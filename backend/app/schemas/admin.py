from __future__ import annotations

from pydantic import BaseModel, Field


class DepositActionRequest(BaseModel):
    depositId: str = Field(min_length=1)


class UserStatusRequest(BaseModel):
    userId: str = Field(min_length=1)
