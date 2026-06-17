import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class AuthSettings(BaseModel):
    supabase_url: str | None
    supabase_jwks_url: str | None
    supabase_jwt_issuer: str | None
    supabase_jwt_audience: str
    supabase_jwt_secret: str | None
    initial_user_balance: float

    @property
    def has_jwks_config(self) -> bool:
        return bool(self.supabase_jwks_url and self.supabase_jwt_issuer)

    @property
    def has_legacy_secret_config(self) -> bool:
        return bool(self.supabase_jwt_secret and self.supabase_jwt_issuer)


@lru_cache
def get_auth_settings() -> AuthSettings:
    supabase_url = normalize_url(os.getenv("SUPABASE_URL"))
    issuer = normalize_url(os.getenv("SUPABASE_JWT_ISSUER"))
    jwks_url = normalize_url(os.getenv("SUPABASE_JWKS_URL"))

    if supabase_url:
        issuer = issuer or f"{supabase_url}/auth/v1"
        jwks_url = jwks_url or f"{supabase_url}/auth/v1/.well-known/jwks.json"

    return AuthSettings(
        supabase_url=supabase_url,
        supabase_jwks_url=jwks_url,
        supabase_jwt_issuer=issuer,
        supabase_jwt_audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated"),
        supabase_jwt_secret=os.getenv("SUPABASE_JWT_SECRET"),
        initial_user_balance=float(os.getenv("INITIAL_USER_BALANCE", "1000000.0")),
    )


def normalize_url(value: str | None) -> str | None:
    if not value:
        return None

    return value.rstrip("/")
