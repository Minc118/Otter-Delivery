import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell.jsx";
import {
  getProfile,
  getOrders,
  isProfileServiceUnavailable,
} from "../services/profileService.js";
import { searchLiveRestaurantRecommendations } from "../services/recommendationService.js";
import { getRestaurantById } from "../services/catalogService.js";
import ProfileSummary from "../components/profile/ProfileSummary.jsx";
import ProfileSettingsDetails from "../components/profile/ProfileSettingsDetails.jsx";

const profileSettings = {
  language: {
    selected: "en",
    options: [
      { value: "en", label: "English" },
      { value: "de", label: "Deutsch" },
    ],
  },
  translation: {
    autoTranslateMenus: true,
    showOriginalNames: false,
  },
  dietary: [
    { id: "vegetarian", label: "Vegetarian", selected: false },
    { id: "vegan", label: "Vegan", selected: false },
    { id: "healthy", label: "Healthy", selected: false },
    { id: "spicy", label: "Spicy", selected: false },
    { id: "halal", label: "Halal", selected: false },
  ],
  notifications: {
    orderUpdates: true,
    aiRecommendations: true,
    promotionalOffers: false,
  },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [restaurantNames, setRestaurantNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [activeSettingsSection, setActiveSettingsSection] = useState("account");

  useEffect(() => {
    document.title = "My Profile - Otter Delivery";

    async function loadProfilePage() {
      const storedProfile = JSON.parse(localStorage.getItem("profile"));

      if (!storedProfile) {
        setLoading(false);
        return;
      }

      let activeProfile = storedProfile;
      setProfile(storedProfile);

      try {
        activeProfile = await getProfile(storedProfile.id);
        localStorage.setItem("profile", JSON.stringify(activeProfile));
        setProfile(activeProfile);
      } catch {
        activeProfile = storedProfile;
      }

      let loadedOrders = [];

      try {
        loadedOrders = await getOrders(activeProfile.id);
        setOrders(loadedOrders);
      } catch (error) {
        setProfileError(
            isProfileServiceUnavailable(error)
                ? "Profile service is currently unavailable"
                : "Profile data could not be loaded",
        );
      }

      try {
        const loadedRecommendations =
            await searchLiveRestaurantRecommendations();

        setRecommendations(loadedRecommendations.recommendations);
      } catch {
        setRecommendations([]);
      }

      try {
        const names = {};

        for (const order of loadedOrders) {
          if (!names[order.restaurantId]) {
            const restaurant = await getRestaurantById(order.restaurantId);
            names[order.restaurantId] = restaurant.name;
          }
        }

        setRestaurantNames(names);
      } catch {
        setRestaurantNames({});
      } finally {
        setLoading(false);
      }
    }

    loadProfilePage();
  }, []);

  if (loading) {
    return (
        <div className="bg-background min-h-screen">
          <PageShell className="py-stack-lg">
            <p className="text-on-surface-variant">Loading profile...</p>
          </PageShell>
        </div>
    );
  }

  if (!profile) {
    return (
        <div className="bg-background min-h-screen">
          <PageShell className="py-stack-lg">
            <p className="text-on-surface-variant">
              Please log in to view your profile.
            </p>
          </PageShell>
        </div>
    );
  }

  const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`;

  const profileUser = {
    ...profile,
    name: fullName || profile.username,
    handle: `@${profile.username}`,
    avatar: {
      alt: profile.username ?? "User avatar",
      initials: initials || "U",
      src: localStorage.getItem(`avatar:${profile.id}`) ?? "",
    },
  };

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
                insight={`You have placed ${orders.length} order${
                    orders.length === 1 ? "" : "s"
                }.`}
                onSettingsSectionChange={setActiveSettingsSection}
                user={profileUser}
            />

            <main className="md:col-span-8 space-y-gutter">
              {profileError ? (
                  <section className="bg-white rounded-2xl border border-surface p-4 shadow-sm">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {profileError}
                    </p>
                  </section>
              ) : null}

              <ProfileSettingsDetails
                  activeSection={activeSettingsSection}
                  onUserUpdate={(updatedProfile) => setProfile(updatedProfile)}
                  settings={profileSettings}
                  user={profileUser}
              />


              {activeSettingsSection === "orders" ? (
                  <section className="bg-white rounded-2xl border border-surface p-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-on-surface mb-4">
                      Order History
                    </h2>

                    {orders.length === 0 ? (
                        <p className="text-on-surface-variant">
                          You have no orders yet.
                        </p>
                    ) : (
                        <div className="space-y-4">
                          {orders.map((order) => {
                            const item = order.items?.[0];

                            return (
                                <article
                                    key={order.id}
                                    className="rounded-xl border border-surface p-4 flex justify-between gap-4"
                                >
                                  <div>
                                    <h3 className="font-bold text-on-surface">
                                      {restaurantNames[order.restaurantId] ?? "Restaurant"}
                                    </h3>

                                    <p className="text-sm text-on-surface-variant">
                                      {item?.itemName}
                                    </p>

                                    <p className="text-sm text-on-surface-variant">
                                      Quantity: {item?.quantity}
                                    </p>
                                  </div>

                                  <div className="text-right">
                <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-primary">
                  {order.status}
                </span>

                                    <p className="font-bold mt-3">
                                      €{order.totalPrice}
                                    </p>
                                  </div>
                                </article>
                            );
                          })}
                        </div>
                    )}
                  </section>
              ) : null}
            </main>
          </div>
        </PageShell>
      </div>
  );
}
