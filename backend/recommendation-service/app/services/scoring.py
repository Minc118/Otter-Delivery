from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.services.restaurant_client import FoodItem, Restaurant


QUERY_SYNONYMS = {
    "spicy": {"spicy", "hot", "chili", "curry"},
    "hot": {"hot", "spicy", "chili"},
    "vegetarian": {"vegetarian", "veggie", "tofu", "plant"},
    "vegan": {"vegan", "plant"},
    "healthy": {"healthy", "fresh", "salad", "bowl"},
    "asian": {"asian", "thai", "japanese", "korean", "chinese", "sushi", "ramen", "noodles", "curry"},
    "indian": {"indian", "curry", "masala", "dal"},
    "italian": {"italian", "pizza", "pasta", "margherita"},
    "japanese": {"japanese", "sushi", "ramen", "noodles"},
    "korean": {"korean", "kimchi", "bibimbap", "tteokbokki"},
    "mexican": {"mexican", "taco", "burrito", "quesadilla"},
    "turkish": {"turkish", "kebab", "doner", "döner"},
    "pizza": {"pizza", "italian", "margherita"},
    "burger": {"burger", "burgers", "american", "smash"},
    "halal": {"halal", "halal-friendly"},
    "gluten": {"gluten", "gluten-free"},
    "free": {"free", "gluten-free"},
    "comfort": {"comfort", "comforting", "warm"},
    "comforting": {"comfort", "comforting", "warm"},
    "warm": {"warm", "comfort", "comforting"},
    "ramen": {"ramen", "noodle", "noodles", "japanese", "warm"},
    "noodle": {"noodle", "noodles", "ramen"},
    "noodles": {"noodle", "noodles", "ramen"},
    "bowl": {"bowl", "bowls", "healthy"},
    "cheap": {"cheap", "low"},
    "kreuzberg": {"kreuzberg"},
}


PRICE_RANGES = {
    "low": (0, 10),
    "cheap": (0, 10),
    "medium": (10, 18),
    "mid": (10, 18),
    "high": (18, 1000),
    "premium": (18, 1000),
}


@dataclass
class ScoredCandidate:
    restaurant_id: str
    restaurant_name: str
    recommendation_score: float
    completion_score: float
    reason: str
    recommended_items: list[str]
    matched_factors: list[str] = field(default_factory=list)
    negative_factors: list[str] = field(default_factory=list)
    menu_item_ids: list[str] = field(default_factory=list)
    source: str = "rule_based"
    feature_snapshot: dict[str, Any] = field(default_factory=dict)

    @property
    def training_loss_proxy(self) -> float:
        return round(1 - self.completion_score, 4)

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "restaurant_id": self.restaurant_id,
            "restaurant_name": self.restaurant_name,
            "recommendation_score": self.recommendation_score,
            "completion_score": self.completion_score,
            "reason": self.reason,
            "recommended_items": self.recommended_items,
            "matched_factors": self.matched_factors,
            "negative_factors": self.negative_factors,
        }

    def to_legacy_result(self) -> dict[str, Any]:
        first_item_name = self.recommended_items[0] if self.recommended_items else self.restaurant_name
        first_item_id = self.menu_item_ids[0] if self.menu_item_ids else self.restaurant_id
        return {
            "restaurant_id": self.restaurant_id,
            "restaurant_name": self.restaurant_name,
            "food_item_id": first_item_id,
            "food_item_name": first_item_name,
            "reason": self.reason,
            "score": self.recommendation_score,
            "recommendation_score": self.recommendation_score,
            "tags": self.matched_factors,
            "metadata": {
                "completion_score": self.completion_score,
                "training_target_proxy": self.completion_score,
                "training_loss_proxy": self.training_loss_proxy,
                "matched_factors": self.matched_factors,
                "negative_factors": self.negative_factors,
                "feature_snapshot": self.feature_snapshot,
                "source": self.source,
            },
        }

    def to_training_event(self, user_id: str, query: str | None, source: str) -> dict[str, Any]:
        snapshot = dict(self.feature_snapshot)
        snapshot["source"] = source
        return {
            "user_id": user_id,
            "query": query,
            "candidate_restaurant_id": self.restaurant_id,
            "recommendation_score": self.recommendation_score,
            "completion_score": self.completion_score,
            "training_loss_proxy": self.training_loss_proxy,
            "matched_factors": self.matched_factors,
            "negative_factors": self.negative_factors,
            "feature_snapshot": snapshot,
        }


