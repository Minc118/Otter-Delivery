from datetime import datetime, timezone

from app.models import Location, RouteEstimate
from app.repositories.postgres_repository import PostgresDriverRepository


NOW = datetime(2026, 7, 5, tzinfo=timezone.utc)


class FakeCursor:
    def __init__(self, fetchone_rows=None, fetchall_rows=None):
        self.fetchone_rows = list(fetchone_rows or [])
        self.fetchall_rows = list(fetchall_rows or [])
        self.executed = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def execute(self, query, params=None):
        self.executed.append((query, params))

    def fetchone(self):
        return self.fetchone_rows.pop(0) if self.fetchone_rows else None

    def fetchall(self):
        return self.fetchall_rows.pop(0) if self.fetchall_rows else []


class FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def cursor(self):
        return self._cursor


def test_postgres_assignment_persists_assignment_status_event_and_snapshot() -> None:
    cursor = FakeCursor(
        fetchone_rows=[
            None,
            _driver_row("AVAILABLE"),
            _assignment_row(),
            _driver_row("ON_DELIVERY"),
        ]
    )
    repository = _repository(cursor)

    assignment, driver, created = repository.assign_driver("order-db", "drv_demo_alex")

    assert created is True
    assert assignment.order_id == "order-db"
    assert driver.status == "ON_DELIVERY"
    executed_sql = "\n".join(query for query, _ in cursor.executed)
    assert "INSERT INTO delivery_assignments" in executed_sql
    assert "INSERT INTO tracking_events" in executed_sql
    assert "INSERT INTO driver_status_events" in executed_sql
    assert "INSERT INTO driver_tracking_snapshots" in executed_sql


def test_postgres_assignment_uses_demo_fallback_when_pool_is_exhausted() -> None:
    cursor = FakeCursor(
        fetchone_rows=[
            None,
            None,
            _driver_row("ON_DELIVERY", driver_id="drv_demo_fallback"),
            _assignment_row(order_id="order-fallback", driver_id="drv_demo_fallback"),
            _driver_row("ON_DELIVERY", driver_id="drv_demo_fallback"),
        ]
    )
    repository = _repository(cursor)

    assignment, driver, created = repository.assign_driver("order-fallback")

    assert created is True
    assert assignment.order_id == "order-fallback"
    assert assignment.driver_id == "drv_demo_fallback"
    assert driver.driver_id == "drv_demo_fallback"
    executed_sql = "\n".join(query for query, _ in cursor.executed)
    assert "ON CONFLICT (id) DO UPDATE" in executed_sql
    assert "INSERT INTO tracking_events" in executed_sql
    assert "INSERT INTO driver_tracking_snapshots" in executed_sql


def test_postgres_route_estimate_persists_geometry_and_tracking_snapshot() -> None:
    cursor = FakeCursor(
        fetchone_rows=[
            _route_row(
                route_points=[
                    {"lat": 52.52, "lng": 13.405},
                    {"lat": 52.5, "lng": 13.4},
                ],
                encoded_polyline="encoded",
            ),
            None,
        ]
    )
    repository = _repository(cursor)

    saved = repository.save_route_estimate(
        RouteEstimate(
            estimate_id="estimate-input",
            order_id="order-route",
            driver_id="drv_demo_alex",
            origin_location=Location(lat=52.52, lng=13.405),
            destination_location=Location(lat=52.5, lng=13.4),
            distance_meters=1000,
            duration_seconds=900,
            provider="google_routes",
            route_points=[
                Location(lat=52.52, lng=13.405),
                Location(lat=52.5, lng=13.4),
            ],
            encoded_polyline="encoded",
            created_at=NOW,
        )
    )

    assert saved.route_points[-1] == Location(lat=52.5, lng=13.4)
    assert saved.encoded_polyline == "encoded"
    executed_sql = "\n".join(query for query, _ in cursor.executed)
    assert "route_points, encoded_polyline" in executed_sql
    assert "INSERT INTO driver_tracking_snapshots" in executed_sql


def test_postgres_tracking_reads_persisted_snapshot_and_route_after_reinit() -> None:
    cursor = FakeCursor(
        fetchone_rows=[
            _assignment_row(),
            _snapshot_row(),
            _route_row(route_points=[{"lat": 52.52, "lng": 13.405}]),
        ],
        fetchall_rows=[
            [
                {
                    "id": "evt-1",
                    "order_id": "order-db",
                    "assignment_id": "asg-1",
                    "driver_id": "drv_demo_alex",
                    "event_type": "DRIVER_ASSIGNED",
                    "message": "Driver assigned to order.",
                    "lat": 52.52,
                    "lng": 13.405,
                    "created_at": NOW,
                }
            ]
        ],
    )
    repository = _repository(cursor)

    tracking = repository.get_tracking("order-db")

    assert tracking.assignment is not None
    assert tracking.events[0].event_type == "DRIVER_ASSIGNED"
    assert tracking.latest_snapshot is not None
    assert tracking.latest_snapshot.driver_location == Location(lat=52.52, lng=13.405)
    assert tracking.latest_route_estimate is not None
    assert tracking.latest_route_estimate.provider == "mock"


def _repository(cursor: FakeCursor) -> PostgresDriverRepository:
    repository = PostgresDriverRepository("postgresql://example.invalid/postgres")
    repository._connect = lambda: FakeConnection(cursor)
    return repository


def _driver_row(status: str, driver_id: str = "drv_demo_alex") -> dict:
    return {
        "id": driver_id,
        "name": "Alex M.",
        "status": status,
        "current_lat": 52.52,
        "current_lng": 13.405,
        "last_position_at": NOW,
        "created_at": NOW,
        "updated_at": NOW,
    }


def _assignment_row(
    status: str = "ASSIGNED",
    order_id: str = "order-db",
    driver_id: str = "drv_demo_alex",
) -> dict:
    return {
        "id": "asg-1",
        "order_id": order_id,
        "driver_id": driver_id,
        "status": status,
        "assigned_at": NOW,
        "picked_up_at": None,
        "delivered_at": None,
        "created_at": NOW,
        "updated_at": NOW,
    }


def _route_row(route_points=None, encoded_polyline=None) -> dict:
    return {
        "id": "route-1",
        "order_id": "order-db",
        "driver_id": "drv_demo_alex",
        "origin_lat": 52.52,
        "origin_lng": 13.405,
        "destination_lat": 52.5,
        "destination_lng": 13.4,
        "distance_meters": 1000,
        "duration_seconds": 900,
        "provider": "mock",
        "route_points": route_points or [],
        "encoded_polyline": encoded_polyline,
        "created_at": NOW,
    }


def _snapshot_row() -> dict:
    return {
        "id": "snap-1",
        "order_id": "order-db",
        "assignment_id": "asg-1",
        "driver_id": "drv_demo_alex",
        "status": "ASSIGNED",
        "driver_lat": 52.52,
        "driver_lng": 13.405,
        "pickup_lat": None,
        "pickup_lng": None,
        "dropoff_lat": None,
        "dropoff_lng": None,
        "route_estimate_id": None,
        "route_provider": None,
        "eta_seconds": None,
        "route_points": [],
        "encoded_polyline": None,
        "metadata": {"source": "assignment"},
        "created_at": NOW,
    }
