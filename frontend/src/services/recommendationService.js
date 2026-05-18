import { recommendations } from "../data/recommendations.js";

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
