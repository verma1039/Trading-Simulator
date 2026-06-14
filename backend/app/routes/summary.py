from fastapi import APIRouter

from app.db import SessionLocal
from app.models import Wallet, Holding, Trade
from app.services.market_data import get_live_price

router = APIRouter()

@router.get("/api/v1/account/summary")
def account_summary():
    db = SessionLocal()
    invested = 0.0
    current = 0.0
    unrealized = 0.0

    try:
        wallet_row = db.query(Wallet).first()
        balance = wallet_row.balance if wallet_row else 0.0

        for holding in db.query(Holding).all():
            live = get_live_price(holding.symbol)
            invested_value = holding.avg_price * holding.quantity
            current_value = live * holding.quantity

            invested += invested_value
            current += current_value
            unrealized += current_value - invested_value

        realized = sum(t.realized_pnl or 0.0 for t in db.query(Trade).all())

        equity = balance + current
        total_pnl = realized + unrealized

        return {
            "cashBalance": round(balance, 2),
            "investedValue": round(invested, 2),
            "portfolioValue": round(current, 2),
            "equity": round(equity, 2),
            "unrealizedPnL": round(unrealized, 2),
            "realizedPnL": round(realized, 2),
            "totalPnL": round(total_pnl, 2)
        }
    finally:
        db.close()
