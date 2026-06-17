import logging
import json
import threading
import time
from datetime import datetime, time as dt_time, timedelta, timezone
from zoneinfo import ZoneInfo

import requests

from app.database import instruments

_price_cache: dict[str, float] = {}
_symbol_last_updated: dict[str, datetime] = {}
_fetch_duration_seconds: list[float] = []
_lock = threading.Lock()
_engine_started = False
_last_failure_logged_at: datetime | None = None
_logged_symbol_mappings: set[str] = set()

SYMBOL_LIVE_MAX_AGE_SECONDS = 90
SYMBOL_DELAYED_MAX_AGE_SECONDS = 180
MARKET_TIMEZONE = ZoneInfo("America/New_York")
MARKET_OPEN_TIME = dt_time(9, 30)
MARKET_CLOSE_TIME = dt_time(16, 0)

logger = logging.getLogger("app.market_data")

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_TIMEOUT_SECONDS = 10
YAHOO_MAX_RETRIES = 2
YAHOO_RETRY_DELAY_SECONDS = 1
YAHOO_SYMBOL_DELAY_SECONDS = 1
YAHOO_CYCLE_SLEEP_SECONDS = 10
DEFAULT_FETCH_DURATION_SECONDS = 0.125
MAX_FETCH_DURATION_SAMPLES = 100
YAHOO_SYMBOL_OVERRIDES = {
    "BRK.B": "BRK-B",
}
YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 trading-simulator/1.0",
    "Accept": "application/json,text/plain,*/*",
}
_session = requests.Session()
_session.headers.update(YAHOO_HEADERS)


def normalize_app_symbol(symbol: str) -> str:
    return symbol.upper()


def get_yahoo_symbol(symbol: str) -> str:
    normalized = normalize_app_symbol(symbol)
    return YAHOO_SYMBOL_OVERRIDES.get(normalized, normalized.replace(".", "-"))


def _log_symbol_mapping(symbol: str, yahoo_symbol: str) -> None:
    if symbol == yahoo_symbol:
        return

    with _lock:
        if symbol in _logged_symbol_mappings:
            return
        _logged_symbol_mappings.add(symbol)

    logger.info(
        json.dumps(
            {
                "event": "market_data_symbol_mapped",
                "provider": "Yahoo Finance",
                "symbol": symbol,
                "provider_symbol": yahoo_symbol,
            },
            sort_keys=True,
        )
    )


def _update_cached_price(symbol: str, price: float) -> None:
    normalized = normalize_app_symbol(symbol)
    rounded = round(price, 2)
    updated_at = datetime.now(timezone.utc)

    with _lock:
        _price_cache[normalized] = rounded
        _symbol_last_updated[normalized] = updated_at
        for inst in instruments:
            if inst["symbol"].upper() == normalized:
                inst["lastTradedPrice"] = rounded
                break


def _record_fetch_duration(duration_seconds: float) -> None:
    with _lock:
        _fetch_duration_seconds.append(duration_seconds)
        if len(_fetch_duration_seconds) > MAX_FETCH_DURATION_SAMPLES:
            del _fetch_duration_seconds[:-MAX_FETCH_DURATION_SAMPLES]


def _log_market_failure(
    symbol: str,
    yahoo_symbol: str,
    error: Exception | str,
    attempt: int,
) -> None:
    logger.warning(
        json.dumps(
            {
                "event": "market_data_fetch_failed",
                "provider": "Yahoo Finance",
                "symbol": symbol,
                "provider_symbol": yahoo_symbol,
                "attempt": attempt,
                "error_type": type(error).__name__,
                "error": str(error),
                "url": YAHOO_CHART_URL.format(symbol=yahoo_symbol),
                "timeout_seconds": YAHOO_TIMEOUT_SECONDS,
            },
            sort_keys=True,
        )
    )


def _log_market_recovered(symbol: str, yahoo_symbol: str, price: float) -> None:
    logger.info(
        json.dumps(
            {
                "event": "market_data_recovered",
                "provider": "Yahoo Finance",
                "symbol": symbol,
                "provider_symbol": yahoo_symbol,
                "price": round(price, 2),
            },
            sort_keys=True,
        )
    )


