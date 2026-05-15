import { getRankingCategories } from "../../services/rankingService.js";
import Button from "../ui/Button.jsx";

export default function RankingFilterTabs() {
  const categories = getRankingCategories();

  return (
    <section className="mb-stack-lg">
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {categories.map((category) => (
          <Button
            className={
              category.ai
                ? "bg-surface-light text-dark-text px-6 py-3 rounded-[16px] border border-tertiary-fixed-dim hover:bg-tertiary-fixed"
                : category.active
                  ? "bg-primary-container text-white px-6 py-3 rounded-[16px] hover:bg-[#3A5B59]"
                  : "bg-surface text-on-surface px-6 py-3 rounded-[16px] border border-surface-container-high hover:border-primary-light hover:bg-surface"
            }
            key={category.id}
            variant={category.active ? "primary" : "ghost"}
          >
            {category.icon ? (
              <span className="material-symbols-outlined text-[20px]">
                {category.icon}
              </span>
            ) : null}
            {category.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
