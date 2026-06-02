import EmptyState from "../ui/EmptyState.jsx";
import RecommendationCard from "./RecommendationCard.jsx";

export default function RecommendationSection({
  activeQuery,
  error,
  recommendations,
  source,
  status,
}) {
  const isLoading = status === "loading";
  const isServiceUnavailable = status === "unavailable";
  const sourceLabel = source === "hybrid" ? "Gemini rerank + fallback scoring" : source;

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
          {activeQuery && !error ? (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Searching the live restaurant catalog for “{activeQuery}”
              {sourceLabel ? ` using ${sourceLabel}.` : "."}
            </p>
          ) : null}
          {error ? (
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      {isLoading ? (
        <EmptyState
          description="Asking the Recommendation Service to score the live restaurant catalog."
          icon="auto_awesome"
          title="Finding live matches"
        />
      ) : recommendations.length > 0 ? (
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
          description={
            isServiceUnavailable
              ? "The Recommendation Service could not be reached and the local fallback had no matching cards."
              : activeQuery
                ? "The live catalog loaded, but no restaurant matched this craving."
                : "No recommendation data is loaded yet."
          }
          icon="search_off"
          title={
            isServiceUnavailable
              ? "Recommendation service unavailable"
              : activeQuery
                ? "No recommendation found"
                : "No recommendations loaded"
          }
        />
      )}
    </section>
  );
}
