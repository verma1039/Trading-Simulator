from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app.auth.dependencies import get_current_user
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.supabase_models import Trade

router = APIRouter()


class TradeItem(BaseModel):
    tradeId: str
    symbol: str
    side: str
    quantity: int
    price: float
    timestamp: str
    realizedPnL: float


class TradesResponse(BaseModel):
    totalTrades: int
    items: List[TradeItem]


@router.get("/api/v1/trades", response_model=TradesResponse)
def get_trades(current_user: CurrentUser = Depends(get_current_user)):
    user_id = UUID(current_user.id)
    db = SessionLocal()
    try:
        rows = (
            db.query(Trade)
            .filter(Trade.user_id == user_id)
            .order_by(Trade.created_at)
            .all()
        )

        return {
            "totalTrades": len(rows),
            "items": [
                {
                    "tradeId": str(t.id),
                    "symbol": t.symbol,
                    "side": t.side,
                    "quantity": t.quantity,
                    "price": float(t.price),
                    "timestamp": t.created_at.isoformat(),
                    "realizedPnL": float(t.realized_pnl or 0.0),
                }
                for t in rows
            ],
        }
    finally:
        db.close()
