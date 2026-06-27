import Card from "../ui/Card.jsx";
import ProfileSettingsPanel from "./ProfileSettingsPanel.jsx";

export default function ProfileSummary({
                                         activeSettingsSection,
                                         insight,
                                         onSettingsSectionChange,
                                         user,
                                       }) {
  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const storedProfile = JSON.parse(localStorage.getItem("profile"));

      localStorage.setItem(`avatar:${storedProfile.id}`, reader.result);

      window.location.reload();
    };

    reader.readAsDataURL(file);
  }

  return (
      <div className="md:col-span-4 space-y-gutter">
        <Card className="p-6 relative transition-all duration-300" hover>
          <div className="absolute top-0 right-0 w-32 h-32 bg-surface rounded-bl-full opacity-50 -z-10" />

          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-surface shadow-sm">
              {user.avatar.src ? (
                  <img
                      alt={user.avatar.alt}
                      className="w-full h-full object-cover"
                      src={user.avatar.src}
                  />
              ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-container text-white font-bold text-xl">
                    {user.avatar.initials}
                  </div>
              )}
            </div>

            <h2 className="font-card-title text-card-title text-on-surface mb-1">
              {user.name}
            </h2>

            <p className="font-body-md text-body-md text-outline mb-4">
              {user.email}
            </p>

            <div className="flex items-center justify-center space-x-2 text-on-surface-variant font-metadata text-metadata bg-surface-container-low px-3 py-1.5 rounded-full mb-6">
            <span className="material-symbols-outlined text-[18px]">
              location_on
            </span>
              <span>{user.city ?? "Berlin"}</span>
            </div>

            <label className="w-full rounded-[16px] border border-primary-container px-4 py-3 text-primary-container font-button text-button hover:bg-surface-container-low transition-colors cursor-pointer inline-flex items-center justify-center">
            <span className="material-symbols-outlined mr-1 text-[20px]">
              edit
            </span>
              Edit Profile Picture

              <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
              />
            </label>
          </div>
        </Card>


        <ProfileSettingsPanel
            activeSection={activeSettingsSection}
            onSectionChange={onSettingsSectionChange}
        />
      </div>
  );
}