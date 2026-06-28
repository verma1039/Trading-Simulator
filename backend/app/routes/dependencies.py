from __future__ import annotations

from fastapi import Depends, Header

from app.repositories.trading_repository import TradingRepository, get_repository
from app.services.supabase_auth import SupabaseAuthVerifier


def bearer_token(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    return token


def current_user(
    token: str | None = Depends(bearer_token),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    auth_user = SupabaseAuthVerifier().verify_token(token)
    return repository.ensure_auth_user(auth_user)


def current_admin(
    user: dict = Depends(current_user),
    repository: TradingRepository = Depends(get_repository),
) -> dict:
    repository.require_admin(user)
    return user
