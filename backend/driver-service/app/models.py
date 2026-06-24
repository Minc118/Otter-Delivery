from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class APIModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class DriverStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    ON_DELIVERY = "ON_DELIVERY"
    OFFLINE = "OFFLINE"


class AssignmentStatus(StrEnum):
    ASSIGNED = "ASSIGNED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Location(APIModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class Driver(APIModel):
    driver_id: str
    name: str
    status: DriverStatus
    current_location: Location
    last_position_at: datetime
    created_at: datetime
    updated_at: datetime


class DriverLocationResponse(APIModel):
    driver_id: str
    status: DriverStatus
    location: Location
    updated_at: datetime


class DeliveryAssignment(APIModel):
    assignment_id: str
    order_id: str
    driver_id: str
    status: AssignmentStatus
    assigned_at: datetime
    picked_up_at: datetime | None = None
    delivered_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TrackingEvent(APIModel):
    event_id: str
    order_id: str
    assignment_id: str | None = None
    driver_id: str | None = None
    event_type: str
    message: str | None = None
    location: Location | None = None
    created_at: datetime


class RouteEstimate(APIModel):
    estimate_id: str
    order_id: str | None = None
    driver_id: str
    origin_location: Location
    destination_location: Location
    distance_meters: int = Field(ge=0)
    duration_seconds: int = Field(gt=0)
    provider: str
    route_points: list[Location] = Field(default_factory=list)
    encoded_polyline: str | None = None
    created_at: datetime


class AvailableDriversResponse(APIModel):
    drivers: list[Driver]


class UpdatePositionRequest(APIModel):
    location: Location | None = None
    lat: float | None = None
    lng: float | None = None

    @model_validator(mode="after")
    def validate_position(self) -> "UpdatePositionRequest":
        if self.location is not None:
            return self
        if self.lat is None or self.lng is None:
            raise ValueError("Position must include a valid latitude and longitude.")
        Location(lat=self.lat, lng=self.lng)
        return self

    def effective_location(self) -> Location:
        return self.location or Location(lat=self.lat, lng=self.lng)


class AssignDriverRequest(APIModel):
    order_id: str = Field(min_length=1)
    driver_id: str | None = None


class AssignDriverResponse(APIModel):
    assignment: DeliveryAssignment
    driver: Driver


class EstimateRequest(APIModel):
    order_id: str | None = None
    restaurant_id: str | None = None
    pickup_location: Location | None = None
    customer_location: Location


class EstimateResponse(APIModel):
    estimate: RouteEstimate
    driver: Driver
    estimated_delivery_time_minutes: int
    eta_label: str


class TrackingResponse(APIModel):
    order_id: str
    assignment: DeliveryAssignment | None = None
    events: list[TrackingEvent]


class HealthResponse(APIModel):
    status: str
    service: str
    repository_mode: str
