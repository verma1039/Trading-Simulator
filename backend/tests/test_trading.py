from __future__ import annotations

from conftest import USER, authenticate_as


def test_buy_success_updates_portfolio(client, repository_double):
    authenticate_as(USER)

    response = client.post("/orders/buy", json={"symbol": "AAPL", "quantity": 1})

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["order"]["side"] == "BUY"
    assert repository_double.cash == 875.0
    assert payload["portfolio"]["summary"]["holdingsCount"] == 1


def test_sell_success_updates_portfolio(client, repository_double):
    authenticate_as(USER)

    response = client.post("/orders/sell", json={"symbol": "AAPL", "quantity": 1})

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["order"]["side"] == "SELL"
    assert repository_double.cash == 1125.0


def test_buy_rejects_insufficient_cash(client, repository_double):
    repository_double.cash = 10
    authenticate_as(USER)

    response = client.post("/orders/buy", json={"symbol": "AAPL", "quantity": 1})

    assert response.status_code == 400
    assert response.json()["message"] == "Insufficient cash."


def test_sell_rejects_oversell(client):
    authenticate_as(USER)

    response = client.post("/orders/sell", json={"symbol": "AAPL", "quantity": 3})

    assert response.status_code == 400
    assert response.json()["message"] == "Insufficient shares."


def test_order_rejects_when_market_closed(client, repository_double):
    repository_double.market_open = False
    authenticate_as(USER)

    response = client.post("/orders/buy", json={"symbol": "AAPL", "quantity": 1})

    assert response.status_code == 400
    assert response.json()["message"] == "Market is currently closed."
