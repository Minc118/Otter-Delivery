from fastapi import APIRouter, Request, status

from app.models import (
    AssignDriverRequest,
    AssignDriverResponse,
    AvailableDriversResponse,
    Driver,
    DriverLocationResponse,
    EstimateRequest,
    EstimateResponse,
    UpdatePositionRequest,
)
from app.services.assignment_service import AssignmentService
from app.services.route_estimator import RouteEstimator


router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("/available", response_model=AvailableDriversResponse)
def available_drivers(request: Request) -> AvailableDriversResponse:
    return AvailableDriversResponse(
        drivers=request.app.state.repository.list_available_drivers()
    )


@router.get("/{driver_id}", response_model=Driver)
def get_driver(driver_id: str, request: Request) -> Driver:
    return request.app.state.repository.get_driver(driver_id.strip())


@router.get("/{driver_id}/location", response_model=DriverLocationResponse)
def get_driver_location(driver_id: str, request: Request) -> DriverLocationResponse:
    driver = request.app.state.repository.get_driver(driver_id.strip())
    return DriverLocationResponse(
        driver_id=driver.driver_id,
        status=driver.status,
        location=driver.current_location,
        updated_at=driver.last_position_at,
    )


@router.patch("/{driver_id}/position", response_model=Driver)
def update_driver_position(
    driver_id: str, payload: UpdatePositionRequest, request: Request
) -> Driver:
    return request.app.state.repository.update_driver_position(
        driver_id.strip(), payload.effective_location()
    )


@router.post(
    "/assign", response_model=AssignDriverResponse, status_code=status.HTTP_201_CREATED
)
def assign_driver(payload: AssignDriverRequest, request: Request) -> AssignDriverResponse:
    return AssignmentService(request.app.state.repository).assign(payload)


@router.post("/estimate", response_model=EstimateResponse)
def estimate(payload: EstimateRequest, request: Request) -> EstimateResponse:
    return RouteEstimator(
        request.app.state.repository,
        request.app.state.settings.eta_minutes,
        request.app.state.settings.google_routes_api_key,
    ).estimate(payload)