def _log_market_offline() -> None:
    global _last_failure_logged_at

    now = datetime.now(timezone.utc)
    if (
        _last_failure_logged_at is not None
        and (now - _last_failure_logged_at).total_seconds() < 60
    ):
        return

    _last_failure_logged_at = now
    logger.warning(
        json.dumps(
            {
                "event": "market_data_offline",
                "provider": "Yahoo Finance",
                "market_status": "OFFLINE",
            },
            sort_keys=True,
        )
    )


def _fetch_price(symbol: str) -> float | None:
    """
    Fetch the latest real price from Yahoo Finance's chart endpoint.
    """
    normalized = normalize_app_symbol(symbol)
    yahoo_symbol = get_yahoo_symbol(normalized)
    _log_symbol_mapping(normalized, yahoo_symbol)

    url = YAHOO_CHART_URL.format(symbol=yahoo_symbol)
    params = {"range": "1d", "interval": "1m"}

    for attempt in range(1, YAHOO_MAX_RETRIES + 1):
        started_at = time.perf_counter()
        try:
            response = _session.get(url, params=params, timeout=YAHOO_TIMEOUT_SECONDS)
            response.raise_for_status()
            payload = response.json()
            result = payload.get("chart", {}).get("result") or []
            if not result:
                raise ValueError("Yahoo response did not include chart result")

            meta = result[0].get("meta", {})
            price = meta.get("regularMarketPrice")

            if price is None:
                closes = (result[0].get("indicators", {})
                          .get("quote", [{}])[0]
                          .get("close", []))
                price = next((value for value in reversed(closes) if value is not None), None)

            if price is None:
                raise ValueError("Yahoo response did not include a usable price")

            _record_fetch_duration(time.perf_counter() - started_at)
            return float(price)

        except requests.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            _log_market_failure(normalized, yahoo_symbol, exc, attempt)
            if status_code in {401, 403, 404}:
                return None
        except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
            _log_market_failure(normalized, yahoo_symbol, exc, attempt)

        if attempt < YAHOO_MAX_RETRIES:
            time.sleep(YAHOO_RETRY_DELAY_SECONDS)

    return None


def _price_updater():
    while True:
        successful_fetch = False

        for index, inst in enumerate(instruments):
            symbol = inst["symbol"]
            price = _fetch_price(symbol)

            if price is not None:
                was_offline = get_market_status()["market_status"] == "OFFLINE"
                _update_cached_price(symbol, price)
                if was_offline:
                    _log_market_recovered(symbol, get_yahoo_symbol(symbol), price)
                successful_fetch = True

            if index < len(instruments) - 1:
                time.sleep(YAHOO_SYMBOL_DELAY_SECONDS)

        if not successful_fetch:
            _log_market_offline()

        # Space out full refresh cycles to reduce provider pressure.
        time.sleep(YAHOO_CYCLE_SLEEP_SECONDS)


def start_price_engine():
    """
    Starts background price engine ONCE.
    Safe to call from FastAPI startup event.
    """
    global _engine_started

    if _engine_started:
        return

    _engine_started = True
    thread = threading.Thread(
        target=_price_updater,
        daemon=True,
        name="price-engine"
    )
    thread.start()


def get_live_price(symbol: str) -> float:
    """
    Returns the latest successfully fetched Yahoo price, if available.
    """
    normalized = normalize_app_symbol(symbol)
    with _lock:
        price = _price_cache.get(normalized, 0.0)

    return round(price, 2)


