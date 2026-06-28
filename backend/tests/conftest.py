from __future__ import annotations

import os
import sys
from copy import deepcopy
from pathlib import Path

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient


os.environ.setdefault("ADMIN_EMAIL", "admin@testing.invalid")
os.environ.setdefault("SUPABASE_URL", "https://project.supabase.invalid")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_DB_URL", "postgresql://postgres:test@db.project.supabase.invalid:5432/postgres")
os.environ.setdefault("SUPABASE_JWT_ISSUER", "https://project.supabase.invalid/auth/v1")
os.environ.setdefault("SUPABASE_JWKS_URL", "https://project.supabase.invalid/auth/v1/.well-known/jwks.json")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app
from app.repositories.trading_repository import get_repository
from app.routes.dependencies import current_user


USER = {
    "id": "user-1",
    "name": "User One",
    "email": "user@testing.invalid",
    "phoneNumber": "9000000001",
    "dateOfBirth": "1999-01-01",
    "role": "USER",
    "status": "ACTIVE",
    "profileCompleted": True,
}

INCOMPLETE_USER = {
    **USER,
    "id": "user-incomplete",
    "profileCompleted": False,
}

ADMIN = {
    "id": "admin-1",
    "name": "Admin One",
    "email": "admin@testing.invalid",
    "role": "ADMIN",
    "status": "ACTIVE",
    "profileCompleted": False,
}


