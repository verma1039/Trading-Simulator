# backend/app/services/market_data.py

import random

# simple in-memory price store
_prices = {
    "AAPL": 170.0,
    "MSFT": 330.0,
    "GOOGL": 140.0,
    "AMZN": 155.0,
    "TSLA": 245.0,
}

def get_live_price(symbol: str) -> float:
    """
    Simulated live price.
    Slight random movement on each call.
    """
    symbol = symbol.upper()

    if symbol not in _prices:
        return 0.0

    # simulate market movement
    change = random.uniform(-0.5, 0.5)
    _prices[symbol] = round(_prices[symbol] + change, 2)

    return _prices[symbol]
