import { recommendations } from "../data/recommendations.js";

const RECOMMENDATION_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQFpQrYG4LpNRtVlfivKSl3ZheRPZ5TMzRJT2gGA-UHouXoQmZcStRnSpOVQszDPkN8009jor73icejL1cZ845YVJf8P-ZoJAuJ3T5tWezYTKuk-VktHr3e6ywT3zcwlEehA-dkaS7v00AIqTB8RJWtEbYjX6qttBqbL8ZZlGMr7e0f88hmQC2n4LVTOJ6wEEHXftC3-ACMXpj1y19K5tCY6OIKz1qb61vDasgGvJhhbAeEJRTRbaAw4fwDZf1k5iTgq0lzdlzYB8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-lQs5K7n7zJdbm6-MaZ2qTx2e9H5HcTDpLbIabdp2Zick0JaCUH2ogRqK8NwT6mr10dydrKxTTHJsQFUpEjzVBnltTmYifLDYsb1KewsmEDp6s2xfRpZwDQb9v2rt4p-i97qDeDEzMpDWfdGGijyS6SIetuU5Gs_S-yQcZ0mc1Cby5GXUPKgEPMAujj9Ja7qkzGCuhU7Vnnk2MCp7ngLMxynpsOafPpV8_jmuOyLa8ToPEWtezpCmZtTPZYR9svmoIdZ9sESkWDA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4tDnZ1-P6jHiJUhgAneI7osHNdC2c2IZ9_LhmRhOlQwahinAG5L3dpejECEFmiRYpDJIZLnYRDUH7cgjPKXaaz_7qO1WwpmDywFxoAJI59aZCvYn99jcdcWvvUr2M7JnvcU1JHgXc9nNgZ4n31fRHmpHW1NcY2j2zfrbW8s6QxPW-t9yNRaSynF_WGBNsmVaU6d7Mal5T8FRHnL2MQN9uCzXAW1l340UjDY_n4dkfM2Vq9GYNp3imoIqLQLTSm9rY3rXWwtBKwzs",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB7kftjOB4DNU2AqzOvfQLUk8dnWple-b9SWyfJT2_mSGDBoinOnmrT0Z3MbBixnjYwP703r8ijxetBLdsTmSlNCruiv-FWY4evwZAYmap7EtG-F4lTw191PDDXKgvW2F22Goq44zL4FzQDYq_dteNeUoCQPVqTAciRXoADS_cQEApBnMIuMw8RQNMOrOUg7fIqSW4DiBxc8qoUDID7NKM6tefW89eIGPjiZ8c6bTP53dIPHkLmL7O0VsoqgB_pAiwae1M1NBXPfiU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDIWhsPb7K0oWYUduk76iBbf-AdcjJjzzp1kABPhxBnb2Uk0DM13OcKszhC10G0HZ5krL7hGrp0srA_sCkJhZUxnKgbMVLLFyQ-0DoYBpjINiFpN5UnKq9yz0VcU-W3rD946CNTFBP-mvwq4Z96ZW5reS_kTas1cj-_8ladi4iaLYJx_yghxCrte-omzI3qWE13wRlI41f2irkkKO-3trOFqRZr6qTYj9KmeFBAUW88Rx8qxO8RUWkRgNUn-XBFMgPhtuCstsVeFR0",
];

const RECOMMENDATION_API_BASE_URL =
  import.meta.env.VITE_RECOMMENDATION_SERVICE_URL ??
  import.meta.env.VITE_RECOMMENDATION_API_URL ??
  "http://localhost:8004";

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
  return recommendations;
}

export function searchRecommendations(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return recommendations;
  }

  const tokens = normalizedQuery
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2 && !SEARCH_STOP_WORDS.has(token));

  if (tokens.length === 0) {
    return recommendations;
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
    .map(({ recommendation }) => recommendation);
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

export async function searchLiveRestaurantRecommendations(query) {
  const data = await getRestaurantRecommendations({
    userId: "frontend-demo-user",
    query,
    preferences: {},
  });

  return {
    recommendations: (data.recommendations ?? []).map((item, index) =>
      toRecommendationCardModel(item, index),
    ),
    source: data.source ?? "fallback",
  };
}

function toRecommendationCardModel(item, index) {
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
      label: index === 0 ? "Best match" : "AI Pick",
    },
    image: {
      alt: title,
      src: pickRecommendationImage(`${restaurantName}:${title}`),
    },
    reason: item.reason ?? "Matched against the live restaurant catalog.",
    tags: matchedFactors.slice(0, 4),
  };
}

function pickRecommendationImage(seed) {
  const hash = String(seed)
    .split("")
    .reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);

  return RECOMMENDATION_IMAGES[hash % RECOMMENDATION_IMAGES.length];
}
