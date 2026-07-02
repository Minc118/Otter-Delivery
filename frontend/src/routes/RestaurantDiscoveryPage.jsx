import { useEffect, useState } from "react";
import FilterBar from "../components/discovery/FilterBar.jsx";
import RestaurantGrid from "../components/restaurant/RestaurantGrid.jsx";
import {
  getRestaurants,
  getTranslatedRestaurants,
} from "../services/catalogService.js";

export default function RestaurantDiscoveryPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState(
      localStorage.getItem("lang") || "EN"
  );

  useEffect(() => {
    document.title = "Restaurant Discovery - Otter Delivery";
  }, []);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setLoading(true);

        let data;

        if (language === "EN") {
          data = await getRestaurants();
        } else {
          data = await getTranslatedRestaurants(language);
        }

        setRestaurants(data);
        setError(null);
      } catch (err) {
        setError("Restaurants could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
  }, [language]);

  useEffect(() => {
    function handleLanguageChange(e) {
      setLanguage(e.detail);
    }

    window.addEventListener("language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("language-change", handleLanguageChange);
    };
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
            {restaurants.length} results found
          </span>
          </div>

          <RestaurantGrid
              restaurants={restaurants}
              loading={loading}
              error={error}
          />

          <div className="flex justify-center mt-stack-md">
            <button className="bg-transparent border-2 border-primary-container text-primary-container hover:bg-surface font-button text-button py-3 px-8 rounded-full transition-colors duration-200">
              Load more restaurants
            </button>
          </div>
        </div>
      </div>
  );
}