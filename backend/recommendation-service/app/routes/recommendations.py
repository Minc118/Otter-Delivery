from fastapi import APIRouter

from app.models.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
)
from app.services.recommendation_engine import get_recommendations

router = APIRouter()


@router.post("/recommendations", response_model=RecommendationResponse)
def recommendations(request: RecommendationRequest) -> RecommendationResponse:
    return RecommendationResponse(
        recommendations=get_recommendations(request),
    )
