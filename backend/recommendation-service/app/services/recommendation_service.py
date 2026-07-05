from decimal import Decimal
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app import models
from app.config import Settings
from app.errors import InvalidInputError, LLMProviderError
from app.repositories import memory_store
from app.repositories import preferences as preference_repository
from app.repositories import recommendations as recommendation_repository
from app.schemas import (
    FeedbackCreateRequest,
    FeedbackCreateResponse,
    RecommendationFeedback,
    RecommendationFeedbackCreate,
    RecommendationEventCreate,
    RecommendationEventResponse,
    RecommendationHistory,
    RecommendationItem,
    RecommendationRequestCreate,
    RecommendationRequestRecord,
    RecommendationResponse,
    RestaurantRecommendationRequest,
    RestaurantRecommendationResponse,
    RestaurantRecommendationItem,
    UserPreference,
    UserPreferencePayload,
)
from app.services.llm_provider import (
    GeminiLanguageNormalizer,
    GeminiReranker,
    LLMRecommendationProvider,
    MockLLMRecommendationProvider,
)
from app.services.multilingual import (
    NormalizedRecommendationInput,
    localize_candidate_reasons,
    normalize_recommendation_input,
)
from app.services.order_client import HttpOrderClient, OrderClient
from app.services.restaurant_client import HttpRestaurantCatalogClient, RestaurantCatalogClient
from app.services.scoring import ScoredCandidate, score_restaurants


