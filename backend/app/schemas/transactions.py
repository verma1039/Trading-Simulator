from __future__ import annotations

from pydantic import BaseModel, Field


class DepositRequest(BaseModel):
    amount: float = Field(gt=0, le=1_000_000)
    notes: str = Field(default="", max_length=240)
