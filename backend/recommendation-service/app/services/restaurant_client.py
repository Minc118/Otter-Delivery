from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Protocol

import httpx

if TYPE_CHECKING:
    from app.config import Settings


@dataclass(frozen=True)
class FoodItem:
    food_item_id: str
    name: str
    description: str | None = None
    price: float | None = None
    currency: str = "EUR"
    available: bool | None = None
    category_id: str | None = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Restaurant:
    restaurant_id: str
    name: str
    cuisine: str | None = None
    open: bool | None = None
    address: dict[str, Any] | None = None
    rating: float | None = None
    tags: list[str] = field(default_factory=list)
    food_items: list[FoodItem] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class RestaurantCatalogClient(Protocol):
    def fetch_catalog(self) -> list[Restaurant]:
        raise NotImplementedError


class HttpRestaurantCatalogClient:
    def __init__(self, settings: "Settings"):
        self.base_url = settings.restaurant_service_url.rstrip("/")
        self.timeout = settings.restaurant_service_timeout_seconds
        self.used_fallback = False

    def fetch_catalog(self) -> list[Restaurant]:
        try:
            with httpx.Client(timeout=self.timeout) as client:
                restaurants_payload = self._get_json(client, "/api/restaurants")
                restaurants = self._normalize_restaurants(restaurants_payload)
                restaurants = self._hydrate_missing_menu_items(client, restaurants)
        except httpx.HTTPError as exc:
            self.used_fallback = True
            return _mock_catalog()
        except ValueError as exc:
            self.used_fallback = True
            return _mock_catalog()

        if not any(restaurant.food_items for restaurant in restaurants):
            self.used_fallback = True
            return _mock_catalog()

        self.used_fallback = False
        return restaurants

    def _get_json(self, client: httpx.Client, path: str) -> Any:
        response = client.get(f"{self.base_url}{path}")
        response.raise_for_status()
        return response.json()

    def _hydrate_missing_menu_items(
        self,
        client: httpx.Client,
        restaurants: list[Restaurant],
    ) -> list[Restaurant]:
        hydrated: list[Restaurant] = []
        for restaurant in restaurants:
            if restaurant.food_items:
                hydrated.append(restaurant)
                continue

            try:
                menu_payload = self._get_json(
                    client,
                    f"/api/food-items/restaurants/{restaurant.restaurant_id}",
                )
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 404:
                    hydrated.append(restaurant)
                    continue
                raise

            food_items = self._normalize_food_items(menu_payload)
            hydrated.append(
                Restaurant(
                    restaurant_id=restaurant.restaurant_id,
                    name=restaurant.name,
                    cuisine=restaurant.cuisine,
                    open=restaurant.open,
                    address=restaurant.address,
                    rating=restaurant.rating,
                    tags=restaurant.tags,
                    food_items=food_items,
                    metadata=restaurant.metadata,
                )
            )

        return hydrated

    def _normalize_restaurants(self, payload: Any) -> list[Restaurant]:
        records = _extract_collection(payload, ("restaurants", "data", "items", "results"))
        restaurants: list[Restaurant] = []

        for record in records:
            if not isinstance(record, dict):
                continue

            restaurant_id = _first_value(record, "restaurantId", "restaurant_id", "id")
            name = _first_value(record, "restaurantName", "restaurant_name", "name")
            if not restaurant_id or not name:
                continue

            food_items = self._normalize_food_items(record)
            restaurants.append(
                Restaurant(
                    restaurant_id=str(restaurant_id),
                    name=str(name),
                    cuisine=_optional_string(_first_value(record, "cuisine", "cuisineType")),
                    open=_optional_bool(_first_value(record, "open", "available", "isOpen")),
                    address=_optional_dict(_first_value(record, "address")),
                    rating=_optional_float(_first_value(record, "rating", "averageRating")),
                    tags=_string_list(_first_value(record, "tags", "categories", "category")),
                    food_items=food_items,
                    metadata=record,
                )
            )

        return restaurants

    def _normalize_food_items(self, payload: Any) -> list[FoodItem]:
        records = _extract_collection(
            payload,
            ("foodItems", "food_items", "menuItems", "menu_items", "dishes", "items", "menu"),
        )
        food_items: list[FoodItem] = []

        for record in records:
            if not isinstance(record, dict):
                continue

            food_item_id = _first_value(record, "foodItemId", "food_item_id", "dishId", "dish_id", "id")
            name = _first_value(record, "foodItemName", "food_item_name", "dishName", "dish_name", "name")
            if not food_item_id or not name:
                continue

            food_items.append(
                FoodItem(
                    food_item_id=str(food_item_id),
                    name=str(name),
                    description=_optional_string(_first_value(record, "description")),
                    price=_optional_float(_first_value(record, "price", "amount")),
                    currency=str(_first_value(record, "currency") or "EUR"),
                    available=_optional_bool(_first_value(record, "available", "isAvailable")),
                    category_id=_optional_string(_first_value(record, "categoryId", "category_id")),
                    tags=_string_list(
                        _first_value(
                            record,
                            "tags",
                            "dietaryTags",
                            "dietary_tags",
                            "categories",
                            "allergens",
                        )
                    ),
                    metadata=record,
                )
            )

        return food_items


def _extract_collection(payload: Any, keys: tuple[str, ...]) -> list[Any]:
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []

    for key in keys:
        value = payload.get(key)
        if isinstance(value, list):
            return value

    return []


def _first_value(record: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in record and record[key] is not None:
            return record[key]
    return None


def _optional_string(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    return []


def _optional_bool(value: Any) -> bool | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "open", "available"}:
            return True
        if normalized in {"false", "0", "no", "closed", "unavailable"}:
            return False
    return None


def _optional_dict(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value
    return None


def _mock_catalog() -> list[Restaurant]:
    from app.data.mock_restaurants import MOCK_RESTAURANTS

    client = object.__new__(HttpRestaurantCatalogClient)
    return client._normalize_restaurants(MOCK_RESTAURANTS)
