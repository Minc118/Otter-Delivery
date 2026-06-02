import RestaurantCard from "./RestaurantCard.jsx";

export default function RestaurantGrid({ restaurants, loading, error }) {
  if (loading) {
    return <p>Loading restaurants...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
  );
}