import { useEffect, useState } from "react";
import AIFoodSearch from "../components/home/AIFoodSearch.jsx";
import RecommendationSection from "../components/home/RecommendationSection.jsx";
import { getRestaurants } from "../services/catalogService.js";
import {
  getHomepageRestaurantRecommendations,
  searchRecommendations,
  searchLiveRestaurantRecommendations,
} from "../services/recommendationService.js";

export default function HomePage() {
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState(null);
  const [recommendationSource, setRecommendationSource] = useState("restaurant-service");
  const [recommendations, setRecommendations] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    document.title = "Otter Delivery - AI-Powered Food Discovery";
  }, []);

  useEffect(() => {
    loadHomepageRecommendations();
  }, []);

  async function loadHomepageRecommendations() {
    setStatus("loading");
    setError(null);
    setRecommendationSource("restaurant-service");

    try {
      const restaurants = await getRestaurants();
      const restaurantRecommendations =
        getHomepageRestaurantRecommendations(restaurants);
      const liveRestaurantIds = new Set(
        restaurants.map((restaurant) => String(restaurant.restaurantId ?? restaurant.id)),
      );

      try {
        const ranked = await searchLiveRestaurantRecommendations();
        const rankedIds = new Set();
        const rankedRecommendations = ranked.recommendations.filter((recommendation) => {
          const restaurantId = String(recommendation.restaurant.id);
          if (!liveRestaurantIds.has(restaurantId) || rankedIds.has(restaurantId)) {
            return false;
          }
          rankedIds.add(restaurantId);
          return true;
        });
        const fillRecommendations = restaurantRecommendations.filter(
          (recommendation) => !rankedIds.has(String(recommendation.restaurant.id)),
        );
        const homepageRecommendations = [
          ...rankedRecommendations,
          ...fillRecommendations,
        ].slice(0, 6);

        setRecommendations(homepageRecommendations);
        setRecommendationSource(ranked.source);
        setStatus(homepageRecommendations.length > 0 ? "success" : "empty");
      } catch {
        setRecommendations(restaurantRecommendations);
        setStatus(restaurantRecommendations.length > 0 ? "success" : "empty");
      }
    } catch {
      setRecommendations([]);
      setError("Restaurant Service is unavailable. Today's recommendations could not be loaded.");
      setStatus("unavailable");
    }
  }

  async function handleSearch(query) {
    const trimmedQuery = query.trim();

    setActiveQuery(trimmedQuery);
    setError(null);

    if (!trimmedQuery) {
      await loadHomepageRecommendations();
      return;
    }

    setStatus("loading");
    setRecommendationSource("live");

    try {
      const result = await searchLiveRestaurantRecommendations(trimmedQuery);
      setRecommendations(result.recommendations);
      setRecommendationSource(result.source);
      setStatus(result.recommendations.length > 0 ? "success" : "empty");
    } catch (searchError) {
      const localMatches = searchRecommendations(trimmedQuery);
      setRecommendations(localMatches);
      setRecommendationSource("mock");
      setError("Recommendation Service is unavailable. Showing local fallback matches.");
      setStatus(localMatches.length > 0 ? "fallback" : "unavailable");
    } finally {
      requestAnimationFrame(() => {
        document
          .getElementById("recommendations")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  return (
    <>
      <AIFoodSearch onSearch={handleSearch} />
      <RecommendationSection
        activeQuery={activeQuery}
        error={error}
        recommendations={recommendations}
        source={recommendationSource}
        status={status}
      />
    </>
  );
}
