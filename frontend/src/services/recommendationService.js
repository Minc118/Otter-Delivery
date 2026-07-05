import { recommendations } from "../data/recommendations.js";

const RECOMMENDATION_IMAGES = [
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
];

const env = import.meta.env ?? {};
const RECOMMENDATION_API_BASE_URL =
  env.VITE_RECOMMENDATION_SERVICE_URL ??
  env.VITE_RECOMMENDATION_API_URL ??
  "http://localhost:8004";
const HOMEPAGE_INITIAL_RECOMMENDATION_LIMIT = 3;
const SEARCH_RECOMMENDATION_LIMIT = 6;
const RECOMMENDATION_ATTRIBUTION_STORAGE_KEY = "otter-recommendation-attribution-v1";

const SEARCH_STOP_WORDS = new Set([
  "and",
  "are",
  "for",
  "not",
  "the",
  "too",
  "want",
  "with",
  "you",
  "your",
]);

export function getRecommendations() {
  return recommendations.slice(0, HOMEPAGE_INITIAL_RECOMMENDATION_LIMIT);
}

export function getHomepageRestaurantRecommendations(restaurants = []) {
  return restaurants
    .slice(0, HOMEPAGE_INITIAL_RECOMMENDATION_LIMIT)
    .map((restaurant, index) => toRestaurantRecommendationCardModel(restaurant, index));
}

export function searchRecommendations(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return getRecommendations();
  }

  const tokens = normalizedQuery
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2 && !SEARCH_STOP_WORDS.has(token));

  if (tokens.length === 0) {
    return getRecommendations();
  }

  return recommendations
    .map((recommendation) => {
      const haystack = [
        recommendation.title,
        recommendation.restaurant.name,
        recommendation.reason,
        ...recommendation.tags,
      ]
        .join(" ")
        .toLowerCase();

      const score = tokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0,
      );

      return { recommendation, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ recommendation }) => recommendation)
    .slice(0, SEARCH_RECOMMENDATION_LIMIT);
}

export async function getRestaurantRecommendations(payload) {
  const response = await fetch(
    `${RECOMMENDATION_API_BASE_URL}/recommendations/restaurants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error("Could not load restaurant recommendations");
  }

  return await response.json();
}

export async function searchLiveRestaurantRecommendations(query, options = {}) {
  const profile = getStoredProfile();
  const preferences = getProfileRecommendationPreferences(profile);
  const limit = options.limit ?? SEARCH_RECOMMENDATION_LIMIT;

  const data = await getRestaurantRecommendations({
    userId: profile?.id ? String(profile.id) : "guest",
    query: query?.trim() || undefined,
    preferences,
  });

  return {
    recommendations: (data.recommendations ?? [])
      .slice(0, limit)
      .map((item, index) => toRecommendationCardModel(item, index, data.requestId)),
    source: data.source ?? "fallback",
    requestId: data.requestId ?? null,
  };
}

function toRestaurantRecommendationCardModel(restaurant, index) {
  const cuisine = restaurant.cuisine ?? "Local favorite";
  const title = restaurant.name;
  const firstTag = restaurant.tags?.[0] ?? cuisine;

  return {
    id: `restaurant-${restaurant.id}`,
    title,
    price: restaurant.priceTier ?? restaurant.eta ?? "Live",
    restaurant: {
      id: restaurant.restaurantId ?? restaurant.id,
      name: restaurant.name,
    },
    subtitle: cuisine,
    badge: {
      icon: index === 0 ? "auto_awesome" : "restaurant",
      label: index === 0 ? "Today's Pick" : "Live Restaurant",
    },
    image: restaurant.image,
    reason: `Open from the live restaurant catalog. ${firstTag} is available for today's demo flow.`,
    tags: [restaurant.rating ? `${restaurant.rating} rating` : null, restaurant.eta, cuisine]
      .filter(Boolean)
      .slice(0, 3),
  };
}

function toRecommendationCardModel(item, index, requestId = null) {
  const recommendedItems = item.recommendedItems ?? item.recommended_items ?? [];
  const title = recommendedItems[0] ?? item.restaurantName ?? item.restaurant_name;
  const restaurantId = item.restaurantId ?? item.restaurant_id;
  const restaurantName = item.restaurantName ?? item.restaurant_name;
  const matchedFactors = item.matchedFactors ?? item.matched_factors ?? [];
  const score = item.recommendationScore ?? item.recommendation_score;

  return {
    id: `${restaurantId}-${title}-${index}`,
    title,
    price: Number.isFinite(score) ? `${Math.round(score)} pts` : "Live",
    restaurant: {
      id: restaurantId,
      name: restaurantName,
    },
    badge: {
      icon: "auto_awesome",
      label: index === 0 ? "Best Match" : "AI Recommendation",
    },
    image: {
      alt: title,
      src: pickRecommendationImage(`${restaurantName}:${title}`),
      fallbackSrc: RECOMMENDATION_IMAGES[0],
    },
    reason: item.reason ?? "Matched against the live restaurant catalog.",
    tags: matchedFactors.slice(0, 4),
    recommendationRequestId: requestId,
    recommendationRank: index + 1,
  };
}

