from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routes.dependencies import current_admin
from app.schemas.admin import DepositActionRequest, UserStatusRequest
from app.schemas.common import ApiSuccessResponse, api_success
from app.repositories.trading_repository import TradingRepository, get_repository
from app.services.admin_service import AdminService


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=ApiSuccessResponse)
def dashboard(
    _admin: dict = Depends(current_admin),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(AdminService(repository).dashboard())


@router.get("/users", response_model=ApiSuccessResponse)
def users(
    _admin: dict = Depends(current_admin),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(AdminService(repository).users())


@router.post("/deposit/approve", response_model=ApiSuccessResponse)
def approve_deposit(
    payload: DepositActionRequest,
    admin: dict = Depends(current_admin),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(AdminService(repository).approve_deposit(admin, payload.depositId))


@router.post("/deposit/reject", response_model=ApiSuccessResponse)
def reject_deposit(
    payload: DepositActionRequest,
    admin: dict = Depends(current_admin),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(AdminService(repository).reject_deposit(admin, payload.depositId))


@router.post("/users/suspend", response_model=ApiSuccessResponse)
def suspend_user(
    payload: UserStatusRequest,
    admin: dict = Depends(current_admin),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(AdminService(repository).suspend_user(admin, payload.userId))


@router.post("/users/activate", response_model=ApiSuccessResponse)
def activate_user(
    payload: UserStatusRequest,
    admin: dict = Depends(current_admin),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(AdminService(repository).activate_user(admin, payload.userId))
