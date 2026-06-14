from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import wallet
from app.db import SessionLocal
from app.models import CashLedger, Wallet

router = APIRouter()

class AmountRequest(BaseModel):
    amount: float = Field(..., gt=0)

@router.post("/api/v1/wallet/deposit")
def deposit(req: AmountRequest):
    db = SessionLocal()
    try:
        wallet["balance"] += req.amount
        wallet_row = db.query(Wallet).first()
        if wallet_row:
            wallet_row.balance = wallet["balance"]
            db.add(wallet_row)

        entry = CashLedger(
            type="DEPOSIT",
            amount=req.amount,
            balance=wallet["balance"],
            timestamp=datetime.utcnow()
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return entry
    finally:
        db.close()

@router.post("/api/v1/wallet/withdraw")
def withdraw(req: AmountRequest):
    if wallet["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    db = SessionLocal()
    try:
        wallet["balance"] -= req.amount
        wallet_row = db.query(Wallet).first()
        if wallet_row:
            wallet_row.balance = wallet["balance"]
            db.add(wallet_row)

        entry = CashLedger(
            type="WITHDRAW",
            amount=req.amount,
            balance=wallet["balance"],
            timestamp=datetime.utcnow()
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return entry
    finally:
        db.close()

@router.get("/api/v1/wallet/ledger")
def ledger():
    db = SessionLocal()
    try:
        items = db.query(CashLedger).order_by(CashLedger.id).all()
        return {
            "balance": wallet["balance"],
            "items": items
        }
    finally:
        db.close()
