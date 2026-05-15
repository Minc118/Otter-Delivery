import { getRankingAiPicks } from "../../services/rankingService.js";
import AIPickCard from "./AIPickCard.jsx";

export default function AIPicksSection() {
  const picks = getRankingAiPicks();

  return (
    <section className="bg-surface-light rounded-xl p-stack-lg mb-stack-lg relative overflow-hidden border border-tertiary-fixed-dim">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      <div className="flex items-center gap-3 mb-stack-md relative z-10">
        <div className="bg-white p-2 rounded-full shadow-sm text-tertiary">
          <span className="material-symbols-outlined text-[28px]">
            auto_awesome
          </span>
        </div>
        <div>
          <h3 className="font-section-title text-section-title text-dark-text">
            AI Picks For You
          </h3>
          <p className="font-body-md text-body-md text-on-tertiary-fixed-variant">
            Based on your recent cravings for spicy food.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter relative z-10">
        {picks.map((pick) => (
          <AIPickCard key={pick.id} pick={pick} />
        ))}
      </div>
    </section>
  );
}
