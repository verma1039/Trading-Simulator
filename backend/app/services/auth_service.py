from __future__ import annotations

from app.repositories.trading_repository import TradingRepository


class AuthService:
    def __init__(self, repository: TradingRepository) -> None:
        self.repository = repository

    def current_user(self, user: dict) -> dict:
        return self.repository.current_user(user)
