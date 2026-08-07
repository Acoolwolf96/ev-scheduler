from datetime import datetime, timedelta, timezone

VALID_REQUEST = {
    "current_charge_percent": 25,
    "target_charge_percent": 90,
    "battery_capacity_kwh": 60,
    "charger_power_kw": 11,
    "place": "Helsinki",
}


def _departure(hours_ahead: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours_ahead)).isoformat()


def test_preview_calculates_correctly_without_saving(client):
    response = client.post(
        "/charging-requests/optimize/preview",
        json={**VALID_REQUEST, "departure_time": _departure(20)},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["hours_needed"] == 4
    assert body["optimized_cost"] < body["baseline_cost"]

    # This is the core integrity guarantee — preview must never persist
    saved = client.get("/charging-requests/")
    assert saved.json() == []


def test_confirm_actually_saves_a_request(client):
    response = client.post(
        "/charging-requests/optimize/confirm",
        json={**VALID_REQUEST, "departure_time": _departure(20)},
    )

    assert response.status_code == 200
    assert response.json()["id"] is not None

    saved = client.get("/charging-requests/")
    assert len(saved.json()) == 1


def test_summary_aggregates_confirmed_requests(client):
    for _ in range(2):
        client.post(
            "/charging-requests/optimize/confirm",
            json={**VALID_REQUEST, "departure_time": _departure(20)},
        )

    response = client.get("/charging-requests/summary?group_by=month")
    assert response.status_code == 200

    body = response.json()
    assert len(body) == 1
    assert body[0]["request_count"] == 2
    assert body[0]["total_saved"] > 0


def test_not_enough_price_data_returns_404(client):
    response = client.post(
        "/charging-requests/optimize/preview",
        json={**VALID_REQUEST, "departure_time": _departure(0)},
    )

    assert response.status_code == 404
