from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routes.dependencies import current_user
from app.schemas.common import ApiSuccessResponse, api_success
from app.schemas.transactions import DepositRequest
from app.repositories.trading_repository import TradingRepository, get_repository
from app.services.transaction_service import TransactionService


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=ApiSuccessResponse)
def transactions(
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(TransactionService(repository).get_transactions(user))


@router.post("/deposit-request", response_model=ApiSuccessResponse)
def create_deposit_request(
    payload: DepositRequest,
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(TransactionService(repository).create_deposit_request(user, payload.amount, payload.notes))
