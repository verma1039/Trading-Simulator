from fastapi import APIRouter
from app.db import SessionLocal
from app.models import Trade

router = APIRouter()

@router.get("/api/v1/trades")
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
                "realizedPnL": t.realized_pnl
            }
            for t in rows
        ]
    }
