from __future__ import annotations

from app.repositories.trading_repository import TradingRepository


class PortfolioService:
    def __init__(self, repository: TradingRepository) -> None:
        self.repository = repository

    def get_portfolio(self, user: dict) -> dict:
        return self.repository.portfolio_payload(user)
