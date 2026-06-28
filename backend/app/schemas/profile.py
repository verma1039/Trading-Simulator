from __future__ import annotations

from datetime import date
import re

from pydantic import BaseModel, Field, field_validator


class ProfileUpdateRequest(BaseModel):
    displayName: str = Field(min_length=1, max_length=120)
    phoneNumber: str = Field(min_length=1, max_length=32)
    timezone: str | None = Field(default=None, max_length=80)
    country: str | None = Field(default=None, max_length=80)
    dateOfBirth: date | None = None

    @field_validator("displayName")
    @classmethod
    def validate_display_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Display name is required.")
        return stripped

    @field_validator("phoneNumber")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if not re.fullmatch(r"\d{10,15}", digits):
            raise ValueError("Phone number must contain 10 to 15 digits.")
        return digits

    @field_validator("timezone", "country")
    @classmethod
    def validate_required_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("Timezone and country must not be empty.")
        return stripped

    @field_validator("dateOfBirth")
    @classmethod
    def validate_date_of_birth(cls, value: date | None) -> date | None:
        if value is None:
            return value
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise ValueError("User must be at least 18 years old.")
        return value
