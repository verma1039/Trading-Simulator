from __future__ import annotations

from app.repositories.trading_repository import TradingRepository


class DashboardService:
    def __init__(self, repository: TradingRepository) -> None:
        self.repository = repository

    def get_dashboard(self, user: dict) -> dict:
        return self.repository.dashboard_payload(user)
