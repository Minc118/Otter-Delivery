const filters = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "on-the-way", label: "On the way" },
];

export default function OrderHistoryFilters({ activeFilter, onFilterChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = filter.key === activeFilter;

        return (
          <button
            className={
              isActive
                ? "px-4 py-2 rounded-full bg-primary-container text-on-primary font-metadata text-metadata shadow-[0_2px_8px_rgba(36,36,38,0.08)] cursor-pointer active:scale-95 transition-all"
                : "px-4 py-2 rounded-full bg-surface text-on-surface border border-primary-light/50 hover:bg-primary-light/10 font-metadata text-metadata cursor-pointer active:scale-95 transition-all"
            }
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            type="button"
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
