from typing import Any, Protocol

from app.errors import LLMProviderError
from app.services.restaurant_client import Restaurant


class LLMRecommendationProvider(Protocol):
    def recommend(
        self,
        *,
        user_id: str,
        language: str,
        free_text: str | None,
        preferences: dict[str, Any],
        restaurants: list[Restaurant],
    ) -> list[dict[str, Any]]:
        raise NotImplementedError


class MockLLMRecommendationProvider:
    """Rule-based stand-in for a future LLM provider."""

    def recommend(
        self,
        *,
        user_id: str,
        language: str,
        free_text: str | None,
        preferences: dict[str, Any],
        restaurants: list[Restaurant],
    ) -> list[dict[str, Any]]:
        if not restaurants:
            raise LLMProviderError("No restaurant catalog was available for recommendations.")

        query_terms = _tokens(free_text or "")
        dietary_preferences = _lower_set(preferences.get("dietary_preferences"))
        cuisine_preferences = _lower_set(preferences.get("cuisine_preferences"))
        allergens = _lower_set(preferences.get("allergens"))
        disliked_ingredients = _lower_set(preferences.get("disliked_ingredients"))
        max_price = preferences.get("max_price")

        scored_items: list[dict[str, Any]] = []
        for restaurant in restaurants:
            restaurant_terms = _tokens(" ".join([restaurant.name, restaurant.cuisine or "", *restaurant.tags]))
            for item in restaurant.food_items:
                item_terms = _tokens(" ".join([item.name, *item.tags]))
                combined_terms = restaurant_terms | item_terms

                if max_price is not None and item.price is not None and item.price > float(max_price):
                    continue
                if allergens and allergens.intersection(combined_terms):
                    continue
                if disliked_ingredients and disliked_ingredients.intersection(combined_terms):
                    continue

                score = 0.1
                score += 0.3 * len(query_terms.intersection(combined_terms))
                score += 0.35 * len(dietary_preferences.intersection(combined_terms))
                score += 0.25 * len(cuisine_preferences.intersection(combined_terms))

                if dietary_preferences and not dietary_preferences.intersection(combined_terms):
                    score -= 0.2
                if cuisine_preferences and restaurant.cuisine:
                    if restaurant.cuisine.lower() in cuisine_preferences:
                        score += 0.4

                scored_items.append(
                    {
                        "restaurant_id": restaurant.restaurant_id,
                        "restaurant_name": restaurant.name,
                        "food_item_id": item.food_item_id,
                        "food_item_name": item.name,
                        "price": item.price,
                        "currency": item.currency,
                        "reason": _build_reason(
                            item_name=item.name,
                            restaurant_name=restaurant.name,
                            query_terms=query_terms,
                            item_terms=combined_terms,
                            dietary_preferences=dietary_preferences,
                            cuisine_preferences=cuisine_preferences,
                            max_price=max_price,
                            language=language,
                        ),
                        "score": round(max(score, 0.0), 4),
                        "tags": sorted(set(item.tags + restaurant.tags)),
                        "metadata": {
                            "provider": "mock",
                            "user_id": user_id,
                            "language": language,
                        },
                    }
                )

        if not scored_items:
            raise LLMProviderError("No food items matched the recommendation constraints.")

        scored_items.sort(key=lambda item: item["score"], reverse=True)
        return scored_items[:5]


def _build_reason(
    *,
    item_name: str,
    restaurant_name: str,
    query_terms: set[str],
    item_terms: set[str],
    dietary_preferences: set[str],
    cuisine_preferences: set[str],
    max_price: float | None,
    language: str,
) -> str:
    matches: list[str] = []
    if dietary_preferences.intersection(item_terms):
        matches.append("dietary preferences")
    if cuisine_preferences.intersection(item_terms):
        matches.append("cuisine preferences")
    if query_terms.intersection(item_terms):
        matches.append("free-text request")
    if max_price is not None:
        matches.append("price range")

    if not matches:
        return f"{item_name} from {restaurant_name} is a strong catalog match for this user."

    language_note = "" if language.lower().startswith("en") else f" Requested language: {language}."
    return f"{item_name} from {restaurant_name} matches your {', '.join(matches)}.{language_note}"


def _tokens(value: str) -> set[str]:
    separators = ",.;:/()[]{}!?-_\n\t"
    normalized = value.lower()
    for separator in separators:
        normalized = normalized.replace(separator, " ")
    return {token for token in normalized.split() if token}


def _lower_set(value: Any) -> set[str]:
    if value is None:
        return set()
    if isinstance(value, str):
        return {value.lower()}
    if isinstance(value, list):
        return {str(item).lower() for item in value if item is not None}
    return set()
