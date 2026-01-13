"""
Central market price store.

This module is the single source of truth for all market prices.
Prices are updated by a background task (mock now, real provider later).
Other parts of the system MUST only read from here.
"""

from typing import Dict

# In-memory price cache
# symbol -> last traded price
market_prices: Dict[str, float] = {}


def set_price(symbol: str, price: float) -> None:
    """Update price for a symbol."""
    market_prices[symbol] = round(float(price), 2)


def get_price(symbol: str) -> float | None:
    """Get latest price for a symbol."""
    return market_prices.get(symbol)


def get_all_prices() -> Dict[str, float]:
    """Get snapshot of all prices."""
    return market_prices.copy()
