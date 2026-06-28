from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def _settings(**overrides):
    values = {
        "admin_email": "admin@testing.invalid",
        "cors_origins": ["https://app.testing.invalid"],
        "environment": "production",
        "supabase_anon_key": "anon-key",
        "supabase_db_url": "postgresql://postgres:secret@db.project.supabase.invalid:5432/postgres",
        "supabase_jwks_url": "https://project.supabase.invalid/auth/v1/.well-known/jwks.json",
        "supabase_jwt_issuer": "https://project.supabase.invalid/auth/v1",
        "supabase_url": "https://project.supabase.invalid",
    }
    values.update(overrides)
    return Settings(**values)


def test_production_requires_explicit_cors_origins():
    with pytest.raises(ValidationError):
        _settings(cors_origins=[])


def test_production_rejects_localhost_cors_origins():
    with pytest.raises(ValidationError):
        _settings(cors_origins=["http://localhost:5173"])


def test_production_rejects_wildcard_cors_origins():
    with pytest.raises(ValidationError):
        _settings(cors_origins=["*"])


def test_development_can_allow_localhost_cors_origins():
    settings = _settings(environment="development", cors_origins=["http://localhost:5173"])

    assert settings.cors_origins == ["http://localhost:5173"]


def test_joining_bonus_defaults_to_ten_thousand():
    settings = _settings(environment="development")

    assert settings.joining_bonus_amount == 10000


def test_security_headers_are_present(client):
    response = client.get("/health")

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "Permissions-Policy" in response.headers
