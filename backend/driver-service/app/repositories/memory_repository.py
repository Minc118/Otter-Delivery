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
    TrackingSnapshot,
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
        self._snapshots: dict[str, list[TrackingSnapshot]] = {}
        self._status_events: dict[str, list[TrackingEvent]] = {}
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
            self._record_position_tracking(updated)
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
            self._status_events[order_id] = [
                TrackingEvent(
                    event_id=str(uuid4()),
                    order_id=order_id,
                    assignment_id=assignment.assignment_id,
                    driver_id=driver.driver_id,
                    event_type="DELIVERY_STATUS_CHANGED",
                    message="Delivery status changed to ASSIGNED.",
                    location=driver.current_location,
                    created_at=now,
                )
            ]
            self._snapshots[order_id] = [
                TrackingSnapshot(
                    snapshot_id=str(uuid4()),
                    order_id=order_id,
                    assignment_id=assignment.assignment_id,
                    driver_id=driver.driver_id,
                    status=assignment.status,
                    driver_location=driver.current_location,
                    metadata={"source": "assignment"},
                    created_at=now,
                )
            ]
            return deepcopy(assignment), deepcopy(assigned_driver), True

    def get_tracking(self, order_id: str) -> TrackingResponse:
        with self._lock:
            assignment = self._assignments.get(order_id)
            events = self._events.get(order_id, [])
            latest_snapshot = self._latest_snapshot(order_id)
            latest_route_estimate = self._latest_route_estimate(order_id)
            if assignment is None and not events and latest_snapshot is None and latest_route_estimate is None:
                raise NotFoundError(
                    "TRACKING_NOT_FOUND", "Order tracking data could not be found."
                )
            return TrackingResponse(
                order_id=order_id,
                assignment=deepcopy(assignment),
                events=deepcopy(events),
                latest_snapshot=deepcopy(latest_snapshot),
                latest_route_estimate=deepcopy(latest_route_estimate),
            )

    def save_route_estimate(self, estimate: RouteEstimate) -> RouteEstimate:
        with self._lock:
            self._estimates[estimate.estimate_id] = deepcopy(estimate)
            if estimate.order_id:
                assignment = self._assignments.get(estimate.order_id)
                self._snapshots.setdefault(estimate.order_id, []).append(
                    TrackingSnapshot(
                        snapshot_id=str(uuid4()),
                        order_id=estimate.order_id,
                        assignment_id=assignment.assignment_id if assignment else None,
                        driver_id=estimate.driver_id,
                        status=assignment.status if assignment else None,
                        pickup_location=estimate.origin_location,
                        dropoff_location=estimate.destination_location,
                        route_estimate_id=estimate.estimate_id,
                        route_provider=estimate.provider,
                        eta_seconds=estimate.duration_seconds,
                        route_points=deepcopy(estimate.route_points),
                        encoded_polyline=estimate.encoded_polyline,
                        metadata={"source": "route_estimate"},
                        created_at=estimate.created_at,
                    )
                )
            return deepcopy(estimate)

    def update_assignment_status(
        self, order_id: str, status: str, message: str | None = None
    ) -> TrackingResponse:
        with self._lock:
            assignment = self._assignments.get(order_id)
            if assignment is None:
                raise NotFoundError(
                    "TRACKING_NOT_FOUND", "Order tracking data could not be found."
                )

            next_status = AssignmentStatus(status)
            now = utc_now()
            update = {"status": next_status, "updated_at": now}
            if next_status == AssignmentStatus.PICKED_UP:
                update["picked_up_at"] = assignment.picked_up_at or now
            if next_status == AssignmentStatus.DELIVERED:
                update["delivered_at"] = assignment.delivered_at or now

            updated_assignment = assignment.model_copy(update=update)
            self._assignments[order_id] = updated_assignment

            driver = self._drivers.get(updated_assignment.driver_id)
            driver_location = driver.current_location if driver else None
            event = TrackingEvent(
                event_id=str(uuid4()),
                order_id=order_id,
                assignment_id=updated_assignment.assignment_id,
                driver_id=updated_assignment.driver_id,
                event_type="DELIVERY_STATUS_CHANGED",
                message=message or f"Delivery status changed to {next_status.value}.",
                location=driver_location,
                created_at=now,
            )
            self._events.setdefault(order_id, []).append(event)
            self._status_events.setdefault(order_id, []).append(deepcopy(event))
            self._snapshots.setdefault(order_id, []).append(
                TrackingSnapshot(
                    snapshot_id=str(uuid4()),
                    order_id=order_id,
                    assignment_id=updated_assignment.assignment_id,
                    driver_id=updated_assignment.driver_id,
                    status=next_status,
                    driver_location=driver_location,
                    metadata={"source": "status_update"},
                    created_at=now,
                )
            )

            if next_status in {AssignmentStatus.DELIVERED, AssignmentStatus.CANCELLED} and driver:
                self._drivers[driver.driver_id] = driver.model_copy(
                    update={"status": DriverStatus.AVAILABLE, "updated_at": now}
                )

            return self.get_tracking(order_id)

    def _record_position_tracking(self, driver: Driver) -> None:
        now = utc_now()
        active_statuses = {
            AssignmentStatus.ASSIGNED,
            AssignmentStatus.PICKED_UP,
            AssignmentStatus.IN_TRANSIT,
        }
        for assignment in self._assignments.values():
            if assignment.driver_id != driver.driver_id or assignment.status not in active_statuses:
                continue
            event = TrackingEvent(
                event_id=str(uuid4()),
                order_id=assignment.order_id,
                assignment_id=assignment.assignment_id,
                driver_id=driver.driver_id,
                event_type="DRIVER_POSITION_UPDATED",
                message="Driver position updated.",
                location=driver.current_location,
                created_at=now,
            )
            self._events.setdefault(assignment.order_id, []).append(event)
            self._snapshots.setdefault(assignment.order_id, []).append(
                TrackingSnapshot(
                    snapshot_id=str(uuid4()),
                    order_id=assignment.order_id,
                    assignment_id=assignment.assignment_id,
                    driver_id=driver.driver_id,
                    status=assignment.status,
                    driver_location=driver.current_location,
                    metadata={"source": "driver_position"},
                    created_at=now,
                )
            )

    def _latest_snapshot(self, order_id: str) -> TrackingSnapshot | None:
        snapshots = self._snapshots.get(order_id, [])
        return snapshots[-1] if snapshots else None

    def _latest_route_estimate(self, order_id: str) -> RouteEstimate | None:
        estimates = [
            estimate for estimate in self._estimates.values() if estimate.order_id == order_id
        ]
        if not estimates:
            return None
        return max(estimates, key=lambda estimate: estimate.created_at)
