from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from app.services.scoring import ScoredCandidate


CANONICAL_LANGUAGE = "en"

_GERMAN_MARKERS = {
    "aber",
    "bitte",
    "etwas",
    "essen",
    "ich",
    "kein",
    "keine",
    "mit",
    "möchte",
    "ohne",
    "scharf",
    "vegetarisch",
    "vegan",
    "warm",
    "und",
}

_ENGLISH_MARKERS = {
    "and",
    "eat",
    "food",
    "i",
    "something",
    "spicy",
    "vegetarian",
    "vegan",
    "want",
    "with",
    "without",
}

_GERMAN_LABELS = {
    "amerikanisch": "american",
    "asiatisch": "asian",
    "billig": "cheap",
    "burger": "burger",
    "chinesisch": "chinese",
    "curry": "curry",
    "falafel": "falafel",
    "gesund": "healthy",
    "glutenfrei": "gluten-free",
    "halal": "halal",
    "indisch": "indian",
    "italienisch": "italian",
    "japanisch": "japanese",
    "koreanisch": "korean",
    "mediterran": "mediterranean",
    "mexikanisch": "mexican",
    "nudeln": "noodles",
    "rindfleisch": "beef",
    "pizza": "pizza",
    "pho": "pho",
    "phở": "pho",
    "preiswert": "cheap",
    "ramen": "ramen",
    "reis": "rice",
    "scharf": "spicy",
    "scharfes": "spicy",
    "scharfen": "spicy",
    "scharfe": "spicy",
    "sushi": "sushi",
    "thailändisch": "thai",
    "türkisch": "turkish",
    "vietnamesisch": "vietnamese",
    "vegan": "vegan",
    "vegane": "vegan",
    "veganes": "vegan",
    "vegetarisch": "vegetarian",
    "vegetarische": "vegetarian",
    "vegetarisches": "vegetarian",
    "warm": "warm",
    "warmes": "warm",
}

_CHINESE_LABELS = {
    "中餐": "chinese",
    "中国菜": "chinese",
    "亚洲菜": "asian",
    "意大利菜": "italian",
    "日本菜": "japanese",
    "韩国菜": "korean",
    "印度菜": "indian",
    "墨西哥菜": "mexican",
    "土耳其菜": "turkish",
    "土耳其": "turkish",
    "地中海菜": "mediterranean",
    "泰国菜": "thai",
    "越南河粉": "pho",
    "越南菜": "vietnamese",
    "越南": "vietnamese",
    "河粉": "pho",
    "牛肉": "beef",
    "鸡肉": "chicken",
    "猪肉": "pork",
    "披萨": "pizza",
    "拉面": "ramen",
    "寿司": "sushi",
    "汉堡": "burger",
    "咖喱": "curry",
    "墨西哥卷饼": "burrito",
    "墨西哥卷": "burrito",
    "卷饼": "burrito",
    "塔可": "taco",
    "沙拉": "salad",
    "碗饭": "bowl",
    "碗": "bowl",
    "面条": "noodles",
    "面": "noodles",
    "烤肉": "kebab",
    "鹰嘴豆丸子": "falafel",
    "法拉费": "falafel",
    "素食": "vegetarian",
    "纯素": "vegan",
    "素": "vegetarian",
    "清真": "halal",
    "无麸质": "gluten-free",
    "健康": "healthy",
    "便宜": "cheap",
    "实惠": "cheap",
    "温暖": "warm",
    "热乎": "warm",
    "米饭": "rice",
    "辣": "spicy",
}

_GERMAN_ALLERGENS = {
    "erdnuss": "peanut",
    "erdnüsse": "peanut",
    "gluten": "gluten",
    "milch": "dairy",
    "nüsse": "nuts",
    "soja": "soy",
}

_CHINESE_ALLERGENS = {
    "花生": "peanut",
    "坚果": "nuts",
    "牛奶": "dairy",
    "乳制品": "dairy",
    "麸质": "gluten",
    "大豆": "soy",
    "海鲜": "seafood",
    "鸡蛋": "egg",
}

