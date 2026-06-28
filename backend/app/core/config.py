from functools import lru_cache
import os
from pathlib import Path

from pydantic import BaseModel, model_validator


class Settings(BaseModel):
    app_name: str = "Trading Simulator API"
    app_version: str = "0.1.0"
    cors_origins: list[str] = []
    environment: str = "development"
    initial_user_balance: float = 0
    joining_bonus_amount: float = 10000
    admin_email: str
    security_headers_enabled: bool = True
    security_x_frame_options: str = "DENY"
    security_referrer_policy: str = "strict-origin-when-cross-origin"
    security_permissions_policy: str = "camera=(), microphone=(), geolocation=()"
    supabase_anon_key: str
    supabase_jwt_audience: str = "authenticated"
    supabase_jwks_url: str
    supabase_jwt_issuer: str
    supabase_url: str
    supabase_db_url: str

    @model_validator(mode="after")
    def validate_required_auth_config(self) -> "Settings":
        missing = [
            key
            for key, value in {
                "ADMIN_EMAIL": self.admin_email,
                "SUPABASE_ANON_KEY": self.supabase_anon_key,
                "SUPABASE_URL": self.supabase_url,
                "SUPABASE_DB_URL": self.supabase_db_url,
            }.items()
            if not value or _is_unconfigured_value(value)
        ]
        if missing:
            raise ValueError(
                "Missing required startup configuration: "
                + ", ".join(missing)
                + ". Add real values to backend/.env or the process environment.",
            )
        if self.environment not in {"development", "staging", "production"}:
            raise ValueError("ENVIRONMENT must be one of: development, staging, production.")
        if self.environment == "production":
            if not self.cors_origins:
                raise ValueError("FRONTEND_ORIGINS is required in production.")
            invalid_origins = [
                origin
                for origin in self.cors_origins
                if origin == "*"
                or "localhost" in origin
                or "127.0.0.1" in origin
                or not origin.startswith("https://")
            ]
            if invalid_origins:
                raise ValueError("Production FRONTEND_ORIGINS must use explicit deployed HTTPS origins only.")
        if self.initial_user_balance < 0:
            raise ValueError("INITIAL_USER_BALANCE must be greater than or equal to 0.")
        if self.joining_bonus_amount < 0:
            raise ValueError("JOINING_BONUS_AMOUNT must be greater than or equal to 0.")
        return self


def _load_local_env() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


@lru_cache
def get_settings() -> Settings:
    _load_local_env()
    origins = os.getenv("FRONTEND_ORIGINS")
    cors_origins = []
    if origins:
        cors_origins = [
            origin.strip()
            for origin in origins.split(",")
            if origin.strip()
        ]

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")

    return Settings(
        cors_origins=cors_origins,
        admin_email=os.getenv("ADMIN_EMAIL", "").lower(),
        environment=os.getenv("ENVIRONMENT", "development").lower(),
        initial_user_balance=float(os.getenv("INITIAL_USER_BALANCE", "0")),
        joining_bonus_amount=float(os.getenv("JOINING_BONUS_AMOUNT", "10000")),
        security_headers_enabled=_bool_env("SECURITY_HEADERS_ENABLED", True),
        security_permissions_policy=os.getenv("SECURITY_PERMISSIONS_POLICY", "camera=(), microphone=(), geolocation=()"),
        security_referrer_policy=os.getenv("SECURITY_REFERRER_POLICY", "strict-origin-when-cross-origin"),
        security_x_frame_options=os.getenv("SECURITY_X_FRAME_OPTIONS", "DENY"),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", ""),
        supabase_jwt_audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated"),
        supabase_db_url=os.getenv("SUPABASE_DB_URL", os.getenv("DATABASE_URL", "")),
        supabase_jwks_url=os.getenv("SUPABASE_JWKS_URL", f"{supabase_url}/auth/v1/.well-known/jwks.json" if supabase_url else ""),
        supabase_jwt_issuer=os.getenv("SUPABASE_JWT_ISSUER", f"{supabase_url}/auth/v1" if supabase_url else ""),
        supabase_url=supabase_url,
    )


def _is_unconfigured_value(value: str) -> bool:
    lowered = value.lower()
    return any(
        token in lowered
        for token in (
            "replace-with",
            "your-project",
            "your-domain",
            "your-database-password",
            "admin@your-domain",
        )
    )


def _bool_env(key: str, default: bool) -> bool:
    value = os.getenv(key)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}
