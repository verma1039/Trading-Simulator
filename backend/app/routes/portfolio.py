from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routes.dependencies import current_user
from app.schemas.common import ApiSuccessResponse, api_success
from app.repositories.trading_repository import TradingRepository, get_repository
from app.services.portfolio_service import PortfolioService


router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=ApiSuccessResponse)
def portfolio(
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(PortfolioService(repository).get_portfolio(user))