def score_restaurants(
        *,
        user_id: str,
        query: str | None,
        preferences: dict[str, Any],
        restaurants: list[Restaurant],
        feedback_by_restaurant: dict[str, str] | None = None,
        history_by_restaurant: dict[str, int] | None = None,
        limit: int = 20,
) -> list[ScoredCandidate]:
    history_by_restaurant = history_by_restaurant or {}
    query_tokens = _expand_tokens(_tokens(query or ""))
    dietary = _lower_list(_first_present(preferences, "dietary", "dietary_preferences", "dietaryPreferences"))
    allergies = _lower_list(_first_present(preferences, "allergies", "allergens"))
    disliked_ingredients = _lower_list(
        _first_present(preferences, "disliked_ingredients", "dislikedIngredients")
    )
    favorite_cuisines = _lower_list(
        _first_present(preferences, "favorite_cuisines", "favoriteCuisines", "cuisine_preferences", "cuisinePreferences")
    )
    price_range = _normalize_price_range(_first_present(preferences, "price_range", "priceRange"))
    max_price = _normalize_max_price(
        _first_present(preferences, "max_price", "maxPrice", "maximum_price", "maximumPrice")
    )
    feedback_by_restaurant = feedback_by_restaurant or {}

    candidates: list[ScoredCandidate] = []
    for restaurant in restaurants:
        reliable_terms = _restaurant_terms(restaurant)
        if allergies and allergies.intersection(reliable_terms):
            continue

        available_items = [
            item for item in restaurant.food_items if item.available is not False
        ] or restaurant.food_items
        item_scores = [
            _score_item(
                restaurant=restaurant,
                item=item,
                query_tokens=query_tokens,
                dietary=dietary,
                favorite_cuisines=favorite_cuisines,
                price_range=price_range,
                max_price=max_price,
            )
            for item in available_items
        ]
        item_scores.sort(key=lambda value: value[0], reverse=True)
        recommended_items = [item.name for _, item, _, _ in item_scores[:3]]
        menu_item_ids = [item.food_item_id for _, item, _, _ in item_scores[:3]]

        score = 0
        matched_factors: list[str] = []
        negative_factors: list[str] = []

        if restaurant.open is True:
            score += 25
            matched_factors.append("open")
        elif restaurant.open is False:
            score -= 50
            negative_factors.append("closed")

        query_score, query_matches, query_negatives = _query_score(query_tokens, reliable_terms)
        score += query_score
        matched_factors.extend(query_matches)
        negative_factors.extend(query_negatives)

        cuisine_score, cuisine_matches, cuisine_negatives = _cuisine_score(
            restaurant,
            favorite_cuisines,
            reliable_terms,
        )
        score += cuisine_score
        matched_factors.extend(cuisine_matches)
        negative_factors.extend(cuisine_negatives)

        dietary_score, dietary_matches, dietary_negatives = _dietary_score(
            dietary,
            reliable_terms,
            query_tokens,
        )
        score += dietary_score
        matched_factors.extend(dietary_matches)
        negative_factors.extend(dietary_negatives)

        price_score, price_matches, price_negatives = _price_score(price_range, available_items)
        score += price_score
        matched_factors.extend(price_matches)
        negative_factors.extend(price_negatives)

        max_price_score, max_price_matches, max_price_negatives = _max_price_score(max_price, available_items)
        score += max_price_score
        matched_factors.extend(max_price_matches)
        negative_factors.extend(max_price_negatives)

        disliked_score, disliked_matches, disliked_negatives = _disliked_ingredient_score(
            disliked_ingredients,
            reliable_terms,
        )
        score += disliked_score
        matched_factors.extend(disliked_matches)
        negative_factors.extend(disliked_negatives)

        feedback_score, feedback_match, feedback_negative = _feedback_score(
            feedback_by_restaurant.get(restaurant.restaurant_id)
        )
        score += feedback_score
        matched_factors.extend(feedback_match)
        negative_factors.extend(feedback_negative)

        history_count = history_by_restaurant.get(restaurant.restaurant_id, 0)

        if history_count > 0:
            history_score = min(30, history_count * 15)
            score += history_score
            matched_factors.append("previously ordered")
        else:
            history_score = 0

        if item_scores:
            score += min(item_scores[0][0], 15)
            matched_factors.extend(item_scores[0][2])
            negative_factors.extend(item_scores[0][3])

        completion_score = _completion_score(score)
        candidate_price_range = _candidate_price_range(available_items)
        feature_snapshot = {
            "user_id": user_id,
            "query_keywords": sorted(query_tokens),
            "dietary_preferences": sorted(dietary),
            "price_preference": price_range,
            "max_price": max_price,
            "cuisine_preference": sorted(favorite_cuisines),
            "allergies": sorted(allergies),
            "disliked_ingredients": sorted(disliked_ingredients),
            "candidate_category": restaurant.cuisine or (restaurant.tags[0] if restaurant.tags else None),
            "candidate_price_range": candidate_price_range,
            "candidate_restaurant_id": restaurant.restaurant_id,
            "matched_menu_item_ids": menu_item_ids,
            "matched_menu_item_names": recommended_items,
            "availability_status": restaurant.open,
            "recommendation_score": round(score, 2),
            "completion_score": completion_score,
            "matched_factors": _unique(matched_factors),
            "negative_factors": _unique(negative_factors),
            "source": "rule_based",
            "timestamp": datetime.now(UTC).isoformat(),
        }

        candidates.append(
            ScoredCandidate(
                restaurant_id=restaurant.restaurant_id,
                restaurant_name=restaurant.name,
                recommendation_score=round(score, 2),
                completion_score=completion_score,
                reason=_reason(matched_factors, negative_factors),
                recommended_items=recommended_items,
                matched_factors=_unique(matched_factors),
                negative_factors=_unique(negative_factors),
                menu_item_ids=menu_item_ids,
                feature_snapshot=feature_snapshot,
            )
        )

    candidates.sort(key=lambda candidate: candidate.recommendation_score, reverse=True)
    return candidates[:limit]


