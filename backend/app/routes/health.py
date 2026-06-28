from fastapi import APIRouter

from app.schemas.common import ApiSuccessResponse, api_success

router = APIRouter(tags=["health"])


@router.get("/health", response_model=ApiSuccessResponse)
def read_health():
    return api_success({"status": "ok"})
