import unittest

from app.services.restaurant_client import FoodItem, Restaurant
from app.services.multilingual import normalize_recommendation_input
from app.services.scoring import score_restaurants


class DishIntentScoringTests(unittest.TestCase):
    def test_falafel_query_ranks_falafel_items_above_generic_vegetarian_bowls(self) -> None:
        test_falafel_query_ranks_falafel_items_above_generic_vegetarian_bowls()

    def test_chinese_mixed_falafel_query_keeps_english_dish_intent(self) -> None:
        test_chinese_mixed_falafel_query_keeps_english_dish_intent()

    def test_vegan_falafel_query_keeps_dish_match_above_generic_vegan(self) -> None:
        test_vegan_falafel_query_keeps_dish_match_above_generic_vegan()

    def test_pizza_query_ranks_italian_pizza_above_unrelated_restaurants(self) -> None:
        test_pizza_query_ranks_italian_pizza_above_unrelated_restaurants()

    def test_burger_query_ranks_burger_items_above_unrelated_comfort_food(self) -> None:
        test_burger_query_ranks_burger_items_above_unrelated_comfort_food()

    def test_sushi_query_ranks_japanese_sushi_above_generic_asian_noodles(self) -> None:
        test_sushi_query_ranks_japanese_sushi_above_generic_asian_noodles()

    def test_healthy_gluten_free_bowl_query_ranks_supported_bowls_above_falafel(self) -> None:
        test_healthy_gluten_free_bowl_query_ranks_supported_bowls_above_falafel()

    def test_turkish_halal_query_ranks_turkish_grill_above_generic_mediterranean(self) -> None:
        test_turkish_halal_query_ranks_turkish_grill_above_generic_mediterranean()

    def test_spicy_noodles_query_ranks_noodle_items_above_unrelated_spicy_items(self) -> None:
        test_spicy_noodles_query_ranks_noodle_items_above_unrelated_spicy_items()

    def test_cheap_query_ranks_low_price_fast_restaurants_without_metadata_names(self) -> None:
        test_cheap_query_ranks_low_price_fast_restaurants_without_metadata_names()

    def test_premium_sushi_query_ranks_sushi_without_metadata_names(self) -> None:
        test_premium_sushi_query_ranks_sushi_without_metadata_names()

    def test_chinese_vietnamese_beef_pho_ranks_pho_above_falafel(self) -> None:
        test_chinese_vietnamese_beef_pho_ranks_pho_above_falafel()

    def test_chinese_short_beef_pho_query_ranks_beef_pho_highest(self) -> None:
        test_chinese_short_beef_pho_query_ranks_beef_pho_highest()

    def test_english_beef_pho_ranks_beef_pho_above_generic_pho(self) -> None:
        test_english_beef_pho_ranks_beef_pho_above_generic_pho()

    def test_chinese_vietnamese_cuisine_ranks_vietnamese_restaurant(self) -> None:
        test_chinese_vietnamese_cuisine_ranks_vietnamese_restaurant()

    def test_german_rindfleisch_pho_ranks_vietnamese_pho(self) -> None:
        test_german_rindfleisch_pho_ranks_vietnamese_pho()


def test_falafel_query_ranks_falafel_items_above_generic_vegetarian_bowls() -> None:
    results = _score("falafel")

    assert results[0].restaurant_id in {"levant", "falafel-sprint"}
    assert any("Falafel" in item for item in results[0].recommended_items)
    assert _rank(results, "generic-vegan") > _rank(results, results[0].restaurant_id)
    assert _rank(results, "korean") > _rank(results, results[0].restaurant_id)


def test_chinese_mixed_falafel_query_keeps_english_dish_intent() -> None:
    normalized = normalize_recommendation_input(
        query="我想吃 falafel",
        preferences={},
    )
    assert normalized.canonical_query == "falafel"

    results = _score_normalized(normalized.canonical_query, normalized.canonical_preferences)

    assert results[0].restaurant_id in {"levant", "falafel-sprint"}
    assert any("Falafel" in item for item in results[0].recommended_items)
    assert _rank(results, "generic-vegan") > _rank(results, results[0].restaurant_id)


def test_vegan_falafel_query_keeps_dish_match_above_generic_vegan() -> None:
    normalized = normalize_recommendation_input(
        query="vegan falafel",
        preferences={},
    )
    assert set(normalized.canonical_query.split()) == {"vegan", "falafel"}

    results = _score_normalized(normalized.canonical_query, normalized.canonical_preferences)

    assert results[0].restaurant_id in {"levant", "falafel-sprint"}
    assert any("Falafel" in item for item in results[0].recommended_items)
    assert _rank(results, "generic-vegan") > _rank(results, results[0].restaurant_id)


