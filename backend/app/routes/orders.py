from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import wallet, holdings
from app.services.market_data import get_live_price
from app.db import SessionLocal
from app.models import Holding, Trade, CashLedger

router = APIRouter()


# -----------------------------
# Schemas
# -----------------------------

class OrderRequest(BaseModel):
    symbol: str = Field(..., example="AAPL")
    side: str = Field(..., example="BUY")
    quantity: int = Field(..., gt=0, example=5)


class OrderResponse(BaseModel):
    status: str
    trade: dict
    balance: float


# -----------------------------
# Order Placement
# -----------------------------

@router.post("/api/v1/orders", response_model=OrderResponse)
def place_order(order: OrderRequest):
    symbol = order.symbol.upper()
    side = order.side.upper()
    quantity = order.quantity

    if side not in ("BUY", "SELL"):
        raise HTTPException(status_code=400, detail="side must be BUY or SELL")

    price = get_live_price(symbol)
    if price <= 0:
        raise HTTPException(status_code=400, detail="Price unavailable")

    db = SessionLocal()
    timestamp = datetime.utcnow()
    realized_pnl = 0.0

    try:
        # ---------------- BUY ----------------
        if side == "BUY":
            total_cost = price * quantity

            if wallet["balance"] < total_cost:
                raise HTTPException(status_code=400, detail="Insufficient balance")

            wallet["balance"] -= total_cost

            holding = db.query(Holding).filter(Holding.symbol == symbol).first()

            if holding:
                new_qty = holding.quantity + quantity
                new_avg = (
                    (holding.quantity * holding.avg_price)
                    + (quantity * price)
                ) / new_qty
                holding.quantity = new_qty
                holding.avg_price = new_avg
            else:
                holding = Holding(
                    symbol=symbol,
                    quantity=quantity,
                    avg_price=price
                )
                db.add(holding)

            db.add(CashLedger(
                type="TRADE_BUY",
                symbol=symbol,
                amount=round(total_cost, 2),
                balance=round(wallet["balance"], 2),
                timestamp=timestamp
            ))

        # ---------------- SELL ----------------
        else:
            holding = db.query(Holding).filter(Holding.symbol == symbol).first()

            if not holding or holding.quantity < quantity:
                raise HTTPException(status_code=400, detail="Insufficient holdings")

            realized_pnl = (price - holding.avg_price) * quantity
            wallet["balance"] += price * quantity
            holding.quantity -= quantity

            if holding.quantity == 0:
                db.delete(holding)

            db.add(CashLedger(
                type="TRADE_SELL",
                symbol=symbol,
                amount=round(price * quantity, 2),
                balance=round(wallet["balance"], 2),
                timestamp=timestamp
            ))

        # ---------------- TRADE RECORD ----------------
        trade_row = Trade(
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=round(price, 2),
            realized_pnl=round(realized_pnl, 2),
            timestamp=timestamp
        )

        db.add(trade_row)
        db.commit()
        db.refresh(trade_row)

        # keep in-memory mirror (for fast reads)
        if side == "BUY" or holding:
            holdings[symbol] = {
                "quantity": holding.quantity,
                "avgPrice": holding.avg_price
            }
        else:
            holdings.pop(symbol, None)

        return {
            "status": "EXECUTED",
            "trade": {
                "tradeId": trade_row.id,
                "symbol": trade_row.symbol,
                "side": trade_row.side,
                "quantity": trade_row.quantity,
                "price": trade_row.price,
                "timestamp": trade_row.timestamp.isoformat(),
                "realizedPnL": trade_row.realized_pnl
            },
            "balance": round(wallet["balance"], 2)
        }

    finally:
        db.close()