export async function logRecommendationEvent({
  requestId,
  profileId,
  restaurantId,
  eventType,
  orderId,
  metadata = {},
}) {
  if (!eventType) {
    return { stored: false };
  }

  try {
    const response = await fetch(`${RECOMMENDATION_API_BASE_URL}/recommendations/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        requestId: requestId ?? undefined,
        profileId: profileId ?? undefined,
        restaurantId: restaurantId ? String(restaurantId) : undefined,
        eventType,
        orderId: orderId ? String(orderId) : undefined,
        metadata,
      }),
    });

    if (!response.ok) {
      return { stored: false };
    }

    return await response.json();
  } catch {
    return { stored: false };
  }
}

export function logRecommendationShownEvents(recommendations, metadata = {}) {
  const profile = getStoredProfile();
  const events = (recommendations ?? [])
    .filter((recommendation) => recommendation.recommendationRequestId)
    .map((recommendation) =>
      logRecommendationEvent({
        requestId: recommendation.recommendationRequestId,
        profileId: profile?.id ? String(profile.id) : "guest",
        restaurantId: recommendation.restaurant?.id,
        eventType: "shown",
        metadata: {
          ...metadata,
          rank: recommendation.recommendationRank,
          title: recommendation.title,
        },
      }),
    );

  if (events.length > 0) {
    void Promise.allSettled(events);
  }
}

export function rememberRecommendationAttribution(recommendation) {
  if (!recommendation?.recommendationRequestId || !recommendation?.restaurant?.id) {
    return;
  }

  const current = readRecommendationAttribution();
  current[String(recommendation.restaurant.id)] = {
    requestId: recommendation.recommendationRequestId,
    restaurantId: String(recommendation.restaurant.id),
    restaurantName: recommendation.restaurant.name,
    rank: recommendation.recommendationRank,
    title: recommendation.title,
    clickedAt: new Date().toISOString(),
  };
  writeRecommendationAttribution(current);
}

export function getRecommendationAttributionForRestaurant(restaurantId) {
  if (!restaurantId) {
    return null;
  }

  return readRecommendationAttribution()[String(restaurantId)] ?? null;
}

function readRecommendationAttribution() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(
      window.sessionStorage.getItem(RECOMMENDATION_ATTRIBUTION_STORAGE_KEY),
    ) ?? {};
  } catch {
    return {};
  }
}

function writeRecommendationAttribution(value) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    RECOMMENDATION_ATTRIBUTION_STORAGE_KEY,
    JSON.stringify(value),
  );
}

function getStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem("profile"));
  } catch {
    return null;
  }
}

export function getProfileRecommendationPreferences(profile = getStoredProfile()) {
  if (!profile) {
    return {};
  }

  const favoriteCuisines = normalizeList(profile.favoriteCuisines);
  const dietaryPreferences = normalizeList(profile.dietaryPreferences);
  const allergies = normalizeList(profile.allergies);
  const dislikedIngredients = normalizeList(profile.dislikedIngredients);
  const maximumPrice = normalizeNumber(profile.maximumPrice);

  return {
    favoriteCuisines,
    cuisinePreferences: favoriteCuisines,
    dietaryPreferences,
    allergies,
    allergens: allergies,
    dislikedIngredients,
    maximumPrice,
    maxPrice: maximumPrice,
  };
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickRecommendationImage(seed) {
  const hash = String(seed)
    .split("")
    .reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);

  return RECOMMENDATION_IMAGES[hash % RECOMMENDATION_IMAGES.length];
}

export async function getUserPreferences(userId) {
  const response = await fetch(
      `${RECOMMENDATION_API_BASE_URL}/preferences/${userId}`,
  );

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export async function updateUserPreferences(userId, preferences) {
  const response = await fetch(
      `${RECOMMENDATION_API_BASE_URL}/preferences/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      },
  );

  if (!response.ok) {
    throw new Error("Could not update preferences");
  }

  return await response.json();
}