def test_pizza_query_ranks_italian_pizza_above_unrelated_restaurants() -> None:
    results = _score("pizza")

    assert results[0].restaurant_id == "italian"
    assert any("Pizza" in item for item in results[0].recommended_items)


def test_burger_query_ranks_burger_items_above_unrelated_comfort_food() -> None:
    results = _score("burger")

    assert results[0].restaurant_id == "burger"
    assert any("Burger" in item for item in results[0].recommended_items)


def test_sushi_query_ranks_japanese_sushi_above_generic_asian_noodles() -> None:
    results = _score("sushi")

    assert results[0].restaurant_id == "sushi"
    assert any("Sushi" in item or "Sashimi" in item for item in results[0].recommended_items)
    assert _rank(results, "dragon-noodles") > _rank(results, "sushi")


def test_healthy_gluten_free_bowl_query_ranks_supported_bowls_above_falafel() -> None:
    results = _score("healthy gluten-free bowl")

    assert results[0].restaurant_id == "glutenfrei"
    assert any("Bowl" in item for item in results[0].recommended_items)
    assert _rank(results, "falafel-sprint") > _rank(results, "glutenfrei")


def test_turkish_halal_query_ranks_turkish_grill_above_generic_mediterranean() -> None:
    results = _score("Turkish halal")

    assert results[0].restaurant_id == "anatolia"
    assert _rank(results, "levant") > _rank(results, "anatolia")


def test_spicy_noodles_query_ranks_noodle_items_above_unrelated_spicy_items() -> None:
    results = _score("spicy noodles")

    assert results[0].restaurant_id in {"dragon-noodles", "ramen", "thai"}
    assert any("Noodles" in item or "Ramen" in item or "Pad Thai" in item for item in results[0].recommended_items)
    assert _rank(results, "anatolia") > _rank(results, results[0].restaurant_id)


def test_cheap_query_ranks_low_price_fast_restaurants_without_metadata_names() -> None:
    results = _score("something fast and cheap")

    assert results[0].restaurant_id == "falafel-sprint"
    assert not any(item.lower().startswith("cheap") for item in results[0].recommended_items)


def test_premium_sushi_query_ranks_sushi_without_metadata_names() -> None:
    results = _score("premium sushi")

    assert results[0].restaurant_id == "sushi"
    assert results[0].recommended_items[0] == "Sushi Selection"


def test_chinese_vietnamese_beef_pho_ranks_pho_above_falafel() -> None:
    normalized = normalize_recommendation_input(
        query="我想要吃越南河粉，牛肉的",
        preferences={},
    )
    assert normalized.canonical_query == "pho vietnamese beef"
    assert "vietnamese" in normalized.canonical_preferences.get("cuisine_preferences", [])

    results = _score_normalized(normalized.canonical_query, normalized.canonical_preferences)

    assert results[0].restaurant_id == "vietnamese"
    assert results[0].recommended_items[0] == "Beef Pho"
    assert _rank(results, "falafel-sprint") > _rank(results, "vietnamese")
    assert _rank(results, "generic-vegan") > _rank(results, "vietnamese")
    assert _rank(results, "korean") > _rank(results, "vietnamese")


def test_chinese_short_beef_pho_query_ranks_beef_pho_highest() -> None:
    normalized = normalize_recommendation_input(
        query="我想吃牛肉河粉",
        preferences={},
    )
    assert set(normalized.canonical_query.split()) == {"beef", "pho"}

    results = _score_normalized(normalized.canonical_query, normalized.canonical_preferences)

    assert results[0].restaurant_id == "vietnamese"
    assert results[0].recommended_items[0] == "Beef Pho"


def test_english_beef_pho_ranks_beef_pho_above_generic_pho() -> None:
    results = _score("beef pho")

    assert results[0].restaurant_id == "vietnamese"
    assert results[0].recommended_items[0] == "Beef Pho"
    assert results[0].recommended_items.index("Beef Pho") < results[0].recommended_items.index("Tofu Pho")
    assert _rank(results, "falafel-sprint") > _rank(results, "vietnamese")


