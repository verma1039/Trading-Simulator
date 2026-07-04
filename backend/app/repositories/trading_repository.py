from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from psycopg.errors import UniqueViolation
from psycopg.types.json import Json

from app.core.config import get_settings
from app.core.logger import get_logger
from app.repositories.database import Database, get_database
from app.services.market_data import PORTFOLIO_PERIODS, SECTOR_COLORS
from app.services.market_data_provider import MarketDataProvider, get_market_provider


IST_TZ = ZoneInfo("Asia/Kolkata")
DEFAULT_TIMEZONE = "Asia/Kolkata"


def _money(value: Any) -> float:
    return round(float(value or 0) + 0.0000001, 2)


def _uuid(value: Any) -> str:
    return str(value) if value is not None else ""


def _date(value: Any) -> str:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, datetime):
        return value.astimezone(IST_TZ).date().isoformat()
    return datetime.now(IST_TZ).date().isoformat()


def _optional_date(value: Any) -> str:
    if not value:
        return ""
    return _date(value)


def _parse_optional_date(value: Any) -> date | None:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str) and value:
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
    return None


def _optional_datetime(value: Any) -> str:
    if not isinstance(value, datetime):
        return ""
    return value.astimezone(IST_TZ).isoformat()


def _time_label(value: Any) -> str:
    if not isinstance(value, datetime):
        return "Never"
    local_value = value.astimezone(IST_TZ)
    today = datetime.now(IST_TZ).date()
    if local_value.date() == today:
        return local_value.strftime("%I:%M %p IST").lstrip("0")
    return local_value.strftime("%b %d, %Y")


def _login_badge(value: Any) -> dict:
    if not isinstance(value, datetime):
        return {"label": "Never Logged In", "status": "NEVER_LOGGED_IN", "tone": "neutral"}

    now = datetime.now(timezone.utc)
    login_at = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    age = now - login_at.astimezone(timezone.utc)
    if age <= timedelta(hours=24):
        return {"label": "Recently Active", "status": "RECENTLY_ACTIVE", "tone": "positive"}
    if age > timedelta(days=30):
        return {"label": "Inactive", "status": "INACTIVE", "tone": "warning"}
    return {"label": "Active", "status": "ACTIVE", "tone": "info"}


