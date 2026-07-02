import {
  adaptMenuItems,
  adaptRestaurant,
  adaptRestaurants,
  getFallbackRestaurantViewModel,
} from "./restaurantAdapter.js";


const RESTAURANT_SERVICE_BASE_URL =
    import.meta.env.VITE_RESTAURANT_SERVICE_URL ?? "http://localhost:8001";

const TRANSLATION_API =
    import.meta.env.VITE_TRANSLATION_SERVICE_URL ?? "http://localhost:8005";


const RESTAURANT_API = `${RESTAURANT_SERVICE_BASE_URL}/api/restaurants`;
const FOOD_ITEMS_API = `${RESTAURANT_SERVICE_BASE_URL}/api/food-items`;

export async function getRestaurants() {
  const response = await fetch(RESTAURANT_API);

  if (!response.ok) {
    throw new Error("Could not load restaurants");
  }

  const restaurants = await response.json();
  return adaptRestaurants(restaurants);
}

export async function getRestaurantById(id) {
  const response = await fetch(`${RESTAURANT_API}/${id}`);

  if (!response.ok) {
    throw new Error("Restaurant not found");
  }

  const restaurant = await response.json();
  return adaptRestaurant(restaurant);
}

export async function getFoodItemsByRestaurantId(
    restaurantId,
    restaurant = null
) {
  const response = await fetch(
      `${FOOD_ITEMS_API}/restaurants/${restaurantId}`
  );

  if (!response.ok) {
    throw new Error("Could not load food items");
  }

  const foodItems = await response.json();
  return adaptMenuItems(foodItems, restaurant);
}

export function getFallbackRestaurant() {
  return getFallbackRestaurantViewModel();
}


// =======================================
// TRANSLATION SERVICE (FASTAPI)
// =======================================

export async function getTranslatedRestaurants(lang) {
  const response = await fetch(
      `${TRANSLATION_API}/api/translations/restaurants?lang=${lang}`
  );

  if (!response.ok) {
    throw new Error("Failed to translate restaurants");
  }

  const data = await response.json();

  return adaptRestaurants(data);
}

export async function getTranslatedFoodItemsByRestaurantId(id, lang) {
  const response = await fetch(
      `${TRANSLATION_API}/api/translations/restaurants/${id}/food-items?lang=${lang}`
  );

  if (!response.ok) {
    throw new Error("Failed to translate food items");
  }

  return await response.json();
}