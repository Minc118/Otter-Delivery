import { useEffect } from "react";
import PageShell from "../components/layout/PageShell.jsx";
import AIPicksSection from "../components/ranking/AIPicksSection.jsx";
import RankingFilterTabs from "../components/ranking/RankingFilterTabs.jsx";
import RankingList from "../components/ranking/RankingList.jsx";

export default function RankingPage() {
  useEffect(() => {
    document.title = "Restaurant Rankings - Otter Delivery";
  }, []);

  return (
    <PageShell as="main" className="py-stack-lg min-h-screen">
      <section className="mb-stack-lg text-center md:text-left">
        <h1 className="font-display-hero text-display-hero text-on-surface mb-stack-sm">
          Restaurant Rankings
        </h1>
        <p className="font-section-title text-section-title text-on-surface-variant">
          Discover what people love today.
        </p>
      </section>

      <RankingFilterTabs />
      <RankingList />
      <AIPicksSection />
    </PageShell>
  );
}
