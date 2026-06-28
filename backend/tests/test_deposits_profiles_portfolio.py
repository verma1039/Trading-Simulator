from __future__ import annotations

from conftest import ADMIN, USER, authenticate_as


def test_create_deposit_request(client):
    authenticate_as(USER)

    response = client.post("/transactions/deposit-request", json={"amount": 250, "notes": "Add funds"})

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "PENDING"


def test_admin_can_approve_deposit(client, repository_double):
    repository_double.create_deposit_request(USER, 250, "Add funds")
    authenticate_as(ADMIN)

    response = client.post("/admin/deposit/approve", json={"depositId": "deposit-1"})

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "APPROVED"
    assert repository_double.cash == 1250.0


def test_admin_can_reject_deposit(client, repository_double):
    repository_double.create_deposit_request(USER, 250, "Add funds")
    authenticate_as(ADMIN)

    response = client.post("/admin/deposit/reject", json={"depositId": "deposit-1"})

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "REJECTED"
    assert repository_double.cash == 1000.0


def test_profile_update_success(client):
    authenticate_as(USER)

    response = client.put(
        "/profile",
        json={
            "displayName": "User Updated",
            "phoneNumber": "9000000000",
            "country": "India",
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["profile"]["phoneNumber"] == "9000000000"


def test_duplicate_phone_is_rejected(client):
    authenticate_as(USER)

    response = client.put(
        "/profile",
        json={
            "displayName": "User Updated",
            "phoneNumber": "9999999999",
            "country": "India",
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 422
    assert response.json()["message"] == "This mobile number is already associated with another account."


def test_phone_availability_endpoint(client):
    available_response = client.get("/profile/phone-availability?phoneNumber=9000000000")
    duplicate_response = client.get("/profile/phone-availability?phoneNumber=9999999999")

    assert available_response.status_code == 200
    assert available_response.json()["data"]["available"] is True
    assert duplicate_response.status_code == 200
    assert duplicate_response.json()["data"]["available"] is False


def test_portfolio_valuation_and_pnl(client):
    authenticate_as(USER)

    response = client.get("/portfolio")

    assert response.status_code == 200
    summary = response.json()["data"]["summary"]
    assert summary["portfolioValue"] == 1250.0
    assert summary["unrealizedPnL"] == 50.0
    assert summary["unrealizedPnLPercent"] == 25.0
