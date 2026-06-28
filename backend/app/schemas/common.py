from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ApiSuccessResponse(BaseModel):
    success: bool = True
    data: Any


class ApiErrorResponse(BaseModel):
    success: bool = False
    message: str


def api_success(data: Any) -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
    }
