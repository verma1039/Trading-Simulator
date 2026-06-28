from __future__ import annotations

from functools import lru_cache
from typing import Protocol

from app.services.yahoo_finance_provider import YahooFinanceProvider


class MarketDataProvider(Protocol):
    def get_indexes(self) -> dict:
        """Return market summary, index cards, and index filter options."""

    def get_stocks(self) -> dict:
        """Return the supported stock universe with live quote data."""

    def get_stock(self, symbol: str) -> dict:
        """Return one supported stock with live quote data."""

    def get_market_status(self) -> dict:
        """Return the current US market status."""

    def search_stocks(self, query: str) -> dict:
        """Search Yahoo Finance and the supported trading universe."""


@lru_cache
def get_market_provider() -> MarketDataProvider:
    return YahooFinanceProvider()
