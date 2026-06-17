from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.db_locking import for_update
from app.supabase_models import CashLedger, Wallet

router = APIRouter()

class AmountRequest(BaseModel):
    amount: float = Field(..., gt=0)

@router.post("/api/v1/wallet/deposit")
def deposit(
    req: AmountRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = UUID(current_user.id)
    amount = Decimal(str(req.amount))
    db = SessionLocal()
    try:
        wallet_row = for_update(
            db.query(Wallet).filter(Wallet.user_id == user_id)
        ).first()
        if not wallet_row:
            raise HTTPException(status_code=404, detail="Wallet not found")

        wallet_row.balance += amount
        entry = CashLedger(
            user_id=user_id,
            wallet_id=wallet_row.id,
            entry_type="DEPOSIT",
            amount=amount,
            balance=wallet_row.balance,
        )
        db.add(wallet_row)
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return serialize_ledger_entry(entry)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@router.post("/api/v1/wallet/withdraw")
def withdraw(
    req: AmountRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = UUID(current_user.id)
    amount = Decimal(str(req.amount))
    db = SessionLocal()
    try:
        wallet_row = for_update(
            db.query(Wallet).filter(Wallet.user_id == user_id)
        ).first()
        if not wallet_row:
            raise HTTPException(status_code=404, detail="Wallet not found")

        if wallet_row.balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        wallet_row.balance -= amount
        entry = CashLedger(
            user_id=user_id,
            wallet_id=wallet_row.id,
            entry_type="WITHDRAW",
            amount=amount,
            balance=wallet_row.balance,
        )
        db.add(wallet_row)
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return serialize_ledger_entry(entry)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@router.get("/api/v1/wallet/ledger")
def ledger(current_user: CurrentUser = Depends(get_current_user)):
    user_id = UUID(current_user.id)
    db = SessionLocal()
    try:
        wallet_row = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        balance = float(wallet_row.balance) if wallet_row else 0.0
        items = (
            db.query(CashLedger)
            .filter(CashLedger.user_id == user_id)
            .order_by(CashLedger.created_at, CashLedger.id)
            .all()
        )
        return {
            "balance": round(balance, 2),
            "items": [serialize_ledger_entry(item) for item in items]
        }
    finally:
        db.close()


def serialize_ledger_entry(entry: CashLedger):
    return {
        "id": str(entry.id),
        "type": entry.entry_type,
        "symbol": entry.symbol,
        "amount": float(entry.amount),
        "balance": float(entry.balance),
        "timestamp": entry.created_at.isoformat(),
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
    }