class RecommendationService:
    def __init__(
        self,
        db: Session | None,
        settings: Settings,
        restaurant_client: RestaurantCatalogClient | None = None,
        llm_provider: LLMRecommendationProvider | None = None,
        order_client: OrderClient | None = None,
    ):
        self.db = db
        self.settings = settings
        self.restaurant_client = restaurant_client or HttpRestaurantCatalogClient(settings)
        self.llm_provider = llm_provider or MockLLMRecommendationProvider()
        self.gemini_language_normalizer = GeminiLanguageNormalizer(settings)
        self.gemini_reranker = GeminiReranker(settings)
        self.order_client = order_client or HttpOrderClient(settings)


    def get_preference(self, user_id: str) -> UserPreference | None:
        if self.db is None:
            memory_preference = memory_store.get_preference(user_id)
            return _memory_preference_to_schema(memory_preference) if memory_preference else None

        preference = preference_repository.get_user_preference(self.db, user_id)
        if preference is None:
            return None
        return _preference_to_schema(preference)

    def upsert_preference(self, user_id: str, payload: UserPreferencePayload) -> UserPreference:
        if self.db is None:
            record = memory_store.save_preference(user_id, payload.model_dump(mode="json"))
            return _memory_preference_to_schema(record)

        preference = preference_repository.upsert_user_preference(self.db, user_id, payload)
        return _preference_to_schema(preference)

    def create_recommendations(self, payload: RecommendationRequestCreate) -> RecommendationResponse:
        stored_preferences = self._stored_preferences(payload.user_id)
        request_preferences = (
            payload.preferences.model_dump(mode="json") if payload.preferences is not None else {}
        )
        effective_preferences = _merge_preferences(stored_preferences, request_preferences)
        normalized = self._normalize_input(
            query=payload.free_text,
            preferences=effective_preferences,
            language_hint=payload.language,
        )

        restaurants = self.restaurant_client.fetch_catalog()
        candidates = score_restaurants(
            user_id=payload.user_id,
            query=normalized.canonical_query,
            preferences=normalized.canonical_preferences,
            restaurants=restaurants,
            limit=5,
        )
        candidates = self._generate_explanations(candidates, normalized)
        recommendations = [candidate.to_legacy_result() for candidate in candidates]

        if self.db is None:
            request_id = uuid4()
            memory_store.save_history(
                {
                    "request_id": str(request_id),
                    "user_id": payload.user_id,
                    "language": normalized.original_language,
                    "query": payload.free_text,
                    "preferences": request_preferences,
                    "normalized_intent": _normalized_intent_snapshot(normalized),
                    "recommended_restaurants": [item.to_public_dict() for item in candidates],
                    "source": "fallback",
                }
            )
            return RecommendationResponse(
                request_id=request_id,
                user_id=payload.user_id,
                recommendations=[
                    RecommendationItem(
                        recommendation_result_id=uuid4(),
                        restaurant_id=item.restaurant_id,
                        restaurant_name=item.restaurant_name,
                        food_item_id=item.menu_item_ids[0] if item.menu_item_ids else item.restaurant_id,
                        food_item_name=item.recommended_items[0] if item.recommended_items else item.restaurant_name,
                        reason=item.reason,
                        tags=item.matched_factors,
                        score=item.recommendation_score,
                    )
                    for item in candidates
                ],
            )

        request, results = self._persist_request_results(
            user_id=payload.user_id,
            language=normalized.original_language,
            query=payload.free_text,
            request_preferences=request_preferences,
            stored_preferences=stored_preferences,
            normalized_intent=_normalized_intent_snapshot(normalized),
            recommendations=recommendations,
        )

        return RecommendationResponse(
            request_id=request.id,
            user_id=payload.user_id,
            recommendations=[_result_to_schema(result) for result in results],
        )

    def create_restaurant_recommendations(
        self,
        payload: RestaurantRecommendationRequest,
    ) -> RestaurantRecommendationResponse:
        stored_preferences = self._stored_preferences(payload.user_id)
        request_preferences = payload.preferences.model_dump(mode="json")
        effective_preferences = _merge_preferences(stored_preferences, request_preferences)

        normalized = self._normalize_input(
            query=payload.query,
            preferences=effective_preferences,
            language_hint=str(stored_preferences.get("language") or "") or None,
        )

        order_history = self.order_client.get_order_history(payload.user_id)
        history_by_restaurant = _history_by_restaurant(order_history)

        restaurants = self.restaurant_client.fetch_catalog()
        catalog_fallback = bool(getattr(self.restaurant_client, "used_fallback", False))
        candidates = score_restaurants(
            history_by_restaurant=history_by_restaurant,
            user_id=payload.user_id,
            query=normalized.canonical_query,
            preferences=normalized.canonical_preferences,
            restaurants=restaurants,
            feedback_by_restaurant=self._feedback_by_restaurant(payload.user_id),
            limit=20,
        )

        source = "fallback"
        final_candidates = self._generate_explanations(candidates, normalized)
        if any(candidate.source == "gemini" for candidate in final_candidates):
            source = "hybrid"

        public_candidates = final_candidates[:6]
        if catalog_fallback and source == "fallback":
            source = "fallback"

        request_id = self._store_recommendation_run(
            user_id=payload.user_id,
            query=payload.query,
            language=normalized.original_language,
            request_preferences=request_preferences,
            stored_preferences=stored_preferences,
            normalized_intent=_normalized_intent_snapshot(normalized),
            candidates=public_candidates,
            source=source,
        )

        return RestaurantRecommendationResponse(
            request_id=request_id,
            recommendations=[
                RestaurantRecommendationItem(**candidate.to_public_dict())
                for candidate in public_candidates
            ],
            source=source,
        )

    def _normalize_input(
        self,
        *,
        query: str | None,
        preferences: dict[str, Any],
        language_hint: str | None,
    ) -> NormalizedRecommendationInput:
        deterministic = normalize_recommendation_input(
            query=query,
            preferences=preferences,
            language_hint=language_hint,
        )
        if not self.gemini_language_normalizer.enabled:
            return deterministic
        try:
            return self.gemini_language_normalizer.normalize(
                query=query,
                preferences=preferences,
                language_hint=deterministic.original_language,
            )
        except LLMProviderError:
            return deterministic

    def _generate_explanations(
        self,
        candidates: list[ScoredCandidate],
        normalized: NormalizedRecommendationInput,
    ) -> list[ScoredCandidate]:
        final_candidates = candidates
        if self.gemini_reranker.enabled:
            try:
                final_candidates = self.gemini_reranker.rerank(
                    query=normalized.canonical_query,
                    original_query=normalized.original_query,
                    target_language=normalized.original_language,
                    preferences=normalized.canonical_preferences,
                    candidates=candidates,
                )
            except LLMProviderError:
                final_candidates = candidates
        return localize_candidate_reasons(final_candidates, normalized.original_language)

    def get_history(self, user_id: str) -> RecommendationHistory | None:
        if self.db is None:
            return None

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
                    normalized_intent=request.normalized_intent or {},
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
        if self.db is None:
            return None

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

    def create_mvp_feedback(self, payload: FeedbackCreateRequest) -> FeedbackCreateResponse:
        recommendation_result_id = payload.recommendation_id
        if self.db is not None:
            try:
                if recommendation_result_id is not None:
                    result = recommendation_repository.get_recommendation_result(
                        self.db,
                        recommendation_result_id,
                    )
                    if result is None:
                        recommendation_result_id = None
                feedback = recommendation_repository.create_loose_feedback(
                    self.db,
                    recommendation_result_id=recommendation_result_id,
                    user_id=payload.user_id,
                    restaurant_id=payload.restaurant_id,
                    feedback_type=payload.feedback_type,
                    comment=payload.comment,
                )
                return FeedbackCreateResponse(
                    id=feedback.id,
                    user_id=feedback.user_id,
                    recommendation_id=feedback.recommendation_result_id,
                    restaurant_id=feedback.restaurant_id,
                    feedback_type=feedback.feedback_type or payload.feedback_type,
                    comment=feedback.comment,
                    stored=True,
                )
            except SQLAlchemyError:
                pass

        stored = memory_store.save_feedback(payload.model_dump(mode="json"))
        return FeedbackCreateResponse(
            id=stored["id"],
            user_id=payload.user_id,
            recommendation_id=payload.recommendation_id,
            restaurant_id=payload.restaurant_id,
            feedback_type=payload.feedback_type,
            comment=payload.comment,
            stored=False,
        )

    def create_recommendation_event(
        self,
        payload: RecommendationEventCreate,
    ) -> RecommendationEventResponse:
        request_id = _parse_uuid(payload.request_id)
        if self.db is not None:
            try:
                event = recommendation_repository.create_recommendation_event(
                    self.db,
                    request_id=request_id,
                    profile_id=payload.profile_id,
                    restaurant_id=payload.restaurant_id,
                    event_type=payload.event_type,
                    order_id=payload.order_id,
                    metadata=payload.metadata,
                )
                return RecommendationEventResponse(id=event.id, stored=True)
            except SQLAlchemyError:
                pass

        stored = memory_store.save_recommendation_event(
            {
                "request_id": str(payload.request_id) if payload.request_id else None,
                "profile_id": payload.profile_id,
                "restaurant_id": payload.restaurant_id,
                "event_type": payload.event_type,
                "order_id": payload.order_id,
                "metadata": payload.metadata,
            }
        )
        return RecommendationEventResponse(id=stored["id"], stored=False)

    def _stored_preferences(self, user_id: str) -> dict[str, Any]:
        if self.db is None:
            preference = memory_store.get_preference(user_id)
            return _memory_preference_to_dict(preference) if preference else {}

        try:
            stored_preference = preference_repository.get_user_preference(self.db, user_id)
        except SQLAlchemyError:
            return {}
        return _preference_to_dict(stored_preference) if stored_preference else {}

    def _feedback_by_restaurant(self, user_id: str) -> dict[str, str]:
        feedback: dict[str, str] = {}
        for record in memory_store.FEEDBACK:
            if record.get("user_id") == user_id and record.get("restaurant_id"):
                feedback[str(record["restaurant_id"])] = str(record.get("feedback_type") or "")
        return feedback

    def _persist_request_results(
        self,
        *,
        user_id: str,
        language: str,
        query: str | None,
        request_preferences: dict[str, Any],
        stored_preferences: dict[str, Any],
        normalized_intent: dict[str, Any],
        recommendations: list[dict[str, Any]],
    ):
        return recommendation_repository.create_request_with_results(
            self.db,
            user_id=user_id,
            language=language,
            free_text=query,
            request_preferences=request_preferences,
            stored_preferences=stored_preferences,
            normalized_intent=normalized_intent,
            restaurant_service_url=self.settings.restaurant_service_url,
            recommendations=recommendations,
        )

    def _store_recommendation_run(
        self,
        *,
        user_id: str,
        query: str | None,
        language: str,
        request_preferences: dict[str, Any],
        stored_preferences: dict[str, Any],
        normalized_intent: dict[str, Any],
        candidates: list[ScoredCandidate],
        source: str,
    ) -> UUID | str:
        legacy_results = [candidate.to_legacy_result() for candidate in candidates]
        request_id: UUID | str = uuid4()
        if self.db is not None:
            try:
                request, _ = self._persist_request_results(
                    user_id=user_id,
                    language=language,
                    query=query,
                    request_preferences=request_preferences,
                    stored_preferences=stored_preferences,
                    normalized_intent=normalized_intent,
                    recommendations=legacy_results,
                )
                request_id = request.id
                recommendation_repository.create_training_events(
                    self.db,
                    request_id=request_id,
                    user_id=user_id,
                    query=query,
                    source=source,
                    events=[
                        candidate.to_training_event(user_id, query, source)
                        for candidate in candidates
                    ],
                )
                return request_id
            except SQLAlchemyError:
                pass

        memory_store.save_history(
            {
                "request_id": str(request_id),
                "user_id": user_id,
                "language": language,
                "query": query,
                "preferences": request_preferences,
                "normalized_intent": normalized_intent,
                "recommended_restaurants": [candidate.to_public_dict() for candidate in candidates],
                "source": source,
            }
        )
        memory_store.save_training_events(
            [
                candidate.to_training_event(user_id, query, source)
                for candidate in candidates
            ]
        )
        return request_id


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


