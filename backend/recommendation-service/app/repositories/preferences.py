from sqlalchemy.orm import Session

from app import models
from app.schemas import UserPreferencePayload


def get_user_preference(db: Session, user_id: str) -> models.UserPreference | None:
    return db.get(models.UserPreference, user_id)


def upsert_user_preference(
    db: Session,
    user_id: str,
    payload: UserPreferencePayload,
) -> models.UserPreference:
    values = payload.model_dump(mode="json")
    preference = get_user_preference(db, user_id)

    if preference is None:
        preference = models.UserPreference(
            user_id=user_id,
            language=values["language"],
            dietary_preferences=values["dietary_preferences"],
            cuisine_preferences=values["cuisine_preferences"],
            allergens=values["allergens"],
            disliked_ingredients=values["disliked_ingredients"],
            max_price=values["max_price"],
            preference_metadata=values["metadata"],
        )
        db.add(preference)
    else:
        preference.language = values["language"]
        preference.dietary_preferences = values["dietary_preferences"]
        preference.cuisine_preferences = values["cuisine_preferences"]
        preference.allergens = values["allergens"]
        preference.disliked_ingredients = values["disliked_ingredients"]
        preference.max_price = values["max_price"]
        preference.preference_metadata = values["metadata"]

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(preference)
    return preference