class TradingRepository:
    def __init__(self, database: Database | None = None, market_provider: MarketDataProvider | None = None) -> None:
        self.database = database or get_database()
        self.market_provider = market_provider or get_market_provider()
        self.logger = get_logger(__name__)

    def ensure_auth_user(self, auth_user: dict) -> dict:
        settings = get_settings()
        user_id = auth_user["id"]
        email = auth_user["email"].lower()
        display_name = auth_user["name"] or email.split("@")[0]
        phone_number = (auth_user.get("phoneNumber") or "").strip() or None
        date_of_birth = _parse_optional_date(auth_user.get("dateOfBirth"))
        timezone_name = (auth_user.get("timezone") or DEFAULT_TIMEZONE).strip() or DEFAULT_TIMEZONE
        country = (auth_user.get("country") or "India").strip() or "India"
        profile_completed = bool(phone_number and date_of_birth)

        with self.database.connect() as connection:
            profile = connection.execute(
                """
                select * from public.profiles
                where user_id = %s
                for update
                """,
                (user_id,),
            ).fetchone()

            if profile:
                try:
                    profile = connection.execute(
                        """
                        update public.profiles
                        set email = %s,
                            phone_number = coalesce(phone_number, %s),
                            date_of_birth = coalesce(date_of_birth, %s),
                            timezone = %s,
                            country = coalesce(nullif(btrim(country), ''), %s, 'India'),
                            profile_completed = case
                              when profile_completed then true
                              when coalesce(phone_number, %s) is not null
                                and coalesce(date_of_birth, %s) is not null
                              then true
                              else false
                            end,
                            last_active_at = now()
                        where user_id = %s
                        returning *
                        """,
                        (email, phone_number, date_of_birth, timezone_name, country, phone_number, date_of_birth, user_id),
                    ).fetchone()
                except UniqueViolation as exc:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail="This mobile number is already associated with another account.",
                    ) from exc
            else:
                role = "ADMIN" if email == settings.admin_email.lower() else "USER"
                try:
                    profile = connection.execute(
                        """
                        insert into public.profiles (
                          user_id,
                          display_name,
                          email,
                          role,
                          phone_number,
                          date_of_birth,
                          profile_completed,
                          timezone,
                          country,
                          last_login_at
                        )
                        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                        returning *
                        """,
                        (user_id, display_name, email, role, phone_number, date_of_birth, profile_completed, timezone_name, country),
                    ).fetchone()
                except UniqueViolation as exc:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail="This mobile number is already associated with another account.",
                    ) from exc

            bonus_amount = _money(settings.joining_bonus_amount if profile["role"] == "USER" else 0)
            starting_balance = _money(settings.initial_user_balance + bonus_amount)
            wallet_insert = connection.execute(
                """
                insert into public.wallets (user_id, cash_balance)
                values (%s, %s)
                on conflict (user_id) do nothing
                returning *
                """,
                (user_id, starting_balance),
            ).fetchone()
            joining_bonus_credited = bool(wallet_insert and bonus_amount > 0)
            if joining_bonus_credited:
                connection.execute(
                    """
                    insert into public.transactions (user_id, type, status, amount, detail)
                    values (%s, 'DEPOSIT', 'APPROVED', %s, %s)
                    """,
                    (user_id, bonus_amount, "Joining bonus credited"),
                )
            wallet = self._wallet(connection, user_id)

        if profile["status"] != "ACTIVE":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active.")
        user = self.public_user(profile, wallet)
        if joining_bonus_credited:
            user["joiningBonusCredited"] = True
            user["joiningBonusAmount"] = bonus_amount
            user["joiningBonusMessage"] = "$" + f"{bonus_amount:,.0f}" + " joining bonus has been credited to your account."
        return user

    def require_admin(self, user: dict) -> None:
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")

    def public_user(self, profile: dict, wallet: dict | None = None) -> dict:
        return {
            "id": _uuid(profile["user_id"]),
            "name": profile["display_name"],
            "email": profile["email"],
            "role": profile["role"],
            "status": profile["status"],
            "accountId": _uuid(wallet["id"]) if wallet else "",
            "timezone": DEFAULT_TIMEZONE,
            "country": profile.get("country") or "India",
            "lastActive": _time_label(profile.get("last_active_at")),
            "lastLoginAt": _optional_datetime(profile.get("last_login_at")),
            "lastLoginLabel": _time_label(profile.get("last_login_at")),
            "loginBadge": _login_badge(profile.get("last_login_at")),
            "phoneNumber": profile.get("phone_number") or "",
            "dateOfBirth": _optional_date(profile.get("date_of_birth")),
            "profileCompleted": bool(profile.get("profile_completed")),
            "createdAt": _date(profile.get("created_at")),
            "joiningBonusAmount": 0,
            "joiningBonusCredited": False,
            "joiningBonusMessage": "",
            "isLoggedIn": True,
        }

    def current_user(self, user: dict) -> dict:
        return {"user": self.update_last_login(user)}

    def update_last_login(self, user: dict) -> dict:
        with self.database.connect() as connection:
            profile = connection.execute(
                """
                update public.profiles
                set last_login_at = now(),
                    last_active_at = now()
                where user_id = %s
                returning *
                """,
                (user["id"],),
            ).fetchone()
            if not profile:
                return user
            wallet = self._wallet(connection, user["id"])
        self.logger.info(
            "auth.login_resolved",
            extra={"event": "auth.login_resolved", "userId": user["id"], "role": profile["role"]},
        )
        next_user = self.public_user(profile, wallet)
        if user.get("joiningBonusCredited"):
            next_user["joiningBonusCredited"] = True
            next_user["joiningBonusAmount"] = _money(user.get("joiningBonusAmount"))
            next_user["joiningBonusMessage"] = user.get("joiningBonusMessage") or (
                "$" + f"{_money(user.get('joiningBonusAmount')):,.0f}" + " joining bonus has been credited to your account."
            )
        return next_user

    def get_profile(self, user: dict) -> dict:
        with self.database.connect() as connection:
            profile = connection.execute(
                """
                select p.*, w.id as wallet_id
                from public.profiles p
                left join public.wallets w on w.user_id = p.user_id
                where p.user_id = %s
                """,
                (user["id"],),
            ).fetchone()
            if not profile:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
        return {"profile": self.public_user(profile, {"id": profile["wallet_id"]})}

    def get_profile_preferences(self, user: dict) -> dict:
        profile = self.get_profile(user)["profile"]
        return {
            "country": profile["country"],
            "timezone": DEFAULT_TIMEZONE,
        }

    def update_profile_preferences(self, user: dict, timezone_name: str, country: str) -> dict:
        with self.database.connect() as connection:
            profile = connection.execute(
                """
                update public.profiles
                set timezone = %s,
                    country = %s,
                    last_active_at = now()
                where user_id = %s
                returning *
                """,
                (DEFAULT_TIMEZONE, country.strip(), user["id"]),
            ).fetchone()
            if not profile:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
            wallet = self._wallet(connection, user["id"])
        self.logger.info(
            "profile.updated",
            extra={
                "event": "profile.updated",
                "userId": user["id"],
                "profileCompleted": bool(profile.get("profile_completed")),
                "country": profile.get("country"),
                "timezone": profile.get("timezone"),
            },
        )
        return {"profile": self.public_user(profile, wallet)}

    def update_profile(
        self,
        user: dict,
        display_name: str,
        phone_number: str,
        timezone_name: str | None = None,
        country: str | None = None,
        date_of_birth: date | None = None,
    ) -> dict:
        with self.database.connect() as connection:
            existing_profile = connection.execute(
                """
                select * from public.profiles
                where user_id = %s
                for update
                """,
                (user["id"],),
            ).fetchone()
            if not existing_profile:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

            duplicate_phone = connection.execute(
                """
                select 1
                from public.profiles
                where phone_number = %s
                  and user_id <> %s
                limit 1
                """,
                (phone_number, user["id"]),
            ).fetchone()
            if duplicate_phone:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="This mobile number is already associated with another account.",
                )

            existing_date_of_birth = existing_profile.get("date_of_birth")
            if existing_date_of_birth:
                if date_of_birth and date_of_birth != existing_date_of_birth:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Date of birth cannot be changed after signup.",
                    )
                next_date_of_birth = existing_date_of_birth
            else:
                next_date_of_birth = date_of_birth

            next_timezone = DEFAULT_TIMEZONE
            next_country = (country or existing_profile.get("country") or "India").strip()
            next_profile_completed = bool(phone_number and next_date_of_birth)

            try:
                profile = connection.execute(
                    """
                    update public.profiles
                    set display_name = %s,
                        phone_number = %s,
                        date_of_birth = %s,
                        timezone = %s,
                        country = %s,
                        profile_completed = %s,
                        last_active_at = now()
                    where user_id = %s
                    returning *
                    """,
                    (display_name.strip(), phone_number, next_date_of_birth, next_timezone, next_country, next_profile_completed, user["id"]),
                ).fetchone()
            except UniqueViolation as exc:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="This mobile number is already associated with another account.",
                ) from exc

            wallet = self._wallet(connection, user["id"])
        return {"profile": self.public_user(profile, wallet)}

    def is_phone_number_available(self, phone_number: str) -> bool:
        with self.database.connect() as connection:
            row = connection.execute(
                """
                select 1
                from public.profiles
                where phone_number = %s
                limit 1
                """,
                (phone_number,),
            ).fetchone()
        return row is None

    def portfolio_payload(self, user: dict) -> dict:
        with self.database.connect() as connection:
            wallet = self._wallet(connection, user["id"])
            holdings = self._holding_rows(connection, user["id"])

        cash = _money(wallet["cash_balance"])
        portfolio_value = _money(cash + sum(item["value"] for item in holdings))
        invested_amount = _money(sum(item["avgPrice"] * item["quantity"] for item in holdings))
        total_return = _money(sum(item["pnl"] for item in holdings))
        total_return_percent = _money((total_return / invested_amount) * 100) if invested_amount else 0
        for holding in holdings:
            holding["allocationPercent"] = _money((holding["value"] / portfolio_value) * 100) if portfolio_value else 0
        daily_return, daily_return_percent = self._daily_return(holdings)
        summary = {
            "portfolioValue": portfolio_value,
            "totalAccountValue": portfolio_value,
            "cashAvailable": cash,
            "cashValue": cash,
            "investedAmount": invested_amount,
            "holdingsCount": len(holdings),
            "totalReturn": total_return,
            "totalReturnPercent": total_return_percent,
            "unrealizedPnL": total_return,
            "unrealizedPnLPercent": total_return_percent,
            "dailyReturn": daily_return,
            "dailyReturnPercent": daily_return_percent,
        }
        return {
            "summary": summary,
            "growth": self._portfolio_growth(invested_amount, portfolio_value),
            "ranges": ["1D", "1W", "1M", "3M", "6M", "1Y"],
            "allocationData": self._sector_allocation(holdings, cash, portfolio_value),
            "stockAllocationData": self._stock_allocation(holdings, cash, portfolio_value),
            "holdings": holdings,
            "events": self._portfolio_events(user["id"]),
            "attention": self._portfolio_attention(holdings, cash, portfolio_value),
        }

    def transactions_payload(self, user: dict) -> dict:
        with self.database.connect() as connection:
            wallet = self._wallet(connection, user["id"])
            deposits = self._deposit_rows(connection, user["id"])
            trades = self._trade_rows(connection, user["id"])
            history = self._transaction_rows(connection, user["id"])

        pending = [item for item in deposits if item["status"] == "PENDING"]
        approved = [item for item in deposits if item["status"] == "APPROVED"]
        rejected = [item for item in deposits if item["status"] == "REJECTED"]
        return {
            "summary": {
                "cashBalance": _money(wallet["cash_balance"]),
                "pendingDeposits": _money(sum(item["amount"] for item in pending)),
                "approvedDeposits": _money(sum(item["amount"] for item in approved)),
                "totalDeposited": _money(sum(item["amount"] for item in approved)),
                "pendingCount": len(pending),
                "approvedCount": len(approved),
                "rejectedCount": len(rejected),
            },
            "depositDraft": {"amount": 0, "notes": "", "processingEstimate": "Requests remain pending until an admin approves or rejects them."},
            "depositRequests": deposits,
            "tradeHistory": trades,
            "recentActivity": self._recent_activity(deposits, trades),
            "recentTransactions": history[:4],
            "timeline": self._transaction_timeline(history),
            "history": history,
            "insights": self._account_insights(deposits, trades),
            "activitySummary": self._activity_summary(deposits, trades),
            "requestStatusSummary": [
                {"id": "pending", "label": "Pending", "count": len(pending), "amount": _money(sum(item["amount"] for item in pending)), "tone": "warning"},
                {"id": "approved", "label": "Approved", "count": len(approved), "amount": _money(sum(item["amount"] for item in approved)), "tone": "positive"},
                {"id": "rejected", "label": "Rejected", "count": len(rejected), "amount": _money(sum(item["amount"] for item in rejected)), "tone": "negative"},
            ],
        }

    def create_deposit_request(self, user: dict, amount: float, notes: str) -> dict:
        if amount <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Amount must be positive.")

        with self.database.connect() as connection:
            request = connection.execute(
                """
                insert into public.deposit_requests (user_id, amount, notes)
                values (%s, %s, %s)
                returning *
                """,
                (user["id"], _money(amount), notes),
            ).fetchone()
            connection.execute(
                """
                insert into public.transactions (user_id, type, status, amount, detail, related_deposit_request_id)
                values (%s, 'DEPOSIT', 'PENDING', %s, %s, %s)
                """,
                (user["id"], _money(amount), notes, request["id"]),
            )

        self.logger.info(
            "deposit.request_created",
            extra={"event": "deposit.request_created", "userId": user["id"], "depositId": _uuid(request["id"]), "amount": _money(amount)},
        )
        return self._map_deposit(request)

    def buy(self, user: dict, symbol: str, quantity: int) -> dict:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Quantity must be positive.")

        market_status = self._require_market_open()
        stock = self.stock_by_symbol(symbol)
        amount = _money(stock["price"] * quantity)
        with self.database.connect() as connection:
            wallet = self._wallet(connection, user["id"], lock=True)
            if _money(wallet["cash_balance"]) < amount:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient cash.")

            holding = self._holding(connection, user["id"], stock["symbol"], lock=True)
            if holding:
                current_quantity = int(holding["quantity"])
                total_cost = current_quantity * float(holding["avg_price"]) + amount
                next_quantity = current_quantity + quantity
                next_avg = _money(total_cost / next_quantity)
                connection.execute(
                    """
                    update public.holdings
                    set quantity = %s, avg_price = %s, company = %s, sector = %s
                    where id = %s
                    """,
                    (next_quantity, next_avg, stock["company"], stock["sector"], holding["id"]),
                )
            else:
                connection.execute(
                    """
                    insert into public.holdings (user_id, symbol, company, sector, quantity, avg_price)
                    values (%s, %s, %s, %s, %s, %s)
                    """,
                    (user["id"], stock["symbol"], stock["company"], stock["sector"], quantity, stock["price"]),
                )

            connection.execute(
                "update public.wallets set cash_balance = cash_balance - %s where user_id = %s",
                (amount, user["id"]),
            )
            order = self._insert_order(connection, user["id"], "BUY", stock, quantity, amount)

        self.logger.info(
            "order.buy_created",
            extra={
                "event": "order.buy_created",
                "userId": user["id"],
                "symbol": stock["symbol"],
                "quantity": quantity,
                "amount": amount,
                "orderId": _uuid(order["id"]),
            },
        )
        return {"marketStatus": market_status, "order": self._map_order(order), "portfolio": self.portfolio_payload(user), "transactions": self.transactions_payload(user)}

    def sell(self, user: dict, symbol: str, quantity: int) -> dict:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Quantity must be positive.")

        market_status = self._require_market_open()
        stock = self.stock_by_symbol(symbol)
        amount = _money(stock["price"] * quantity)
        with self.database.connect() as connection:
            self._wallet(connection, user["id"], lock=True)
            holding = self._holding(connection, user["id"], stock["symbol"], lock=True)
            if not holding or int(holding["quantity"]) < quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient shares.")

            remaining = int(holding["quantity"]) - quantity
            if remaining:
                connection.execute("update public.holdings set quantity = %s where id = %s", (remaining, holding["id"]))
            else:
                connection.execute("delete from public.holdings where id = %s", (holding["id"],))

            connection.execute(
                "update public.wallets set cash_balance = cash_balance + %s where user_id = %s",
                (amount, user["id"]),
            )
            order = self._insert_order(connection, user["id"], "SELL", stock, quantity, amount)

        self.logger.info(
            "order.sell_created",
            extra={
                "event": "order.sell_created",
                "userId": user["id"],
                "symbol": stock["symbol"],
                "quantity": quantity,
                "amount": amount,
                "orderId": _uuid(order["id"]),
            },
        )
        return {"marketStatus": market_status, "order": self._map_order(order), "portfolio": self.portfolio_payload(user), "transactions": self.transactions_payload(user)}

    def dashboard_payload(self, user: dict) -> dict:
        portfolio = self.portfolio_payload(user)
        transactions = self.transactions_payload(user)
        market = self.market_provider.get_indexes()
        stocks = self.market_provider.get_stocks()["stocks"]
        sorted_by_move = sorted(stocks, key=lambda item: item["changePercent"], reverse=True)
        summary = portfolio["summary"]
        return {
            "user": user,
            "marketSummary": market["marketSummary"],
            "marketIndices": market["marketIndices"],
            "portfolioSummary": summary,
            "portfolioGrowth": portfolio["growth"],
            "dashboardSnapshot": {"activeRange": "6M", "todayPnl": summary["dailyReturn"], "todayPnlPercent": summary["dailyReturnPercent"], "portfolioTrend": self._portfolio_trend(summary)},
            "dashboardTimeRanges": ["1D", "1W", "1M", "3M", "6M", "1Y"],
            "attentionItems": self._dashboard_attention(portfolio, transactions),
            "marketNews": [],
            "timelineExtras": [],
            "recentActivity": transactions["recentActivity"],
            "topGainers": [item for item in sorted_by_move if item["changePercent"] > 0][:3],
            "topLosers": sorted([item for item in stocks if item["changePercent"] < 0], key=lambda item: item["changePercent"])[:3],
            "watchlist": [],
        }

    def admin_dashboard(self) -> dict:
        users = self.admin_users()
        deposits = self.all_deposit_requests()
        pending = [item for item in deposits if item["status"] == "PENDING"]
        approved = [item for item in deposits if item["status"] == "APPROVED"]
        rejected = [item for item in deposits if item["status"] == "REJECTED"]
        return {
            "summary": {
                "totalUsers": len(users),
                "activeUsers": sum(1 for user in users if user["status"] == "ACTIVE"),
                "suspendedUsers": sum(1 for user in users if user["status"] == "SUSPENDED"),
                "pendingDeposits": len(pending),
                "platformHealth": 100 if not pending and not rejected else 98,
                "pendingActions": len(pending),
                "attentionRequired": len(rejected) + sum(1 for user in users if user["status"] == "SUSPENDED"),
                "reviewedToday": len(approved) + len(rejected),
            },
            "operations": [
                {"id": "new-users", "label": "Users", "value": len(users), "trend": "0%", "meta": "registered accounts", "type": "number"},
                {"id": "pending-deposits", "label": "Pending Deposits", "value": len(pending), "trend": "0%", "meta": "awaiting review", "type": "number"},
                {"id": "approved-deposits", "label": "Approved Deposits", "value": len(approved), "trend": "0%", "meta": "approved requests", "type": "number"},
                {"id": "rejected-deposits", "label": "Rejected Deposits", "value": len(rejected), "trend": "0%", "meta": "rejected requests", "type": "number"},
                {"id": "virtual-funds", "label": "Total Virtual Funds", "value": self._total_user_cash(), "trend": "0%", "meta": "available user cash", "type": "currency"},
            ],
            "depositRequests": deposits,
            "users": users,
            "activity": self.admin_activity(),
            "attention": {"suspendedAccounts": [user for user in users if user["status"] == "SUSPENDED"], "largeDeposits": [item for item in deposits if item["amount"] >= 10000], "recentlyActiveUsers": users[:3]},
        }

    def admin_users(self) -> list[dict]:
        with self.database.connect() as connection:
            profiles = connection.execute(
                """
                select p.*, w.id as wallet_id
                from public.profiles p
                left join public.wallets w on w.user_id = p.user_id
                where p.role = 'USER'
                order by p.created_at desc
                """
            ).fetchall()

        rows = []
        for profile in profiles:
            user = self.public_user(profile, {"id": profile["wallet_id"]})
            portfolio = self.portfolio_payload(user)
            rows.append({
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "phoneNumber": user["phoneNumber"],
                "dateOfBirth": user["dateOfBirth"],
                "timezone": user["timezone"],
                "country": user["country"],
                "role": user["role"],
                "status": user["status"],
                "createdAt": user["createdAt"],
                "lastLoginAt": user["lastLoginAt"],
                "lastLoginLabel": user["lastLoginLabel"],
                "loginBadge": user["loginBadge"],
                "profileCompleted": user["profileCompleted"],
                "portfolioValue": portfolio["summary"]["portfolioValue"],
                "lastActive": user["lastActive"],
                "holdingsCount": portfolio["summary"]["holdingsCount"],
                "riskLevel": "High" if user["status"] == "SUSPENDED" else "Low",
                "accountAge": _date(profile["created_at"]),
                "deposits": self._deposit_rows_for_admin(user["id"]),
                "activity": self._portfolio_events(user["id"])[:3],
            })
        return rows

    def all_deposit_requests(self) -> list[dict]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                select d.*, p.display_name as user_name
                from public.deposit_requests d
                join public.profiles p on p.user_id = d.user_id
                where p.role = 'USER'
                order by d.created_at desc
                """
            ).fetchall()
        return [self._map_admin_deposit(row) for row in rows]

    def approve_deposit(self, admin: dict, deposit_id: str) -> dict:
        with self.database.connect() as connection:
            request = self._deposit_for_update(connection, deposit_id)
            if request["status"] != "PENDING":
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Deposit request has already been reviewed.")

            connection.execute("select * from public.wallets where user_id = %s for update", (request["user_id"],)).fetchone()
            request = connection.execute(
                """
                update public.deposit_requests
                set status = 'APPROVED', reviewed_by = %s, reviewed_at = now()
                where id = %s
                returning *
                """,
                (admin["id"], deposit_id),
            ).fetchone()
            connection.execute(
                "update public.wallets set cash_balance = cash_balance + %s where user_id = %s",
                (request["amount"], request["user_id"]),
            )
            connection.execute(
                """
                update public.transactions
                set status = 'APPROVED'
                where related_deposit_request_id = %s
                """,
                (deposit_id,),
            )
            self._insert_admin_action(connection, admin["id"], request["user_id"], "DEPOSIT_APPROVED", {"depositId": _uuid(deposit_id), "amount": _money(request["amount"])})
        self.logger.info(
            "deposit.approved",
            extra={
                "event": "deposit.approved",
                "adminUserId": admin["id"],
                "targetUserId": _uuid(request["user_id"]),
                "depositId": _uuid(deposit_id),
                "amount": _money(request["amount"]),
            },
        )
        return self._map_deposit(request)

    def reject_deposit(self, admin: dict, deposit_id: str) -> dict:
        with self.database.connect() as connection:
            request = self._deposit_for_update(connection, deposit_id)
            if request["status"] != "PENDING":
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Deposit request has already been reviewed.")

            request = connection.execute(
                """
                update public.deposit_requests
                set status = 'REJECTED', reviewed_by = %s, reviewed_at = now()
                where id = %s
                returning *
                """,
                (admin["id"], deposit_id),
            ).fetchone()
            connection.execute(
                """
                update public.transactions
                set status = 'REJECTED'
                where related_deposit_request_id = %s
                """,
                (deposit_id,),
            )
            self._insert_admin_action(connection, admin["id"], request["user_id"], "DEPOSIT_REJECTED", {"depositId": _uuid(deposit_id), "amount": _money(request["amount"])})
        self.logger.info(
            "deposit.rejected",
            extra={
                "event": "deposit.rejected",
                "adminUserId": admin["id"],
                "targetUserId": _uuid(request["user_id"]),
                "depositId": _uuid(deposit_id),
                "amount": _money(request["amount"]),
            },
        )
        return self._map_deposit(request)

    def set_user_status(self, admin: dict, user_id: str, new_status: str) -> dict:
        with self.database.connect() as connection:
            profile = connection.execute(
                """
                update public.profiles
                set status = %s
                where user_id = %s and role = 'USER'
                returning *
                """,
                (new_status, user_id),
            ).fetchone()
            if not profile:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
            self._insert_admin_action(connection, admin["id"], user_id, "USER_" + new_status, {"status": new_status})
            wallet = self._wallet(connection, user_id)
        self.logger.info(
            "admin.user_status_updated",
            extra={
                "event": "admin.user_status_updated",
                "adminUserId": admin["id"],
                "targetUserId": user_id,
                "status": new_status,
            },
        )
        return self.public_user(profile, wallet)

    def admin_activity(self) -> list[dict]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                select a.*, p.display_name as target_name
                from public.admin_actions a
                left join public.profiles p on p.user_id = a.target_user_id
                order by a.created_at desc
                limit 8
                """
            ).fetchall()
        return [self._map_admin_action(row) for row in rows]

    def stock_by_symbol(self, symbol: str) -> dict:
        return self.market_provider.get_stock(symbol)["stock"]

    def _require_market_open(self) -> dict:
        market_status = self.market_provider.get_market_status()
        if market_status["status"] != "OPEN":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Market is currently closed.")
        return market_status

    def _wallet(self, connection, user_id: str, lock: bool = False) -> dict:
        suffix = " for update" if lock else ""
        wallet = connection.execute("select * from public.wallets where user_id = %s" + suffix, (user_id,)).fetchone()
        if not wallet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found.")
        return wallet

    def _holding(self, connection, user_id: str, symbol: str, lock: bool = False) -> dict | None:
        suffix = " for update" if lock else ""
        return connection.execute(
            "select * from public.holdings where user_id = %s and symbol = %s" + suffix,
            (user_id, symbol),
        ).fetchone()

    def _holding_rows(self, connection, user_id: str) -> list[dict]:
        rows = connection.execute(
            "select * from public.holdings where user_id = %s order by symbol",
            (user_id,),
        ).fetchall()
        holdings = []
        for row in rows:
            stock = self.stock_by_symbol(row["symbol"])
            quantity = int(row["quantity"])
            avg_price = _money(row["avg_price"])
            value = _money(quantity * stock["price"])
            basis = quantity * avg_price
            pnl = _money(value - basis)
            pnl_percent = _money((pnl / basis) * 100) if basis else 0
            holdings.append({
                "id": _uuid(row["id"]),
                "symbol": row["symbol"],
                "company": stock.get("company") or row["company"],
                "quantity": quantity,
                "avgPrice": avg_price,
                "currentPrice": stock["price"],
                "value": value,
                "pnl": pnl,
                "pnlPercent": pnl_percent,
                "unrealizedPnL": pnl,
                "unrealizedPnLPercent": pnl_percent,
                "allocationPercent": 0,
                "sector": stock.get("sector") or row["sector"],
                "changePercent": stock.get("changePercent", 0),
                "previousClose": stock.get("previousClose", stock["price"]),
                "quoteSource": stock.get("quoteSource", ""),
                "quoteTimestamp": stock.get("quoteTimestamp", ""),
                "dataAgeSeconds": stock.get("dataAgeSeconds", 0),
                "freshness": stock.get("freshness", "OFFLINE"),
            })
        return holdings

    def _insert_order(self, connection, user_id: str, side: str, stock: dict, quantity: int, amount: float) -> dict:
        order = connection.execute(
            """
            insert into public.orders (user_id, symbol, side, quantity, requested_price, executed_price, status)
            values (%s, %s, %s, %s, %s, %s, 'APPROVED')
            returning *
            """,
            (user_id, stock["symbol"], side, quantity, stock["price"], stock["price"]),
        ).fetchone()
        signed_amount = -amount if side == "BUY" else amount
        connection.execute(
            """
            insert into public.transactions (user_id, type, status, amount, detail, related_order_id)
            values (%s, %s, 'APPROVED', %s, %s, %s)
            """,
            (user_id, side, signed_amount, f"{stock['symbol']} {side} x{quantity}", order["id"]),
        )
        return order

    def _map_order(self, row: dict) -> dict:
        price = _money(row["executed_price"])
        quantity = int(row["quantity"])
        return {
            "id": _uuid(row["id"]),
            "date": _date(row["created_at"]),
            "side": row["side"],
            "symbol": row["symbol"],
            "quantity": quantity,
            "price": price,
            "amount": _money(price * quantity),
            "status": row["status"],
            "requestTime": _time_label(row["created_at"]),
        }

    def _trade_rows(self, connection, user_id: str) -> list[dict]:
        rows = connection.execute(
            """
            select * from public.orders
            where user_id = %s
            order by created_at desc
            """,
            (user_id,),
        ).fetchall()
        return [self._map_order(row) for row in rows]

    def _map_deposit(self, row: dict) -> dict:
        return {
            "id": _uuid(row["id"]),
            "date": _date(row["created_at"]),
            "amount": _money(row["amount"]),
            "notes": row.get("notes") or "",
            "requestTime": _time_label(row["created_at"]),
            "status": row["status"],
        }

    def _map_admin_deposit(self, row: dict) -> dict:
        deposit = self._map_deposit(row)
        deposit["userId"] = _uuid(row["user_id"])
        deposit["user"] = row["user_name"]
        return deposit

    def _deposit_rows(self, connection, user_id: str) -> list[dict]:
        rows = connection.execute(
            """
            select * from public.deposit_requests
            where user_id = %s
            order by created_at desc
            """,
            (user_id,),
        ).fetchall()
        return [self._map_deposit(row) for row in rows]

    def _deposit_rows_for_admin(self, user_id: str) -> list[dict]:
        with self.database.connect() as connection:
            return self._deposit_rows(connection, user_id)

    def _deposit_for_update(self, connection, deposit_id: str) -> dict:
        request = connection.execute(
            "select * from public.deposit_requests where id = %s for update",
            (deposit_id,),
        ).fetchone()
        if not request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deposit request not found.")
        return request

    def _transaction_rows(self, connection, user_id: str) -> list[dict]:
        rows = connection.execute(
            """
            select * from public.transactions
            where user_id = %s
            order by created_at desc
            """,
            (user_id,),
        ).fetchall()
        return [
            {
                "id": _uuid(row["id"]),
                "amount": _money(row["amount"]),
                "date": _date(row["created_at"]),
                "detail": row["detail"],
                "status": row["status"],
                "type": row["type"],
            }
            for row in rows
        ]

    def _portfolio_events(self, user_id: str) -> list[dict]:
        with self.database.connect() as connection:
            orders = self._trade_rows(connection, user_id)[:6]
        return [
            {
                "id": "event-" + order["id"],
                "title": ("Bought " if order["side"] == "BUY" else "Sold ") + order["symbol"],
                "description": str(order["quantity"]) + " shares at market",
                "time": order["requestTime"],
                "type": "buy" if order["side"] == "BUY" else "sell",
            }
            for order in orders
        ]

    def _daily_return(self, holdings: list[dict]) -> tuple[float, float]:
        current_value = sum(item["value"] for item in holdings)
        previous_value = 0
        for holding in holdings:
            previous_price = holding["currentPrice"] / (1 + (holding.get("changePercent", 0) / 100))
            previous_value += previous_price * holding["quantity"]
        daily_return = _money(current_value - previous_value)
        daily_return_percent = _money((daily_return / previous_value) * 100) if previous_value else 0
        return daily_return, daily_return_percent

    def _portfolio_growth(self, invested_amount: float, portfolio_value: float) -> list[dict]:
        return [{"date": period, "invested": invested_amount, "value": portfolio_value} for period in PORTFOLIO_PERIODS]

    def _sector_allocation(self, holdings: list[dict], cash: float, total: float) -> list[dict]:
        buckets = {"Cash": cash}
        for holding in holdings:
            buckets[holding["sector"]] = buckets.get(holding["sector"], 0) + holding["value"]
        return [{"label": key, "value": _money((value / total) * 100) if total else 0, "color": SECTOR_COLORS.get(key, "#334155")} for key, value in sorted(buckets.items(), key=lambda item: item[1], reverse=True)]

    def _stock_allocation(self, holdings: list[dict], cash: float, total: float) -> list[dict]:
        rows = [{"label": item["symbol"], "value": _money((item["value"] / total) * 100) if total else 0, "color": SECTOR_COLORS.get(item["sector"], "#10b981")} for item in sorted(holdings, key=lambda holding: holding["value"], reverse=True)]
        rows.append({"label": "Cash", "value": _money((cash / total) * 100) if total else 0, "color": SECTOR_COLORS["Cash"]})
        return rows

    def _portfolio_attention(self, holdings: list[dict], cash: float, total: float) -> list[dict]:
        largest = max(holdings, key=lambda item: item["value"], default=None)
        weakest = min(holdings, key=lambda item: item["pnlPercent"], default=None)
        return [
            {"id": "attn-1", "label": "Largest allocation", "value": largest["symbol"] if largest else "None", "detail": str(largest["allocationPercent"]) + "% of total portfolio value" if largest else "No holdings", "tone": "info"},
            {"id": "attn-2", "label": "Needs review", "value": weakest["symbol"] if weakest else "None", "detail": str(weakest["pnlPercent"]) + "% unrealized return" if weakest else "No holdings", "tone": "negative" if weakest and weakest["pnlPercent"] < 0 else "positive"},
            {"id": "attn-3", "label": "Cash buffer", "value": "$" + f"{cash / 1000:.1f}K", "detail": str(_money((cash / total) * 100) if total else 0) + "% available for new entries", "tone": "positive"},
        ]

    def _portfolio_trend(self, summary: dict) -> str:
        if not summary["investedAmount"]:
            return "No invested capital yet"
        prefix = "+" if summary["totalReturnPercent"] >= 0 else ""
        return prefix + str(summary["totalReturnPercent"]) + "% total return"

    def _dashboard_attention(self, portfolio: dict, transactions: dict) -> list[dict]:
        summary = portfolio["summary"]
        pending_deposits = transactions["summary"]["pendingDeposits"]
        largest_holding = max(portfolio["holdings"], key=lambda item: item["value"], default=None)
        return [
            {"id": "attention-1", "label": "Pending Funding", "value": "$" + f"{pending_deposits:,.0f}", "detail": "No pending requests" if pending_deposits == 0 else "Awaiting admin approval", "tone": "warning" if pending_deposits else "info"},
            {"id": "attention-2", "label": "Holdings", "value": str(summary["holdingsCount"]), "detail": "No positions yet" if summary["holdingsCount"] == 0 else "Open positions in portfolio", "tone": "info" if summary["holdingsCount"] == 0 else "positive"},
            {"id": "attention-3", "label": "Largest Position", "value": largest_holding["symbol"] if largest_holding else "None", "detail": str(largest_holding["allocationPercent"]) + "% allocation" if largest_holding else "Buy shares to create an allocation", "tone": "positive" if largest_holding else "info"},
        ]

    def _recent_activity(self, deposits: list[dict], trades: list[dict]) -> list[dict]:
        latest_trade = trades[0] if trades else None
        latest_deposit = deposits[0] if deposits else None
        rows = []
        if latest_trade:
            rows.append({"id": "act-1", "title": ("Bought " if latest_trade["side"] == "BUY" else "Sold ") + latest_trade["symbol"], "description": str(latest_trade["quantity"]) + " shares at market", "time": latest_trade["requestTime"], "tone": "positive" if latest_trade["side"] == "BUY" else "negative"})
        if latest_deposit:
            rows.append({"id": "act-2", "title": "Deposit requested", "description": "$" + f"{latest_deposit['amount']:,.0f} pending admin review", "time": latest_deposit["requestTime"], "tone": "warning"})
        return rows

    def _transaction_timeline(self, rows: list[dict]) -> list[dict]:
        timeline = []
        for row in rows[:6]:
            if row["type"] == "BUY":
                title = "Stock Purchased"
                item_type = "buy"
            elif row["type"] == "SELL":
                title = "Stock Sold"
                item_type = "sell"
            else:
                title = "Deposit " + ("Requested" if row["status"] == "PENDING" else row["status"].title())
                item_type = "deposit-requested" if row["status"] == "PENDING" else ("deposit-approved" if row["status"] == "APPROVED" else "deposit-rejected")
            timeline.append({"id": "timeline-" + row["id"], "title": title, "description": row["detail"], "amount": row["amount"], "status": row["status"], "time": row["date"], "type": item_type})
        return timeline

    def _account_insights(self, deposits: list[dict], trades: list[dict]) -> list[dict]:
        largest = max((item["amount"] for item in deposits), default=0)
        average = sum(item["amount"] for item in deposits) / len(deposits) if deposits else 0
        return [
            {"id": "largest-deposit", "label": "Largest Deposit", "value": largest, "type": "currency", "detail": "Largest single request"},
            {"id": "total-requests", "label": "Total Requests", "value": len(deposits), "type": "number", "detail": "Across all states"},
            {"id": "average-request", "label": "Average Request Size", "value": _money(average), "type": "currency", "detail": "Deposit request average"},
            {"id": "trading-count", "label": "Trading Activity Count", "value": len(trades), "type": "number", "detail": "Recent executions"},
        ]

    def _activity_summary(self, deposits: list[dict], trades: list[dict]) -> list[dict]:
        last_deposit = deposits[0] if deposits else None
        last_approval = next((item for item in deposits if item["status"] == "APPROVED"), None)
        last_trade = trades[0] if trades else None
        return [
            {"id": "last-deposit", "label": "Last Deposit", "value": "$" + f"{last_deposit['amount']:,.0f} requested" if last_deposit else "None", "detail": last_deposit["requestTime"] if last_deposit else "No activity", "tone": "warning"},
            {"id": "last-approval", "label": "Last Approval", "value": "$" + f"{last_approval['amount']:,.0f} approved" if last_approval else "None", "detail": last_approval["requestTime"] if last_approval else "No approvals", "tone": "positive"},
            {"id": "last-trade", "label": "Last Trade", "value": (last_trade["side"].title() + " " + last_trade["symbol"]) if last_trade else "None", "detail": last_trade["date"] if last_trade else "No trades", "tone": "info"},
        ]

    def _total_user_cash(self) -> float:
        with self.database.connect() as connection:
            row = connection.execute(
                """
                select coalesce(sum(w.cash_balance), 0) as total
                from public.wallets w
                join public.profiles p on p.user_id = w.user_id
                where p.role = 'USER'
                """
            ).fetchone()
        return _money(row["total"])

    def _insert_admin_action(self, connection, admin_user_id: str, target_user_id: UUID | str, action: str, metadata: dict) -> None:
        connection.execute(
            """
            insert into public.admin_actions (admin_user_id, target_user_id, action, metadata)
            values (%s, %s, %s, %s)
            """,
            (admin_user_id, target_user_id, action, Json(metadata)),
        )

    def _map_admin_action(self, row: dict) -> dict:
        action = row["action"]
        target = row.get("target_name") or "User"
        if action == "DEPOSIT_APPROVED":
            title = "Deposit Approved"
            description = target + " received $" + f"{_money(row['metadata'].get('amount', 0)):,.0f}"
            item_type = "approved"
        elif action == "DEPOSIT_REJECTED":
            title = "Deposit Rejected"
            description = target + " request was rejected"
            item_type = "rejected"
        elif action == "USER_SUSPENDED":
            title = "User Suspended"
            description = target + " is blocked from user routes"
            item_type = "suspended"
        else:
            title = "User Activated"
            description = target + " can access user routes"
            item_type = "activated"
        return {"id": _uuid(row["id"]), "title": title, "description": description, "time": _time_label(row["created_at"]), "type": item_type}


def get_repository() -> TradingRepository:
    return TradingRepository()
