from typing import Protocol

from app.models import (
    DeliveryAssignment,
    Driver,
    Location,
    RouteEstimate,
    TrackingSnapshot,
    TrackingResponse,
)


class DriverRepository(Protocol):
    mode: str

    def list_available_drivers(self) -> list[Driver]: ...

    def get_driver(self, driver_id: str) -> Driver: ...

    def update_driver_position(self, driver_id: str, location: Location) -> Driver: ...

    def assign_driver(
        self, order_id: str, driver_id: str | None = None
    ) -> tuple[DeliveryAssignment, Driver, bool]: ...

    def get_tracking(self, order_id: str) -> TrackingResponse: ...

    def save_route_estimate(self, estimate: RouteEstimate) -> RouteEstimate: ...

    def update_assignment_status(
        self, order_id: str, status: str, message: str | None = None
    ) -> TrackingResponse: ...
