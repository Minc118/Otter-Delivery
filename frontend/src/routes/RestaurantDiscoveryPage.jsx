import { useEffect, useMemo, useState } from "react";
import FilterBar from "../components/discovery/FilterBar.jsx";
import RestaurantGrid from "../components/restaurant/RestaurantGrid.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import {
    getRestaurants,
    getTranslatedRestaurants,
} from "../services/catalogService.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
    defaultRestaurantFilters,
    filterRestaurants,
    getVisibleRestaurants,
    hasActiveRestaurantFilters,
    INITIAL_RESTAURANT_VISIBLE_COUNT,
    RESTAURANT_LOAD_MORE_COUNT,
} from "../services/restaurantFilters.js";

export default function RestaurantDiscoveryPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [filters, setFilters] = useState(defaultRestaurantFilters);
    const [visibleCount, setVisibleCount] = useState(INITIAL_RESTAURANT_VISIBLE_COUNT);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { language } = useLanguage();

    // Teammate's live filters & pagination calculations
    const filteredRestaurants = useMemo(
        () => filterRestaurants(restaurants, filters),
        [filters, restaurants],
    );
    const visibleRestaurants = useMemo(
        () => getVisibleRestaurants(filteredRestaurants, visibleCount),
        [filteredRestaurants, visibleCount],
    );
    const canLoadMore = visibleCount < filteredRestaurants.length;

    // Set the browser tab title once on mount
    useEffect(() => {
        document.title = "Restaurant Discovery - Otter Delivery";
    }, []);

    // Your reactive data fetching hook updated to play nice with their states
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

    function handleFilterChange(key, value) {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
        setVisibleCount(INITIAL_RESTAURANT_VISIBLE_COUNT);
    }

    return (
        <div className="bg-background min-h-full">
            <div className="w-full max-w-container-max mx-auto px-margin-x py-stack-lg flex flex-col gap-stack-lg">
                <FilterBar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <div className="flex justify-between items-end">
                    <h1 className="font-section-title text-section-title text-on-background">
                        Explore Restaurants
                    </h1>

                    <span className="font-metadata text-metadata text-on-surface-variant">
            {filteredRestaurants.length} results found
          </span>
                </div>

                {filteredRestaurants.length === 0 && !loading && !error ? (
                    <div className="bg-surface-container-lowest border border-surface rounded-xl">
                        <EmptyState
                            description={
                                hasActiveRestaurantFilters(filters)
                                    ? "Try another cuisine, dietary preference, or price range."
                                    : "No restaurants are available right now."
                            }
                            icon="search_off"
                            title="No matching restaurants"
                        />
                    </div>
                ) : (
                    <RestaurantGrid
                        restaurants={visibleRestaurants}
                        loading={loading}
                        error={error}
                    />
                )}

                {canLoadMore ? (
                    <div className="flex justify-center mt-stack-md">
                        <button
                            className="bg-transparent border-2 border-primary-container text-primary-container hover:bg-surface font-button text-button py-3 px-8 rounded-full transition-colors duration-200"
                            onClick={() =>
                                setVisibleCount((current) => current + RESTAURANT_LOAD_MORE_COUNT)
                            }
                            type="button"
                        >
                            Load more restaurants
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}