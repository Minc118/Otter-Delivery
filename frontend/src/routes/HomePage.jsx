import { useEffect, useState } from "react";
import AIFoodSearch from "../components/home/AIFoodSearch.jsx";
import RecommendationSection from "../components/home/RecommendationSection.jsx";
import {
  getRecommendations,
  searchRecommendations,
} from "../services/recommendationService.js";

export default function HomePage() {
  const [activeQuery, setActiveQuery] = useState("");
  const [recommendations, setRecommendations] = useState(getRecommendations());

  useEffect(() => {
    document.title = "Otter Delivery - AI-Powered Food Discovery";
  }, []);

  function handleSearch(query) {
    const trimmedQuery = query.trim();

    setActiveQuery(trimmedQuery);
    setRecommendations(searchRecommendations(trimmedQuery));

    if (trimmedQuery) {
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
        recommendations={recommendations}
      />
    </>
  );
}
