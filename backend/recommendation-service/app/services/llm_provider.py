import json
import logging
from typing import Any, Protocol

import httpx

from app.errors import LLMProviderError
from app.config import Settings
from app.services.multilingual import NormalizedRecommendationInput
from app.services.scoring import ScoredCandidate
from app.services.restaurant_client import Restaurant

logger = logging.getLogger(__name__)


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


class GeminiReranker:
    def __init__(self, settings: Settings):
        self.configured_enabled = settings.gemini_enabled
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.timeout = settings.restaurant_service_timeout_seconds
        self.candidate_limit = settings.gemini_candidate_limit
        self.menu_item_limit = settings.gemini_menu_item_limit

    @property
    def enabled(self) -> bool:
        return self.configured_enabled and bool(self.api_key)

    def rerank(
        self,
        *,
        query: str | None,
        original_query: str | None = None,
        target_language: str = "en",
        preferences: dict[str, Any],
        candidates: list[ScoredCandidate],
    ) -> list[ScoredCandidate]:
        if not self.enabled or not candidates:
            return candidates

        limited_candidates = candidates[: self.candidate_limit]
        payload_candidates = [
            {
                "restaurantId": candidate.restaurant_id,
                "restaurantName": candidate.restaurant_name,
                "category": _candidate_category(candidate),
                "priceRange": _candidate_price_range(candidate),
                "tags": _compact_strings(candidate.matched_factors + candidate.negative_factors, 8),
                "topMenuItems": candidate.recommended_items[: self.menu_item_limit],
                "recommendationScore": candidate.recommendation_score,
                "matchedFactors": _compact_strings(candidate.matched_factors, 6),
                "negativeFactors": _compact_strings(candidate.negative_factors, 6),
            }
            for candidate in limited_candidates
        ]
        prompt = (
            "You rerank restaurant recommendation candidates. "
            "Only use the compact candidate fields provided. "
            "Do not invent IDs, names, menu items, prices, availability, or tags. "
            "Return strict JSON with this shape: "
            '{"recommendations":[{"restaurantId":"...","reason":"short user-facing reason"}]}. '
            f"Write every reason in language code {target_language}. "
            "Rank best candidates first.\n"
            f"Original user query: {original_query or query or ''}\n"
            f"Canonical English query: {query or ''}\n"
            f"Preferences JSON: {json.dumps(preferences, ensure_ascii=True)}\n"
            f"Candidates JSON: {json.dumps(payload_candidates, ensure_ascii=True)}"
        )
        response_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    url,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": self.api_key or "",
                    },
                    json=response_payload,
                )
                response.raise_for_status()
                body = response.json()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                logger.warning("gemini_rerank_fallback category=rate_limited")
                raise LLMProviderError("Gemini reranking rate_limited.") from exc
            logger.warning("gemini_rerank_fallback category=http_error status=%s", exc.response.status_code)
            raise LLMProviderError("Gemini reranking failed.") from exc
        except httpx.RequestError as exc:
            logger.warning("gemini_rerank_fallback category=network_or_api_issue")
            raise LLMProviderError("Gemini reranking failed.") from exc
        except ValueError as exc:
            logger.warning("gemini_rerank_fallback category=invalid_response")
            raise LLMProviderError("Gemini reranking failed.") from exc

        text = _extract_gemini_text(body)
        try:
            ranked_payload = json.loads(text)
        except json.JSONDecodeError as exc:
            logger.warning("gemini_rerank_fallback category=invalid_json")
            raise LLMProviderError("Gemini returned invalid JSON.") from exc
        if not isinstance(ranked_payload, dict):
            logger.warning("gemini_rerank_fallback category=invalid_payload")
            raise LLMProviderError("Gemini returned an invalid payload.")

        ranked_ids = _valid_ranked_ids(ranked_payload, limited_candidates)
        if not ranked_ids:
            logger.warning("gemini_rerank_fallback category=validation_rejection")
            raise LLMProviderError("Gemini returned no known restaurant IDs.")

        candidate_by_id = {candidate.restaurant_id: candidate for candidate in limited_candidates}
        reason_by_id = {
            str(item.get("restaurantId")): str(item.get("reason"))
            for item in ranked_payload.get("recommendations", [])
            if isinstance(item, dict) and item.get("restaurantId") and item.get("reason")
        }

        reranked: list[ScoredCandidate] = []
        seen: set[str] = set()
        for restaurant_id in ranked_ids:
            candidate = candidate_by_id[restaurant_id]
            candidate.reason = reason_by_id.get(restaurant_id, candidate.reason)
            candidate.source = "gemini"
            candidate.feature_snapshot["source"] = "gemini"
            candidate.feature_snapshot["original_language"] = target_language
            candidate.feature_snapshot["explanation_provider"] = "gemini"
            reranked.append(candidate)
            seen.add(restaurant_id)

        for candidate in candidates:
            if candidate.restaurant_id not in seen:
                reranked.append(candidate)

        return reranked