def test_chinese_vietnamese_cuisine_ranks_vietnamese_restaurant() -> None:
    normalized = normalize_recommendation_input(
        query="越南菜",
        preferences={},
    )
    assert normalized.canonical_query == "vietnamese"

    results = _score_normalized(normalized.canonical_query, normalized.canonical_preferences)

    assert results[0].restaurant_id == "vietnamese"
    assert _rank(results, "falafel-sprint") > _rank(results, "vietnamese")


def test_german_rindfleisch_pho_ranks_vietnamese_pho() -> None:
    normalized = normalize_recommendation_input(
        query="Rindfleisch Pho",
        preferences={},
    )
    assert normalized.canonical_query == "beef pho"

    results = _score_normalized(normalized.canonical_query, normalized.canonical_preferences)

    assert results[0].restaurant_id == "vietnamese"
    assert results[0].recommended_items[0] == "Beef Pho"


def _score(query: str):
    return score_restaurants(
        user_id="dish-intent-test-user",
        query=query,
        preferences={},
        restaurants=_catalog(),
        limit=20,
    )


def _score_normalized(query: str | None, preferences: dict):
    return score_restaurants(
        user_id="dish-intent-test-user",
        query=query,
        preferences=preferences,
        restaurants=_catalog(),
        limit=20,
    )


def _rank(results, restaurant_id: str) -> int:
    for index, result in enumerate(results):
        if result.restaurant_id == restaurant_id:
            return index
    raise AssertionError(f"{restaurant_id} not found in results")