def get_market_status() -> dict:
    now = datetime.now(timezone.utc)
    with _lock:
        last_global_update = max(_symbol_last_updated.values(), default=None)

    seconds_since_last_global_update = (
        int((now - last_global_update).total_seconds())
        if last_global_update is not None
        else None
    )
    offline_after_seconds = _expected_symbol_refresh_interval_seconds() * 2
    market_status = (
        "ONLINE"
        if (
            seconds_since_last_global_update is not None
            and seconds_since_last_global_update <= offline_after_seconds
        )
        else "OFFLINE"
    )
    market_hours = get_market_hours()

    return {
        "market_data_available": market_status == "ONLINE",
        "last_successful_update": (
            last_global_update.isoformat()
            if last_global_update is not None
            else None
        ),
        "last_global_update": (
            last_global_update.isoformat()
            if last_global_update is not None
            else None
        ),
        "seconds_since_last_global_update": seconds_since_last_global_update,
        "market_status": market_status,
        "freshness_status": "OFFLINE" if market_status == "OFFLINE" else "LIVE",
        "data_age_seconds": seconds_since_last_global_update,
        "data_source": "Yahoo Finance",
        "offline_after_seconds": offline_after_seconds,
        "market_open": market_hours["market_open"],
        "market_open_time": market_hours["market_open_time"],
        "market_close_time": market_hours["market_close_time"],
        "next_open_time": market_hours["next_open_time"],
        "market_timezone": "America/New_York",
        "trading_allowed": market_status == "ONLINE" and market_hours["market_open"],
    }


def get_symbol_market_data(symbol: str) -> dict:
    normalized = normalize_app_symbol(symbol)
    now = datetime.now(timezone.utc)
    status = get_market_status()

    with _lock:
        price = _price_cache.get(normalized, 0.0)
        last_updated = _symbol_last_updated.get(normalized)

    age_seconds = (
        int((now - last_updated).total_seconds())
        if last_updated is not None
        else None
    )

    return {
        "symbol": normalized,
        "price": round(price, 2),
        "last_updated": last_updated.isoformat() if last_updated else None,
        "age_seconds": age_seconds,
        "freshness_status": _compute_symbol_freshness_status(
            status["market_status"],
            age_seconds,
        ),
    }


def _compute_symbol_freshness_status(
    market_status: str,
    age_seconds: int | None,
) -> str:
    if market_status == "OFFLINE":
        return "OFFLINE"

    if age_seconds is None:
        return "STALE"

    if age_seconds <= SYMBOL_LIVE_MAX_AGE_SECONDS:
        return "LIVE"

    if age_seconds <= SYMBOL_DELAYED_MAX_AGE_SECONDS:
        return "DELAYED"

    return "STALE"


def _expected_symbol_refresh_interval_seconds() -> int:
    tracked_symbols = max(len(instruments), 1)
    with _lock:
        average_fetch_duration = (
            sum(_fetch_duration_seconds) / len(_fetch_duration_seconds)
            if _fetch_duration_seconds
            else DEFAULT_FETCH_DURATION_SECONDS
        )

    return int(
        tracked_symbols * (average_fetch_duration + YAHOO_SYMBOL_DELAY_SECONDS)
        + YAHOO_CYCLE_SLEEP_SECONDS
    )


def get_market_hours(now: datetime | None = None) -> dict:
    current = (now or datetime.now(timezone.utc)).astimezone(MARKET_TIMEZONE)
    is_weekday = current.weekday() < 5
    session_date = current.date() if is_weekday else _next_market_open(current).date()
    open_dt = datetime.combine(session_date, MARKET_OPEN_TIME, MARKET_TIMEZONE)
    close_dt = datetime.combine(session_date, MARKET_CLOSE_TIME, MARKET_TIMEZONE)
    market_open = is_weekday and open_dt <= current < close_dt

    return {
        "market_open": market_open,
        "market_open_time": open_dt.isoformat(),
        "market_close_time": close_dt.isoformat(),
        "next_open_time": _next_market_open(current).isoformat(),
    }


def _next_market_open(current: datetime) -> datetime:
    candidate_date = current.date()
    candidate_open = datetime.combine(candidate_date, MARKET_OPEN_TIME, MARKET_TIMEZONE)

    if current < candidate_open and current.weekday() < 5:
        return candidate_open

    candidate_date += timedelta(days=1)
    while candidate_date.weekday() >= 5:
        candidate_date += timedelta(days=1)

    return datetime.combine(candidate_date, MARKET_OPEN_TIME, MARKET_TIMEZONE)