def serialize_candidates(candidates: list[ScoredCandidate]) -> list[dict[str, Any]]:
    return [asdict(candidate) | {"training_loss_proxy": candidate.training_loss_proxy} for candidate in candidates]


def _score_item(
    *,
    restaurant: Restaurant,
    item: FoodItem,
    query_tokens: set[str],
    dietary: set[str],
    favorite_cuisines: set[str],
    price_range: str | None,
    max_price: float | None,
) -> tuple[float, FoodItem, list[str], list[str]]:
    restaurant_terms = _restaurant_terms(restaurant)
    item_terms = _item_terms(item)
    terms = restaurant_terms | item_terms
    score = 0.0
    matched: list[str] = []
    negative: list[str] = []

    query_matches = query_tokens.intersection(item_terms)
    if query_matches:
        score += min(12, 6 + 2 * len(query_matches))
        matched.extend(sorted(query_matches)[:4])
    elif query_tokens.intersection(restaurant_terms):
        score += 3
    if dietary and dietary.intersection(terms):
        score += 5 if dietary.intersection(query_tokens) else 2
        matched.extend(sorted(dietary.intersection(terms)))
    if favorite_cuisines and favorite_cuisines.intersection(terms):
        score += 2
        matched.extend(sorted(favorite_cuisines.intersection(terms)))
    if price_range and item.price is not None:
        price_score, price_matched, price_negative = _price_score(price_range, [item])
        score += max(min(price_score, 4), -4)
        matched.extend(price_matched)
        negative.extend(price_negative)
    if max_price is not None and item.price is not None:
        max_price_score, max_price_matched, max_price_negative = _max_price_score(max_price, [item])
        score += max(min(max_price_score, 2), -3)
        matched.extend(max_price_matched)
        negative.extend(max_price_negative)

    return score, item, matched, negative


def _cuisine_score(
    restaurant: Restaurant,
    favorite_cuisines: set[str],
    terms: set[str],
) -> tuple[int, list[str], list[str]]:
    if not favorite_cuisines:
        return 0, [], []
    cuisine = (restaurant.cuisine or "").lower()
    if cuisine and cuisine in favorite_cuisines:
        return 8, [f"{cuisine} cuisine"], []
    related = favorite_cuisines.intersection(terms)
    if related:
        return 4, sorted(related), []
    return 0, [], []


def _dietary_score(
    dietary: set[str],
    terms: set[str],
    query_tokens: set[str],
) -> tuple[int, list[str], list[str]]:
    if not dietary:
        return 0, [], []
    explicit = dietary.intersection(query_tokens)
    matched = dietary.intersection(terms)
    if matched:
        return (18 if explicit else 6), sorted(matched), []
    if explicit:
        return -8, [], ["missing explicit dietary match"]
    return 0, [], []


def _price_score(price_range: str | None, items: list[FoodItem]) -> tuple[int, list[str], list[str]]:
    if not price_range or price_range not in PRICE_RANGES or not items:
        return 0, [], []
    prices = [item.price for item in items if item.price is not None]
    if not prices:
        return 0, [], ["price unknown"]
    average = sum(prices) / len(prices)
    low, high = PRICE_RANGES[price_range]
    if low <= average <= high:
        return 15, [f"{price_range} price"], []
    if average < low or average <= high + 5:
        return 5, [f"close to {price_range} price"], []
    return -20, [], ["too expensive"]


