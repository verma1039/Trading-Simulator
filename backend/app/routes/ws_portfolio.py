import asyncio
from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status

from app.auth.dependencies import bootstrap_user_resources, enforce_active_user
from app.auth.jwt import AuthConfigurationError, AuthTokenError, verify_supabase_jwt
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.services.market_data import get_live_price
from app.supabase_models import Holding, Wallet

router = APIRouter()


@router.websocket("/ws/portfolio")
async def portfolio_stream(websocket: WebSocket):
    current_user = authenticate_websocket_user(websocket)
    if current_user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    user_id = UUID(current_user.id)

    try:
        while True:
            await websocket.send_json(build_user_portfolio_payload(user_id))
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        pass


def authenticate_websocket_user(websocket: WebSocket) -> CurrentUser | None:
    token = websocket.query_params.get("access_token")
    if not token:
        return None

    try:
        claims = verify_supabase_jwt(token)
    except (AuthConfigurationError, AuthTokenError):
        return None

    user_id = claims.get("sub")
    if not user_id:
        return None

    current_user = CurrentUser(
        id=user_id,
        email=claims.get("email"),
        role=claims.get("role", "authenticated"),
        session_id=claims.get("session_id"),
        claims=claims,
    )
    try:
        profile = bootstrap_user_resources(current_user)
        current_user.status = profile.status
        enforce_active_user(profile)
    except HTTPException:
        return None

    return current_user


def build_user_portfolio_payload(user_id: UUID):
    db = SessionLocal()
    total_invested = 0.0
    total_current_value = 0.0
    portfolio_holdings = []

    try:
        wallet_row = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        balance = float(wallet_row.balance) if wallet_row else 0.0

        holdings = (
            db.query(Holding)
            .filter(Holding.user_id == user_id)
            .order_by(Holding.symbol)
            .all()
        )

        for holding in holdings:
            qty = holding.quantity
            avg_price = float(holding.avg_price)
            live_price = get_live_price(holding.symbol)

            invested = qty * avg_price
            current = qty * live_price
            unrealized = current - invested

            total_invested += invested
            total_current_value += current

            portfolio_holdings.append({
                "symbol": holding.symbol,
                "quantity": qty,
                "avgPrice": round(avg_price, 2),
                "livePrice": round(live_price, 2),
                "investedValue": round(invested, 2),
                "currentValue": round(current, 2),
                "unrealizedPnL": round(unrealized, 2),
            })

        return {
            "balance": round(balance, 2),
            "totalInvested": round(total_invested, 2),
            "totalCurrentValue": round(total_current_value, 2),
            "totalUnrealizedPnL": round(total_current_value - total_invested, 2),
            "holdings": portfolio_holdings,
        }
    finally:
        db.close()
