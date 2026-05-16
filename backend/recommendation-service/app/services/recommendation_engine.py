from app.data.mock_restaurants import MOCK_RESTAURANTS
from app.models.recommendation import RecommendationItem, RecommendationRequest


def get_recommendations(request: RecommendationRequest) -> list[RecommendationItem]:
    query_terms = set(request.query.lower().replace(",", " ").replace(".", " ").split())
    dietary_terms = {term.lower() for term in request.dietaryPreferences}
    recommendations: list[RecommendationItem] = []

    for restaurant in MOCK_RESTAURANTS:
        for dish in restaurant["dishes"]:
            tags = {tag.lower() for tag in dish["tags"]}
            if request.maxPrice is not None and dish["price"] > request.maxPrice:
                continue
            if dietary_terms and not dietary_terms.issubset(tags):
                continue

            score = len(query_terms.intersection(tags))
            if score == 0 and query_terms:
                if not dietary_terms:
                    continue

            recommendations.append(
                RecommendationItem(
                    restaurantId=restaurant["restaurantId"],
                    restaurantName=restaurant["restaurantName"],
                    dishId=dish["dishId"],
                    dishName=dish["dishName"],
                    price=dish["price"],
                    currency=dish["currency"],
                    reason=_build_reason(dish["tags"], request.maxPrice),
                    tags=dish["tags"],
                )
            )

    if not recommendations:
        recommendations = [_fallback_recommendation()]

    # TODO: Replace this rule-based mock logic with Gemini API integration later.
    # The AI service must only recommend restaurants and dishes. It must not create orders.
    return recommendations[:3]


def _build_reason(tags: list[str], max_price: float | None) -> str:
    reason_parts = []

    if "warm" in tags:
        reason_parts.append("warm")
    if "vegetarian" in tags:
        reason_parts.append("vegetarian")
    if max_price is not None:
        reason_parts.append("within your price range")

    if not reason_parts:
        return "This dish is a good match for your current craving."

    return f"{', '.join(reason_parts).capitalize()}."


def _fallback_recommendation() -> RecommendationItem:
    restaurant = MOCK_RESTAURANTS[0]
    dish = restaurant["dishes"][0]

    return RecommendationItem(
        restaurantId=restaurant["restaurantId"],
        restaurantName=restaurant["restaurantName"],
        dishId=dish["dishId"],
        dishName=dish["dishName"],
        price=dish["price"],
        currency=dish["currency"],
        reason="Warm, vegetarian, and within your price range.",
        tags=dish["tags"],
    )
