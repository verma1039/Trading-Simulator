from fastapi import APIRouter
from app.services.market_data import get_live_price

from app.db import SessionLocal
from app.models import Wallet, Holding, Trade
from app.services.market_data import get_live_price

router = APIRouter()

@router.get("/api/v1/account/summary")
def account_summary():
    invested = 0.0
    current = 0.0
    unrealized = 0.0
    realized = 0.0

    # Unrealized P&L from holdings
    for symbol, pos in holdings.items():
        qty = pos["quantity"]
        avg = pos["avgPrice"]
        live = get_live_price(symbol)

        invested_value = avg * qty
        current_value = live * qty

        invested += invested_value
        current += current_value
        unrealized += (current_value - invested_value)

    # Realized P&L from trades
    for t in trades:
        realized += t.get("realizedPnL", 0.0)

    equity = wallet["balance"] + current
    total_pnl = realized + unrealized

    return {
        "cashBalance": round(wallet["balance"], 2),
        "investedValue": round(invested, 2),
        "portfolioValue": round(current, 2),
        "equity": round(equity, 2),
        "unrealizedPnL": round(unrealized, 2),
        "realizedPnL": round(realized, 2),
        "totalPnL": round(total_pnl, 2)
    }
