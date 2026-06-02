import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MenuSection from "../components/restaurant/MenuSection.jsx";
import RestaurantHero from "../components/restaurant/RestaurantHero.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import {
  getRestaurantById,
  getFoodItemsByRestaurantId,
} from "../services/catalogService.js";
import { adaptRestaurant } from "../services/restaurantAdapter.js";

export default function RestaurantDetailPage() {
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const restaurantData = await getRestaurantById(id);
        const foodItemsData = await getFoodItemsByRestaurantId(
          id,
          restaurantData,
        );
        const restaurantWithMenuContext = adaptRestaurant(
          restaurantData.raw ?? restaurantData,
          { menuItems: foodItemsData },
        );

        setRestaurant(restaurantWithMenuContext);
        setFoodItems(foodItemsData);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [id]);

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

  if (!restaurant) {
    return (
      <div className="bg-background min-h-full">
        <section className="max-w-container-max mx-auto px-margin-x py-stack-lg">
          <div className="bg-surface-container-lowest border border-surface rounded-xl">
            <EmptyState
              description="Try another restaurant from the discovery page."
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
        <MenuSection items={foodItems} restaurant={restaurant} />
      )}
    </div>
  );
}
