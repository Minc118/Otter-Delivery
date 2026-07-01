import psycopg
from psycopg.errors import UndefinedColumn, UndefinedTable, UniqueViolation
from psycopg.rows import dict_row

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
)


DRIVER_COLUMNS = """
    id, name, status, current_lat, current_lng,
    last_position_at, created_at, updated_at
"""
ASSIGNMENT_COLUMNS = """
    id, order_id, driver_id, status, assigned_at,
    picked_up_at, delivered_at, created_at, updated_at
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
            return _driver_from_row(row)

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
                if assignment is None and not events:
                    raise NotFoundError(
                        "TRACKING_NOT_FOUND", "Order tracking data could not be found."
                    )
                return TrackingResponse(
                    order_id=order_id,
                    assignment=assignment,
                    events=events,
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
                     duration_seconds, provider)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, order_id, driver_id, origin_lat, origin_lng,
                              destination_lat, destination_lng, distance_meters,
                              duration_seconds, provider, created_at""",
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
                ),
            )
            return _estimate_from_row(cursor.fetchone())

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
        created_at=row["created_at"],
    )
