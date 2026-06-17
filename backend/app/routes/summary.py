from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.services.market_data import get_live_price
from app.supabase_models import Holding, Trade, Wallet

router = APIRouter()

@router.get("/api/v1/account/summary")
def account_summary(current_user: CurrentUser = Depends(get_current_user)):
    user_id = UUID(current_user.id)
    db = SessionLocal()
    invested = 0.0
    current = 0.0
    unrealized = 0.0

    try:
        wallet_row = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        balance = float(wallet_row.balance) if wallet_row else 0.0

        holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
        for holding in holdings:
            live = get_live_price(holding.symbol)
            avg_price = float(holding.avg_price)
            invested_value = avg_price * holding.quantity
            current_value = live * holding.quantity

            invested += invested_value
            current += current_value
            unrealized += current_value - invested_value

        trades = db.query(Trade).filter(Trade.user_id == user_id).all()
        realized = sum(float(t.realized_pnl or 0.0) for t in trades)

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
