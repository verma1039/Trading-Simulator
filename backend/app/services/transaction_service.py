from __future__ import annotations

from app.repositories.trading_repository import TradingRepository


class TransactionService:
    def __init__(self, repository: TradingRepository) -> None:
        self.repository = repository

    def get_transactions(self, user: dict) -> dict:
        return self.repository.transactions_payload(user)

    def create_deposit_request(self, user: dict, amount: float, notes: str) -> dict:
        return self.repository.create_deposit_request(user, amount, notes)