_FACTOR_LABELS = {
    "de": {
        "open": "jetzt geöffnet",
        "closed": "geschlossen",
        "low price": "günstiger Preis",
        "medium price": "mittlerer Preis",
        "high price": "gehobener Preis",
        "previously liked": "früheren Vorlieben",
        "no cuisine match": "keine passende Küche",
        "dietary preference unknown": "unklare Ernährungsangaben",
        "no query match": "geringe Übereinstimmung mit der Anfrage",
        "too expensive": "zu teuer",
        "price unknown": "unbekannter Preis",
    },
    "zh": {
        "open": "正在营业",
        "closed": "已打烊",
        "low price": "价格实惠",
        "medium price": "价格适中",
        "high price": "高端价位",
        "previously liked": "你之前喜欢的选择",
        "no cuisine match": "菜系不匹配",
        "dietary preference unknown": "饮食偏好信息不足",
        "no query match": "与请求匹配较弱",
        "too expensive": "价格过高",
        "price unknown": "价格未知",
    },
}


@dataclass(frozen=True)
class NormalizedRecommendationInput:
    original_language: str
    original_query: str | None
    canonical_query: str | None
    canonical_preferences: dict[str, Any]
    provider: str = "deterministic"


def normalize_recommendation_input(
    *,
    query: str | None,
    preferences: dict[str, Any],
    language_hint: str | None = None,
) -> NormalizedRecommendationInput:
    language = detect_language(query, language_hint)
    canonical_preferences = normalize_preferences(preferences, language)
    canonical_labels = extract_canonical_labels(query or "", language)
    canonical_query = " ".join(canonical_labels) if canonical_labels else _fallback_query(query, language)
    _merge_query_intent(canonical_preferences, query or "", language, canonical_labels)

    return NormalizedRecommendationInput(
        original_language=language,
        original_query=query,
        canonical_query=canonical_query,
        canonical_preferences=canonical_preferences,
    )


def detect_language(query: str | None, language_hint: str | None = None) -> str:
    text = (query or "").strip()
    if re.search(r"[\u3400-\u9fff]", text):
        return "zh"

    tokens = set(re.findall(r"[a-zA-ZÀ-ÿ]+", text.lower()))
    german_score = len(tokens.intersection(_GERMAN_MARKERS))
    german_score += sum(
        1
        for token in tokens
        if token.startswith(
            (
                "chines",
                "günst",
                "indisch",
                "italien",
                "japan",
                "möcht",
                "rindfleisch",
                "scharf",
                "thail",
                "türk",
                "vietnames",
                "vegan",
                "vegetar",
            )
        )
    )
    english_score = len(tokens.intersection(_ENGLISH_MARKERS))
    if re.search(r"[äöüß]", text.lower()) or german_score > english_score:
        return "de"
    if english_score:
        return "en"

    normalized_hint = _normalize_language_code(language_hint)
    return normalized_hint or "en"


def normalize_preferences(preferences: dict[str, Any], language: str) -> dict[str, Any]:
    normalized = dict(preferences)
    for key in (
        "dietary",
        "dietary_preferences",
        "favorite_cuisines",
        "cuisine_preferences",
        "allergies",
        "allergens",
        "disliked_ingredients",
    ):
        if key in normalized:
            normalized[key] = [
                _normalize_label(str(value), language)
                for value in _as_list(normalized.get(key))
                if str(value).strip()
            ]

    price_key = "price_range" if "price_range" in normalized else "priceRange"
    if price_key in normalized and normalized.get(price_key) is not None:
        normalized[price_key] = _normalize_price_label(normalized[price_key], language)
    return normalized


def extract_canonical_labels(query: str, language: str) -> list[str]:
    lowered = query.lower()
    labels: list[str] = []
    if language == "zh":
        for phrase, canonical in sorted(_CHINESE_LABELS.items(), key=lambda item: -len(item[0])):
            if phrase in lowered:
                labels.append(canonical)
    elif language == "de":
        for token in re.findall(r"[a-zA-ZÀ-ÿ-]+", lowered):
            canonical = _german_label(token)
            if canonical:
                labels.append(canonical)
    else:
        labels.extend(
            token
            for token in re.findall(r"[a-z0-9-]+", lowered)
            if len(token) > 2
        )
    return _unique(labels)