class GeminiLanguageNormalizer:
    def __init__(self, settings: Settings):
        self.configured_enabled = settings.gemini_enabled
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.timeout = settings.restaurant_service_timeout_seconds

    @property
    def enabled(self) -> bool:
        return self.configured_enabled and bool(self.api_key)

    def normalize(
        self,
        *,
        query: str | None,
        preferences: dict[str, Any],
        language_hint: str | None,
    ) -> NormalizedRecommendationInput:
        if not self.enabled or not query:
            raise LLMProviderError("Gemini language normalization is unavailable.")

        prompt = (
            "Detect the language of a food recommendation request and normalize its intent into "
            "English catalog labels. Preserve proper names and locations. Do not add preferences "
            "that the user did not express. Return strict JSON with this shape: "
            '{"language":"ISO-639-1 code","canonicalQuery":"concise English search labels",'
            '"preferences":{"dietary":[],"favorite_cuisines":[],"allergies":[],'
            '"disliked_ingredients":[],"price_range":null}}. '
            "Use canonical food labels such as spicy, vegetarian, vegan, halal, gluten-free, "
            "healthy, cheap, Japanese, Chinese, Korean, Thai, Indian, Italian, Turkish, Mexican, "
            "Mediterranean, pizza, burger, sushi, ramen, noodles, rice, curry, and warm. "
            "Merge and translate the supplied preferences.\n"
            f"Language hint: {language_hint or ''}\n"
            f"User query: {query}\n"
            f"Preferences JSON: {json.dumps(preferences, ensure_ascii=False)}"
        )
        response_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    url,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": self.api_key or "",
                    },
                    json=response_payload,
                )
                response.raise_for_status()
                body = response.json()
            payload = json.loads(_extract_gemini_text(body))
        except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
            logger.warning("gemini_language_fallback category=normalization_failed")
            raise LLMProviderError("Gemini language normalization failed.") from exc
        if not isinstance(payload, dict):
            raise LLMProviderError("Gemini returned an invalid normalization payload.")

        language = str(payload.get("language") or language_hint or "en").strip().lower()
        language = language.replace("_", "-").split("-", 1)[0]
        if not language.isalpha() or not 2 <= len(language) <= 3:
            language = str(language_hint or "en")
        canonical_query = str(payload.get("canonicalQuery") or "").strip()[:2000] or None
        normalized_preferences = payload.get("preferences")
        if not isinstance(normalized_preferences, dict):
            raise LLMProviderError("Gemini returned invalid normalized preferences.")

        merged_preferences = dict(preferences)
        for key, value in normalized_preferences.items():
            if value not in (None, [], {}):
                merged_preferences[key] = value

        return NormalizedRecommendationInput(
            original_language=language or "en",
            original_query=query,
            canonical_query=canonical_query,
            canonical_preferences=merged_preferences,
            provider="gemini",
        )


def _extract_gemini_text(body: Any) -> str:
    if not isinstance(body, dict):
        raise LLMProviderError("Gemini returned an invalid response.")
    candidates = body.get("candidates") or []
    if not candidates or not isinstance(candidates[0], dict):
        raise LLMProviderError("Gemini returned no candidates.")
    content = candidates[0].get("content")
    if not isinstance(content, dict):
        raise LLMProviderError("Gemini returned invalid content.")
    parts = content.get("parts", [])
    if not isinstance(parts, list):
        raise LLMProviderError("Gemini returned invalid content parts.")
    texts = [part.get("text", "") for part in parts if isinstance(part, dict)]
    text = "\n".join(texts).strip()
    if not text:
        raise LLMProviderError("Gemini returned an empty response.")
    return text


def _valid_ranked_ids(payload: dict[str, Any], candidates: list[ScoredCandidate]) -> list[str]:
    valid_ids = {candidate.restaurant_id for candidate in candidates}
    ranked_ids: list[str] = []
    for item in payload.get("recommendations", []):
        if not isinstance(item, dict):
            continue
        restaurant_id = str(item.get("restaurantId", ""))
        if restaurant_id in valid_ids and restaurant_id not in ranked_ids:
            ranked_ids.append(restaurant_id)
    return ranked_ids


def _candidate_category(candidate: ScoredCandidate) -> str | None:
    snapshot = candidate.feature_snapshot or {}
    category = snapshot.get("candidate_category")
    return str(category) if category else None


def _candidate_price_range(candidate: ScoredCandidate) -> str | None:
    snapshot = candidate.feature_snapshot or {}
    price = snapshot.get("candidate_price_range")
    return str(price) if price else None


def _compact_strings(values: list[str], limit: int) -> list[str]:
    compact: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = str(value).strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        compact.append(normalized)
        if len(compact) >= limit:
            break
    return compact
