import Card from "../ui/Card.jsx";

const settingsSections = [
  {
    key: "language",
    icon: "language",
    title: "Manage language",
    description: "App language and menu translation.",
  },
  {
    key: "dietary",
    icon: "restaurant",
    title: "Dietary preferences",
    description: "Dietary tags and allergy warnings.",
  },
  {
    key: "notifications",
    icon: "notifications",
    title: "Notifications",
    description: "Order updates and AI recommendations.",
  },
  {
    key: "account",
    icon: "person",
    title: "Account preferences",
    description: "Email, password, and account actions.",
  },
];

export default function ProfileSettingsPanel({
  activeSection,
  onSectionChange,
}) {
  return (
    <Card className="p-6 flex flex-col gap-stack-md">
      <div>
        <h3 className="font-section-title text-section-title text-on-surface">
          Settings
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Manage language, dietary, notification, and account preferences.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {settingsSections.map((section) => {
          const isActive = section.key === activeSection;

          return (
            <button
              className={
                isActive
                  ? "flex items-start gap-3 p-3 rounded-lg bg-surface-container-low text-primary text-left transition-colors"
                  : "flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low text-on-surface-variant text-left transition-colors"
              }
              key={section.key}
              onClick={() => onSectionChange(section.key)}
              type="button"
            >
              <span
                className="material-symbols-outlined mt-0.5"
                style={
                  isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
                }
              >
                {section.icon}
              </span>
              <span>
                <span className="block font-button text-button">
                  {section.title}
                </span>
                <span className="block font-metadata text-metadata text-on-surface-variant mt-1">
                  {section.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
