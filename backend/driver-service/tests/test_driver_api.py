import httpx
from fastapi.testclient import TestClient

from app.models import EstimateRequest, Location
from app.config import Settings
from app.main import _build_repository
from app.repositories.memory_repository import MemoryDriverRepository
from app.repositories.postgres_repository import PostgresDriverRepository
from app.services.route_estimator import RouteEstimator


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


def test_repository_mode_requires_database_url_for_explicit_postgres() -> None:
    settings = Settings(
        DRIVER_REPOSITORY_MODE="postgres",
        DRIVER_DATABASE_URL=None,
        DATABASE_URL=None,
    )

    try:
        _build_repository(settings)
    except RuntimeError as exc:
        assert "DRIVER_DATABASE_URL" in str(exc)
    else:
        raise AssertionError("postgres mode must not silently fall back to memory")


def test_auto_repository_mode_uses_postgres_when_database_url_exists() -> None:
    settings = Settings(
        DRIVER_REPOSITORY_MODE="auto",
        DRIVER_DATABASE_URL="postgresql://example.invalid/postgres",
        DATABASE_URL=None,
    )

    repository = _build_repository(settings)

    assert isinstance(repository, PostgresDriverRepository)


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
    assert payload["latestSnapshot"]["status"] == "ASSIGNED"
    assert payload["latestSnapshot"]["driverLocation"].keys() == {"lat", "lng"}


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
    assert payload["estimate"]["routePoints"][0] == {"lat": 52.52, "lng": 13.405}
    assert payload["estimate"]["routePoints"][-1] == {"lat": 52.5, "lng": 13.4}
    assert payload["estimate"]["encodedPolyline"] is None

    tracking = client.get("/orders/order-estimate/tracking").json()
    assert tracking["latestRouteEstimate"]["provider"] == "mock"
    assert tracking["latestSnapshot"]["routeProvider"] == "mock"
    assert tracking["latestSnapshot"]["routePoints"][0] == {"lat": 52.52, "lng": 13.405}


def test_status_update_is_persisted_in_tracking(client: TestClient) -> None:
    client.post("/drivers/assign", json={"orderId": "order-status"})

    response = client.patch(
        "/orders/order-status/tracking/status",
        json={"status": "IN_TRANSIT", "message": "Courier is on the way."},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["assignment"]["status"] == "IN_TRANSIT"
    assert payload["events"][-1]["eventType"] == "DELIVERY_STATUS_CHANGED"
    assert payload["events"][-1]["message"] == "Courier is on the way."
    assert payload["latestSnapshot"]["status"] == "IN_TRANSIT"


def test_estimate_uses_driver_already_assigned_to_order(client: TestClient) -> None:
    assignment = client.post(
        "/drivers/assign",
        json={"orderId": "order-route", "driverId": "drv_demo_sam"},
    ).json()

    response = client.post(
        "/drivers/estimate",
        json={
            "orderId": "order-route",
            "pickupLocation": {"lat": 52.52, "lng": 13.405},
            "customerLocation": {"lat": 52.5, "lng": 13.4},
        },
    )

    assert response.status_code == 200
    assert response.json()["driver"]["driverId"] == assignment["driver"]["driverId"]


def test_google_routes_provider_is_used_when_configured(
    repository: MemoryDriverRepository,
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-fieldmask"] == (
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline"
        )
        assert request.headers["x-goog-api-key"] == "test-key"
        return httpx.Response(
            200,
            json={
                "routes": [
                    {
                        "distanceMeters": 1234,
                        "duration": "321.5s",
                        "polyline": {
                            "encodedPolyline": "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
                        },
                    }
                ]
            },
        )

    estimator = RouteEstimator(
        repository,
        google_routes_api_key="test-key",
        google_client=httpx.Client(transport=httpx.MockTransport(handler)),
    )
    response = estimator.estimate(
        EstimateRequest(
            order_id="google-route",
            pickup_location=Location(lat=38.5, lng=-120.2),
            customer_location=Location(lat=43.252, lng=-126.453),
        )
    )

    assert response.estimate.provider == "google_routes"
    assert response.estimate.distance_meters == 1234
    assert response.estimate.duration_seconds == 322
    assert len(response.estimate.route_points) == 3
    assert response.estimate.encoded_polyline is not None


def test_google_routes_failure_falls_back_without_failing_request(
    repository: MemoryDriverRepository,
) -> None:
    estimator = RouteEstimator(
        repository,
        eta_minutes=40,
        google_routes_api_key="test-key",
        google_client=httpx.Client(
            transport=httpx.MockTransport(
                lambda request: httpx.Response(503, json={"error": "unavailable"})
            )
        ),
    )
    response = estimator.estimate(
        EstimateRequest(
            order_id="fallback-route",
            pickup_location=Location(lat=52.52, lng=13.405),
            customer_location=Location(lat=52.5, lng=13.4),
        )
    )

    assert response.estimate.provider == "mock"
    assert response.estimated_delivery_time_minutes == 40


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
