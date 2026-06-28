from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routes.dependencies import current_user
from app.schemas.common import ApiSuccessResponse, api_success
from app.schemas.orders import OrderRequest
from app.repositories.trading_repository import TradingRepository, get_repository
from app.services.order_service import OrderService


router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/buy", response_model=ApiSuccessResponse)
def buy(
    payload: OrderRequest,
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(OrderService(repository).buy(user, payload.symbol, payload.quantity))


@router.post("/sell", response_model=ApiSuccessResponse)
def sell(
    payload: OrderRequest,
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(OrderService(repository).sell(user, payload.symbol, payload.quantity))
