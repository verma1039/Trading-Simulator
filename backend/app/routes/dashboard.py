from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routes.dependencies import current_user
from app.schemas.common import ApiSuccessResponse, api_success
from app.repositories.trading_repository import TradingRepository, get_repository
from app.services.dashboard_service import DashboardService


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=ApiSuccessResponse)
def dashboard(
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(DashboardService(repository).get_dashboard(user))