def _memory_preference_to_dict(preference: dict[str, Any] | None) -> dict[str, Any]:
    if not preference:
        return {}
    return {
        "language": preference.get("language", "en"),
        "dietary_preferences": preference.get("dietary_preferences", []),
        "cuisine_preferences": preference.get("cuisine_preferences", []),
        "allergens": preference.get("allergens", []),
        "disliked_ingredients": preference.get("disliked_ingredients", []),
        "max_price": preference.get("max_price"),
        "metadata": preference.get("metadata", {}),
    }


def _memory_preference_to_schema(preference: dict[str, Any]) -> UserPreference:
    created_at = _parse_datetime(preference.get("created_at"))
    updated_at = _parse_datetime(preference.get("updated_at"))
    return UserPreference(
        user_id=preference["user_id"],
        language=preference.get("language", "en"),
        dietary_preferences=preference.get("dietary_preferences", []),
        cuisine_preferences=preference.get("cuisine_preferences", []),
        allergens=preference.get("allergens", []),
        disliked_ingredients=preference.get("disliked_ingredients", []),
        max_price=preference.get("max_price"),
        metadata=preference.get("metadata", {}),
        created_at=created_at,
        updated_at=updated_at,
    )


def _parse_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    return datetime.utcnow()


def _normalized_intent_snapshot(
    normalized: NormalizedRecommendationInput,
) -> dict[str, Any]:
    return {
        "original_query": normalized.original_query,
        "canonical_query": normalized.canonical_query,
        "original_language": normalized.original_language,
        "canonical_preferences": normalized.canonical_preferences,
    }


def _parse_uuid(value: UUID | str | None) -> UUID | None:
    if value is None:
        return None
    if isinstance(value, UUID):
        return value
    try:
        return UUID(str(value))
    except ValueError:
        return None


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

def _history_by_restaurant(
        orders: list[dict[str, Any]],
) -> dict[str, int]:
    history: dict[str, int] = {}

    for order in orders:
        restaurant_id = order.get("restaurantId")

        if restaurant_id is None:
            continue

        key = str(restaurant_id)
        history[key] = history.get(key, 0) + 1

    return history
