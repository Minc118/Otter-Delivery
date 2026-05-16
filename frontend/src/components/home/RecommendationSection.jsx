import { getRecommendations } from "../../services/recommendationService.js";
import RecommendationCard from "./RecommendationCard.jsx";

export default function RecommendationSection() {
  const recommendations = getRecommendations();

  return (
    <section className="px-margin-x py-stack-lg max-w-container-max mx-auto">
      <div className="flex items-center gap-2 mb-stack-lg">
        <span
          className="material-symbols-outlined text-tertiary-fixed-dim"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <h2 className="font-section-title text-section-title text-on-surface">
          Today's Recommendations
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
          />
        ))}
      </div>
    </section>
  );
}
