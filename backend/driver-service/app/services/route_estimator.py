from math import asin, ceil, cos, radians, sin, sqrt
from uuid import uuid4

from app.errors import NotFoundError
from app.models import EstimateRequest, EstimateResponse, Location, RouteEstimate
from app.repositories.base import DriverRepository
from app.repositories.memory_repository import utc_now


class MockRouteEstimator:
    def __init__(self, repository: DriverRepository, eta_minutes: int = 40) -> None:
        self.repository = repository
        self.eta_minutes = eta_minutes

    def estimate(self, request: EstimateRequest) -> EstimateResponse:
        drivers = self.repository.list_available_drivers()
        if not drivers:
            raise NotFoundError(
                "NO_AVAILABLE_DRIVER", "No available driver could be found."
            )
        driver = drivers[0]
        origin = request.pickup_location or driver.current_location
        duration_seconds = self.eta_minutes * 60
        estimate = RouteEstimate(
            estimate_id=str(uuid4()),
            order_id=request.order_id.strip() if request.order_id else None,
            driver_id=driver.driver_id,
            origin_location=origin,
            destination_location=request.customer_location,
            distance_meters=_distance_meters(origin, request.customer_location),
            duration_seconds=duration_seconds,
            provider="mock",
            created_at=utc_now(),
        )
        saved = self.repository.save_route_estimate(estimate)
        minutes = ceil(saved.duration_seconds / 60)
        return EstimateResponse(
            estimate=saved,
            driver=driver,
            estimated_delivery_time_minutes=minutes,
            eta_label=f"approx. {minutes} min",
        )


def _distance_meters(origin: Location, destination: Location) -> int:
    earth_radius = 6_371_000
    lat1, lat2 = radians(origin.lat), radians(destination.lat)
    delta_lat = radians(destination.lat - origin.lat)
    delta_lng = radians(destination.lng - origin.lng)
    value = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lng / 2) ** 2
    return round(earth_radius * 2 * asin(sqrt(value)))
