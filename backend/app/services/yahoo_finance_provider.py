from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any, Callable

from fastapi import HTTPException, status
import yfinance as yf

from app.core.exceptions import ExternalProviderError
from app.core.logger import get_logger
from app.services.market_status_provider import MarketStatusProvider, get_market_status_provider
from app.services.market_universe import (
    INDEX_OPTIONS,
    SUPPORTED_INDEXES,
    SUPPORTED_STOCKS,
    SUPPORTED_STOCK_SYMBOLS,
    SUPPORTED_STOCK_BY_SYMBOL,
)


INDEX_CACHE_SECONDS = 60
SEARCH_CACHE_SECONDS = 300
STOCK_CACHE_SECONDS = 60


@dataclass
class CacheEntry:
    data: Any
    expires_at: datetime


class YahooFinanceProvider:
    def __init__(self, market_status_provider: MarketStatusProvider | None = None) -> None:
        self._cache: dict[str, CacheEntry] = {}
        self._lock = Lock()
        self.market_status_provider = market_status_provider or get_market_status_provider()
        self.logger = get_logger(__name__)

    def get_indexes(self) -> dict:
        return self._cached("indexes", INDEX_CACHE_SECONDS, self._fetch_indexes)

    def get_market_status(self) -> dict:
        return self.market_status_provider.get_status()

    def get_stocks(self) -> dict:
        return self._cached("stocks", STOCK_CACHE_SECONDS, self._fetch_stocks)

    def get_stock(self, symbol: str) -> dict:
        normalized = symbol.upper().strip()
        if normalized not in SUPPORTED_STOCK_BY_SYMBOL:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown symbol.")

        stocks = self.get_stocks()["stocks"]
        stock = next((item for item in stocks if item["symbol"] == normalized), None)
        if not stock:
            raise ExternalProviderError("Yahoo Finance quote unavailable.")
        return {"stock": stock}

    def search_stocks(self, query: str) -> dict:
        normalized = query.strip()
        if not normalized:
            return {"results": []}

        cache_key = "search:" + normalized.lower()
        return self._cached(cache_key, SEARCH_CACHE_SECONDS, lambda: self._fetch_search(normalized))

    def indexes(self) -> dict:
        return self.get_indexes()

    def stocks(self) -> dict:
        return self.get_stocks()

    def _cached(self, key: str, ttl_seconds: int, fetcher: Callable[[], Any]) -> Any:
        now = datetime.now(timezone.utc)
        with self._lock:
            entry = self._cache.get(key)
            if entry and entry.expires_at > now:
                return self._with_freshness(entry.data)

        try:
            data = fetcher()
        except HTTPException:
            stale = self._cache.get(key)
            if stale:
                self.logger.warning(
                    "market.provider_using_stale_cache",
                    extra={"event": "market.provider_using_stale_cache", "cacheKey": key},
                )
                return self._with_freshness(stale.data)
            raise
        except Exception as exc:
            stale = self._cache.get(key)
            if stale:
                self.logger.warning(
                    "market.provider_using_stale_cache",
                    extra={"event": "market.provider_using_stale_cache", "cacheKey": key},
                )
                return self._with_freshness(stale.data)
            raise ExternalProviderError("Yahoo Finance data unavailable.") from exc

        with self._lock:
            self._cache[key] = CacheEntry(data=data, expires_at=now + timedelta(seconds=ttl_seconds))
        return self._with_freshness(data)

    def _fetch_indexes(self) -> dict:
        rows = []
        for metadata in SUPPORTED_INDEXES:
            rows.append(self._quote(metadata["symbol"], metadata))

        return {
            "marketSummary": self._market_summary(),
            "indexes": rows,
            "marketIndices": rows,
            "indexOptions": INDEX_OPTIONS,
        }

    def _fetch_stocks(self) -> dict:
        ticker_collection = yf.Tickers(" ".join(SUPPORTED_STOCK_SYMBOLS))
        stocks = []

        for metadata in SUPPORTED_STOCKS:
            ticker = ticker_collection.tickers.get(metadata["symbol"]) or yf.Ticker(metadata["symbol"])
            stocks.append(self._quote(metadata["symbol"], metadata, ticker=ticker))

        return {
            "stocks": stocks,
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
            "quoteSource": "Yahoo Finance",
        }

    def _fetch_search(self, query: str) -> dict:
        universe_matches = [
            self.get_stock(metadata["symbol"])["stock"]
            for metadata in SUPPORTED_STOCKS
            if query.lower() in metadata["symbol"].lower() or query.lower() in metadata["company"].lower()
        ]
        seen = {item["symbol"] for item in universe_matches}
        results = list(universe_matches)

        search = yf.Search(query, max_results=8)
        for quote in getattr(search, "quotes", []) or []:
            symbol = str(quote.get("symbol", "")).upper()
            if not symbol or symbol in seen:
                continue

            if symbol in SUPPORTED_STOCK_BY_SYMBOL:
                results.append(self.get_stock(symbol)["stock"])
            else:
                quote_timestamp = datetime.now(timezone.utc).isoformat()
                results.append({
                    "id": symbol.lower().replace(".", "-"),
                    "symbol": symbol,
                    "company": quote.get("longname") or quote.get("shortname") or symbol,
                    "sector": quote.get("sector") or quote.get("sectorDisp") or "Unknown",
                    "indices": [],
                    "exchange": quote.get("exchDisp") or quote.get("exchange") or "",
                    "price": 0,
                    "change": 0,
                    "changePercent": 0,
                    "volume": 0,
                    "quoteSource": "Yahoo Finance Search",
                    "quoteTimestamp": quote_timestamp,
                    "fetchedAt": quote_timestamp,
                    "dataAgeSeconds": 0,
                    "freshness": "LIVE",
                })
            seen.add(symbol)

        return {"results": results[:10], "query": query}

    def _quote(self, yahoo_symbol: str, metadata: dict, ticker: Any | None = None) -> dict:
        ticker = ticker or yf.Ticker(yahoo_symbol)
        fast_info = ticker.fast_info
        price = _number(_fast_value(fast_info, "lastPrice", "last_price"))
        previous_close = _number(_fast_value(
            fast_info,
            "previousClose",
            "previous_close",
            "regularMarketPreviousClose",
            "regular_market_previous_close",
        ))
        volume = int(_number(_fast_value(
            fast_info,
            "lastVolume",
            "last_volume",
            "tenDayAverageVolume",
            "ten_day_average_volume",
        )))

        if price <= 0:
            price, previous_close, volume = self._history_quote(ticker)

        if previous_close <= 0:
            previous_close = price

        change = round(price - previous_close, 2)
        change_percent = round((change / previous_close) * 100, 2) if previous_close else 0
        quote_timestamp = datetime.now(timezone.utc).isoformat()

        return {
            **metadata,
            "value": round(price, 2),
            "price": round(price, 2),
            "change": change,
            "changePercent": change_percent,
            "volume": volume,
            "previousClose": round(previous_close, 2),
            "quoteSource": "Yahoo Finance",
            "quoteTimestamp": quote_timestamp,
            "fetchedAt": quote_timestamp,
            "dataAgeSeconds": 0,
            "freshness": "LIVE",
        }

    def _history_quote(self, ticker: Any) -> tuple[float, float, int]:
        history = ticker.history(period="5d", interval="1d")
        if history.empty:
            raise ExternalProviderError("Yahoo Finance quote unavailable.")

        closes = [float(value) for value in history["Close"].dropna().tolist()]
        volumes = [int(value) for value in history["Volume"].dropna().tolist()]
        if not closes:
            raise ExternalProviderError("Yahoo Finance quote unavailable.")

        price = closes[-1]
        previous_close = closes[-2] if len(closes) > 1 else price
        volume = volumes[-1] if volumes else 0
        return price, previous_close, volume

    def _market_summary(self) -> dict:
        return {
            **self.market_status_provider.market_summary(),
            "quoteSource": "US Market Schedule",
        }

    def _with_freshness(self, data: Any) -> Any:
        payload = deepcopy(data)
        self._apply_freshness(payload)
        return payload

    def _apply_freshness(self, value: Any) -> None:
        if isinstance(value, list):
            for item in value:
                self._apply_freshness(item)
            return

        if not isinstance(value, dict):
            return

        quote_timestamp = value.get("quoteTimestamp")
        if quote_timestamp:
            data_age_seconds = _data_age_seconds(quote_timestamp)
            value["dataAgeSeconds"] = data_age_seconds
            value["freshness"] = _freshness(data_age_seconds)

        for item in value.values():
            self._apply_freshness(item)


def _fast_value(fast_info: Any, *keys: str) -> Any:
    for key in keys:
        try:
            if hasattr(fast_info, "get"):
                value = fast_info.get(key)
            else:
                value = fast_info[key]
            if value is not None:
                return value
        except Exception:
            continue
    return None


def _number(value: Any) -> float:
    try:
        if value is None:
            return 0
        return float(value)
    except (TypeError, ValueError):
        return 0


def _data_age_seconds(timestamp: str) -> int:
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        return 901

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return max(int((datetime.now(timezone.utc) - parsed.astimezone(timezone.utc)).total_seconds()), 0)


def _freshness(data_age_seconds: int) -> str:
    if data_age_seconds <= 60:
        return "LIVE"
    if data_age_seconds <= 300:
        return "DELAYED"
    if data_age_seconds <= 900:
        return "STALE"
    return "OFFLINE"
