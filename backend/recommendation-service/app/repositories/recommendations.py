from typing import Any
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app import models


def create_request_with_results(
    db: Session,
    *,
    user_id: str,
    language: str,
    free_text: str | None,
    request_preferences: dict[str, Any],
    stored_preferences: dict[str, Any],
    restaurant_service_url: str,
    recommendations: list[dict[str, Any]],
) -> tuple[models.RecommendationRequest, list[models.RecommendationResult]]:
    request = models.RecommendationRequest(
        user_id=user_id,
        language=language,
        free_text=free_text,
        request_preferences=request_preferences,
        stored_preferences=stored_preferences,
        restaurant_service_url=restaurant_service_url,
    )
    db.add(request)
    db.flush()

    results: list[models.RecommendationResult] = []
    for index, recommendation in enumerate(recommendations, start=1):
        result = models.RecommendationResult(
            request_id=request.id,
            user_id=user_id,
            restaurant_id=recommendation["restaurant_id"],
            restaurant_name=recommendation["restaurant_name"],
            food_item_id=recommendation["food_item_id"],
            food_item_name=recommendation["food_item_name"],
            price=recommendation.get("price"),
            currency=recommendation.get("currency", "EUR"),
            reason=recommendation["reason"],
            score=recommendation.get("score", recommendation.get("recommendation_score")),
            tags=recommendation.get("tags", []),
            result_metadata=recommendation.get("metadata", {}),
            rank=index,
        )
        db.add(result)
        results.append(result)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(request)
    for result in results:
        db.refresh(result)

    return request, results


def get_recommendation_result(
    db: Session,
    recommendation_result_id: UUID,
) -> models.RecommendationResult | None:
    return db.get(models.RecommendationResult, recommendation_result_id)


def get_history_by_user(
    db: Session,
    user_id: str,
    limit: int = 20,
) -> list[models.RecommendationRequest]:
    statement: Select[tuple[models.RecommendationRequest]] = (
        select(models.RecommendationRequest)
        .where(models.RecommendationRequest.user_id == user_id)
        .options(selectinload(models.RecommendationRequest.results))
        .order_by(models.RecommendationRequest.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(statement).all())


def create_feedback(
    db: Session,
    *,
    recommendation_result_id: UUID,
    user_id: str,
    rating: int | None,
    feedback_type: str | None,
    comment: str | None,
    restaurant_id: str | None = None,
) -> models.RecommendationFeedback:
    feedback = models.RecommendationFeedback(
        recommendation_result_id=recommendation_result_id,
        user_id=user_id,
        restaurant_id=restaurant_id,
        rating=rating,
        feedback_type=feedback_type,
        comment=comment,
    )
    db.add(feedback)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(feedback)
    return feedback


def create_loose_feedback(
    db: Session,
    *,
    recommendation_result_id: UUID | None,
    user_id: str,
    restaurant_id: str | None,
    feedback_type: str,
    comment: str | None,
) -> models.RecommendationFeedback:
    feedback = models.RecommendationFeedback(
        recommendation_result_id=recommendation_result_id,
        user_id=user_id,
        restaurant_id=restaurant_id,
        feedback_type=feedback_type,
        comment=comment,
    )
    db.add(feedback)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(feedback)
    return feedback


def create_training_events(
    db: Session,
    *,
    request_id: UUID | None,
    user_id: str,
    query: str | None,
    source: str,
    events: list[dict[str, Any]],
) -> list[models.RecommendationTrainingEvent]:
    rows: list[models.RecommendationTrainingEvent] = []
    for event in events:
        row = models.RecommendationTrainingEvent(
            request_id=request_id,
            user_id=user_id,
            query=query,
            candidate_restaurant_id=event["candidate_restaurant_id"],
            recommendation_score=event["recommendation_score"],
            completion_score=event["completion_score"],
            training_loss_proxy=event["training_loss_proxy"],
            matched_factors=event.get("matched_factors", []),
            negative_factors=event.get("negative_factors", []),
            feature_snapshot=event.get("feature_snapshot", {}),
            source=source,
        )
        db.add(row)
        rows.append(row)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    for row in rows:
        db.refresh(row)
    return rows