class RepositoryDouble:
    def __init__(self) -> None:
        self.cash = 1_000.0
        self.market_open = True
        self.phone_numbers = {"user-2": "9999999999"}
        self.holdings = {
            "AAPL": {"symbol": "AAPL", "quantity": 2, "avgPrice": 100.0, "currentPrice": 125.0},
        }
        self.deposits = []
        self.orders = []
        self.transactions = []
        self.user_status = "ACTIVE"

    def current_user(self, user: dict) -> dict:
        return {"user": user}

    def require_admin(self, user: dict) -> None:
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    def dashboard_payload(self, user: dict) -> dict:
        return {
            "user": user,
            "marketSummary": {"status": "OPEN"},
            "marketIndices": [],
            "portfolioSummary": self.portfolio_payload(user)["summary"],
            "portfolioGrowth": [],
            "dashboardSnapshot": {},
            "dashboardTimeRanges": [],
            "attentionItems": [],
            "marketNews": [],
            "timelineExtras": [],
            "recentActivity": [],
            "topGainers": [],
            "topLosers": [],
            "watchlist": [],
        }

    def portfolio_payload(self, user: dict) -> dict:
        holdings = []
        invested = 0.0
        value = 0.0
        pnl = 0.0
        for holding in self.holdings.values():
            row = deepcopy(holding)
            row["value"] = round(row["quantity"] * row["currentPrice"], 2)
            row["pnl"] = round(row["value"] - row["quantity"] * row["avgPrice"], 2)
            row["pnlPercent"] = round((row["pnl"] / (row["quantity"] * row["avgPrice"])) * 100, 2)
            row["unrealizedPnL"] = row["pnl"]
            holdings.append(row)
            invested += row["quantity"] * row["avgPrice"]
            value += row["value"]
            pnl += row["pnl"]

        account_value = round(self.cash + value, 2)
        return {
            "summary": {
                "cashAvailable": self.cash,
                "cashValue": self.cash,
                "investedAmount": invested,
                "portfolioValue": account_value,
                "totalAccountValue": account_value,
                "holdingsCount": len(holdings),
                "totalReturn": pnl,
                "totalReturnPercent": round((pnl / invested) * 100, 2) if invested else 0,
                "unrealizedPnL": pnl,
                "unrealizedPnLPercent": round((pnl / invested) * 100, 2) if invested else 0,
            },
            "holdings": holdings,
            "growth": [],
            "ranges": [],
            "allocationData": [],
            "stockAllocationData": [],
            "events": [],
            "attention": [],
        }

    def transactions_payload(self, user: dict) -> dict:
        return {
            "summary": {
                "cashBalance": self.cash,
                "pendingCount": sum(1 for item in self.deposits if item["status"] == "PENDING"),
                "pendingDeposits": sum(item["amount"] for item in self.deposits if item["status"] == "PENDING"),
                "approvedDeposits": sum(item["amount"] for item in self.deposits if item["status"] == "APPROVED"),
                "totalDeposited": sum(item["amount"] for item in self.deposits if item["status"] == "APPROVED"),
                "approvedCount": sum(1 for item in self.deposits if item["status"] == "APPROVED"),
                "rejectedCount": sum(1 for item in self.deposits if item["status"] == "REJECTED"),
            },
            "depositDraft": {"amount": 0, "notes": "", "processingEstimate": "Pending admin review."},
            "depositRequests": self.deposits,
            "tradeHistory": self.orders,
            "recentActivity": [],
            "recentTransactions": self.transactions[:4],
            "timeline": [],
            "history": self.transactions,
            "insights": [],
            "activitySummary": [],
            "requestStatusSummary": [],
        }

    def create_deposit_request(self, user: dict, amount: float, notes: str) -> dict:
        deposit = {"id": f"deposit-{len(self.deposits) + 1}", "amount": amount, "notes": notes, "status": "PENDING"}
        self.deposits.append(deposit)
        self.transactions.append({"id": "tx-deposit", "type": "DEPOSIT", "status": "PENDING", "amount": amount})
        return deposit

    def approve_deposit(self, admin: dict, deposit_id: str) -> dict:
        deposit = self._deposit(deposit_id)
        if deposit["status"] != "PENDING":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Deposit request has already been reviewed.")
        deposit["status"] = "APPROVED"
        self.cash += deposit["amount"]
        return deposit

    def reject_deposit(self, admin: dict, deposit_id: str) -> dict:
        deposit = self._deposit(deposit_id)
        if deposit["status"] != "PENDING":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Deposit request has already been reviewed.")
        deposit["status"] = "REJECTED"
        return deposit

    def admin_dashboard(self) -> dict:
        return {
            "summary": {"totalUsers": 1, "activeUsers": 1, "suspendedUsers": 0, "pendingDeposits": 0},
            "operations": [],
            "depositRequests": self.deposits,
            "users": self.admin_users(),
            "activity": [],
            "attention": {},
        }

    def admin_users(self) -> list[dict]:
        return [{"id": USER["id"], "name": USER["name"], "email": USER["email"], "status": self.user_status}]

    def all_deposit_requests(self) -> list[dict]:
        return self.deposits

    def set_user_status(self, admin: dict, user_id: str, new_status: str) -> dict:
        self.user_status = new_status
        return {"id": user_id, "status": new_status}

    def get_profile(self, user: dict) -> dict:
        return {
            "profile": {
                **user,
                "phoneNumber": self.phone_numbers.get(user["id"], ""),
                "dateOfBirth": "1999-01-01",
                "country": "India",
                "timezone": "Asia/Kolkata",
            },
        }

    def update_profile(self, user: dict, display_name: str, phone_number: str, **kwargs) -> dict:
        existing_owner = next((owner for owner, phone in self.phone_numbers.items() if phone == phone_number), None)
        if existing_owner and existing_owner != user["id"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="This mobile number is already associated with another account.",
            )
        self.phone_numbers[user["id"]] = phone_number
        return {
            "profile": {
                **user,
                "name": display_name,
                "phoneNumber": phone_number,
                "country": kwargs.get("country") or "India",
                "timezone": kwargs.get("timezone_name") or "Asia/Kolkata",
                "profileCompleted": True,
            },
        }

    def is_phone_number_available(self, phone_number: str) -> bool:
        return phone_number not in self.phone_numbers.values()

    def buy(self, user: dict, symbol: str, quantity: int) -> dict:
        self._require_market_open()
        stock = self._stock(symbol)
        amount = stock["price"] * quantity
        if self.cash < amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient cash.")
        self.cash -= amount
        holding = self.holdings.setdefault(symbol, {"symbol": symbol, "quantity": 0, "avgPrice": stock["price"], "currentPrice": stock["price"]})
        holding["quantity"] += quantity
        order = {"id": f"order-{len(self.orders) + 1}", "side": "BUY", "symbol": symbol, "quantity": quantity, "price": stock["price"]}
        self.orders.append(order)
        return {"marketStatus": {"status": "OPEN"}, "order": order, "portfolio": self.portfolio_payload(user), "transactions": self.transactions_payload(user)}

    def sell(self, user: dict, symbol: str, quantity: int) -> dict:
        self._require_market_open()
        stock = self._stock(symbol)
        holding = self.holdings.get(symbol)
        if not holding or holding["quantity"] < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient shares.")
        holding["quantity"] -= quantity
        if holding["quantity"] == 0:
            self.holdings.pop(symbol)
        self.cash += stock["price"] * quantity
        order = {"id": f"order-{len(self.orders) + 1}", "side": "SELL", "symbol": symbol, "quantity": quantity, "price": stock["price"]}
        self.orders.append(order)
        return {"marketStatus": {"status": "OPEN"}, "order": order, "portfolio": self.portfolio_payload(user), "transactions": self.transactions_payload(user)}

    def _require_market_open(self) -> None:
        if not self.market_open:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Market is currently closed.")

    def _stock(self, symbol: str) -> dict:
        if symbol != "AAPL":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown symbol.")
        return {"symbol": "AAPL", "price": 125.0, "company": "Apple Inc.", "sector": "Technology"}

    def _deposit(self, deposit_id: str) -> dict:
        deposit = next((item for item in self.deposits if item["id"] == deposit_id), None)
        if not deposit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deposit request not found.")
        return deposit


@pytest.fixture()
def repository_double() -> RepositoryDouble:
    return RepositoryDouble()


@pytest.fixture()
def client(repository_double: RepositoryDouble) -> TestClient:
    app.dependency_overrides.clear()
    app.dependency_overrides[get_repository] = lambda: repository_double
    yield TestClient(app)
    app.dependency_overrides.clear()


def authenticate_as(user: dict) -> None:
    app.dependency_overrides[current_user] = lambda: user
