import psycopg
from psycopg.errors import UndefinedColumn, UndefinedTable, UniqueViolation
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.errors import ConflictError, NotFoundError
from app.models import (
    AssignmentStatus,
    DeliveryAssignment,
    Driver,
    DriverStatus,
    Location,
    RouteEstimate,
    TrackingEvent,
    TrackingResponse,
    TrackingSnapshot,
)


DRIVER_COLUMNS = """
    id, name, status, current_lat, current_lng,
    last_position_at, created_at, updated_at
"""
ASSIGNMENT_COLUMNS = """
    id, order_id, driver_id, status, assigned_at,
    picked_up_at, delivered_at, created_at, updated_at
"""
ROUTE_ESTIMATE_COLUMNS = """
    id, order_id, driver_id, origin_lat, origin_lng,
    destination_lat, destination_lng, distance_meters,
    duration_seconds, provider, route_points, encoded_polyline, created_at
"""
TRACKING_SNAPSHOT_COLUMNS = """
    id, order_id, assignment_id, driver_id, status, driver_lat, driver_lng,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, route_estimate_id,
    route_provider, eta_seconds, route_points, encoded_polyline, metadata, created_at
"""


class PostgresDriverRepository:
    mode = "postgres"

    def __init__(self, database_url: str) -> None:
        self._database_url = database_url

    def _connect(self):
        return psycopg.connect(self._database_url, row_factory=dict_row)

    def list_available_drivers(self) -> list[Driver]:
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""SELECT {DRIVER_COLUMNS} FROM drivers
                    WHERE status = %s ORDER BY updated_at DESC""",
                (DriverStatus.AVAILABLE.value,),
            )
            return [_driver_from_row(row) for row in cursor.fetchall()]

    def get_driver(self, driver_id: str) -> Driver:
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"SELECT {DRIVER_COLUMNS} FROM drivers WHERE id = %s",
                (driver_id,),
            )
            row = cursor.fetchone()
            if row is None:
                raise NotFoundError("DRIVER_NOT_FOUND", "Driver could not be found.")
            driver = _driver_from_row(row)
            self._record_position_tracking(cursor, driver)
            return driver

    def update_driver_position(self, driver_id: str, location: Location) -> Driver:
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""UPDATE drivers
                    SET current_lat = %s, current_lng = %s,
                        last_position_at = now(), updated_at = now()
                    WHERE id = %s RETURNING {DRIVER_COLUMNS}""",
                (location.lat, location.lng, driver_id),
            )
            row = cursor.fetchone()
            if row is None:
                raise NotFoundError("DRIVER_NOT_FOUND", "Driver could not be found.")
            return _driver_from_row(row)

    def assign_driver(
        self, order_id: str, driver_id: str | None = None
    ) -> tuple[DeliveryAssignment, Driver, bool]:
        try:
            with self._connect() as connection, connection.cursor() as cursor:
                existing = self._find_assignment(cursor, order_id)
                if existing is not None:
                    return existing, self._get_driver_with_cursor(cursor, existing.driver_id), False

                if driver_id:
                    cursor.execute(
                        f"SELECT {DRIVER_COLUMNS} FROM drivers WHERE id = %s FOR UPDATE",
                        (driver_id,),
                    )
                else:
                    cursor.execute(
                        f"""SELECT {DRIVER_COLUMNS} FROM drivers
                            WHERE status = %s ORDER BY updated_at ASC
                            LIMIT 1 FOR UPDATE SKIP LOCKED""",
                        (DriverStatus.AVAILABLE.value,),
                    )
                driver_row = cursor.fetchone()
                if driver_row is None:
                    if driver_id:
                        raise NotFoundError("DRIVER_NOT_FOUND", "Driver could not be found.")
                    raise NotFoundError(
                        "NO_AVAILABLE_DRIVER", "No available driver could be found."
                    )

                driver = _driver_from_row(driver_row)
                if driver.status != DriverStatus.AVAILABLE:
                    raise ConflictError(
                        "DRIVER_UNAVAILABLE", "Driver is not available for assignment."
                    )

                cursor.execute(
                    f"""INSERT INTO delivery_assignments
                        (order_id, driver_id, status, assigned_at)
                        VALUES (%s, %s, %s, now()) RETURNING {ASSIGNMENT_COLUMNS}""",
                    (order_id, driver.driver_id, AssignmentStatus.ASSIGNED.value),
                )
                assignment = _assignment_from_row(cursor.fetchone())
                cursor.execute(
                    f"""UPDATE drivers SET status = %s, updated_at = now()
                        WHERE id = %s RETURNING {DRIVER_COLUMNS}""",
                    (DriverStatus.ON_DELIVERY.value, driver.driver_id),
                )
                assigned_driver = _driver_from_row(cursor.fetchone())
                cursor.execute(
                    """INSERT INTO tracking_events
                        (order_id, assignment_id, driver_id, event_type, message, lat, lng)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (
                        order_id,
                        assignment.assignment_id,
                        driver.driver_id,
                        "DRIVER_ASSIGNED",
                        "Driver assigned to order.",
                        driver.current_location.lat,
                        driver.current_location.lng,
                    ),
                )
                self._insert_status_event(
                    cursor,
                    order_id=order_id,
                    assignment_id=assignment.assignment_id,
                    driver_id=driver.driver_id,
                    previous_status=None,
                    status=AssignmentStatus.ASSIGNED.value,
                    event_type="DELIVERY_STATUS_CHANGED",
                    message="Delivery status changed to ASSIGNED.",
                    location=driver.current_location,
                )
                self._insert_tracking_snapshot(
                    cursor,
                    order_id=order_id,
                    assignment_id=assignment.assignment_id,
                    driver_id=driver.driver_id,
                    status=assignment.status.value,
                    driver_location=driver.current_location,
                    metadata={"source": "assignment"},
                )
                return assignment, assigned_driver, True
        except UniqueViolation:
            # A concurrent request won the one-assignment-per-order race.
            with self._connect() as connection, connection.cursor() as cursor:
                existing = self._find_assignment(cursor, order_id)
                if existing is None:
                    raise
                return existing, self._get_driver_with_cursor(cursor, existing.driver_id), False

    def get_tracking(self, order_id: str) -> TrackingResponse:
        try:
            with self._connect() as connection, connection.cursor() as cursor:
                assignment = self._find_assignment(cursor, order_id)
                cursor.execute(
                    """SELECT id, order_id, assignment_id, driver_id, event_type,
                              message, lat, lng, created_at
                       FROM tracking_events WHERE order_id = %s ORDER BY created_at ASC""",
                    (order_id,),
                )
                events = [_event_from_row(row) for row in cursor.fetchall()]
                latest_snapshot = self._latest_tracking_snapshot(cursor, order_id)
                latest_route_estimate = self._latest_route_estimate(cursor, order_id)
                if (
                    assignment is None
                    and not events
                    and latest_snapshot is None
                    and latest_route_estimate is None
                ):
                    raise NotFoundError(
                        "TRACKING_NOT_FOUND", "Order tracking data could not be found."
                    )
                return TrackingResponse(
                    order_id=order_id,
                    assignment=assignment,
                    events=events,
                    latest_snapshot=latest_snapshot,
                    latest_route_estimate=latest_route_estimate,
                )
        except (KeyError, UndefinedColumn, UndefinedTable):
            raise NotFoundError(
                "TRACKING_NOT_FOUND", "Order tracking data could not be found."
            )

    def save_route_estimate(self, estimate: RouteEstimate) -> RouteEstimate:
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO route_estimates
                    (order_id, driver_id, origin_lat, origin_lng,
                     destination_lat, destination_lng, distance_meters,
                     duration_seconds, provider, route_points, encoded_polyline)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING """ + ROUTE_ESTIMATE_COLUMNS,
                (
                    estimate.order_id,
                    estimate.driver_id,
                    estimate.origin_location.lat,
                    estimate.origin_location.lng,
                    estimate.destination_location.lat,
                    estimate.destination_location.lng,
                    estimate.distance_meters,
                    estimate.duration_seconds,
                    estimate.provider,
                    Jsonb([point.model_dump(mode="json") for point in estimate.route_points]),
                    estimate.encoded_polyline,
                ),
            )
            saved = _estimate_from_row(cursor.fetchone())
            if saved.order_id:
                assignment = self._find_assignment(cursor, saved.order_id)
                self._insert_tracking_snapshot(
                    cursor,
                    order_id=saved.order_id,
                    assignment_id=assignment.assignment_id if assignment else None,
                    driver_id=saved.driver_id,
                    status=assignment.status.value if assignment else None,
                    pickup_location=saved.origin_location,
                    dropoff_location=saved.destination_location,
                    route_estimate_id=saved.estimate_id,
                    route_provider=saved.provider,
                    eta_seconds=saved.duration_seconds,
                    route_points=saved.route_points,
                    encoded_polyline=saved.encoded_polyline,
                    metadata={"source": "route_estimate"},
                )
            return saved

    def update_assignment_status(
        self, order_id: str, status: str, message: str | None = None
    ) -> TrackingResponse:
        next_status = AssignmentStatus(status)
        with self._connect() as connection, connection.cursor() as cursor:
            existing = self._find_assignment(cursor, order_id)
            if existing is None:
                raise NotFoundError(
                    "TRACKING_NOT_FOUND", "Order tracking data could not be found."
                )

            picked_up_sql = ", picked_up_at = COALESCE(picked_up_at, now())" if next_status == AssignmentStatus.PICKED_UP else ""
            delivered_sql = ", delivered_at = COALESCE(delivered_at, now())" if next_status == AssignmentStatus.DELIVERED else ""
            cursor.execute(
                f"""UPDATE delivery_assignments
                    SET status = %s, updated_at = now(){picked_up_sql}{delivered_sql}
                    WHERE order_id = %s RETURNING {ASSIGNMENT_COLUMNS}""",
                (next_status.value, order_id),
            )
            assignment = _assignment_from_row(cursor.fetchone())
            driver = self._get_driver_with_cursor(cursor, assignment.driver_id)
            event_message = message or f"Delivery status changed to {next_status.value}."
            cursor.execute(
                """INSERT INTO tracking_events
                    (order_id, assignment_id, driver_id, event_type, message, lat, lng)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    order_id,
                    assignment.assignment_id,
                    assignment.driver_id,
                    "DELIVERY_STATUS_CHANGED",
                    event_message,
                    driver.current_location.lat,
                    driver.current_location.lng,
                ),
            )
            self._insert_status_event(
                cursor,
                order_id=order_id,
                assignment_id=assignment.assignment_id,
                driver_id=assignment.driver_id,
                previous_status=existing.status.value,
                status=next_status.value,
                event_type="DELIVERY_STATUS_CHANGED",
                message=event_message,
                location=driver.current_location,
            )
            self._insert_tracking_snapshot(
                cursor,
                order_id=order_id,
                assignment_id=assignment.assignment_id,
                driver_id=assignment.driver_id,
                status=next_status.value,
                driver_location=driver.current_location,
                metadata={"source": "status_update"},
            )
            if next_status in {AssignmentStatus.DELIVERED, AssignmentStatus.CANCELLED}:
                cursor.execute(
                    """UPDATE drivers SET status = %s, updated_at = now()
                       WHERE id = %s""",
                    (DriverStatus.AVAILABLE.value, assignment.driver_id),
                )

        return self.get_tracking(order_id)

    def _find_assignment(self, cursor, order_id: str) -> DeliveryAssignment | None:
        cursor.execute(
            f"""SELECT {ASSIGNMENT_COLUMNS} FROM delivery_assignments
                WHERE order_id = %s ORDER BY assigned_at DESC LIMIT 1""",
            (order_id,),
        )
        row = cursor.fetchone()
        return _assignment_from_row(row) if row else None

    def _get_driver_with_cursor(self, cursor, driver_id: str) -> Driver:
        cursor.execute(
            f"SELECT {DRIVER_COLUMNS} FROM drivers WHERE id = %s", (driver_id,)
        )
        row = cursor.fetchone()
        if row is None:
            raise NotFoundError("DRIVER_NOT_FOUND", "Driver could not be found.")
        return _driver_from_row(row)

    def _record_position_tracking(self, cursor, driver: Driver) -> None:
        cursor.execute(
            f"""SELECT {ASSIGNMENT_COLUMNS} FROM delivery_assignments
                WHERE driver_id = %s
                  AND status IN (%s, %s, %s)
                ORDER BY updated_at DESC""",
            (
                driver.driver_id,
                AssignmentStatus.ASSIGNED.value,
                AssignmentStatus.PICKED_UP.value,
                AssignmentStatus.IN_TRANSIT.value,
            ),
        )
        assignments = [_assignment_from_row(row) for row in cursor.fetchall()]
        for assignment in assignments:
            cursor.execute(
                """INSERT INTO tracking_events
                    (order_id, assignment_id, driver_id, event_type, message, lat, lng)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    assignment.order_id,
                    assignment.assignment_id,
                    driver.driver_id,
                    "DRIVER_POSITION_UPDATED",
                    "Driver position updated.",
                    driver.current_location.lat,
                    driver.current_location.lng,
                ),
            )
            self._insert_tracking_snapshot(
                cursor,
                order_id=assignment.order_id,
                assignment_id=assignment.assignment_id,
                driver_id=driver.driver_id,
                status=assignment.status.value,
                driver_location=driver.current_location,
                metadata={"source": "driver_position"},
            )

    def _insert_status_event(
        self,
        cursor,
        *,
        order_id: str,
        assignment_id: str | None,
        driver_id: str | None,
        previous_status: str | None,
        status: str,
        event_type: str,
        message: str | None,
        location: Location | None,
    ) -> None:
        cursor.execute(
            """INSERT INTO driver_status_events
                (order_id, assignment_id, driver_id, previous_status, status,
                 event_type, message, lat, lng)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                order_id,
                assignment_id,
                driver_id,
                previous_status,
                status,
                event_type,
                message,
                location.lat if location else None,
                location.lng if location else None,
            ),
        )

    def _insert_tracking_snapshot(
        self,
        cursor,
        *,
        order_id: str,
        assignment_id: str | None,
        driver_id: str | None,
        status: str | None,
        driver_location: Location | None = None,
        pickup_location: Location | None = None,
        dropoff_location: Location | None = None,
        route_estimate_id: str | None = None,
        route_provider: str | None = None,
        eta_seconds: int | None = None,
        route_points: list[Location] | None = None,
        encoded_polyline: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        cursor.execute(
            """INSERT INTO driver_tracking_snapshots
                (order_id, assignment_id, driver_id, status, driver_lat, driver_lng,
                 pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, route_estimate_id,
                 route_provider, eta_seconds, route_points, encoded_polyline, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                order_id,
                assignment_id,
                driver_id,
                status,
                driver_location.lat if driver_location else None,
                driver_location.lng if driver_location else None,
                pickup_location.lat if pickup_location else None,
                pickup_location.lng if pickup_location else None,
                dropoff_location.lat if dropoff_location else None,
                dropoff_location.lng if dropoff_location else None,
                route_estimate_id,
                route_provider,
                eta_seconds,
                Jsonb([point.model_dump(mode="json") for point in route_points or []]),
                encoded_polyline,
                Jsonb(metadata or {}),
            ),
        )

    def _latest_tracking_snapshot(self, cursor, order_id: str) -> TrackingSnapshot | None:
        cursor.execute(
            f"""SELECT {TRACKING_SNAPSHOT_COLUMNS}
                FROM driver_tracking_snapshots
                WHERE order_id = %s
                ORDER BY created_at DESC
                LIMIT 1""",
            (order_id,),
        )
        row = cursor.fetchone()
        return _snapshot_from_row(row) if row else None

    def _latest_route_estimate(self, cursor, order_id: str) -> RouteEstimate | None:
        cursor.execute(
            f"""SELECT {ROUTE_ESTIMATE_COLUMNS}
                FROM route_estimates
                WHERE order_id = %s
                ORDER BY created_at DESC
                LIMIT 1""",
            (order_id,),
        )
        row = cursor.fetchone()
        return _estimate_from_row(row) if row else None


