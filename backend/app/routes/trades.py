from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.db import SessionLocal
from app.models import Trade

router = APIRouter()


class TradeItem(BaseModel):
    tradeId: int
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
def get_trades():
    db = SessionLocal()
    rows = db.query(Trade).order_by(Trade.timestamp).all()
    db.close()

    return {
        "totalTrades": len(rows),
        "items": [
            {
                "tradeId": t.id,
                "symbol": t.symbol,
                "side": t.side,
                "quantity": t.quantity,
                "price": t.price,
                "timestamp": t.timestamp.isoformat(),
                "realizedPnL": t.realized_pnl,
            }
            for t in rows
        ],
    }
