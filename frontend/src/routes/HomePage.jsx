import { useEffect, useState } from "react";
import AIFoodSearch from "../components/home/AIFoodSearch.jsx";
import RecommendationSection from "../components/home/RecommendationSection.jsx";
import {
  getRecommendations,
  searchRecommendations,
  searchLiveRestaurantRecommendations,
} from "../services/recommendationService.js";

export default function HomePage() {
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState(null);
  const [recommendationSource, setRecommendationSource] = useState("mock");
  const [recommendations, setRecommendations] = useState(getRecommendations());
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    document.title = "Otter Delivery - AI-Powered Food Discovery";
  }, []);

  async function handleSearch(query) {
    const trimmedQuery = query.trim();

    setActiveQuery(trimmedQuery);
    setError(null);

    if (!trimmedQuery) {
      setStatus("idle");
      setRecommendationSource("mock");
      setRecommendations(getRecommendations());
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
