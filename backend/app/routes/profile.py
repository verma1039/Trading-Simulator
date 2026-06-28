from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.repositories.trading_repository import TradingRepository, get_repository
from app.routes.dependencies import current_user
from app.schemas.common import ApiSuccessResponse, api_success
from app.schemas.profile import ProfileUpdateRequest


router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/phone-availability", response_model=ApiSuccessResponse)
def phone_availability(
    phoneNumber: str = Query(min_length=1, max_length=32),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    digits = re.sub(r"\D", "", phoneNumber)
    if not re.fullmatch(r"\d{10,15}", digits):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Phone number must contain 10 to 15 digits.")
    return api_success({"available": repository.is_phone_number_available(digits), "phoneNumber": digits})


@router.get("", response_model=ApiSuccessResponse)
def get_profile(
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(repository.get_profile(user))


@router.put("", response_model=ApiSuccessResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    return api_success(
        repository.update_profile(
            user,
            display_name=payload.displayName,
            phone_number=payload.phoneNumber,
            timezone_name=payload.timezone,
            country=payload.country,
            date_of_birth=payload.dateOfBirth,
        ),
    )
