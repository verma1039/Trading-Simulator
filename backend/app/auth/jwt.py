from typing import Any

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError

from app.auth.config import get_auth_settings


class AuthConfigurationError(RuntimeError):
    pass


class AuthTokenError(RuntimeError):
    pass


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    settings = get_auth_settings()

    try:
        header = jwt.get_unverified_header(token)
    except InvalidTokenError as exc:
        raise AuthTokenError("Invalid authorization token") from exc

    algorithm = header.get("alg")
    if algorithm == "HS256":
        return _verify_with_legacy_secret(token)

    return _verify_with_jwks(token)


def _verify_with_jwks(token: str) -> dict[str, Any]:
    settings = get_auth_settings()
    if not settings.has_jwks_config:
        raise AuthConfigurationError("Supabase JWKS configuration is missing")

    try:
        jwk_client = PyJWKClient(settings.supabase_jwks_url)
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience=settings.supabase_jwt_audience,
            issuer=settings.supabase_jwt_issuer,
        )
    except (InvalidTokenError, PyJWKClientError) as exc:
        raise AuthTokenError("Invalid or expired authorization token") from exc


def _verify_with_legacy_secret(token: str) -> dict[str, Any]:
    settings = get_auth_settings()
    if not settings.has_legacy_secret_config:
        raise AuthConfigurationError("Supabase JWT secret configuration is missing")

    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=settings.supabase_jwt_audience,
            issuer=settings.supabase_jwt_issuer,
        )
    except InvalidTokenError as exc:
        raise AuthTokenError("Invalid or expired authorization token") from exc