def _max_price_score(max_price: float | None, items: list[FoodItem]) -> tuple[int, list[str], list[str]]:
    if max_price is None or not items:
        return 0, [], []
    prices = [item.price for item in items if item.price is not None]
    if not prices:
        return 0, [], ["price unknown"]
    average = sum(prices) / len(prices)
    cheapest = min(prices)
    if average <= max_price:
        return 5, [f"within {max_price:.2f} max"], []
    if cheapest <= max_price:
        return 2, [f"has options under {max_price:.2f}"], []
    return -4, [], [f"above {max_price:.2f} max"]


def _disliked_ingredient_score(
    disliked_ingredients: set[str],
    terms: set[str],
) -> tuple[int, list[str], list[str]]:
    if not disliked_ingredients:
        return 0, [], []
    matched = disliked_ingredients.intersection(terms)
    if matched:
        return -8, [], [f"contains disliked {item}" for item in sorted(matched)[:3]]
    return 0, [], []


def _candidate_price_range(items: list[FoodItem]) -> str | None:
    prices = [item.price for item in items if item.price is not None]
    if not prices:
        return None
    average = sum(prices) / len(prices)
    if average <= 10:
        return "low"
    if average <= 18:
        return "medium"
    return "high"


def _query_score(query_tokens: set[str], terms: set[str]) -> tuple[int, list[str], list[str]]:
    if not query_tokens:
        return 0, [], []
    matched = query_tokens.intersection(terms)
    if len(matched) >= 2:
        return min(45, 22 + 6 * len(matched)), sorted(matched)[:5], []
    if matched:
        return 18, sorted(matched), []
    return -10, [], ["no query match"]


def _feedback_score(feedback_type: str | None) -> tuple[int, list[str], list[str]]:
    if feedback_type in {"ordered", "like", "clicked"}:
        return 15, ["previously liked"], []
    if feedback_type in {"dislike", "skipped", "not_relevant"}:
        return -30, [], ["previously disliked"]
    return 0, [], []


def _completion_score(score: float) -> float:
    return round(max(0.0, min(1.0, (score + 100) / 200)), 4)


def _reason(matched: list[str], negative: list[str]) -> str:
    meaningful_matches = [match for match in matched if match != "open"]
    if meaningful_matches:
        return f"Matches {', '.join(_unique(meaningful_matches)[:4])}."
    if matched:
        return f"Matches {', '.join(_unique(matched)[:4])}."
    if negative:
        return "Weak match because " + ", ".join(_unique(negative)[:3]) + "."
    return "Best available catalog match."


def _restaurant_terms(restaurant: Restaurant) -> set[str]:
    metadata = restaurant.metadata or {}
    address = restaurant.address or {}
    values = [
        restaurant.name,
        restaurant.cuisine or "",
        str(metadata.get("description") or ""),
        str(address.get("street") or ""),
        str(address.get("city") or ""),
        str(address.get("postalCode") or address.get("postal_code") or ""),
        *(restaurant.tags or []),
    ]
    for item in restaurant.food_items:
        values.extend([item.name, item.description or "", *(item.tags or [])])
    return _expand_tokens(_tokens(" ".join(values)))


def _item_terms(item: FoodItem) -> set[str]:
    return _expand_tokens(_tokens(" ".join([item.name, item.description or "", *(item.tags or [])])))


def _tokens(value: str) -> set[str]:
    normalized = value.lower()
    for separator in ",.;:/()[]{}!?-_\n\t":
        normalized = normalized.replace(separator, " ")
    return {token for token in normalized.split() if len(token) > 2}


def _expand_tokens(tokens: set[str]) -> set[str]:
    expanded = set(tokens)
    for token in list(tokens):
        expanded.update(QUERY_SYNONYMS.get(token, set()))
    return expanded


def _lower_list(value: Any) -> set[str]:
    if value is None:
        return set()
    if isinstance(value, str):
        return {value.lower()}
    if isinstance(value, list):
        return {str(item).lower() for item in value if item is not None}
    return set()


def _first_present(values: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in values and values[key] not in (None, [], {}):
            return values[key]
    return None


def _normalize_price_range(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).lower().strip()
    return normalized or None


def _normalize_max_price(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 0 else None


def _unique(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = value.strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result
