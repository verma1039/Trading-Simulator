import yfinance as yf
import threading
import time
from app.database import instruments

_price_cache: dict[str, float] = {}
_lock = threading.Lock()


def _fetch_price(symbol: str) -> float | None:
    """
    Fetch price safely from Yahoo.
    Uses fast_info first, falls back to history.
    """
    try:
        ticker = yf.Ticker(symbol)

        # Fast + reliable
        price = ticker.fast_info.get("last_price")

        if price is None:
            hist = ticker.history(period="1d", interval="1m")
            if not hist.empty:
                price = hist["Close"].iloc[-1]

        return float(price) if price is not None else None

    except Exception:
        return None


def _price_updater():
    while True:
        for inst in instruments:
            symbol = inst["symbol"]

            price = _fetch_price(symbol)

            if price is not None:
                with _lock:
                    _price_cache[symbol] = price
                    inst["lastTradedPrice"] = round(price, 2)

        # IMPORTANT: do not hammer Yahoo
        time.sleep(10)


def start_price_engine():
    """
    Starts background price engine ONCE.
    Safe to call from FastAPI startup event.
    """
    thread = threading.Thread(
        target=_price_updater,
        daemon=True,
        name="price-engine"
    )
    thread.start()


def get_live_price(symbol: str) -> float:
    """
    Always returns latest known price.
    """
    return round(_price_cache.get(symbol.upper(), 0.0), 2)
