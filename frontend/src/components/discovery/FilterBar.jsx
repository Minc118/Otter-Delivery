const filterGroups = [
  {
    label: "Category",
    options: ["Category", "Healthy", "Asian", "Italian", "Fast Food"],
  },
  {
    label: "Dietary Preference",
    options: ["Dietary Preference", "Vegetarian", "Vegan", "Gluten-Free"],
  },
  {
    label: "Price Range",
    options: ["Price Range", "€ (Under €10)", "€€ (€10 - €25)", "€€€ (Over €25)"],
  },
  {
    label: "Delivery Time",
    options: ["Delivery Time", "Approx. 40 min"],
  },
  {
    label: "Rating",
    options: ["Rating", "4.5+", "4.0+", "3.5+"],
  },
];

export default function FilterBar() {
  return (
    <section className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-sm sticky top-24 z-40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {filterGroups.map((group) => (
            <label className="relative" key={group.label}>
              <span className="sr-only">{group.label}</span>
              <select className="otter-select bg-surface-container-low border border-surface-variant text-on-surface font-metadata text-metadata rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer">
                {group.options.map((option) => (
                  <option key={option}>{option}</option>
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
            <select className="otter-select otter-select-primary bg-transparent font-button text-button text-primary border-none focus:ring-0 cursor-pointer pr-6 font-semibold">
              <option>Recommended</option>
              <option>Rating (High to Low)</option>
              <option>Delivery Time</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
