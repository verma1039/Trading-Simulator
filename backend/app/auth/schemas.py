from typing import Any

from pydantic import BaseModel, Field


class CurrentUser(BaseModel):
    id: str
    email: str | None = None
    role: str = "authenticated"
    status: str | None = None
    session_id: str | None = None
    claims: dict[str, Any] = Field(default_factory=dict)


class AuthBootstrapResponse(BaseModel):
    status: str
    user: CurrentUser
    profile_ready: bool
    wallet_ready: bool
