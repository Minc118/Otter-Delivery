export const INITIAL_RESTAURANT_VISIBLE_COUNT = 9;
export const RESTAURANT_LOAD_MORE_COUNT = 9;

export const defaultRestaurantFilters = {
  category: "all",
  dietary: "all",
  price: "all",
  delivery: "all",
  rating: "all",
  sort: "recommended",
};

export function filterRestaurants(restaurants, filters = defaultRestaurantFilters) {
  return restaurants
    .filter((restaurant) => matchesCategory(restaurant, filters.category))
    .filter((restaurant) => matchesDietary(restaurant, filters.dietary))
    .filter((restaurant) => matchesPrice(restaurant, filters.price))
    .filter((restaurant) => matchesDelivery(restaurant, filters.delivery))
    .filter((restaurant) => matchesRating(restaurant, filters.rating))
    .sort((left, right) => compareRestaurants(left, right, filters.sort));
}

export function getVisibleRestaurants(restaurants, visibleCount) {
  return restaurants.slice(0, visibleCount);
}

export function hasActiveRestaurantFilters(filters) {
  return Object.entries(filters).some(
    ([key, value]) => key !== "sort" && value !== "all",
  );
}

function matchesCategory(restaurant, value) {
  if (value === "all") return true;

  const text = searchableText(restaurant);
  const termsByCategory = {
    healthy: ["healthy", "salad", "bowl", "gluten-free", "vegan"],
    asian: ["asian", "japanese", "korean", "thai", "vietnamese", "chinese", "sushi", "ramen", "pho", "noodles"],
    italian: ["italian", "pizza", "pasta"],
    burger: ["burger", "american", "smash"],
    japanese: ["japanese", "sushi", "ramen"],
    turkish: ["turkish", "halal", "kebab", "döner", "doner", "grill"],
    falafel: ["falafel", "mediterranean", "shawarma", "mezze"],
  };

  return termsByCategory[value]?.some((term) => text.includes(term)) ?? true;
}

function matchesDietary(restaurant, value) {
  if (value === "all") return true;
  return searchableText(restaurant).includes(value);
}

function matchesPrice(restaurant, value) {
  if (value === "all") return true;
  if (value === "under-10") return restaurant.priceTier === "€";
  if (value === "10-25") return restaurant.priceTier === "€€";
  if (value === "over-25") return restaurant.priceTier === "€€€";
  return true;
}

function matchesDelivery(restaurant, value) {
  if (value === "all") return true;
  const minutes = Number.parseInt(String(restaurant.eta ?? ""), 10);
  return Number.isFinite(minutes) && minutes <= 40;
}

function matchesRating(restaurant, value) {
  if (value === "all") return true;
  const minimumRating = Number.parseFloat(value);
  const rating = Number.parseFloat(restaurant.rating);
  return Number.isFinite(rating) && rating >= minimumRating;
}

function compareRestaurants(left, right, sort) {
  if (sort === "rating") {
    return Number.parseFloat(right.rating) - Number.parseFloat(left.rating);
  }
  if (sort === "delivery") {
    return Number.parseInt(left.eta, 10) - Number.parseInt(right.eta, 10);
  }
  return 0;
}

function searchableText(restaurant) {
  return [
    restaurant?.name,
    restaurant?.cuisine,
    restaurant?.description,
    restaurant?.priceTier,
    ...(restaurant?.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
