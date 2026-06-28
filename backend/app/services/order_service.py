from __future__ import annotations

from app.repositories.trading_repository import TradingRepository


class OrderService:
    def __init__(self, repository: TradingRepository) -> None:
        self.repository = repository

    def buy(self, user: dict, symbol: str, quantity: int) -> dict:
        return self.repository.buy(user, symbol, quantity)

    def sell(self, user: dict, symbol: str, quantity: int) -> dict:
        return self.repository.sell(user, symbol, quantity)
