import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext.jsx";
import { useParams } from "react-router-dom";
import RestaurantHero from "../components/restaurant/RestaurantHero.jsx";
import {
  getRestaurantById,
  getFoodItemsByRestaurantId,
} from "../services/catalogService.js";

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { addItem, cartWarning, setCartWarning } = useContext(CartContext);  const [restaurant, setRestaurant] = useState(null);
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
          {cartWarning && (
              <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
                <div className="flex justify-between gap-4">
                  <p>{cartWarning}</p>

                  <button
                      className="font-bold"
                      onClick={() => setCartWarning(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>
          )}
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

                      <button
                          className="mt-3 bg-blue-500 text-white px-4 py-2 rounded"
                          onClick={() =>
                              addItem({
                                restaurantId: restaurant.id,
                                restaurantName: restaurant.name,
                                item: {
                                  id: item.id,
                                  name: item.name,
                                  priceCents: Math.round(item.price * 100),
                                },
                              })
                          }
                      >
                        Add to Cart
                      </button>
                    </div>
                ))}
              </div>
          )}
        </section>
      </div>
  );
}