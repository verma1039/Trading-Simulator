from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, text

from app.auth.schemas import CurrentUser
from app.auth.dependencies import get_current_admin
from app.db import SessionLocal
from app.db_locking import for_update
from app.services.market_data import get_live_price
from app.supabase_models import (
    AdminAction,
    CashLedger,
    Holding,
    Order,
    Profile,
    Trade,
    Wallet,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class AdminBalanceAdjustmentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    reason: str = Field(..., min_length=1)


class AdminDashboardResponse(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    banned_users: int
    total_wallet_balance: float
    total_holdings_count: int
    orders_today: int
    trades_today: int


class AdminTopUserResponse(BaseModel):
    id: str
    email: str | None
    role: str
    status: str
    walletBalance: float
    holdingsValue: float
    portfolioValue: float


class AdminTopUsersResponse(BaseModel):
    limit: int
    offset: int
    users: list[AdminTopUserResponse]


class AdminActivityItemResponse(BaseModel):
    id: str
    admin_user_id: str | None
    target_user_id: str
    action: str
    metadata: dict
    reason: str | None
    created_at: str


class AdminActivityResponse(BaseModel):
    limit: int
    offset: int
    actions: list[AdminActivityItemResponse]


@router.get("/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(_admin: CurrentUser = Depends(get_current_admin)):
    db = SessionLocal()
    today_start = datetime.now(timezone.utc).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    try:
        total_users = db.execute(text("select count(*) from auth.users")).scalar() or 0
        suspended_users = (
            db.query(Profile)
            .filter(Profile.status == "SUSPENDED")
            .count()
        )
        banned_users = (
            db.query(Profile)
            .filter(Profile.status == "BANNED")
            .count()
        )
        active_users = max(int(total_users) - suspended_users - banned_users, 0)
        total_wallet_balance = db.query(func.coalesce(func.sum(Wallet.balance), 0)).scalar() or 0
        total_holdings_count = db.query(Holding).count()
        orders_today = (
            db.query(Order)
            .filter(Order.created_at >= today_start)
            .count()
        )
        trades_today = (
            db.query(Trade)
            .filter(Trade.created_at >= today_start)
            .count()
        )

        return {
            "total_users": int(total_users),
            "active_users": active_users,
            "suspended_users": suspended_users,
            "banned_users": banned_users,
            "total_wallet_balance": float(total_wallet_balance),
            "total_holdings_count": total_holdings_count,
            "orders_today": orders_today,
            "trades_today": trades_today,
        }
    finally:
        db.close()


@router.get("/users")
def list_users(_admin: CurrentUser = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        auth_users = db.execute(text(
            """
            select id::text as id, email, created_at
            from auth.users
            order by created_at desc
            """
        )).mappings().all()

        user_ids = [UUID(row["id"]) for row in auth_users]
        profiles = {
            profile.user_id: profile
            for profile in (
                db.query(Profile)
                .filter(Profile.user_id.in_(user_ids))
                .all()
                if user_ids
                else []
            )
        }
        wallets = {
            wallet.user_id: wallet
            for wallet in (
                db.query(Wallet)
                .filter(Wallet.user_id.in_(user_ids))
                .all()
                if user_ids
                else []
            )
        }

        return [
            {
                "id": row["id"],
                "email": row["email"],
                "role": profiles.get(UUID(row["id"])).role if UUID(row["id"]) in profiles else "user",
                "status": profiles.get(UUID(row["id"])).status if UUID(row["id"]) in profiles else "ACTIVE",
                "walletBalance": (
                    float(wallets[UUID(row["id"])].balance)
                    if UUID(row["id"]) in wallets
                    else 0.0
                ),
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
            for row in auth_users
        ]
    finally:
        db.close()


@router.get("/users/top", response_model=AdminTopUsersResponse)
def top_users_by_portfolio_value(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _admin: CurrentUser = Depends(get_current_admin),
):
    db = SessionLocal()
    try:
        auth_users = db.execute(text(
            """
            select id::text as id, email, created_at
            from auth.users
            """
        )).mappings().all()
        user_ids = [UUID(row["id"]) for row in auth_users]
        profiles = {
            profile.user_id: profile
            for profile in (
                db.query(Profile)
                .filter(Profile.user_id.in_(user_ids))
                .all()
                if user_ids
                else []
            )
        }
        wallets = {
            wallet.user_id: wallet
            for wallet in (
                db.query(Wallet)
                .filter(Wallet.user_id.in_(user_ids))
                .all()
                if user_ids
                else []
            )
        }
        holdings_by_user: dict[UUID, list[Holding]] = {}
        all_holdings = (
            db.query(Holding)
            .filter(Holding.user_id.in_(user_ids))
            .all()
            if user_ids
            else []
        )
        price_by_symbol = {
            symbol: get_live_price(symbol)
            for symbol in {holding.symbol for holding in all_holdings}
        }

        for holding in all_holdings:
            holdings_by_user.setdefault(holding.user_id, []).append(holding)

        ranked_users = []
        for row in auth_users:
            user_id = UUID(row["id"])
            profile = profiles.get(user_id)
            wallet = wallets.get(user_id)
            wallet_balance = float(wallet.balance) if wallet else 0.0
            holdings_value = sum(
                holding.quantity * price_by_symbol.get(holding.symbol, 0.0)
                for holding in holdings_by_user.get(user_id, [])
            )
            portfolio_value = wallet_balance + holdings_value
            ranked_users.append({
                "id": row["id"],
                "email": row["email"],
                "role": profile.role if profile else "user",
                "status": profile.status if profile else "ACTIVE",
                "walletBalance": round(wallet_balance, 2),
                "holdingsValue": round(holdings_value, 2),
                "portfolioValue": round(portfolio_value, 2),
            })

        ranked_users.sort(key=lambda item: item["portfolioValue"], reverse=True)
        return {
            "limit": limit,
            "offset": offset,
            "users": ranked_users[offset:offset + limit],
        }
    finally:
        db.close()


@router.get("/activity", response_model=AdminActivityResponse)
def admin_activity(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _admin: CurrentUser = Depends(get_current_admin),
):
    db = SessionLocal()
    try:
        actions = (
            db.query(AdminAction)
            .order_by(AdminAction.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return {
            "limit": limit,
            "offset": offset,
            "actions": [serialize_admin_action(action) for action in actions],
        }
    finally:
        db.close()


@router.get("/users/{user_id}")
def get_user_detail(
    user_id: str,
    _admin: CurrentUser = Depends(get_current_admin),
):
    target_user_id = parse_user_id(user_id)
    db = SessionLocal()
    try:
        auth_user = get_auth_user_or_404(db, target_user_id)
        profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
        wallet = db.query(Wallet).filter(Wallet.user_id == target_user_id).first()
        holdings = (
            db.query(Holding)
            .filter(Holding.user_id == target_user_id)
            .order_by(Holding.symbol)
            .all()
        )
        trades = (
            db.query(Trade)
            .filter(Trade.user_id == target_user_id)
            .order_by(Trade.created_at.desc())
            .all()
        )
        orders = (
            db.query(Order)
            .filter(Order.user_id == target_user_id)
            .order_by(Order.created_at.desc())
            .all()
        )
        ledger_entries = (
            db.query(CashLedger)
            .filter(CashLedger.user_id == target_user_id)
            .order_by(CashLedger.created_at.desc())
            .all()
        )
        admin_actions = (
            db.query(AdminAction)
            .filter(AdminAction.target_user_id == target_user_id)
            .order_by(AdminAction.created_at.desc())
            .limit(50)
            .all()
        )

        return {
            "profile": serialize_profile(profile, auth_user),
            "wallet": serialize_wallet(wallet),
            "holdings": [serialize_holding(item) for item in holdings],
            "trades": [serialize_trade(item) for item in trades],
            "orders": [serialize_order(item) for item in orders],
            "ledgerEntries": [serialize_ledger_entry(item) for item in ledger_entries],
            "adminActions": [serialize_admin_action(item) for item in admin_actions],
        }
    finally:
        db.close()


@router.post("/users/{user_id}/activate")
def activate_user(
    user_id: str,
    admin: CurrentUser = Depends(get_current_admin),
):
    return set_user_status(user_id, "ACTIVE", "USER_ACTIVATED", admin)


@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: str,
    admin: CurrentUser = Depends(get_current_admin),
):
    return set_user_status(user_id, "SUSPENDED", "USER_SUSPENDED", admin)


@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: str,
    admin: CurrentUser = Depends(get_current_admin),
):
    return set_user_status(user_id, "BANNED", "USER_BANNED", admin)


@router.post("/users/{user_id}/deposit")
def admin_deposit(
    user_id: str,
    req: AdminBalanceAdjustmentRequest,
    admin: CurrentUser = Depends(get_current_admin),
):
    return adjust_user_balance(user_id, req, admin, "DEPOSIT", "ADMIN_DEPOSIT", 1)


@router.post("/users/{user_id}/withdraw")
def admin_withdraw(
    user_id: str,
    req: AdminBalanceAdjustmentRequest,
    admin: CurrentUser = Depends(get_current_admin),
):
    return adjust_user_balance(user_id, req, admin, "WITHDRAW", "ADMIN_WITHDRAW", -1)


def set_user_status(
    user_id: str,
    status: str,
    action: str,
    admin: CurrentUser,
):
    target_user_id = parse_user_id(user_id)
    admin_user_id = UUID(admin.id)
    prevent_destructive_self_status_action(target_user_id, admin_user_id, status)
    db = SessionLocal()
    try:
        auth_user = get_auth_user_or_404(db, target_user_id)
        profile = get_or_create_profile(db, target_user_id, auth_user["email"])
        old_status = profile.status
        profile.status = status
        db.add(profile)
        add_admin_action(
            db,
            admin_user_id=admin_user_id,
            target_user_id=target_user_id,
            action=action,
            reason=f"Set status to {status}",
            metadata={
                "old_status": old_status,
                "new_status": status,
            },
        )
        db.commit()
        db.refresh(profile)
        return {"status": profile.status, "user_id": str(target_user_id)}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def adjust_user_balance(
    user_id: str,
    req: AdminBalanceAdjustmentRequest,
    admin: CurrentUser,
    ledger_type: str,
    action: str,
    direction: int,
):
    target_user_id = parse_user_id(user_id)
    admin_user_id = UUID(admin.id)
    amount = Decimal(str(req.amount))
    db = SessionLocal()
    try:
        auth_user = get_auth_user_or_404(db, target_user_id)
        get_or_create_profile(db, target_user_id, auth_user["email"])
        lock_profile(db, target_user_id)
        wallet = get_or_create_locked_wallet(db, target_user_id)

        if direction < 0 and wallet.balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        old_balance = wallet.balance
        wallet.balance = wallet.balance + amount if direction > 0 else wallet.balance - amount
        db.add(wallet)
        db.flush()

        ledger_entry = CashLedger(
            user_id=target_user_id,
            wallet_id=wallet.id,
            entry_type=ledger_type,
            amount=amount,
            balance=wallet.balance,
        )
        db.add(ledger_entry)
        db.flush()

        add_admin_action(
            db,
            admin_user_id=admin_user_id,
            target_user_id=target_user_id,
            action=action,
            reason=req.reason,
            metadata={
                "amount": float(amount),
                "old_balance": float(old_balance),
                "new_balance": float(wallet.balance),
                "ledger_entry_id": str(ledger_entry.id),
            },
        )
        db.commit()
        db.refresh(wallet)
        db.refresh(ledger_entry)

        return {
            "user_id": str(target_user_id),
            "balance": float(wallet.balance),
            "ledgerEntry": serialize_ledger_entry(ledger_entry),
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def add_admin_action(
    db,
    admin_user_id: UUID,
    target_user_id: UUID,
    action: str,
    reason: str,
    metadata: dict,
) -> AdminAction:
    row = AdminAction(
        admin_user_id=admin_user_id,
        target_user_id=target_user_id,
        action=action,
        reason=reason,
        metadata_json=metadata,
    )
    db.add(row)
    return row


def serialize_admin_action(action: AdminAction):
    return {
        "id": str(action.id),
        "admin_user_id": str(action.admin_user_id) if action.admin_user_id else None,
        "target_user_id": str(action.target_user_id),
        "action": action.action,
        "metadata": action.metadata_json or {},
        "reason": action.reason,
        "created_at": action.created_at.isoformat(),
    }


def prevent_destructive_self_status_action(
    target_user_id: UUID,
    admin_user_id: UUID,
    new_status: str,
) -> None:
    if target_user_id == admin_user_id and new_status in {"SUSPENDED", "BANNED"}:
        raise HTTPException(
            status_code=400,
            detail="Admins cannot suspend or ban their own account",
        )


def get_auth_user_or_404(db, user_id: UUID):
    row = db.execute(
        text(
            """
            select id::text as id, email, created_at
            from auth.users
            where id = :user_id
            """
        ),
        {"user_id": str(user_id)},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return row


def get_or_create_profile(db, user_id: UUID, email: str | None) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile:
        return profile

    profile = Profile(
        user_id=user_id,
        display_name=email.split("@", 1)[0] if email else None,
        role="user",
        status="ACTIVE",
    )
    db.add(profile)
    db.flush()
    return profile


def get_or_create_wallet(db, user_id: UUID) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if wallet:
        return wallet

    wallet = Wallet(user_id=user_id, balance=Decimal("0"))
    db.add(wallet)
    db.flush()
    return wallet


def get_or_create_locked_wallet(db, user_id: UUID) -> Wallet:
    wallet = for_update(
        db.query(Wallet).filter(Wallet.user_id == user_id)
    ).first()
    if wallet:
        return wallet

    wallet = Wallet(user_id=user_id, balance=Decimal("0"))
    db.add(wallet)
    db.flush()
    return wallet


def lock_profile(db, user_id: UUID) -> Profile | None:
    return for_update(
        db.query(Profile).filter(Profile.user_id == user_id)
    ).first()


def parse_user_id(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user_id") from exc


def serialize_profile(profile: Profile | None, auth_user):
    return {
        "id": str(profile.id) if profile else None,
        "user_id": auth_user["id"],
        "email": auth_user["email"],
        "display_name": profile.display_name if profile else None,
        "role": profile.role if profile else "user",
        "status": profile.status if profile else "ACTIVE",
        "created_at": profile.created_at.isoformat() if profile else auth_user["created_at"].isoformat(),
        "updated_at": profile.updated_at.isoformat() if profile else None,
    }


def serialize_wallet(wallet: Wallet | None):
    if not wallet:
        return None

    return {
        "id": str(wallet.id),
        "user_id": str(wallet.user_id),
        "balance": float(wallet.balance),
        "created_at": wallet.created_at.isoformat(),
        "updated_at": wallet.updated_at.isoformat(),
    }


def serialize_holding(holding: Holding):
    return {
        "id": str(holding.id),
        "user_id": str(holding.user_id),
        "symbol": holding.symbol,
        "quantity": holding.quantity,
        "avg_price": float(holding.avg_price),
        "created_at": holding.created_at.isoformat(),
        "updated_at": holding.updated_at.isoformat(),
    }


def serialize_trade(trade: Trade):
    return {
        "id": str(trade.id),
        "user_id": str(trade.user_id),
        "order_id": str(trade.order_id) if trade.order_id else None,
        "symbol": trade.symbol,
        "side": trade.side,
        "quantity": trade.quantity,
        "price": float(trade.price),
        "realized_pnl": float(trade.realized_pnl or 0),
        "created_at": trade.created_at.isoformat(),
        "updated_at": trade.updated_at.isoformat(),
    }


def serialize_order(order: Order):
    return {
        "id": str(order.id),
        "user_id": str(order.user_id),
        "symbol": order.symbol,
        "side": order.side,
        "quantity": order.quantity,
        "status": order.status,
        "requested_price": float(order.requested_price) if order.requested_price is not None else None,
        "executed_price": float(order.executed_price) if order.executed_price is not None else None,
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat(),
    }


def serialize_ledger_entry(entry: CashLedger):
    return {
        "id": str(entry.id),
        "user_id": str(entry.user_id),
        "wallet_id": str(entry.wallet_id),
        "order_id": str(entry.order_id) if entry.order_id else None,
        "trade_id": str(entry.trade_id) if entry.trade_id else None,
        "type": entry.entry_type,
        "symbol": entry.symbol,
        "amount": float(entry.amount),
        "balance": float(entry.balance),
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
    }