def _driver_from_row(row: dict) -> Driver:
    return Driver(
        driver_id=row["id"],
        name=row["name"],
        status=row["status"],
        current_location=Location(lat=row["current_lat"], lng=row["current_lng"]),
        last_position_at=row["last_position_at"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _assignment_from_row(row: dict) -> DeliveryAssignment:
    return DeliveryAssignment(
        assignment_id=row["id"],
        order_id=row["order_id"],
        driver_id=row["driver_id"],
        status=row["status"],
        assigned_at=row["assigned_at"],
        picked_up_at=row["picked_up_at"],
        delivered_at=row["delivered_at"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _event_from_row(row: dict) -> TrackingEvent:
    location = None
    if row["lat"] is not None and row["lng"] is not None:
        location = Location(lat=row["lat"], lng=row["lng"])
    return TrackingEvent(
        event_id=row["id"],
        order_id=row["order_id"],
        assignment_id=row["assignment_id"],
        driver_id=row["driver_id"],
        event_type=row["event_type"],
        message=row["message"],
        location=location,
        created_at=row["created_at"],
    )


def _location_from_row(row: dict, lat_key: str, lng_key: str) -> Location | None:
    if row.get(lat_key) is None or row.get(lng_key) is None:
        return None
    return Location(lat=row[lat_key], lng=row[lng_key])


def _route_points(value) -> list[Location]:
    if not value:
        return []
    return [Location(lat=point["lat"], lng=point["lng"]) for point in value]


def _snapshot_from_row(row: dict) -> TrackingSnapshot:
    return TrackingSnapshot(
        snapshot_id=row["id"],
        order_id=row["order_id"],
        assignment_id=row["assignment_id"],
        driver_id=row["driver_id"],
        status=row["status"],
        driver_location=_location_from_row(row, "driver_lat", "driver_lng"),
        pickup_location=_location_from_row(row, "pickup_lat", "pickup_lng"),
        dropoff_location=_location_from_row(row, "dropoff_lat", "dropoff_lng"),
        route_estimate_id=row["route_estimate_id"],
        route_provider=row["route_provider"],
        eta_seconds=row["eta_seconds"],
        route_points=_route_points(row.get("route_points")),
        encoded_polyline=row["encoded_polyline"],
        metadata=row.get("metadata") or {},
        created_at=row["created_at"],
    )


def _estimate_from_row(row: dict) -> RouteEstimate:
    return RouteEstimate(
        estimate_id=row["id"],
        order_id=row["order_id"],
        driver_id=row["driver_id"],
        origin_location=Location(lat=row["origin_lat"], lng=row["origin_lng"]),
        destination_location=Location(
            lat=row["destination_lat"], lng=row["destination_lng"]
        ),
        distance_meters=row["distance_meters"],
        duration_seconds=row["duration_seconds"],
        provider=row["provider"],
        route_points=_route_points(row.get("route_points")),
        encoded_polyline=row.get("encoded_polyline"),
        created_at=row["created_at"],
    )
