# app/services/price_cache.py
from app.services.market_data import get_live_price

def get_price(symbol: str) -> float:
    return get_live_price(symbol)
