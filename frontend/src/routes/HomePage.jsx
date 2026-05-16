import { useEffect } from "react";
import AIFoodSearch from "../components/home/AIFoodSearch.jsx";
import RecommendationSection from "../components/home/RecommendationSection.jsx";

export default function HomePage() {
  useEffect(() => {
    document.title = "Otter Delivery - AI-Powered Food Discovery";
  }, []);

  return (
    <>
      <AIFoodSearch />
      <RecommendationSection />
    </>
  );
}
