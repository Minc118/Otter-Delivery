from fastapi.testclient import TestClient

from app.repositories.memory_repository import MemoryDriverRepository


def assert_error_shape(response, code: str) -> None:
    payload = response.json()
    assert payload["error"]["code"] == code
    assert isinstance(payload["error"]["message"], str)
    assert set(payload["error"]) == {"code", "message"}


def test_health_reports_memory_mode_without_configuration(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "driver-service",
        "repositoryMode": "memory",
    }


def test_available_drivers_has_frontend_shape(client: TestClient) -> None:
    response = client.get("/drivers/available")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["drivers"]) == 5
    assert {
        "driverId",
        "name",
        "status",
        "currentLocation",
        "lastPositionAt",
        "createdAt",
        "updatedAt",
    } == set(payload["drivers"][0])


def test_assigns_oldest_available_driver(client: TestClient) -> None:
    response = client.post("/drivers/assign", json={"orderId": "order-auto"})

    assert response.status_code == 201
    payload = response.json()
    assert payload["assignment"]["orderId"] == "order-auto"
    assert payload["assignment"]["driverId"] == payload["driver"]["driverId"]
    assert payload["assignment"]["status"] == "ASSIGNED"
    assert payload["driver"]["status"] == "ON_DELIVERY"


def test_assigns_explicit_driver(client: TestClient) -> None:
    response = client.post(
        "/drivers/assign",
        json={"orderId": "order-explicit", "driverId": "drv_demo_sam"},
    )

    assert response.status_code == 201
    assert response.json()["driver"]["driverId"] == "drv_demo_sam"


def test_duplicate_assignment_is_idempotent(client: TestClient) -> None:
    first = client.post("/drivers/assign", json={"orderId": "order-repeat"})
    second = client.post("/drivers/assign", json={"orderId": "order-repeat"})

    assert first.status_code == second.status_code == 201
    assert first.json() == second.json()
    tracking = client.get("/orders/order-repeat/tracking").json()
    assert len(tracking["events"]) == 1


def test_no_available_driver_error(
    client: TestClient, repository: MemoryDriverRepository
) -> None:
    for index in range(5):
        repository.assign_driver(f"occupy-{index}")

    response = client.post("/drivers/assign", json={"orderId": "order-no-driver"})

    assert response.status_code == 404
    assert_error_shape(response, "NO_AVAILABLE_DRIVER")


def test_tracking_response_has_frontend_shape(client: TestClient) -> None:
    client.post("/drivers/assign", json={"orderId": "order-tracking"})

    response = client.get("/orders/order-tracking/tracking")

    assert response.status_code == 200
    payload = response.json()
    assert payload["orderId"] == "order-tracking"
    assert payload["assignment"]["status"] == "ASSIGNED"
    assert payload["events"][0]["eventType"] == "DRIVER_ASSIGNED"
    assert payload["events"][0]["location"].keys() == {"lat", "lng"}


def test_updates_driver_position(client: TestClient) -> None:
    response = client.patch(
        "/drivers/drv_demo_alex/position",
        json={"location": {"lat": 52.51, "lng": 13.39}},
    )

    assert response.status_code == 200
    assert response.json()["currentLocation"] == {"lat": 52.51, "lng": 13.39}

    location = client.get("/drivers/drv_demo_alex/location")
    assert location.status_code == 200
    assert location.json()["location"] == {"lat": 52.51, "lng": 13.39}
    assert location.json()["driverId"] == "drv_demo_alex"


def test_estimate_returns_mock_distance_and_eta(client: TestClient) -> None:
    response = client.post(
        "/drivers/estimate",
        json={
            "orderId": "order-estimate",
            "pickupLocation": {"lat": 52.52, "lng": 13.405},
            "customerLocation": {"lat": 52.50, "lng": 13.40},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["estimatedDeliveryTimeMinutes"] == 40
    assert payload["etaLabel"] == "approx. 40 min"
    assert payload["estimate"]["provider"] == "mock"
    assert payload["estimate"]["distanceMeters"] > 0


def test_error_responses_are_consistent(client: TestClient) -> None:
    missing = client.get("/drivers/unknown")
    invalid = client.patch(
        "/drivers/drv_demo_alex/position", json={"lat": 100, "lng": 13.4}
    )
    missing_tracking = client.get("/orders/unknown/tracking")

    assert missing.status_code == 404
    assert_error_shape(missing, "DRIVER_NOT_FOUND")
    assert invalid.status_code == 400
    assert_error_shape(invalid, "INVALID_INPUT")
    assert missing_tracking.status_code == 404
    assert_error_shape(missing_tracking, "TRACKING_NOT_FOUND")


def test_explicit_unavailable_driver_returns_conflict(client: TestClient) -> None:
    client.post(
        "/drivers/assign",
        json={"orderId": "first", "driverId": "drv_demo_alex"},
    )

    response = client.post(
        "/drivers/assign",
        json={"orderId": "second", "driverId": "drv_demo_alex"},
    )

    assert response.status_code == 400
    assert_error_shape(response, "DRIVER_UNAVAILABLE")
