import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import MenuSection from "../components/restaurant/MenuSection.jsx";
import RestaurantHero from "../components/restaurant/RestaurantHero.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

import useCart from "../hooks/useCart.js";

import {
    getRestaurantById,
    getFoodItemsByRestaurantId,
    getTranslatedFoodItemsByRestaurantId,
} from "../services/catalogService.js";

import { adaptRestaurant } from "../services/restaurantAdapter.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function RestaurantDetailPage() {
    const { id } = useParams();
    const { cartWarning, setCartWarning } = useCart();

    const [restaurant, setRestaurant] = useState(null);
    const [foodItems, setFoodItems] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();

    useEffect(() => {
        async function loadRestaurant() {
            try {
                setLoading(true);

                let restaurantData;
                let foodItemsData;

                const lang = language;

                // RESTAURANT (no translated single endpoint yet)
                restaurantData = await getRestaurantById(id);

                // FOOD ITEMS (translated supported)
                if (lang === "EN") {
                    foodItemsData = await getFoodItemsByRestaurantId(id, restaurantData);
                } else {
                    foodItemsData = await getTranslatedFoodItemsByRestaurantId(id, lang);
                }

                const restaurantWithMenuContext = adaptRestaurant(
                    restaurantData.raw ?? restaurantData,
                    { menuItems: foodItemsData }
                );

                setRestaurant(restaurantWithMenuContext);
                setFoodItems(foodItemsData);
                setError(null);
            } catch {
                setError("Restaurant details could not be loaded.");
            } finally {
                setLoading(false);
            }
        }

        loadRestaurant();
    }, [id, language]);

    useEffect(() => {
        if (restaurant) {
            document.title = `${restaurant.name} - Otter Delivery`;
        }
    }, [restaurant]);

    if (loading) {
        return (
            <div className="bg-background min-h-full">
                <section className="max-w-container-max mx-auto px-margin-x py-stack-lg">
                    <div className="bg-surface-container-lowest border border-surface rounded-xl">
                        <EmptyState
                            description="Fetching restaurant details and menu items."
                            icon="restaurant"
                            title="Loading restaurant"
                        />
                    </div>
                </section>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="bg-background min-h-full">
                <section className="max-w-container-max mx-auto px-margin-x py-stack-lg">
                    <div className="bg-surface-container-lowest border border-surface rounded-xl">
                        <EmptyState
                            description={
                                error ?? "Try another restaurant from the discovery page."
                            }
                            icon="error"
                            title="Restaurant not found"
                        />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-full pb-stack-lg">
            <RestaurantHero restaurant={restaurant} />

            {foodItems.length === 0 ? (
                <section className="max-w-container-max mx-auto px-margin-x py-stack-md">
                    <div className="bg-surface-container-lowest border border-surface rounded-xl">
                        <EmptyState
                            description="This restaurant does not have live menu items yet."
                            icon="room_service"
                            title="No food items available"
                        />
                    </div>
                </section>
            ) : (
                <>
                    {cartWarning ? (
                        <section className="max-w-container-max mx-auto px-margin-x pt-stack-md">
                            <div className="rounded-xl border border-primary-container bg-surface-container-lowest px-4 py-3 text-on-surface flex items-center justify-between gap-4">
                                <p>{cartWarning}</p>
                                <button
                                    aria-label="Dismiss cart warning"
                                    className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
                                    onClick={() => setCartWarning(null)}
                                    type="button"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </section>
                    ) : null}

                    <MenuSection items={foodItems} restaurant={restaurant} />
                </>
            )}
        </div>
    );
}