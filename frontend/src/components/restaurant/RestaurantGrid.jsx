import { getRestaurants } from "../../services/catalogService.js";
import RestaurantCard from "./RestaurantCard.jsx";

export default function RestaurantGrid() {
  const restaurants = getRestaurants();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
