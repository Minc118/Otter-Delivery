const filterGroups = [
  {
    id: "category",
    label: "Category",
    options: [
      ["all", "Category"],
      ["healthy", "Healthy"],
      ["asian", "Asian"],
      ["italian", "Italian"],
      ["burger", "Burger"],
      ["japanese", "Japanese/Sushi"],
      ["turkish", "Turkish/Halal"],
      ["falafel", "Falafel/Mediterranean"],
    ],
  },
  {
    id: "dietary",
    label: "Dietary Preference",
    options: [
      ["all", "Dietary Preference"],
      ["vegetarian", "Vegetarian"],
      ["vegan", "Vegan"],
      ["gluten-free", "Gluten-Free"],
      ["halal", "Halal"],
    ],
  },
  {
    id: "price",
    label: "Price Range",
    options: [
      ["all", "Price Range"],
      ["under-10", "€ (Under €10)"],
      ["10-25", "€€ (€10 - €25)"],
      ["over-25", "€€€ (Over €25)"],
    ],
  },
  {
    id: "delivery",
    label: "Delivery Time",
    options: [
      ["all", "Delivery Time"],
      ["under-40", "Approx. 40 min"],
    ],
  },
  {
    id: "rating",
    label: "Rating",
    options: [
      ["all", "Rating"],
      ["4.5", "4.5+"],
      ["4.0", "4.0+"],
      ["3.5", "3.5+"],
    ],
  },
];

export default function FilterBar({ filters, onFilterChange }) {
  return (
    <section className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {filterGroups.map((group) => (
            <label className="relative" key={group.label}>
              <span className="sr-only">{group.label}</span>
              <select
                className="otter-select bg-surface-container-low border border-surface-variant text-on-surface font-metadata text-metadata rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                onChange={(event) => onFilterChange(group.id, event.target.value)}
                value={filters[group.id]}
              >
                {group.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="font-metadata text-metadata text-on-surface-variant">
            Sort by:
          </span>
          <label className="relative">
            <span className="sr-only">Sort restaurants</span>
            <select
              className="otter-select otter-select-primary bg-transparent font-button text-button text-primary border-none focus:ring-0 cursor-pointer pr-6 font-semibold"
              onChange={(event) => onFilterChange("sort", event.target.value)}
              value={filters.sort}
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Rating (High to Low)</option>
              <option value="delivery">Delivery Time</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
