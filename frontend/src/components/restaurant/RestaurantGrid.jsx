import { useEffect, useState } from "react";
import { getRestaurants } from "../../services/catalogService.js";
import EmptyState from "../ui/EmptyState.jsx";
import RestaurantCard from "./RestaurantCard.jsx";

export default function RestaurantGrid({ restaurants, loading, error }) {
  if (loading) {
    return (
      <div className="bg-surface-container-lowest border border-surface rounded-xl">
        <EmptyState
          description="Fetching the latest restaurant catalog."
          icon="restaurant"
          title="Loading restaurants"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-container-lowest border border-surface rounded-xl">
        <EmptyState
          description={error}
          icon="error"
          title="Restaurants could not be loaded"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
