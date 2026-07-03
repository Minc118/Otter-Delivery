import unittest

from app.config import Settings
from app.schemas import RestaurantRecommendationRequest
from app.services.multilingual import normalize_recommendation_input
from app.services.recommendation_service import RecommendationService
from app.services.restaurant_client import FoodItem, Restaurant


class StaticRestaurantClient:
    used_fallback = False

    def fetch_catalog(self) -> list[Restaurant]:
        return [
            Restaurant(
                restaurant_id="spicy-veg",
                name="Spicy Garden",
                cuisine="Chinese",
                open=True,
                tags=["chinese", "vegetarian", "spicy"],
                food_items=[
                    FoodItem(
                        food_item_id="mapo-tofu",
                        name="Mapo Tofu",
                        description="Spicy vegetarian tofu with rice and chili.",
                        price=11.9,
                        tags=["spicy", "vegetarian", "chinese"],
                    )
                ],
            ),
            Restaurant(
                restaurant_id="burger",
                name="Burger House",
                cuisine="American",
                open=True,
                tags=["burger", "american"],
                food_items=[
                    FoodItem(
                        food_item_id="beef-burger",
                        name="Beef Burger",
                        description="Classic beef burger with cheese.",
                        price=13.9,
                        tags=["burger", "beef"],
                    )
                ],
            ),
        ]


class MultilingualRecommendationTests(unittest.TestCase):
    def setUp(self) -> None:
        settings = Settings(
            _env_file=None,
            recommendation_database_url=None,
            gemini_enabled=False,
            gemini_api_key=None,
        )
        self.service = RecommendationService(
            db=None,
            settings=settings,
            restaurant_client=StaticRestaurantClient(),
        )

    def test_english_query_uses_canonical_labels_and_english_reason(self) -> None:
        query = "I want spicy vegetarian Chinese food"
        normalized = normalize_recommendation_input(query=query, preferences={})
        result = self._recommend(query)

        self.assertEqual(normalized.original_language, "en")
        self.assertIn("spicy", normalized.canonical_query or "")
        self.assertEqual(result.recommendations[0].restaurant_id, "spicy-veg")
        self.assertTrue(result.recommendations[0].reason.startswith("Matches "))

    def test_german_query_uses_canonical_labels_and_german_reason(self) -> None:
        query = "Ich möchte scharfes vegetarisches chinesisches Essen"
        normalized = normalize_recommendation_input(query=query, preferences={})
        result = self._recommend(query)

        self.assertEqual(normalized.original_language, "de")
        self.assertEqual(normalized.canonical_query, "spicy vegetarian chinese")
        self.assertEqual(result.recommendations[0].restaurant_id, "spicy-veg")
        self.assertTrue(result.recommendations[0].reason.startswith("Passt zu "))
        self.assertIn("scharf", result.recommendations[0].reason)

    def test_chinese_query_uses_canonical_labels_and_chinese_reason(self) -> None:
        query = "我想吃辣的中国菜和素食"
        normalized = normalize_recommendation_input(query=query, preferences={})
        result = self._recommend(query)

        self.assertEqual(normalized.original_language, "zh")
        self.assertEqual(normalized.canonical_query, "chinese vegetarian spicy")
        self.assertEqual(result.recommendations[0].restaurant_id, "spicy-veg")
        self.assertTrue(result.recommendations[0].reason.startswith("符合你的需求："))
        self.assertIn("辣味", result.recommendations[0].reason)

    def test_restaurant_preferences_accept_max_price_alias(self) -> None:
        result = self.service.create_restaurant_recommendations(
            RestaurantRecommendationRequest(
                user_id="preference-test-user",
                preferences={"maxPrice": 12},
            )
        )

        self.assertEqual(result.recommendations[0].restaurant_id, "spicy-veg")
        self.assertIn("within 12.00 max", result.recommendations[0].matched_factors)

    def test_disliked_ingredients_reduce_risky_matches(self) -> None:
        result = self.service.create_restaurant_recommendations(
            RestaurantRecommendationRequest(
                user_id="preference-test-user",
                preferences={"dislikedIngredients": ["tofu"]},
            )
        )

        self.assertEqual(result.recommendations[0].restaurant_id, "burger")
        self.assertIn("contains disliked tofu", result.recommendations[1].negative_factors)

    def _recommend(self, query: str):
        return self.service.create_restaurant_recommendations(
            RestaurantRecommendationRequest(
                user_id="multilingual-test-user",
                query=query,
            )
        )


if __name__ == "__main__":
    unittest.main()
