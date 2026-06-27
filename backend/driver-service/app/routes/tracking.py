from fastapi import APIRouter, Request

from app.models import TrackingResponse


router = APIRouter(prefix="/orders", tags=["tracking"])


@router.get("/{order_id}/tracking", response_model=TrackingResponse)
def order_tracking(order_id: str, request: Request) -> TrackingResponse:
    return request.app.state.repository.get_tracking(order_id.strip())
