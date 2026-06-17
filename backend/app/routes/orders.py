from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.db_locking import for_update
from app.services.market_data import get_live_price, get_market_status
from app.supabase_models import CashLedger, Holding, Order, Trade, Wallet

router = APIRouter()


class OrderRequest(BaseModel):
    symbol: str
    side: str
    quantity: int = Field(..., gt=0)


class TradeResponse(BaseModel):
    tradeId: str
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
def place_order(
    order: OrderRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = UUID(current_user.id)
    symbol = order.symbol.upper()
    side = order.side.upper()

    if side not in ("BUY", "SELL"):
        raise HTTPException(400, "side must be BUY or SELL")

    market_status = get_market_status()
    if market_status["market_status"] == "OFFLINE":
        raise HTTPException(
            status_code=503,
            detail="Live market data unavailable.",
        )

    if not market_status["market_open"]:
        raise HTTPException(
            status_code=403,
            detail="Market is closed.",
        )

    live_price = get_live_price(symbol)
    if live_price <= 0:
        raise HTTPException(400, "Price unavailable")

    price = Decimal(str(round(live_price, 4)))
    quantity = order.quantity
    db = SessionLocal()
    realized = Decimal("0")

    try:
        wallet_row = for_update(
            db.query(Wallet).filter(Wallet.user_id == user_id)
        ).first()
        if not wallet_row:
            raise HTTPException(status_code=404, detail="Wallet not found")

        order_row = Order(
            user_id=user_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            status="PENDING",
            requested_price=price,
        )
        db.add(order_row)
        db.flush()

        holding = (
            for_update(
                db.query(Holding)
                .filter(Holding.user_id == user_id, Holding.symbol == symbol)
            )
            .first()
        )

        if side == "BUY":
            amount = price * quantity
            if wallet_row.balance < amount:
                order_row.status = "REJECTED"
                db.commit()
                raise HTTPException(400, "Insufficient balance")

            wallet_row.balance -= amount

            if holding:
                current_cost = holding.avg_price * holding.quantity
                new_quantity = holding.quantity + quantity
                holding.avg_price = (current_cost + amount) / new_quantity
                holding.quantity = new_quantity
            else:
                holding = Holding(
                    user_id=user_id,
                    symbol=symbol,
                    quantity=quantity,
                    avg_price=price,
                )
                db.add(holding)

            ledger_type = "TRADE_BUY"

        else:
            if not holding or holding.quantity < quantity:
                order_row.status = "REJECTED"
                db.commit()
                raise HTTPException(400, "Insufficient holdings")

            amount = price * quantity
            realized = (price - holding.avg_price) * quantity
            wallet_row.balance += amount
            holding.quantity -= quantity

            if holding.quantity == 0:
                db.delete(holding)

            ledger_type = "TRADE_SELL"

        order_row.status = "EXECUTED"
        order_row.executed_price = price

        trade = Trade(
            user_id=user_id,
            order_id=order_row.id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            realized_pnl=realized,
        )
        db.add(trade)
        db.flush()

        db.add(CashLedger(
            user_id=user_id,
            wallet_id=wallet_row.id,
            order_id=order_row.id,
            trade_id=trade.id,
            entry_type=ledger_type,
            symbol=symbol,
            amount=amount,
            balance=wallet_row.balance,
        ))

        db.add(wallet_row)
        db.commit()
        db.refresh(trade)
        db.refresh(wallet_row)

        return {
            "status": "EXECUTED",
            "trade": {
                "tradeId": str(trade.id),
                "symbol": trade.symbol,
                "side": trade.side,
                "quantity": trade.quantity,
                "price": float(trade.price),
                "timestamp": trade.created_at.isoformat(),
                "realizedPnL": float(trade.realized_pnl or 0.0),
            },
            "balance": round(float(wallet_row.balance), 2),
        }

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
