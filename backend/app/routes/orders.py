from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import wallet, holdings
from app.services.market_data import get_live_price
from app.db import SessionLocal
from app.models import Holding, Trade, CashLedger, Wallet

router = APIRouter()


class OrderRequest(BaseModel):
    symbol: str
    side: str
    quantity: int = Field(..., gt=0)


class TradeResponse(BaseModel):
    tradeId: int
    symbol: str
    side: str
    quantity: int
    price: float
    timestamp: str
    realizedPnL: float


class OrderResponse(BaseModel):
    status: str
    trade: TradeResponse
    balance: float


@router.post("/api/v1/orders", response_model=OrderResponse)
def place_order(order: OrderRequest):
    symbol = order.symbol.upper()
    side = order.side.upper()

    if side not in ("BUY", "SELL"):
        raise HTTPException(400, "side must be BUY or SELL")

    price = get_live_price(symbol)
    if price <= 0:
        raise HTTPException(400, "Price unavailable")

    db = SessionLocal()
    timestamp = datetime.utcnow()
    realized = 0.0

    try:
        holding = db.query(Holding).filter(Holding.symbol == symbol).first()

        if side == "BUY":
            cost = price * order.quantity
            if wallet["balance"] < cost:
                raise HTTPException(400, "Insufficient balance")

            wallet["balance"] -= cost
            
            # Persist wallet balance
            wallet_row = db.query(Wallet).first()
            if wallet_row:
                wallet_row.balance = wallet["balance"]
                db.add(wallet_row)


            if holding:
                holding.avg_price = (
                    (holding.avg_price * holding.quantity + cost)
                    / (holding.quantity + order.quantity)
                )
                holding.quantity += order.quantity
            else:
                holding = Holding(
                    symbol=symbol,
                    quantity=order.quantity,
                    avg_price=price,
                )
                db.add(holding)

            db.add(CashLedger(
                type="TRADE_BUY",
                symbol=symbol,
                amount=round(cost, 2),
                balance=round(wallet["balance"], 2),
                timestamp=timestamp,
            ))

        else:
            if not holding or holding.quantity < order.quantity:
                raise HTTPException(400, "Insufficient holdings")

            realized = (price - holding.avg_price) * order.quantity
            wallet["balance"] += price * order.quantity
            
            # Persist wallet balance
            wallet_row = db.query(Wallet).first()
            if wallet_row:
                wallet_row.balance = wallet["balance"]
                db.add(wallet_row)
            holding.quantity -= order.quantity

            if holding.quantity == 0:
                db.delete(holding)

            db.add(CashLedger(
                type="TRADE_SELL",
                symbol=symbol,
                amount=round(price * order.quantity, 2),
                balance=round(wallet["balance"], 2),
                timestamp=timestamp,
            ))

        trade = Trade(
            symbol=symbol,
            side=side,
            quantity=order.quantity,
            price=round(price, 2),
            realized_pnl=round(realized, 2),
            timestamp=timestamp,
        )

        db.add(trade)
        db.commit()
        db.refresh(trade)

        if holding:
            holdings[symbol] = {
                "quantity": holding.quantity,
                "avgPrice": holding.avg_price,
            }
        else:
            holdings.pop(symbol, None)

        return {
            "status": "EXECUTED",
            "trade": {
                "tradeId": trade.id,
                "symbol": trade.symbol,
                "side": trade.side,
                "quantity": trade.quantity,
                "price": trade.price,
                "timestamp": trade.timestamp.isoformat(),
                "realizedPnL": trade.realized_pnl,
            },
            "balance": round(wallet["balance"], 2),
        }

    finally:
        db.close()
