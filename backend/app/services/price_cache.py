# app/services/price_cache.py
from app.services.market_data import get_live_price

_price_cache = {}

def get_price(symbol: str) -> float:
    if symbol not in _price_cache:
        _price_cache[symbol] = get_live_price(symbol)
    return _price_cache.get(symbol, 0.0)
