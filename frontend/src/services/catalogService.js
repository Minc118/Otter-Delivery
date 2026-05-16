import { restaurants } from "../data/restaurants.js";

export function getRestaurants() {
  return restaurants;
}

export function getRestaurantById(id) {
  return restaurants.find((restaurant) => restaurant.id === id) ?? null;
}

export function getFallbackRestaurant() {
  return restaurants[0] ?? null;
}
