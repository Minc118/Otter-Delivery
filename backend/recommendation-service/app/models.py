import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class UserPreference(TimestampMixin, Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="en")
    dietary_preferences: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    cuisine_preferences: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    allergens: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    disliked_ingredients: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    max_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    preference_metadata: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)


class RecommendationRequest(Base):
    __tablename__ = "recommendation_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="en")
    free_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_preferences: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    stored_preferences: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    normalized_intent: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    restaurant_service_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    results: Mapped[list["RecommendationResult"]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
        order_by="RecommendationResult.rank",
    )


class RecommendationResult(Base):
    __tablename__ = "recommendation_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recommendation_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    restaurant_id: Mapped[str] = mapped_column(String(128), nullable=False)
    restaurant_name: Mapped[str] = mapped_column(Text, nullable=False)
    food_item_id: Mapped[str] = mapped_column(String(128), nullable=False)
    food_item_name: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="EUR")
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[float | None] = mapped_column(Numeric(7, 4), nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    result_metadata: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    request: Mapped[RecommendationRequest] = relationship(back_populates="results")
    feedback: Mapped[list["RecommendationFeedback"]] = relationship(
        back_populates="recommendation_result",
        cascade="all, delete-orphan",
    )


class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"
    __table_args__ = (
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="rating_between_1_and_5"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    recommendation_result_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recommendation_results.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    restaurant_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    recommendation_result: Mapped[RecommendationResult | None] = relationship(back_populates="feedback")


class RecommendationTrainingEvent(Base):
    __tablename__ = "recommendation_training_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recommendation_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    query: Mapped[str | None] = mapped_column(Text, nullable=True)
    candidate_restaurant_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    recommendation_score: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    completion_score: Mapped[float] = mapped_column(Numeric(7, 4), nullable=False)
    training_loss_proxy: Mapped[float] = mapped_column(Numeric(7, 4), nullable=False)
    matched_factors: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    negative_factors: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    feature_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="fallback")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class RecommendationEvent(Base):
    __tablename__ = "recommendation_events"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('shown', 'click', 'order')",
            name="recommendation_events_type_supported",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recommendation_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    profile_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    restaurant_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    order_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
