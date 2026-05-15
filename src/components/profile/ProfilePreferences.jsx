import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";

export default function ProfilePreferences({ preferences }) {
  return (
    <Card
      className="p-6 transition-all duration-300"
      hover
    >
      <div className="flex justify-between items-center mb-6 border-b border-surface pb-4">
        <h2 className="font-section-title text-section-title text-on-surface">
          Food Preferences
        </h2>
        <button
          className="text-primary-container hover:text-primary transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <PreferencePanel icon="restaurant" title="Favorite Cuisines">
          <div className="flex flex-wrap gap-2">
            {preferences.cuisines.map((cuisine) => (
              <span
                className="bg-surface text-dark-text px-3 py-1 rounded-full font-metadata text-metadata border border-outline-variant"
                key={cuisine}
              >
                {cuisine}
              </span>
            ))}
            <button
              className="bg-transparent text-outline px-3 py-1 rounded-full font-metadata text-metadata border border-dashed border-outline-variant cursor-pointer hover:bg-surface-container transition-colors"
              type="button"
            >
              + Add
            </button>
          </div>
        </PreferencePanel>

        <PreferencePanel icon="eco" title="Dietary Needs">
          <div className="flex flex-wrap gap-2">
            {preferences.dietaryNeeds.map((need) => (
              <span
                className="bg-[#c6eae7] text-on-primary-fixed-variant px-3 py-1 rounded-full font-metadata text-metadata"
                key={need}
              >
                {need}
              </span>
            ))}
          </div>
        </PreferencePanel>

        <PreferencePanel
          icon="local_fire_department"
          iconClassName="text-[#ba1a1a]"
          title="Spice Preference"
        >
          <div className="flex items-center space-x-1">
            {Array.from({ length: preferences.spiceLevel.max }).map((_, index) => {
              const isActive = index < preferences.spiceLevel.value;

              return (
                <span
                  className={
                    isActive
                      ? "material-symbols-outlined text-[#ba1a1a]"
                      : "material-symbols-outlined text-outline-variant"
                  }
                  key={index}
                  style={
                    isActive
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  local_fire_department
                </span>
              );
            })}
            <span className="ml-2 font-metadata text-metadata text-on-surface-variant">
              {preferences.spiceLevel.label}
            </span>
          </div>
        </PreferencePanel>

        <PreferencePanel icon="payments" title="Price Range">
          <div className="flex items-center space-x-2">
            <span className="font-card-title text-card-title text-on-surface">
              {preferences.priceRange.display}
            </span>
            <span className="font-body-md text-body-md text-on-surface-variant">
              - {preferences.priceRange.label}
            </span>
          </div>
        </PreferencePanel>
      </div>

      <div className="mt-6 flex justify-end">
        <Button className="rounded-[16px]">
          Manage Preferences
        </Button>
      </div>
    </Card>
  );
}

function PreferencePanel({ children, icon, iconClassName = "", title }) {
  return (
    <div className="bg-surface-container-low rounded-lg p-4">
      <div className="flex items-center mb-3 text-on-surface">
        <span className={`material-symbols-outlined mr-2 ${iconClassName}`}>
          {icon}
        </span>
        <h3 className="font-card-title text-card-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}
