import { useEffect } from "react";
import FilterBar from "../components/discovery/FilterBar.jsx";
import RestaurantGrid from "../components/restaurant/RestaurantGrid.jsx";

export default function RestaurantDiscoveryPage() {
  useEffect(() => {
    document.title = "Restaurant Discovery - Otter Delivery";
  }, []);

  return (
    <div className="bg-background min-h-full">
      <div className="w-full max-w-container-max mx-auto px-margin-x py-stack-lg flex flex-col gap-stack-lg">
        <FilterBar />

        <div className="flex justify-between items-end mt-4">
          <h1 className="font-section-title text-section-title text-on-background">
            Explore Restaurants
          </h1>
          <span className="font-metadata text-metadata text-on-surface-variant">
            124 results found
          </span>
        </div>

        <RestaurantGrid />

        <div className="flex justify-center mt-stack-md">
          <button className="bg-transparent border-2 border-primary-container text-primary-container hover:bg-surface font-button text-button py-3 px-8 rounded-full transition-colors duration-200">
            Load more restaurants
          </button>
        </div>
      </div>
    </div>
  );
}
