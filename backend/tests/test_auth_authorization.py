from __future__ import annotations

from conftest import ADMIN, INCOMPLETE_USER, USER, authenticate_as


def test_unauthenticated_request_is_rejected(client):
    response = client.get("/dashboard")

    assert response.status_code == 401
    assert response.json() == {"success": False, "message": "Authentication required."}


def test_authenticated_request_returns_current_user(client):
    authenticate_as(USER)

    response = client.get("/auth/me")

    assert response.status_code == 200
    assert response.json()["data"]["user"]["email"] == USER["email"]


def test_admin_access_allowed(client):
    authenticate_as(ADMIN)

    response = client.get("/admin/dashboard")

    assert response.status_code == 200
    assert response.json()["data"]["summary"]["totalUsers"] == 1


def test_user_access_to_admin_is_blocked(client):
    authenticate_as(USER)

    response = client.get("/admin/dashboard")

    assert response.status_code == 403
    assert response.json()["message"] == "Admin role required."


def test_incomplete_legacy_profile_no_longer_blocks_user_routes(client):
    authenticate_as(INCOMPLETE_USER)

    response = client.get("/dashboard")

    assert response.status_code == 200
    assert response.json()["data"]["user"]["id"] == INCOMPLETE_USER["id"]


def test_completed_user_can_access_user_routes(client):
    authenticate_as(USER)

    response = client.get("/dashboard")

    assert response.status_code == 200
    assert response.json()["data"]["user"]["id"] == USER["id"]