def localize_candidate_reasons(
    candidates: list[ScoredCandidate],
    language: str,
) -> list[ScoredCandidate]:
    for candidate in candidates:
        if candidate.source == "gemini":
            continue
        matched = [_localize_factor(value, language) for value in candidate.matched_factors[:4]]
        negative = [_localize_factor(value, language) for value in candidate.negative_factors[:3]]
        candidate.reason = _localized_reason(matched, negative, language)
        candidate.feature_snapshot["original_language"] = language
        candidate.feature_snapshot["explanation_provider"] = "deterministic"
    return candidates


def _merge_query_intent(
    preferences: dict[str, Any],
    query: str,
    language: str,
    labels: list[str],
) -> None:
    dietary_labels = [label for label in labels if label in {"vegetarian", "vegan", "halal", "gluten-free"}]
    cuisine_labels = [
        label
        for label in labels
        if label
        in {
            "american",
            "asian",
            "chinese",
            "indian",
            "italian",
            "japanese",
            "korean",
            "mediterranean",
            "mexican",
            "thai",
            "turkish",
            "vietnamese",
        }
    ]
    if dietary_labels:
        key = "dietary" if "dietary" in preferences else "dietary_preferences"
        preferences[key] = _unique(_as_list(preferences.get(key)) + dietary_labels)
    if cuisine_labels:
        key = "favorite_cuisines" if "favorite_cuisines" in preferences else "cuisine_preferences"
        preferences[key] = _unique(_as_list(preferences.get(key)) + cuisine_labels)

    allergens = _extract_allergens(query, language)
    if allergens:
        key = "allergies" if "allergies" in preferences else "allergens"
        preferences[key] = _unique(_as_list(preferences.get(key)) + allergens)

    if "cheap" in labels and not preferences.get("price_range") and not preferences.get("priceRange"):
        preferences["price_range"] = "low"
    elif "premium" in labels and not preferences.get("price_range") and not preferences.get("priceRange"):
        preferences["price_range"] = "high"


def _extract_allergens(query: str, language: str) -> list[str]:
    lowered = query.lower()
    if language == "de" and not any(marker in lowered for marker in ("allerg", "ohne", "kein")):
        return []
    if language == "zh" and not any(
        marker in lowered for marker in ("过敏", "不要", "不含", "不能吃")
    ):
        return []
    if language == "en" and not any(marker in lowered for marker in ("allerg", "without", "no ")):
        return []

    mapping = _CHINESE_ALLERGENS if language == "zh" else _GERMAN_ALLERGENS
    if language == "en":
        mapping = {
            "peanut": "peanut",
            "nuts": "nuts",
            "dairy": "dairy",
            "gluten": "gluten",
            "soy": "soy",
            "seafood": "seafood",
            "shellfish": "shellfish",
            "egg": "egg",
        }
    return _unique([canonical for phrase, canonical in mapping.items() if phrase in lowered])


def _normalize_label(value: str, language: str) -> str:
    lowered = value.lower().strip()
    if language == "de":
        return _german_label(lowered) or _GERMAN_ALLERGENS.get(lowered, lowered)
    if language == "zh":
        return _CHINESE_LABELS.get(lowered, _CHINESE_ALLERGENS.get(lowered, lowered))
    return lowered


def _german_label(value: str) -> str | None:
    direct = _GERMAN_LABELS.get(value)
    if direct:
        return direct
    stems = {
        "chines": "chinese",
        "günst": "cheap",
        "gesund": "healthy",
        "indisch": "indian",
        "italien": "italian",
        "japan": "japanese",
        "korean": "korean",
        "mediterran": "mediterranean",
            "mexikan": "mexican",
            "nudel": "noodles",
            "rindfleisch": "beef",
            "preiswert": "cheap",
            "scharf": "spicy",
            "thail": "thai",
            "türk": "turkish",
            "vietnames": "vietnamese",
        "vegan": "vegan",
        "vegetar": "vegetarian",
    }
    for stem, canonical in stems.items():
        if value.startswith(stem):
            return canonical
    return None


