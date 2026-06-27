import { useState } from "react";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import { updateProfile } from "../../services/profileService.js";
import {
    getUserPreferences,
    updateUserPreferences,
} from "../../services/recommendationService.js";
import { useNavigate } from "react-router-dom";

const sectionCopy = {
    account: {
        icon: "person",
        title: "Account preferences",
        description: "Manage your personal information.",
    },
    preferences: {
        icon: "restaurant",
        title: "Food Preferences",
        description: "Save your favorite cuisines and dietary needs.",
    },
    orders: {
        icon: "receipt_long",
        title: "Order History",
        description: "View your previous orders.",
    },
};

export default function ProfileSettingsDetails({
  activeSection,
  settings,
  user,
}) {
  const [language, setLanguage] = useState(settings.language.selected);
  const [translation, setTranslation] = useState(settings.translation);
  const [dietary, setDietary] = useState(settings.dietary);
  const [notifications, setNotifications] = useState(settings.notifications);
  const copy = sectionCopy[activeSection] ?? sectionCopy.language;

  const toggleDietary = (id) => {
    setDietary((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  return (
    <Card className="p-6 shadow-sm flex flex-col gap-stack-md">
      <div className="flex items-start justify-between gap-4 border-b border-surface pb-stack-md">
        <div>
          <div className="flex items-center gap-3 text-primary-container mb-2">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {copy.icon}
            </span>
            <h2 className="font-section-title text-section-title text-on-surface">
              {copy.title}
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {copy.description}
          </p>
        </div>
      </div>

      {activeSection === "language" ? (
        <LanguageSettings
          language={language}
          languageOptions={settings.language.options}
          onLanguageChange={setLanguage}
          onTranslationChange={setTranslation}
          translation={translation}
        />
      ) : null}

        {activeSection === "preferences" ? (
            <FoodPreferencesSettings user={user} />
        ) : null}

      {activeSection === "notifications" ? (
        <NotificationSettings
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />
      ) : null}

        {activeSection === "account" ? (
            <AccountSettings user={user} />
        ) : null}    </Card>
  );
}

function LanguageSettings({
  language,
  languageOptions,
  onLanguageChange,
  onTranslationChange,
  translation,
}) {
  return (
    <div className="flex flex-col gap-stack-md">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h3 className="font-card-title text-card-title text-on-surface">
            App Language
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Select the main language for the Otter Delivery interface.
          </p>
        </div>
        <div className="relative min-w-[220px]">
          <select
            className="w-full appearance-none bg-surface-container-low border border-surface text-on-surface font-body-md text-body-md rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent"
            onChange={(event) => onLanguageChange(event.target.value)}
            value={language}
          >
            {languageOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      <div className="h-px bg-surface" />

      <ToggleRow
        checked={translation.autoTranslateMenus}
        description="Automatically translate restaurant menus and dish descriptions to your app language using AI."
        label="Auto-translate menus"
        onChange={() =>
          onTranslationChange((current) => ({
            ...current,
            autoTranslateMenus: !current.autoTranslateMenus,
          }))
        }
      />
      <ToggleRow
        checked={translation.showOriginalNames}
        description="Display original dish names alongside translations."
        label="Show original names"
        onChange={() =>
          onTranslationChange((current) => ({
            ...current,
            showOriginalNames: !current.showOriginalNames,
          }))
        }
      />
    </div>
  );
}

function DietarySettings({ dietary, onToggleDietary }) {
  return (
    <div className="flex flex-col gap-stack-md">
      <p className="font-body-md text-body-md text-on-surface-variant">
        We'll highlight dishes that match your preferences and warn you about
        potential conflicts.
      </p>
      <div className="flex flex-wrap gap-3">
        {dietary.map((item) => (
          <button
            className={
              item.selected
                ? "px-4 py-2 rounded-full border border-primary-container bg-primary-container text-white font-button text-button hover:bg-secondary transition-colors inline-flex items-center gap-2"
                : "px-4 py-2 rounded-full border border-primary-container bg-surface-container-lowest text-primary-container font-button text-button hover:bg-surface-container-low transition-colors"
            }
            key={item.id}
            onClick={() => onToggleDietary(item.id)}
            type="button"
          >
            {item.selected ? (
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check
              </span>
            ) : null}
            {item.label}
          </button>
        ))}
        <button
          className="px-4 py-2 rounded-full border border-surface bg-surface-container-lowest text-on-surface-variant font-button text-button hover:bg-surface-container-low transition-colors inline-flex items-center gap-2"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add allergy
        </button>
      </div>
      <div className="p-4 bg-surface-light rounded-lg flex gap-3 items-start border border-tertiary-fixed-dim">
        <span
          className="material-symbols-outlined text-tertiary mt-0.5"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          temp_preferences_custom
        </span>
        <div>
          <h4 className="font-button text-button text-on-tertiary-container">
            AI Dietary Assistant Active
          </h4>
          <p className="font-metadata text-metadata text-on-tertiary-container mt-1">
            Otter analyzes ingredient lists to verify your preferences across
            translations.
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings({ notifications, onNotificationsChange }) {
  return (
    <div className="flex flex-col gap-2">
      <ToggleRow
        checked={notifications.orderUpdates}
        description="Push notifications for delivery tracking and status changes."
        label="Order Updates"
        onChange={() =>
          onNotificationsChange((current) => ({
            ...current,
            orderUpdates: !current.orderUpdates,
          }))
        }
      />
      <div className="h-px bg-surface" />
      <ToggleRow
        checked={notifications.aiRecommendations}
        description="Weekly curated lists based on your past orders and dietary profile."
        label="AI Recommendations"
        onChange={() =>
          onNotificationsChange((current) => ({
            ...current,
            aiRecommendations: !current.aiRecommendations,
          }))
        }
      />
      <div className="h-px bg-surface" />
      <ToggleRow
        checked={notifications.promotionalOffers}
        description="Discounts, special events, and partner restaurant updates."
        label="Promotional Offers"
        onChange={() =>
          onNotificationsChange((current) => ({
            ...current,
            promotionalOffers: !current.promotionalOffers,
          }))
        }
      />
    </div>
  );
}

function AccountSettings({ user }) {
    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem("profile");
        localStorage.removeItem("cart");
        localStorage.removeItem("activeOrder");

        navigate("/login", { replace: true });
    }
    const [formData, setFormData] = useState({
        username: user.username ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
        street: user.street ?? "",
        city: user.city ?? "",
        postalCode: user.postalCode ?? "",
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const updatedProfile = await updateProfile(user.id, {
                ...user,
                ...formData,
            });

            localStorage.setItem("profile", JSON.stringify(updatedProfile));
            setMessage("Profile updated successfully.");
        } catch (error) {
            console.error(error);
            setMessage("Could not update profile.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-stack-md"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AccountInput
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                />

                <AccountInput
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                />

                <AccountInput
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                />

                <AccountInput
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                />

                <AccountInput
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                />

                <AccountInput
                    label="Street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                />

                <AccountInput
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                />

                <AccountInput
                    label="Postal Code"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                />
            </div>

            <div className="mt-2 pt-4 border-t border-surface flex justify-between items-center gap-4">

                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleLogout}
                >
                    Log out
                </Button>

                <p
                    className={`font-metadata text-metadata ${
                        message.includes("successfully")
                            ? "text-green-600"
                            : "text-error"
                    }`}
                >
                    {message}
                </p>

                <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>

            </div>
        </form>
    );
}

function FoodPreferencesSettings({ user }) {
    const cuisineOptions = ["Italian", "Korean", "Japanese", "Mexican", "Indian", "Turkish"];
    const dietaryOptions = ["Vegetarian", "Vegan", "Halal", "Gluten-free", "Healthy", "Spicy"];

    const [favoriteCuisines, setFavoriteCuisines] = useState([]);
    const [dietaryPreferences, setDietaryPreferences] = useState([]);
    const [allergens, setAllergens] = useState("");
    const [dislikedIngredients, setDislikedIngredients] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    function toggleValue(value, setter) {
        setter((current) =>
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
        );
    }

    async function handleSave() {
        setSaving(true);
        setMessage("");

        try {
            await updateUserPreferences(String(user.id), {
                language: "en",
                cuisinePreferences: favoriteCuisines.map((item) => item.toLowerCase()),
                dietaryPreferences: dietaryPreferences.map((item) => item.toLowerCase()),
                allergens: allergens
                    .split(",")
                    .map((item) => item.trim().toLowerCase())
                    .filter(Boolean),
                dislikedIngredients: dislikedIngredients
                    .split(",")
                    .map((item) => item.trim().toLowerCase())
                    .filter(Boolean),
                maxPrice: maxPrice ? Number(maxPrice) : null,
                metadata: {},
            });

            setMessage("Preferences saved successfully.");
        } catch (error) {
            console.error(error);
            setMessage("Could not save preferences.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-stack-md">
            <PreferenceGroup
                title="Favorite cuisines"
                description="Choose cuisines you usually enjoy."
                options={cuisineOptions}
                selected={favoriteCuisines}
                onToggle={(value) => toggleValue(value, setFavoriteCuisines)}
            />

            <PreferenceGroup
                title="Dietary preferences"
                description="These preferences can influence your restaurant recommendations."
                options={dietaryOptions}
                selected={dietaryPreferences}
                onToggle={(value) => toggleValue(value, setDietaryPreferences)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AccountInput
                    label="Allergies"
                    name="allergens"
                    value={allergens}
                    onChange={(event) => setAllergens(event.target.value)}
                />

                <AccountInput
                    label="Disliked ingredients"
                    name="dislikedIngredients"
                    value={dislikedIngredients}
                    onChange={(event) => setDislikedIngredients(event.target.value)}
                />

                <AccountInput
                    label="Maximum price"
                    name="maxPrice"
                    type="number"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                />
            </div>

            <div className="mt-2 pt-4 border-t border-surface flex justify-between items-center gap-4">
                <p
                    className={`font-metadata text-metadata ${
                        message.includes("successfully")
                            ? "text-green-600"
                            : "text-error"
                    }`}
                >
                    {message}
                </p>

                <Button type="button" disabled={saving} onClick={handleSave}>
                    {saving ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </div>
    );
}

function PreferenceGroup({ title, description, options, selected, onToggle }) {
    return (
        <div>
            <h3 className="font-card-title text-card-title text-on-surface">
                {title}
            </h3>

            <p className="font-body-md text-body-md text-on-surface-variant mt-1 mb-3">
                {description}
            </p>

            <div className="flex flex-wrap gap-3">
                {options.map((option) => {
                    const active = selected.includes(option);

                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onToggle(option)}
                            className={
                                active
                                    ? "px-4 py-2 rounded-full border border-primary-container bg-primary-container text-white font-button text-button inline-flex items-center gap-2"
                                    : "px-4 py-2 rounded-full border border-primary-container bg-surface-container-lowest text-primary-container font-button text-button hover:bg-surface-container-low transition-colors"
                            }
                        >
                            {active ? (
                                <span className="material-symbols-outlined text-[18px]">
                  check
                </span>
                            ) : null}
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ToggleRow({ checked, description, label, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer p-3 -mx-3 rounded-lg hover:bg-surface-bright transition-colors">
      <span className="flex-1">
        <span className="block font-button text-button text-on-surface">
          {label}
        </span>
        <span className="block font-body-md text-body-md text-on-surface-variant mt-1">
          {description}
        </span>
      </span>
      <span className="relative flex items-center justify-center mt-1">
        <input
          checked={checked}
          className="peer sr-only"
          onChange={onChange}
          type="checkbox"
        />
        <span className="w-11 h-6 bg-surface rounded-full peer-checked:bg-primary-container transition-colors" />
        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
      </span>
    </label>
  );
}

function AccountRow({ action, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="font-metadata text-metadata text-on-surface-variant uppercase tracking-wider">
          {label}
        </div>
        <div className="font-button text-button text-on-surface mt-1">
          {value}
        </div>
      </div>
      <button
        className="text-primary-container font-button text-button hover:underline"
        type="button"
      >
        {action}
      </button>
    </div>
  );
}

function AccountInput({ label, name, value, onChange, type = "text" }) {
    return (
        <label className="block">
      <span className="block font-metadata text-metadata text-on-surface-variant uppercase tracking-wider mb-2">
        {label}
      </span>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full rounded-lg border border-surface bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
            />
        </label>
    );
}
