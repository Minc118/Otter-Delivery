from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.schemas import (
    FeedbackCreateRequest,
    FeedbackCreateResponse,
    RecommendationEventCreate,
    RecommendationEventResponse,
    RecommendationFeedback,
    RecommendationFeedbackCreate,
    RecommendationHistory,
    RecommendationRequestCreate,
    RecommendationResponse,
    RestaurantRecommendationRequest,
    RestaurantRecommendationResponse,
)
from app.services.recommendation_service import RecommendationService

router = APIRouter(tags=["recommendations"])


@router.post("/recommendations", response_model=RecommendationResponse)
def create_recommendations(
    payload: RecommendationRequestCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RecommendationResponse:
    service = RecommendationService(db, settings)
    return service.create_recommendations(payload)


@router.post("/recommendations/restaurants", response_model=RestaurantRecommendationResponse)
def create_restaurant_recommendations(
    payload: RestaurantRecommendationRequest,
    db: Session | None = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RestaurantRecommendationResponse:
    service = RecommendationService(db, settings)
    return service.create_restaurant_recommendations(payload)


@router.post("/feedback", response_model=FeedbackCreateResponse)
def create_feedback(
    payload: FeedbackCreateRequest,
    db: Session | None = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> FeedbackCreateResponse:
    service = RecommendationService(db, settings)
    return service.create_mvp_feedback(payload)


@router.post("/recommendations/events", response_model=RecommendationEventResponse)
def create_recommendation_event(
    payload: RecommendationEventCreate,
    db: Session | None = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RecommendationEventResponse:
    service = RecommendationService(db, settings)
    return service.create_recommendation_event(payload)


@router.get("/recommendations/history/{userId}", response_model=RecommendationHistory)
def get_recommendation_history(
    userId: str = Path(..., min_length=1),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RecommendationHistory:
    service = RecommendationService(db, settings)
    history = service.get_history(userId)
    if history is None:
        raise HTTPException(status_code=404, detail="Recommendation history not found.")
    return history


@router.post(
    "/recommendations/{recommendationResultId}/feedback",
    response_model=RecommendationFeedback,
    status_code=status.HTTP_201_CREATED,
)
def create_recommendation_feedback(
    payload: RecommendationFeedbackCreate,
    recommendationResultId: UUID = Path(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RecommendationFeedback:
    service = RecommendationService(db, settings)
    feedback = service.create_feedback(recommendationResultId, payload)
    if feedback is None:
        raise HTTPException(status_code=404, detail="Recommendation result not found.")
    return feedback
