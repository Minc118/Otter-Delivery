from copy import deepcopy
from datetime import datetime, timezone
from threading import RLock
from uuid import uuid4

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


DEMO_DRIVERS = (
    ("drv_demo_alex", "Alex M.", 52.5200, 13.4050),
    ("drv_demo_sam", "Sam K.", 52.5180, 13.4090),
    ("drv_demo_mina", "Mina L.", 52.5224, 13.4017),
    ("drv_demo_noah", "Noah R.", 52.5157, 13.3901),
    ("drv_demo_lina", "Lina S.", 52.5260, 13.4142),
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MemoryDriverRepository:
    mode = "memory"

    def __init__(self, seed_demo_drivers: bool = True) -> None:
        self._lock = RLock()
        self._drivers: dict[str, Driver] = {}
        self._assignments: dict[str, DeliveryAssignment] = {}
        self._events: dict[str, list[TrackingEvent]] = {}
        self._estimates: dict[str, RouteEstimate] = {}
        if seed_demo_drivers:
            self._seed()

    def _seed(self) -> None:
        now = utc_now()
        for index, (driver_id, name, lat, lng) in enumerate(DEMO_DRIVERS):
            created_at = now.replace(microsecond=min(now.microsecond + index, 999999))
            self._drivers[driver_id] = Driver(
                driver_id=driver_id,
                name=name,
                status=DriverStatus.AVAILABLE,
                current_location=Location(lat=lat, lng=lng),
                last_position_at=created_at,
                created_at=created_at,
                updated_at=created_at,
            )

    def list_available_drivers(self) -> list[Driver]:
        with self._lock:
            drivers = [
                driver
                for driver in self._drivers.values()
                if driver.status == DriverStatus.AVAILABLE
            ]
            return deepcopy(sorted(drivers, key=lambda driver: driver.updated_at, reverse=True))

    def get_driver(self, driver_id: str) -> Driver:
        with self._lock:
            driver = self._drivers.get(driver_id)
            if driver is None:
                raise NotFoundError("DRIVER_NOT_FOUND", "Driver could not be found.")
            return deepcopy(driver)

    def update_driver_position(self, driver_id: str, location: Location) -> Driver:
        with self._lock:
            driver = self._drivers.get(driver_id)
            if driver is None:
                raise NotFoundError("DRIVER_NOT_FOUND", "Driver could not be found.")
            now = utc_now()
            updated = driver.model_copy(
                update={
                    "current_location": location,
                    "last_position_at": now,
                    "updated_at": now,
                }
            )
            self._drivers[driver_id] = updated
            return deepcopy(updated)

    def assign_driver(
        self, order_id: str, driver_id: str | None = None
    ) -> tuple[DeliveryAssignment, Driver, bool]:
        with self._lock:
            existing = self._assignments.get(order_id)
            if existing is not None:
                return deepcopy(existing), deepcopy(self._drivers[existing.driver_id]), False

            if driver_id:
                driver = self._drivers.get(driver_id)
                if driver is None:
                    raise NotFoundError("DRIVER_NOT_FOUND", "Driver could not be found.")
                if driver.status != DriverStatus.AVAILABLE:
                    raise ConflictError(
                        "DRIVER_UNAVAILABLE",
                        "Driver is not available for assignment.",
                    )
            else:
                available = [
                    driver
                    for driver in self._drivers.values()
                    if driver.status == DriverStatus.AVAILABLE
                ]
                if not available:
                    raise NotFoundError(
                        "NO_AVAILABLE_DRIVER", "No available driver could be found."
                    )
                driver = min(available, key=lambda candidate: candidate.updated_at)

            now = utc_now()
            assigned_driver = driver.model_copy(
                update={"status": DriverStatus.ON_DELIVERY, "updated_at": now}
            )
            assignment = DeliveryAssignment(
                assignment_id=str(uuid4()),
                order_id=order_id,
                driver_id=driver.driver_id,
                status=AssignmentStatus.ASSIGNED,
                assigned_at=now,
                created_at=now,
                updated_at=now,
            )
            event = TrackingEvent(
                event_id=str(uuid4()),
                order_id=order_id,
                assignment_id=assignment.assignment_id,
                driver_id=driver.driver_id,
                event_type="DRIVER_ASSIGNED",
                message="Driver assigned to order.",
                location=driver.current_location,
                created_at=now,
            )
            self._drivers[driver.driver_id] = assigned_driver
            self._assignments[order_id] = assignment
            self._events[order_id] = [event]
            return deepcopy(assignment), deepcopy(assigned_driver), True

    def get_tracking(self, order_id: str) -> TrackingResponse:
        with self._lock:
            assignment = self._assignments.get(order_id)
            events = self._events.get(order_id, [])
            if assignment is None and not events:
                raise NotFoundError(
                    "TRACKING_NOT_FOUND", "Order tracking data could not be found."
                )
            return TrackingResponse(
                order_id=order_id,
                assignment=deepcopy(assignment),
                events=deepcopy(events),
            )

    def save_route_estimate(self, estimate: RouteEstimate) -> RouteEstimate:
        with self._lock:
            self._estimates[estimate.estimate_id] = deepcopy(estimate)
            return deepcopy(estimate)
