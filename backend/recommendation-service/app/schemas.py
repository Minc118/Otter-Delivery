from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserPreferencePayload(ApiModel):
    language: str = Field(default="en", min_length=2, max_length=16)
    dietary_preferences: list[str] = Field(default_factory=list)
    cuisine_preferences: list[str] = Field(default_factory=list)
    allergens: list[str] = Field(default_factory=list)
    disliked_ingredients: list[str] = Field(default_factory=list)
    max_price: float | None = Field(default=None, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class UserPreference(ApiModel):
    user_id: str
    language: str
    dietary_preferences: list[str]
    cuisine_preferences: list[str]
    allergens: list[str]
    disliked_ingredients: list[str]
    max_price: float | None
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class RecommendationRequestCreate(ApiModel):
    user_id: str = Field(..., min_length=1, max_length=128)
    language: str = Field(default="en", min_length=2, max_length=16)
    preferences: UserPreferencePayload | None = None
    free_text: str | None = Field(default=None, min_length=1, max_length=2000)
    query: str | None = Field(default=None, min_length=1, max_length=2000)

    @model_validator(mode="after")
    def copy_legacy_query(self) -> "RecommendationRequestCreate":
        if self.free_text is None and self.query is not None:
            self.free_text = self.query
        return self


class RecommendationItem(ApiModel):
    recommendation_result_id: UUID
    restaurant_id: str
    restaurant_name: str
    food_item_id: str
    food_item_name: str
    price: float | None = None
    currency: str = "EUR"
    reason: str
    tags: list[str] = Field(default_factory=list)
    score: float | None = None


class RecommendationResponse(ApiModel):
    request_id: UUID
    user_id: str
    recommendations: list[RecommendationItem]


class RecommendationRequestRecord(ApiModel):
    request_id: UUID
    user_id: str
    language: str
    free_text: str | None
    request_preferences: dict[str, Any]
    stored_preferences: dict[str, Any]
    created_at: datetime
    results: list[RecommendationItem]


class RecommendationHistory(ApiModel):
    user_id: str
    requests: list[RecommendationRequestRecord]


class RecommendationFeedbackCreate(ApiModel):
    user_id: str = Field(..., min_length=1, max_length=128)
    rating: int | None = Field(default=None, ge=1, le=5)
    feedback_type: Literal["like", "dislike", "not_relevant", "ordered", "other"] | None = None
    comment: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def require_feedback_signal(self) -> "RecommendationFeedbackCreate":
        if self.rating is None and self.feedback_type is None and not self.comment:
            raise ValueError("Provide rating, feedbackType, or comment.")
        return self


class RecommendationFeedback(ApiModel):
    id: UUID
    recommendation_result_id: UUID
    user_id: str
    rating: int | None
    feedback_type: str | None
    comment: str | None
    created_at: datetime


class ErrorBody(ApiModel):
    code: str
    message: str


class ErrorResponse(ApiModel):
    error: ErrorBody
