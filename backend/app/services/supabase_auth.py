from __future__ import annotations

from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError, decode
from fastapi import HTTPException, status

from app.core.config import Settings, get_settings


class SupabaseAuthVerifier:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.jwks_client = PyJWKClient(self.settings.supabase_jwks_url)

    def verify_token(self, token: str | None) -> dict:
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            claims = decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                audience=self.settings.supabase_jwt_audience,
                issuer=self.settings.supabase_jwt_issuer,
            )
        except (InvalidTokenError, PyJWKClientError) as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.") from exc

        user_id = claims.get("sub")
        email = (claims.get("email") or "").lower()
        if not user_id or not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")

        metadata = claims.get("user_metadata") or {}
        name = (
            metadata.get("full_name")
            or metadata.get("name")
            or metadata.get("display_name")
            or email.split("@")[0]
        )
        role = "ADMIN" if email == self.settings.admin_email.lower() else "USER"

        return {
            "id": user_id,
            "email": email,
            "name": name,
            "phoneNumber": metadata.get("phone_number") or metadata.get("phoneNumber") or "",
            "dateOfBirth": metadata.get("date_of_birth") or metadata.get("dateOfBirth") or "",
            "timezone": "Asia/Kolkata",
            "country": metadata.get("country") or "India",
            "role": role,
        }
