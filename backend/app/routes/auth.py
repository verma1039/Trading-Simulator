from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routes.dependencies import current_user
from app.schemas.common import ApiSuccessResponse, api_success
from app.repositories.trading_repository import TradingRepository, get_repository
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ApiSuccessResponse)
def me(
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(AuthService(repository).current_user(user))
