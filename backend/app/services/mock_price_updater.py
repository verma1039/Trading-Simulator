"""
Mock market price updater.

Simulates real market movement using a random walk.
This runs as a background task and updates market_prices.
"""

import random
import time
from threading import Thread

from app.database import instruments
from app.services.market_prices import set_price


# Initial base prices (rough, realistic)
BASE_PRICES = {
    "AAPL": 187.0,
    "MSFT": 421.0,
    "GOOG": 142.0,
    "AMZN": 156.0,
    "META": 490.0,
}


def _initial_price(symbol: str) -> float:
    return BASE_PRICES.get(symbol, random.uniform(50, 500))


def _price_tick(price: float) -> float:
    # Small random walk: ±0.3%
    change_pct = random.uniform(-0.003, 0.003)
    return max(1.0, price * (1 + change_pct))


def price_update_loop(interval: int = 5) -> None:
    prices = {}

    # Initialize prices
    for inst in instruments:
        prices[inst["symbol"]] = _initial_price(inst["symbol"])
        set_price(inst["symbol"], prices[inst["symbol"]])

    # Continuous update loop
    while True:
        for symbol in prices:
            prices[symbol] = _price_tick(prices[symbol])
            set_price(symbol, prices[symbol])

        time.sleep(interval)


def start_price_updater() -> None:
    thread = Thread(target=price_update_loop, daemon=True)
    thread.start()
