const RESTAURANT_API = "http://localhost:8001/api/restaurants";
const FOOD_ITEMS_API = "http://localhost:8001/api/food-items";

export async function getRestaurants() {
  const response = await fetch(RESTAURANT_API);

  if (!response.ok) {
    throw new Error("Could not load restaurants");
  }

  return await response.json();
}

export async function getRestaurantById(id) {
  const response = await fetch(`${RESTAURANT_API}/${id}`);

  if (!response.ok) {
    throw new Error("Restaurant not found");
  }

  return await response.json();
}

export async function getFoodItemsByRestaurantId(restaurantId) {
  const response = await fetch(
      `${FOOD_ITEMS_API}/restaurants/${restaurantId}`
  );

  if (!response.ok) {
    throw new Error("Could not load food items");
  }

  return await response.json();
}

export function getFallbackRestaurant() {
  return null;
}