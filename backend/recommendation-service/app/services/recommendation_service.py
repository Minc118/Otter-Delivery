from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app import models
from app.config import Settings
from app.errors import InvalidInputError
from app.repositories import preferences as preference_repository
from app.repositories import recommendations as recommendation_repository
from app.schemas import (
    RecommendationFeedback,
    RecommendationFeedbackCreate,
    RecommendationHistory,
    RecommendationItem,
    RecommendationRequestCreate,
    RecommendationRequestRecord,
    RecommendationResponse,
    UserPreference,
    UserPreferencePayload,
)
from app.services.llm_provider import LLMRecommendationProvider, MockLLMRecommendationProvider
from app.services.restaurant_client import HttpRestaurantCatalogClient, RestaurantCatalogClient


class RecommendationService:
    def __init__(
        self,
        db: Session,
        settings: Settings,
        restaurant_client: RestaurantCatalogClient | None = None,
        llm_provider: LLMRecommendationProvider | None = None,
    ):
        self.db = db
        self.settings = settings
        self.restaurant_client = restaurant_client or HttpRestaurantCatalogClient(settings)
        self.llm_provider = llm_provider or MockLLMRecommendationProvider()

    def get_preference(self, user_id: str) -> UserPreference | None:
        preference = preference_repository.get_user_preference(self.db, user_id)
        if preference is None:
            return None
        return _preference_to_schema(preference)

    def upsert_preference(self, user_id: str, payload: UserPreferencePayload) -> UserPreference:
        preference = preference_repository.upsert_user_preference(self.db, user_id, payload)
        return _preference_to_schema(preference)

    def create_recommendations(self, payload: RecommendationRequestCreate) -> RecommendationResponse:
        stored_preference = preference_repository.get_user_preference(self.db, payload.user_id)
        stored_preferences = _preference_to_dict(stored_preference) if stored_preference else {}
        request_preferences = (
            payload.preferences.model_dump(mode="json") if payload.preferences is not None else {}
        )
        effective_preferences = _merge_preferences(stored_preferences, request_preferences)

        restaurants = self.restaurant_client.fetch_catalog()
        recommendations = self.llm_provider.recommend(
            user_id=payload.user_id,
            language=payload.language,
            free_text=payload.free_text,
            preferences=effective_preferences,
            restaurants=restaurants,
        )

        request, results = recommendation_repository.create_request_with_results(
            self.db,
            user_id=payload.user_id,
            language=payload.language,
            free_text=payload.free_text,
            request_preferences=request_preferences,
            stored_preferences=stored_preferences,
            restaurant_service_url=self.settings.restaurant_service_url,
            recommendations=recommendations,
        )

        return RecommendationResponse(
            request_id=request.id,
            user_id=payload.user_id,
            recommendations=[_result_to_schema(result) for result in results],
        )

    def get_history(self, user_id: str) -> RecommendationHistory | None:
        requests = recommendation_repository.get_history_by_user(self.db, user_id)
        if not requests:
            return None

        return RecommendationHistory(
            user_id=user_id,
            requests=[
                RecommendationRequestRecord(
                    request_id=request.id,
                    user_id=request.user_id,
                    language=request.language,
                    free_text=request.free_text,
                    request_preferences=request.request_preferences or {},
                    stored_preferences=request.stored_preferences or {},
                    created_at=request.created_at,
                    results=[_result_to_schema(result) for result in request.results],
                )
                for request in requests
            ],
        )

    def create_feedback(
        self,
        recommendation_result_id,
        payload: RecommendationFeedbackCreate,
    ) -> RecommendationFeedback | None:
        result = recommendation_repository.get_recommendation_result(self.db, recommendation_result_id)
        if result is None:
            return None
        if result.user_id != payload.user_id:
            raise InvalidInputError("Feedback userId must match the recommendation result owner.")

        feedback = recommendation_repository.create_feedback(
            self.db,
            recommendation_result_id=recommendation_result_id,
            user_id=payload.user_id,
            rating=payload.rating,
            feedback_type=payload.feedback_type,
            comment=payload.comment,
        )
        return RecommendationFeedback(
            id=feedback.id,
            recommendation_result_id=feedback.recommendation_result_id,
            user_id=feedback.user_id,
            rating=feedback.rating,
            feedback_type=feedback.feedback_type,
            comment=feedback.comment,
            created_at=feedback.created_at,
        )


def _merge_preferences(
    stored_preferences: dict[str, Any],
    request_preferences: dict[str, Any],
) -> dict[str, Any]:
    merged = dict(stored_preferences)
    for key, value in request_preferences.items():
        if value not in (None, [], {}):
            merged[key] = value
    return merged


def _preference_to_dict(preference: models.UserPreference) -> dict[str, Any]:
    return {
        "language": preference.language,
        "dietary_preferences": preference.dietary_preferences or [],
        "cuisine_preferences": preference.cuisine_preferences or [],
        "allergens": preference.allergens or [],
        "disliked_ingredients": preference.disliked_ingredients or [],
        "max_price": _number(preference.max_price),
        "metadata": preference.preference_metadata or {},
    }


def _preference_to_schema(preference: models.UserPreference) -> UserPreference:
    return UserPreference(
        user_id=preference.user_id,
        language=preference.language,
        dietary_preferences=preference.dietary_preferences or [],
        cuisine_preferences=preference.cuisine_preferences or [],
        allergens=preference.allergens or [],
        disliked_ingredients=preference.disliked_ingredients or [],
        max_price=_number(preference.max_price),
        metadata=preference.preference_metadata or {},
        created_at=preference.created_at,
        updated_at=preference.updated_at,
    )


def _result_to_schema(result: models.RecommendationResult) -> RecommendationItem:
    return RecommendationItem(
        recommendation_result_id=result.id,
        restaurant_id=result.restaurant_id,
        restaurant_name=result.restaurant_name,
        food_item_id=result.food_item_id,
        food_item_name=result.food_item_name,
        price=_number(result.price),
        currency=result.currency,
        reason=result.reason,
        tags=result.tags or [],
        score=_number(result.score),
    )


def _number(value):
    if isinstance(value, Decimal):
        return float(value)
    return value