def _normalize_price_label(value: Any, language: str) -> str:
    lowered = str(value).lower().strip()
    if language == "de":
        return {
            "günstig": "low",
            "billig": "low",
            "niedrig": "low",
            "mittel": "medium",
            "teuer": "high",
            "hoch": "high",
        }.get(lowered, lowered)
    if language == "zh":
        return {
            "便宜": "low",
            "低": "low",
            "适中": "medium",
            "中等": "medium",
            "贵": "high",
            "高": "high",
        }.get(lowered, lowered)
    return lowered


def _fallback_query(query: str | None, language: str) -> str | None:
    if not query:
        return None
    return query if language == CANONICAL_LANGUAGE else None


def _localized_reason(matched: list[str], negative: list[str], language: str) -> str:
    if language == "de":
        if matched:
            return f"Passt zu {', '.join(matched)}."
        if negative:
            return f"Eher schwache Übereinstimmung: {', '.join(negative)}."
        return "Die beste verfügbare Übereinstimmung im Restaurantangebot."
    if language == "zh":
        if matched:
            return f"符合你的需求：{'、'.join(matched)}。"
        if negative:
            return f"匹配度较弱：{'、'.join(negative)}。"
        return "这是当前餐厅菜单中最合适的选择。"
    if matched:
        return f"Matches {', '.join(matched)}."
    if negative:
        return f"Weak match because {', '.join(negative)}."
    return "Best available catalog match."


def _localize_factor(value: str, language: str) -> str:
    if language == "en":
        return value
    direct = _FACTOR_LABELS.get(language, {}).get(value)
    if direct:
        return direct

    if value.endswith(" cuisine"):
        cuisine = _normalize_factor_label(value.removesuffix(" cuisine"), language)
        return f"{cuisine}-Küche" if language == "de" else f"{cuisine}菜系"
    if value.endswith(" price"):
        price = _normalize_factor_label(value.removesuffix(" price"), language)
        return f"{price}er Preis" if language == "de" else f"{price}价位"
    if value.startswith("close to "):
        target = _localize_factor(value.removeprefix("close to "), language)
        return f"nahe an {target}" if language == "de" else f"接近{target}"
    return _normalize_factor_label(value, language)


def _normalize_factor_label(value: str, language: str) -> str:
    reverse = {
        "de": {
            "spicy": "scharf",
            "hot": "scharf",
            "chili": "scharf",
            "vegetarian": "vegetarisch",
            "vegan": "vegan",
            "healthy": "gesund",
            "cheap": "günstig",
            "curry": "Curry",
            "noodles": "Nudeln",
            "ramen": "Ramen",
            "rice": "Reis",
            "chinese": "chinesisch",
            "japanese": "japanisch",
            "korean": "koreanisch",
            "thai": "thailändisch",
            "indian": "indisch",
            "italian": "italienisch",
            "turkish": "türkisch",
        },
        "zh": {
            "spicy": "辣味",
            "hot": "辣味",
            "chili": "辣味",
            "vegetarian": "素食",
            "vegan": "纯素",
            "healthy": "健康",
            "cheap": "实惠",
            "curry": "咖喱",
            "noodles": "面条",
            "ramen": "拉面",
            "rice": "米饭",
            "chinese": "中餐",
            "japanese": "日本菜",
            "korean": "韩国菜",
            "thai": "泰国菜",
            "indian": "印度菜",
            "italian": "意大利菜",
            "turkish": "土耳其菜",
        },
    }
    return reverse.get(language, {}).get(value, value)


def _normalize_language_code(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().lower().replace("_", "-").split("-", 1)[0]
    return normalized if 2 <= len(normalized) <= 3 else None


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    return [str(value)]


def _unique(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = str(value).strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result
