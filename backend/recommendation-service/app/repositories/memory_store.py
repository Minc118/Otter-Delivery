from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4


PREFERENCES: dict[str, dict] = {}
HISTORY: list[dict] = []
FEEDBACK: list[dict] = []
TRAINING_EVENTS: list[dict] = []
RECOMMENDATION_EVENTS: list[dict] = []


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def save_preference(user_id: str, payload: dict) -> dict:
    record = {
        "user_id": user_id,
        **payload,
        "created_at": PREFERENCES.get(user_id, {}).get("created_at", now_iso()),
        "updated_at": now_iso(),
    }
    PREFERENCES[user_id] = record
    return record


def get_preference(user_id: str) -> dict | None:
    return PREFERENCES.get(user_id)


def save_history(record: dict) -> dict:
    stored = {"id": str(uuid4()), "created_at": now_iso(), **record}
    HISTORY.insert(0, stored)
    return stored


def save_feedback(record: dict) -> dict:
    stored = {"id": str(uuid4()), "created_at": now_iso(), **record}
    FEEDBACK.insert(0, stored)
    return stored


def save_training_events(records: list[dict]) -> None:
    timestamp = now_iso()
    for record in records:
        TRAINING_EVENTS.append({"id": str(uuid4()), "created_at": timestamp, **record})


def save_recommendation_event(record: dict) -> dict:
    stored = {"id": str(uuid4()), "created_at": now_iso(), **record}
    RECOMMENDATION_EVENTS.insert(0, stored)
    return stored
