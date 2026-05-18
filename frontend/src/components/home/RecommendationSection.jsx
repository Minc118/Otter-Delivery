import EmptyState from "../ui/EmptyState.jsx";
import RecommendationCard from "./RecommendationCard.jsx";

export default function RecommendationSection({ activeQuery, recommendations }) {
  return (
    <section
      className="px-margin-x py-stack-lg max-w-container-max mx-auto"
      id="recommendations"
    >
      <div className="flex items-center gap-2 mb-stack-lg">
        <span
          className="material-symbols-outlined text-tertiary-fixed-dim"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <div>
          <h2 className="font-section-title text-section-title text-on-surface">
            {activeQuery
              ? "AI matches for your craving"
              : "Today's Recommendations"}
          </h2>
          {activeQuery ? (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Showing mock results for “{activeQuery}”.
            </p>
          ) : null}
        </div>
      </div>
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Try a broader craving like vegetarian, warm, spicy, comfort, or quick."
          icon="search_off"
          title="No matching mock recommendations"
        />
      )}
    </section>
  );
}
