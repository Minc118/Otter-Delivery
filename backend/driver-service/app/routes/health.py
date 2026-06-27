from fastapi import APIRouter, Request

from app.models import HealthResponse


router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="driver-service",
        repository_mode=request.app.state.repository.mode,
    )
