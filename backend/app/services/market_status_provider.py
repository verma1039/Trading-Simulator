from __future__ import annotations

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo


EASTERN_TZ = ZoneInfo("America/New_York")
IST_TZ = ZoneInfo("Asia/Kolkata")
MARKET_OPEN = time(hour=9, minute=30)
MARKET_CLOSE = time(hour=16, minute=0)


class MarketStatusProvider:
    def get_status(self, now: datetime | None = None) -> dict:
        current = _to_eastern(now or datetime.now(EASTERN_TZ))
        market_open = datetime.combine(current.date(), MARKET_OPEN, tzinfo=EASTERN_TZ)
        market_close = datetime.combine(current.date(), MARKET_CLOSE, tzinfo=EASTERN_TZ)

        if current.weekday() >= 5:
            next_open = _next_market_open(current)
            next_close = _market_close_for(next_open)
            return _status_payload("CLOSED", "CLOSED", next_open, next_close, next_open - current)

        if current < market_open:
            return _status_payload("CLOSED", "PRE_MARKET", market_open, market_close, market_open - current)

        if current < market_close:
            return _status_payload("OPEN", "REGULAR", market_open, market_close, market_close - current)

        next_open = _next_market_open(current)
        next_close = _market_close_for(next_open)
        return _status_payload("CLOSED", "AFTER_HOURS", next_open, next_close, next_open - current)

    def market_summary(self, now: datetime | None = None) -> dict:
        status = self.get_status(now)
        countdown_label = "Closes in" if status["status"] == "OPEN" else "Opens in"

        return {
            **status,
            "status": status["status"],
            "session": status["session"],
            "sessionLabel": _session_label(status["session"]),
            "countdownLabel": countdown_label,
            "countdownValue": _format_countdown(status["countdownSeconds"]),
            "updatedAt": "Updated " + datetime.now(IST_TZ).strftime("%I:%M %p IST").lstrip("0"),
        }


def get_market_status_provider() -> MarketStatusProvider:
    return MarketStatusProvider()


def _to_eastern(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=EASTERN_TZ)
    return value.astimezone(EASTERN_TZ)


def _status_payload(status: str, session: str, next_open: datetime, next_close: datetime, countdown: timedelta) -> dict:
    return {
        "market": "US",
        "status": status,
        "session": session,
        "nextOpen": next_open.isoformat(),
        "nextClose": next_close.isoformat(),
        "countdownSeconds": max(int(countdown.total_seconds()), 0),
    }


def _next_market_open(current: datetime) -> datetime:
    next_day = current.date()
    if current.weekday() < 5 and current.time() < MARKET_OPEN:
        return datetime.combine(next_day, MARKET_OPEN, tzinfo=EASTERN_TZ)

    next_day += timedelta(days=1)
    while next_day.weekday() >= 5:
        next_day += timedelta(days=1)
    return datetime.combine(next_day, MARKET_OPEN, tzinfo=EASTERN_TZ)


def _market_close_for(open_at: datetime) -> datetime:
    return datetime.combine(open_at.date(), MARKET_CLOSE, tzinfo=EASTERN_TZ)


def _format_countdown(seconds: int) -> str:
    total_minutes = max(seconds // 60, 0)
    hours, minutes = divmod(total_minutes, 60)
    return f"{hours:02d}h {minutes:02d}m"


def _session_label(session: str) -> str:
    labels = {
        "AFTER_HOURS": "After-hours Session",
        "CLOSED": "US Market Closed",
        "PRE_MARKET": "Pre-market Session",
        "REGULAR": "US Regular Session",
    }
    return labels.get(session, session.title())
