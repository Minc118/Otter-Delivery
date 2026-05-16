import {
  rankedRestaurants,
  rankingAiPicks,
  rankingCategories,
} from "../data/rankings.js";

export function getRankingCategories() {
  return rankingCategories;
}

export function getRankedRestaurants() {
  return rankedRestaurants;
}

export function getRankingAiPicks() {
  return rankingAiPicks;
}
