from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.schemas import AuthBootstrapResponse, CurrentUser

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/bootstrap", response_model=AuthBootstrapResponse)
def bootstrap_auth(
    current_user: CurrentUser = Depends(get_current_user),
):
    return {
        "status": "AUTH_BOOTSTRAPPED",
        "user": current_user,
        "profile_ready": True,
        "wallet_ready": True,
    }
