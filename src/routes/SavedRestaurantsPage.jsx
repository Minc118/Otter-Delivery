import { useEffect } from "react";
import PageShell from "../components/layout/PageShell.jsx";
import SavedRestaurantCard from "../components/saved/SavedRestaurantCard.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { getSavedRestaurants } from "../services/savedRestaurantService.js";

export default function SavedRestaurantsPage() {
  const savedRestaurants = getSavedRestaurants();

  useEffect(() => {
    document.title = "Saved Restaurants - Otter Delivery";
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <PageShell className="py-stack-lg flex flex-col gap-stack-lg">
        <div>
          <h1 className="font-page-title text-page-title text-on-surface">
            Saved Restaurants
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Restaurants you saved for later discovery and repeat meals.
          </p>
        </div>

        {savedRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {savedRestaurants.map((restaurant) => (
              <SavedRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Save restaurants from discovery or rankings to find them here."
            icon="bookmark"
            title="No saved restaurants yet"
          />
        )}
      </PageShell>
    </div>
  );
}
