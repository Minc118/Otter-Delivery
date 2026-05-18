from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.schemas import UserPreference, UserPreferencePayload
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("/{userId}", response_model=UserPreference)
def get_preferences(
    userId: str = Path(..., min_length=1),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserPreference:
    service = RecommendationService(db, settings)
    preference = service.get_preference(userId)
    if preference is None:
        raise HTTPException(status_code=404, detail="User preference not found.")
    return preference


@router.put("/{userId}", response_model=UserPreference)
def put_preferences(
    payload: UserPreferencePayload,
    userId: str = Path(..., min_length=1),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserPreference:
    service = RecommendationService(db, settings)
    return service.upsert_preference(userId, payload)
