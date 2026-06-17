from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.services.market_data import get_live_price
from app.supabase_models import Holding, Wallet

router = APIRouter()

@router.get("/api/v1/portfolio")
def get_portfolio(current_user: CurrentUser = Depends(get_current_user)):
    user_id = UUID(current_user.id)
    db = SessionLocal()
    portfolio_items = []
    total_invested = 0.0
    total_current_value = 0.0

    try:
        wallet_row = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        balance = float(wallet_row.balance) if wallet_row else 0.0

        rows = (
            db.query(Holding)
            .filter(Holding.user_id == user_id)
            .order_by(Holding.symbol)
            .all()
        )

        for holding in rows:
            quantity = holding.quantity
            avg_price = float(holding.avg_price)

            live_price = get_live_price(holding.symbol)

            invested_value = avg_price * quantity
            current_value = live_price * quantity
            pnl = current_value - invested_value

            total_invested += invested_value
            total_current_value += current_value

            portfolio_items.append({
                "symbol": holding.symbol,
                "quantity": quantity,
                "avgPrice": round(avg_price, 2),
                "livePrice": round(live_price, 2),
                "investedValue": round(invested_value, 2),
                "currentValue": round(current_value, 2),
                "unrealizedPnL": round(pnl, 2)
            })

        return {
            "balance": round(balance, 2),
            "totalInvested": round(total_invested, 2),
            "totalCurrentValue": round(total_current_value, 2),
            "totalUnrealizedPnL": round(total_current_value - total_invested, 2),
            "holdings": portfolio_items
        }
    finally:
        db.close()
