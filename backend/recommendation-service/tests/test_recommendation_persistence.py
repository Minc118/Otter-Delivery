import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.database import get_db
from app.main import app
from app.schemas import RecommendationEventCreate, RestaurantRecommendationRequest
from app.services.recommendation_service import RecommendationService
from app.services.restaurant_client import FoodItem, Restaurant


class PhoRamenFalafelClient:
    used_fallback = False

    def fetch_catalog(self) -> list[Restaurant]:
        return [
            Restaurant(
                restaurant_id="pho-lantern",
                name="Pho Lantern Mitte",
                cuisine="Vietnamese",
                open=True,
                tags=["vietnamese", "pho", "noodles", "soup"],
                food_items=[
                    FoodItem(
                        food_item_id="beef-pho",
                        name="Beef Pho",
                        description="Vietnamese pho with sliced beef, rice noodles, herbs, lime, and warm broth.",
                        price=13.9,
                        tags=["vietnamese", "pho", "beef", "noodles", "soup"],
                    ),
                    FoodItem(
                        food_item_id="tofu-pho",
                        name="Tofu Pho",
                        description="Vietnamese pho with tofu, rice noodles, herbs, lime, and warm broth.",
                        price=11.9,
                        tags=["vietnamese", "pho", "vegetarian", "noodles", "soup"],
                    ),
                ],
            ),
            Restaurant(
                restaurant_id="anatolia-doner",
                name="Anatolia Grill Kreuzberg",
                cuisine="Turkish / Halal",
                open=True,
                tags=["turkish", "halal", "doner"],
                food_items=[
                    FoodItem(
                        food_item_id="doner",
                        name="Chicken Doner Plate",
                        description="Halal-friendly chicken doner with rice and salad.",
                        price=13.9,
                        tags=["halal", "turkish", "doner"],
                    )
                ],
            ),
            Restaurant(
                restaurant_id="falafel-sprint",
                name="Falafel Sprint Friedrichshain",
                cuisine="Mediterranean / Falafel",
                open=True,
                tags=["falafel", "vegetarian", "wrap"],
                food_items=[
                    FoodItem(
                        food_item_id="falafel-wrap",
                        name="Falafel Wrap",
                        description="Falafel wrap with hummus, salad, and herbs.",
                        price=6.9,
                        tags=["falafel", "vegetarian", "wrap"],
                    )
                ],
            ),
        ]


class EmptyDb:
    def get(self, *args, **kwargs):
        return None


class EmptyOrderClient:
    def get_order_history(self, user_id: str) -> list[dict]:
        return []


class RecommendationPersistenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            _env_file=None,
            recommendation_database_url=None,
            gemini_enabled=False,
            gemini_api_key=None,
        )

    def test_vietnamese_beef_pho_query_ranks_pho_above_falafel_and_doner(self) -> None:
        service = RecommendationService(
            db=None,
            settings=self.settings,
            restaurant_client=PhoRamenFalafelClient(),
            order_client=EmptyOrderClient(),
        )

        result = service.create_restaurant_recommendations(
            RestaurantRecommendationRequest(
                user_id="pho-test-user",
                query="I want Vietnamese pho with beef",
                preferences={"dietaryPreferences": ["halal"]},
            )
        )

        self.assertEqual(result.recommendations[0].restaurant_id, "pho-lantern")
        self.assertEqual(result.recommendations[0].recommended_items[0], "Beef Pho")
        ranked_ids = [item.restaurant_id for item in result.recommendations]
        self.assertLess(ranked_ids.index("pho-lantern"), ranked_ids.index("falafel-sprint"))
        self.assertLess(ranked_ids.index("pho-lantern"), ranked_ids.index("anatolia-doner"))
        self.assertIsNotNone(result.request_id)

    def test_restaurant_request_and_results_are_persisted_with_normalized_intent(self) -> None:
        request_id = uuid4()
        db = EmptyDb()
        service = RecommendationService(
            db=db,
            settings=self.settings,
            restaurant_client=PhoRamenFalafelClient(),
            order_client=EmptyOrderClient(),
        )

        with patch(
            "app.services.recommendation_service.recommendation_repository.create_request_with_results",
            return_value=(SimpleNamespace(id=request_id), []),
        ) as create_request, patch(
            "app.services.recommendation_service.recommendation_repository.create_training_events",
            return_value=[],
        ) as create_training:
            result = service.create_restaurant_recommendations(
                RestaurantRecommendationRequest(
                    user_id="persist-test-user",
                    query="beef pho",
                    preferences={},
                )
            )

        self.assertEqual(result.request_id, request_id)
        kwargs = create_request.call_args.kwargs
        self.assertEqual(kwargs["user_id"], "persist-test-user")
        self.assertEqual(kwargs["free_text"], "beef pho")
        self.assertIn("canonical_query", kwargs["normalized_intent"])
        self.assertGreaterEqual(len(kwargs["recommendations"]), 1)
        self.assertEqual(kwargs["recommendations"][0]["restaurant_id"], "pho-lantern")
        self.assertTrue(create_training.called)

    def test_recommendation_event_logging_uses_db_when_available(self) -> None:
        event_id = uuid4()
        service = RecommendationService(db=EmptyDb(), settings=self.settings)

        with patch(
            "app.services.recommendation_service.recommendation_repository.create_recommendation_event",
            return_value=SimpleNamespace(id=event_id),
        ) as create_event:
            response = service.create_recommendation_event(
                RecommendationEventCreate(
                    requestId=str(uuid4()),
                    profileId="profile-1",
                    restaurantId="pho-lantern",
                    eventType="click",
                    metadata={"rank": 1},
                )
            )

        self.assertTrue(response.stored)
        self.assertEqual(response.id, event_id)
        self.assertEqual(create_event.call_args.kwargs["event_type"], "click")

    def test_recommendation_event_logging_falls_back_best_effort(self) -> None:
        service = RecommendationService(db=None, settings=self.settings)

        response = service.create_recommendation_event(
            RecommendationEventCreate(
                requestId="not-a-uuid",
                profileId="profile-1",
                restaurantId="pho-lantern",
                eventType="order",
                orderId="order-1",
            )
        )

        self.assertFalse(response.stored)
        self.assertTrue(response.id)

    def test_recommendation_event_endpoint_logs_with_mocked_repository(self) -> None:
        event_id = uuid4()
        app.dependency_overrides[get_db] = lambda: EmptyDb()
        app.dependency_overrides[get_settings] = lambda: self.settings
        try:
            with patch(
                "app.services.recommendation_service.recommendation_repository.create_recommendation_event",
                return_value=SimpleNamespace(id=event_id),
            ):
                response = TestClient(app).post(
                    "/recommendations/events",
                    json={
                        "requestId": str(uuid4()),
                        "profileId": "profile-1",
                        "restaurantId": "pho-lantern",
                        "eventType": "click",
                        "metadata": {"rank": 1},
                    },
                )
        finally:
            app.dependency_overrides.clear()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"id": str(event_id), "stored": True})

    def test_recommendation_event_endpoint_accepts_order_event_payload(self) -> None:
        event_id = uuid4()
        app.dependency_overrides[get_db] = lambda: EmptyDb()
        app.dependency_overrides[get_settings] = lambda: self.settings
        try:
            with patch(
                "app.services.recommendation_service.recommendation_repository.create_recommendation_event",
                return_value=SimpleNamespace(id=event_id),
            ):
                response = TestClient(app).post(
                    "/recommendations/events",
                    json={
                        "requestId": "a5054968-ea3c-43a0-8b94-fee96ccf886f",
                        "profileId": "2",
                        "restaurantId": "5",
                        "eventType": "order",
                        "orderId": "1",
                        "metadata": {
                            "itemCount": 2,
                            "totalPrice": 23.8
                        }
                    },
                )
        finally:
            app.dependency_overrides.clear()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"id": str(event_id), "stored": True})


if __name__ == "__main__":
    unittest.main()
