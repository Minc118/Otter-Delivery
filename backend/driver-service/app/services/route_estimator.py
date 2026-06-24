from dataclasses import dataclass
from math import asin, ceil, cos, radians, sin, sqrt
from typing import Protocol
from uuid import uuid4

import httpx

from app.errors import NotFoundError
from app.models import Driver, EstimateRequest, EstimateResponse, Location, RouteEstimate
from app.repositories.base import DriverRepository
from app.repositories.memory_repository import utc_now


GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"


@dataclass(frozen=True)
class RouteResult:
    distance_meters: int
    duration_seconds: int
    provider: str
    route_points: list[Location]
    encoded_polyline: str | None = None


class RouteProvider(Protocol):
    def calculate(self, origin: Location, destination: Location) -> RouteResult: ...


class MockRouteProvider:
    def __init__(self, eta_minutes: int = 40) -> None:
        self.eta_minutes = eta_minutes

    def calculate(self, origin: Location, destination: Location) -> RouteResult:
        return RouteResult(
            distance_meters=_distance_meters(origin, destination),
            duration_seconds=self.eta_minutes * 60,
            provider="mock",
            route_points=_mock_route_points(origin, destination),
        )


class GoogleRoutesProvider:
    def __init__(self, api_key: str, client: httpx.Client | None = None) -> None:
        self._api_key = api_key
        self._client = client

    def calculate(self, origin: Location, destination: Location) -> RouteResult:
        request_body = {
            "origin": {"location": {"latLng": _google_lat_lng(origin)}},
            "destination": {"location": {"latLng": _google_lat_lng(destination)}},
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
            "computeAlternativeRoutes": False,
            "polylineQuality": "OVERVIEW",
            "polylineEncoding": "ENCODED_POLYLINE",
            "languageCode": "en-US",
            "units": "METRIC",
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self._api_key,
            "X-Goog-FieldMask": (
                "routes.distanceMeters,routes.duration,"
                "routes.polyline.encodedPolyline"
            ),
        }

        try:
            if self._client is not None:
                response = self._client.post(
                    GOOGLE_ROUTES_URL, json=request_body, headers=headers
                )
            else:
                response = httpx.post(
                    GOOGLE_ROUTES_URL,
                    json=request_body,
                    headers=headers,
                    timeout=5.0,
                )
            response.raise_for_status()
            route = response.json()["routes"][0]
            encoded_polyline = route["polyline"]["encodedPolyline"]
            route_points = decode_polyline(encoded_polyline)
            if len(route_points) < 2:
                raise ValueError("Google Routes returned insufficient route geometry.")
            return RouteResult(
                distance_meters=int(route["distanceMeters"]),
                duration_seconds=_duration_seconds(route["duration"]),
                provider="google_routes",
                route_points=route_points,
                encoded_polyline=encoded_polyline,
            )
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            raise RouteProviderError from exc


class RouteEstimator:
    def __init__(
        self,
        repository: DriverRepository,
        eta_minutes: int = 40,
        google_routes_api_key: str | None = None,
        google_client: httpx.Client | None = None,
    ) -> None:
        self.repository = repository
        self._fallback = MockRouteProvider(eta_minutes)
        self._primary = (
            GoogleRoutesProvider(google_routes_api_key, google_client)
            if google_routes_api_key
            else self._fallback
        )

    def estimate(self, request: EstimateRequest) -> EstimateResponse:
        driver = self._resolve_driver(request.order_id)
        origin = request.pickup_location or driver.current_location
        try:
            route = self._primary.calculate(origin, request.customer_location)
        except RouteProviderError:
            route = self._fallback.calculate(origin, request.customer_location)
        estimate = RouteEstimate(
            estimate_id=str(uuid4()),
            order_id=request.order_id.strip() if request.order_id else None,
            driver_id=driver.driver_id,
            origin_location=origin,
            destination_location=request.customer_location,
            distance_meters=route.distance_meters,
            duration_seconds=route.duration_seconds,
            provider=route.provider,
            route_points=route.route_points,
            encoded_polyline=route.encoded_polyline,
            created_at=utc_now(),
        )
        saved = self.repository.save_route_estimate(estimate)
        saved = saved.model_copy(
            update={
                "route_points": route.route_points,
                "encoded_polyline": route.encoded_polyline,
            }
        )
        minutes = ceil(saved.duration_seconds / 60)
        return EstimateResponse(
            estimate=saved,
            driver=driver,
            estimated_delivery_time_minutes=minutes,
            eta_label=f"approx. {minutes} min",
        )

    def _resolve_driver(self, order_id: str | None) -> Driver:
        if order_id and order_id.strip():
            try:
                tracking = self.repository.get_tracking(order_id.strip())
                if tracking.assignment is not None:
                    return self.repository.get_driver(tracking.assignment.driver_id)
            except NotFoundError:
                pass

        drivers = self.repository.list_available_drivers()
        if not drivers:
            raise NotFoundError(
                "NO_AVAILABLE_DRIVER", "No available driver could be found."
            )
        return drivers[0]


class RouteProviderError(Exception):
    pass


# Kept as a compatibility alias for existing imports.
MockRouteEstimator = RouteEstimator


def _distance_meters(origin: Location, destination: Location) -> int:
    earth_radius = 6_371_000
    lat1, lat2 = radians(origin.lat), radians(destination.lat)
    delta_lat = radians(destination.lat - origin.lat)
    delta_lng = radians(destination.lng - origin.lng)
    value = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lng / 2) ** 2
    return round(earth_radius * 2 * asin(sqrt(value)))


def _mock_route_points(origin: Location, destination: Location) -> list[Location]:
    points = []
    for index in range(7):
        progress = index / 6
        curve = sin(progress * 3.141592653589793) * 0.0015
        points.append(
            Location(
                lat=origin.lat + (destination.lat - origin.lat) * progress + curve,
                lng=origin.lng + (destination.lng - origin.lng) * progress - curve / 2,
            )
        )
    points[0] = origin
    points[-1] = destination
    return points


def _google_lat_lng(location: Location) -> dict[str, float]:
    return {"latitude": location.lat, "longitude": location.lng}


def _duration_seconds(value: str) -> int:
    if not value.endswith("s"):
        raise ValueError("Invalid Google Routes duration.")
    return max(1, ceil(float(value[:-1])))


def decode_polyline(encoded: str) -> list[Location]:
    points: list[Location] = []
    index = 0
    latitude = 0
    longitude = 0

    while index < len(encoded):
        latitude_change, index = _decode_polyline_value(encoded, index)
        longitude_change, index = _decode_polyline_value(encoded, index)
        latitude += latitude_change
        longitude += longitude_change
        points.append(Location(lat=latitude / 100_000, lng=longitude / 100_000))
    return points


def _decode_polyline_value(encoded: str, index: int) -> tuple[int, int]:
    result = 0
    shift = 0
    while True:
        if index >= len(encoded):
            raise ValueError("Invalid encoded polyline.")
        value = ord(encoded[index]) - 63
        index += 1
        result |= (value & 0x1F) << shift
        shift += 5
        if value < 0x20:
            break
    decoded = ~(result >> 1) if result & 1 else result >> 1
    return decoded, index
