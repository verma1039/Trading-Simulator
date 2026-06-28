from __future__ import annotations

from pydantic import BaseModel, Field, StrictInt


class OrderRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=12)
    quantity: StrictInt = Field(gt=0, le=100_000)
