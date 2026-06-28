from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from app.core.config import Settings


async def security_headers_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
    settings: Settings,
) -> Response:
    response = await call_next(request)
    if not settings.security_headers_enabled:
        return response

    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", settings.security_x_frame_options)
    response.headers.setdefault("Referrer-Policy", settings.security_referrer_policy)
    response.headers.setdefault("Permissions-Policy", settings.security_permissions_policy)
    return response
