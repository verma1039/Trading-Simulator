from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.auth.config import get_auth_settings
from app.auth.jwt import AuthConfigurationError, AuthTokenError, verify_supabase_jwt
from app.auth.schemas import CurrentUser
from app.db import SessionLocal
from app.supabase_models import Profile, Wallet

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    current_user = authenticate_current_user(credentials)
    profile = bootstrap_user_resources(current_user)
    current_user.role = "admin" if _is_admin_claim(current_user) else profile.role
    current_user.status = profile.status
    enforce_active_user(profile)
    return current_user


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    current_user = authenticate_current_user(credentials)
    profile = bootstrap_user_resources(current_user)
    current_user.role = "admin" if _is_admin_claim(current_user) else profile.role
    current_user.status = profile.status

    if current_user.role == "admin":
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required",
    )


def authenticate_current_user(
    credentials: HTTPAuthorizationCredentials | None,
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = verify_supabase_jwt(credentials.credentials)
    except AuthTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except AuthConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    current_user = CurrentUser(
        id=user_id,
        email=claims.get("email"),
        role=claims.get("role", "authenticated"),
        session_id=claims.get("session_id"),
        claims=claims,
    )
    return current_user


def bootstrap_user_resources(current_user: CurrentUser) -> Profile:
    settings = get_auth_settings()

    try:
        user_uuid = UUID(current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject is not a valid UUID",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.user_id == user_uuid).first()
        if profile is None:
            profile = Profile(
                user_id=user_uuid,
                display_name=_default_display_name(current_user.email),
                role="user",
            )
            db.add(profile)

        wallet = db.query(Wallet).filter(Wallet.user_id == user_uuid).first()
        if wallet is None:
            db.add(
                Wallet(
                    user_id=user_uuid,
                    balance=settings.initial_user_balance,
                )
            )

        db.commit()
        db.refresh(profile)
        return profile
    except IntegrityError:
        db.rollback()
        profile = db.query(Profile).filter(Profile.user_id == user_uuid).first()
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to load authenticated user profile",
            )
        return profile
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to bootstrap authenticated user resources",
        ) from exc
    finally:
        db.close()


def enforce_active_user(profile: Profile) -> None:
    if profile.status == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )

    if profile.status == "BANNED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned",
        )


def _default_display_name(email: str | None) -> str | None:
    if not email:
        return None

    return email.split("@", 1)[0]


def _is_admin_claim(current_user: CurrentUser) -> bool:
    app_metadata = current_user.claims.get("app_metadata") or {}
    return app_metadata.get("role") == "admin"
