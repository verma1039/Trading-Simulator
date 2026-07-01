from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any


_STANDARD_LOG_KEYS = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "message",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
}


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key not in _STANDARD_LOG_KEYS and not key.startswith("_"):
                payload[key] = _redact_sensitive_value(value)

        if record.exc_info:
            payload["exception"] = _redact_sensitive_text(self.formatException(record.exc_info))

        return json.dumps(payload, default=str)


def configure_logging() -> None:
    root_logger = logging.getLogger()
    if getattr(root_logger, "_trading_simulator_configured", False):
        return

    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    handler = logging.StreamHandler()
    handler.setFormatter(JsonLogFormatter())

    root_logger.handlers.clear()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)
    root_logger._trading_simulator_configured = True  # type: ignore[attr-defined]


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)


def _redact_sensitive_value(value: Any) -> Any:
    if isinstance(value, str):
        return _redact_sensitive_text(value)
    if isinstance(value, list):
        return [_redact_sensitive_value(item) for item in value]
    if isinstance(value, tuple):
        return tuple(_redact_sensitive_value(item) for item in value)
    if isinstance(value, dict):
        return {key: _redact_sensitive_value(item) for key, item in value.items()}
    return value


def _redact_sensitive_text(value: str) -> str:
    redacted = value
    for key, secret in os.environ.items():
        key_upper = key.upper()
        if secret and any(token in key_upper for token in ("DATABASE_URL", "SUPABASE", "PASSWORD", "SECRET", "TOKEN", "KEY")):
            redacted = redacted.replace(secret, "[REDACTED]")

    redacted = re.sub(r"(postgres(?:ql)?://[^:\s]+:)[^@\s]+(@)", r"\1[REDACTED]\2", redacted)
    redacted = re.sub(r"(password=)[^\s]+", r"\1[REDACTED]", redacted, flags=re.IGNORECASE)
    redacted = re.sub(r"\b(?:db\.)?[a-z0-9]{20}\.supabase\.co\b", "[REDACTED-SUPABASE-HOST]", redacted)
    redacted = re.sub(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b", "[REDACTED-JWT]", redacted)
    return redacted
