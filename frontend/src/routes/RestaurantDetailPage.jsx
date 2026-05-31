import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RestaurantHero from "../components/restaurant/RestaurantHero.jsx";
import {
  getRestaurantById,
  getFoodItemsByRestaurantId,
} from "../services/catalogService.js";

export default function RestaurantDetailPage() {
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const restaurantData = await getRestaurantById(id);
        const foodItemsData = await getFoodItemsByRestaurantId(id);

        setRestaurant(restaurantData);
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
    return <p>Loading...</p>;
  }

  if (!restaurant) {
    return <p>Restaurant not found.</p>;
  }

  return (
      <div className="bg-background min-h-full pb-stack-lg">
        <RestaurantHero restaurant={restaurant} />

        <section className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Menu</h2>

          {foodItems.length === 0 ? (
              <p>No food items available.</p>
          ) : (
              <div className="space-y-4">
                {foodItems.map((item) => (
                    <div
                        key={item.id}
                        className="border rounded-lg p-4 bg-white"
                    >
                      <h3 className="font-semibold text-lg">
                        {item.name}
                      </h3>

                      <p>{item.description}</p>

                      <p className="mt-2 font-medium">
                        € {item.price}
                      </p>

                      <p>
                        {item.available ? "Available" : "Unavailable"}
                      </p>
                    </div>
                ))}
              </div>
          )}
        </section>
      </div>
  );
}