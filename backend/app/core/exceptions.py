from __future__ import annotations

import os
import re
import traceback

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import psycopg

from app.core.logger import get_logger


logger = get_logger(__name__)


_SENSITIVE_ENV_KEYS = {
    "DATABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_DB_URL",
    "SUPABASE_JWKS_URL",
    "SUPABASE_JWT_ISSUER",
    "SUPABASE_URL",
}


class ApplicationError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class DatabaseOperationError(ApplicationError):
    def __init__(self, message: str = "Database operation failed.") -> None:
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE)


class ExternalProviderError(ApplicationError):
    def __init__(self, message: str = "External market data provider unavailable.") -> None:
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE)


def error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        messages = [error.get("msg", "Invalid request.") for error in exc.errors()]
        logger.warning(
            "request.validation_failed",
            extra={"event": "request.validation_failed", "path": request.url.path, "errorCount": len(messages)},
        )
        return error_response(status.HTTP_422_UNPROCESSABLE_CONTENT, " ".join(messages))

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "Request failed."
        level = logger.warning if exc.status_code < status.HTTP_500_INTERNAL_SERVER_ERROR else logger.error
        level(
            "request.http_error",
            extra={
                "event": "request.http_error",
                "path": request.url.path,
                "statusCode": exc.status_code,
            },
        )
        return error_response(exc.status_code, message)

    @app.exception_handler(DatabaseOperationError)
    async def database_exception_handler(request: Request, exc: DatabaseOperationError) -> JSONResponse:
        root_cause = _root_cause(exc)
        exc_info = (type(exc), exc, exc.__traceback__)
        logger.error(
            "database.operation_failed",
            exc_info=exc_info,
            extra={
                "event": "database.operation_failed",
                "path": request.url.path,
                "statusCode": exc.status_code,
                "errorType": type(exc).__name__,
                "errorMessage": _redact_sensitive_text(str(exc)),
                "rootCauseType": type(root_cause).__name__,
                "rootCauseMessage": _redact_sensitive_text(str(root_cause)),
                "traceback": _redact_sensitive_text(
                    "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
                ),
            },
        )
        return error_response(exc.status_code, exc.message)

    @app.exception_handler(psycopg.Error)
    async def psycopg_exception_handler(request: Request, exc: psycopg.Error) -> JSONResponse:
        exc_info = (type(exc), exc, exc.__traceback__)
        logger.error(
            "database.driver_error",
            exc_info=exc_info,
            extra={
                "event": "database.driver_error",
                "path": request.url.path,
                "errorType": type(exc).__name__,
                "errorMessage": _redact_sensitive_text(str(exc)),
                "traceback": _redact_sensitive_text(
                    "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
                ),
            },
        )
        return error_response(status.HTTP_503_SERVICE_UNAVAILABLE, "Database operation failed.")

    @app.exception_handler(ExternalProviderError)
    async def provider_exception_handler(request: Request, exc: ExternalProviderError) -> JSONResponse:
        logger.warning(
            "market.provider_unavailable",
            extra={"event": "market.provider_unavailable", "path": request.url.path, "statusCode": exc.status_code},
        )
        return error_response(exc.status_code, exc.message)

    @app.exception_handler(Exception)
    async def fallback_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        exc_info = (type(exc), exc, exc.__traceback__)
        logger.error(
            "request.unexpected_error",
            exc_info=exc_info,
            extra={"event": "request.unexpected_error", "path": request.url.path},
        )
        return error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, "Unexpected server error.")


def _root_cause(exc: BaseException) -> BaseException:
    current = exc
    seen: set[int] = set()
    while True:
        next_exc = current.__cause__ or current.__context__
        if next_exc is None or id(next_exc) in seen:
            return current
        seen.add(id(current))
        current = next_exc


def _redact_sensitive_text(value: str) -> str:
    redacted = value
    for key in _SENSITIVE_ENV_KEYS:
        secret = os.getenv(key)
        if secret:
            redacted = redacted.replace(secret, "[REDACTED]")

    redacted = re.sub(r"(postgres(?:ql)?://[^:\s]+:)[^@\s]+(@)", r"\1[REDACTED]\2", redacted)
    redacted = re.sub(r"(password=)[^\s]+", r"\1[REDACTED]", redacted, flags=re.IGNORECASE)
    redacted = re.sub(r"\b(?:db\.)?[a-z0-9]{20}\.supabase\.co\b", "[REDACTED-SUPABASE-HOST]", redacted)
    redacted = re.sub(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b", "[REDACTED-JWT]", redacted)
    return redacted
