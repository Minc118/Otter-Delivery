from fastapi import APIRouter, Request

from app.models import TrackingResponse, UpdateTrackingStatusRequest


router = APIRouter(prefix="/orders", tags=["tracking"])


@router.get("/{order_id}/tracking", response_model=TrackingResponse)
def order_tracking(order_id: str, request: Request) -> TrackingResponse:
    return request.app.state.repository.get_tracking(order_id.strip())


@router.patch("/{order_id}/tracking/status", response_model=TrackingResponse)
def update_order_tracking_status(
    order_id: str, payload: UpdateTrackingStatusRequest, request: Request
) -> TrackingResponse:
    return request.app.state.repository.update_assignment_status(
        order_id.strip(),
        payload.status.value,
        payload.message,
    )
