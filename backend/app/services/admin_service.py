from __future__ import annotations

from app.repositories.trading_repository import TradingRepository


class AdminService:
    def __init__(self, repository: TradingRepository) -> None:
        self.repository = repository

    def dashboard(self) -> dict:
        return self.repository.admin_dashboard()

    def users(self) -> dict:
        return {
            "users": self.repository.admin_users(),
            "deposits": self.repository.all_deposit_requests(),
        }

    def approve_deposit(self, admin: dict, deposit_id: str) -> dict:
        return self.repository.approve_deposit(admin, deposit_id)

    def reject_deposit(self, admin: dict, deposit_id: str) -> dict:
        return self.repository.reject_deposit(admin, deposit_id)

    def suspend_user(self, admin: dict, user_id: str) -> dict:
        return self.repository.set_user_status(admin, user_id, "SUSPENDED")

    def activate_user(self, admin: dict, user_id: str) -> dict:
        return self.repository.set_user_status(admin, user_id, "ACTIVE")