def _catalog() -> list[Restaurant]:
    return [
        Restaurant(
            restaurant_id="levant",
            name="Levant Kitchen Moabit",
            cuisine="Middle Eastern / Halal",
            open=True,
            tags=["middle eastern", "halal-friendly", "falafel", "mezze"],
            food_items=[
                FoodItem(
                    food_item_id="levant-falafel",
                    name="Falafel Plate",
                    description="Falafel with hummus, tabbouleh, pickles, and warm flatbread. Vegan.",
                    price=11.9,
                    available=True,
                    tags=["falafel", "vegan", "mediterranean"],
                ),
                FoodItem(
                    food_item_id="levant-shawarma",
                    name="Chicken Shawarma Bowl",
                    description="Halal-friendly chicken shawarma with rice, salad, garlic sauce, and warm spices.",
                    price=13.9,
                    available=True,
                    tags=["halal", "shawarma"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="falafel-sprint",
            name="Falafel Sprint Friedrichshain",
            cuisine="Mediterranean / Falafel",
            open=True,
            tags=["falafel", "cheap", "fast delivery", "mediterranean"],
            food_items=[
                FoodItem(
                    food_item_id="sprint-wrap",
                    name="Falafel Wrap",
                    description="Falafel wrap with hummus, salad, pickles, and herbs. Vegan and low priced.",
                    price=6.9,
                    available=True,
                    tags=["falafel", "vegan", "cheap"],
                )
            ],
        ),
        Restaurant(
            restaurant_id="generic-vegan",
            name="Green Garden Vegan",
            cuisine="Vegan",
            open=True,
            tags=["vegan", "healthy", "bowl"],
            food_items=[
                FoodItem(
                    food_item_id="buddha",
                    name="Vegan Buddha Bowl",
                    description="Quinoa bowl with chickpeas, avocado, greens, and tahini. Vegan and gluten-free.",
                    price=12.9,
                    available=True,
                    tags=["vegan", "healthy", "bowl"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="korean",
            name="Seoul Bowl Neukölln",
            cuisine="Korean",
            open=True,
            tags=["korean", "bibimbap", "bowl", "vegetarian"],
            food_items=[
                FoodItem(
                    food_item_id="bibimbap",
                    name="Vegetable Bibimbap",
                    description="Korean rice bowl with egg, seasonal vegetables, sesame, and gochujang sauce. Vegetarian.",
                    price=11.9,
                    available=True,
                    tags=["korean", "vegetarian", "bowl"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="italian",
            name="Napoli Pizza Berlin",
            cuisine="Italian",
            open=True,
            tags=["italian", "pizza", "pasta"],
            food_items=[
                FoodItem(
                    food_item_id="pizza",
                    name="Margherita Pizza",
                    description="Tomato, mozzarella, basil, and olive oil on a crisp Italian base.",
                    price=10.9,
                    available=True,
                    tags=["pizza", "italian"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="burger",
            name="Kreuzberg Burger Lab",
            cuisine="Burger / American",
            open=True,
            tags=["burger", "american", "comfort"],
            food_items=[
                FoodItem(
                    food_item_id="classic-burger",
                    name="Classic Smash Burger",
                    description="Beef smash burger with cheddar, pickles, and house sauce.",
                    price=12.9,
                    available=True,
                    tags=["burger"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="sushi",
            name="Sushi Atelier Charlottenburg",
            cuisine="Japanese / Sushi",
            open=True,
            tags=["japanese", "sushi", "premium"],
            food_items=[
                FoodItem(
                    food_item_id="sushi-selection",
                    name="Sushi Selection",
                    description="Premium sushi box with nigiri, maki, sashimi, ginger, and fresh rice.",
                    price=21.9,
                    available=True,
                    tags=["sushi", "japanese", "premium"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="glutenfrei",
            name="Glutenfrei Garden Neukölln",
            cuisine="Healthy / Gluten-Free",
            open=True,
            tags=["healthy", "gluten-free", "bowl", "salad"],
            food_items=[
                FoodItem(
                    food_item_id="quinoa",
                    name="Chicken Quinoa Bowl",
                    description="Gluten-free lunch bowl with chicken, quinoa, cucumber, herbs, and lemon dressing.",
                    price=12.9,
                    available=True,
                    tags=["gluten-free", "healthy", "bowl"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="anatolia",
            name="Anatolia Grill Kreuzberg",
            cuisine="Turkish / Halal",
            open=True,
            tags=["turkish", "halal-friendly", "grill", "kebab"],
            food_items=[
                FoodItem(
                    food_item_id="doner",
                    name="Chicken Döner Plate",
                    description="Halal-friendly chicken döner with rice, salad, garlic sauce, and warm flatbread.",
                    price=13.9,
                    available=True,
                    tags=["turkish", "halal", "doner"],
                ),
                FoodItem(
                    food_item_id="adana",
                    name="Adana Kebab",
                    description="Spicy halal-friendly minced lamb kebab with bulgur, grilled vegetables, and chili sauce.",
                    price=16.9,
                    available=True,
                    tags=["turkish", "halal", "kebab", "spicy"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="vietnamese",
            name="Pho Lantern Mitte",
            cuisine="Vietnamese",
            open=True,
            tags=["vietnamese", "pho", "rice noodles", "noodles"],
            food_items=[
                FoodItem(
                    food_item_id="beef-pho",
                    name="Beef Pho",
                    description="Vietnamese pho with sliced beef, rice noodles, herbs, lime, and warm broth.",
                    price=13.9,
                    available=True,
                    tags=["vietnamese", "pho", "beef", "noodles"],
                ),
                FoodItem(
                    food_item_id="tofu-pho",
                    name="Tofu Pho",
                    description="Vietnamese pho with rice noodles, tofu, herbs, lime, and warm broth.",
                    price=11.9,
                    available=True,
                    tags=["vietnamese", "pho", "tofu", "noodles"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="dragon-noodles",
            name="Dragon Noodles Wedding",
            cuisine="Chinese",
            open=True,
            tags=["chinese", "asian", "noodles", "spicy"],
            food_items=[
                FoodItem(
                    food_item_id="dan-dan",
                    name="Dan Dan Noodles",
                    description="Spicy wheat noodles with sesame chili sauce, greens, and Sichuan pepper.",
                    price=10.9,
                    available=True,
                    tags=["spicy", "noodles"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="ramen",
            name="Sakura Ramen Mitte",
            cuisine="Japanese",
            open=True,
            tags=["japanese", "ramen", "noodles"],
            food_items=[
                FoodItem(
                    food_item_id="tan-tan",
                    name="Vegan Tan Tan Ramen",
                    description="Spicy ramen noodles with tofu, sesame broth, and chili oil.",
                    price=13.9,
                    available=True,
                    tags=["spicy", "ramen", "noodles"],
                ),
            ],
        ),
        Restaurant(
            restaurant_id="thai",
            name="Spicy Thai Box Friedrichshain",
            cuisine="Thai",
            open=True,
            tags=["thai", "curry", "noodles", "spicy"],
            food_items=[
                FoodItem(
                    food_item_id="pad-thai",
                    name="Pad Thai Tofu",
                    description="Rice noodles with tofu, peanuts, tamarind, lime, and chili.",
                    price=11.9,
                    available=True,
                    tags=["thai", "noodles", "spicy"],
                ),
            ],
        ),
    ]
