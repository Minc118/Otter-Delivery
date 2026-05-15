import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell.jsx";
import ProfilePreferences from "../components/profile/ProfilePreferences.jsx";
import ProfileSettingsDetails from "../components/profile/ProfileSettingsDetails.jsx";
import ProfileSummary from "../components/profile/ProfileSummary.jsx";
import RecentOrdersCard from "../components/profile/RecentOrdersCard.jsx";
import SavedRestaurantsCard from "../components/profile/SavedRestaurantsCard.jsx";
import { getCurrentUserProfile } from "../services/userService.js";

export default function ProfilePage() {
  const profile = getCurrentUserProfile();
  const [activeSettingsSection, setActiveSettingsSection] =
    useState("language");

  useEffect(() => {
    document.title = "My Profile - Otter Delivery";
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <PageShell className="py-stack-lg">
        <header className="mb-stack-lg">
          <h1 className="font-page-title text-page-title text-on-surface">
            My Profile
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <ProfileSummary
            activeSettingsSection={activeSettingsSection}
            insight={profile.discoveryInsight}
            onSettingsSectionChange={setActiveSettingsSection}
            user={profile.user}
          />

          <div className="md:col-span-8 space-y-gutter">
            <ProfileSettingsDetails
              activeSection={activeSettingsSection}
              settings={profile.settings}
              user={profile.user}
            />

            <ProfilePreferences preferences={profile.preferences} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <SavedRestaurantsCard restaurants={profile.savedRestaurants} />
              <RecentOrdersCard orders={profile.recentOrders} />
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
