import { Link } from "react-router-dom";
import Card from "../ui/Card.jsx";

export default function SavedRestaurantsCard({ restaurants }) {
  const previewRestaurants = restaurants.slice(0, 2);

  return (
    <Card
      className="p-6 transition-all duration-300 flex flex-col h-full"
      hover
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-section-title text-section-title text-on-surface">
          Saved
        </h3>
        <span className="material-symbols-outlined text-outline">bookmark</span>
      </div>
      <div className="space-y-4 flex-grow">
        {previewRestaurants.map((restaurant) => (
          <div
            className="flex items-center space-x-4 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            key={restaurant.id}
          >
            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
              <img
                alt={restaurant.image.alt}
                className="w-full h-full object-cover"
                src={restaurant.image.src}
              />
            </div>
            <div>
              <h4 className="font-card-title text-[16px] text-on-surface">
                {restaurant.name}
              </h4>
              <p className="font-metadata text-metadata text-outline">
                {restaurant.cuisine} • {restaurant.rating} ★
              </p>
            </div>
          </div>
        ))}
      </div>
      <Link
        className="mt-4 inline-block font-button text-button text-primary-container hover:text-primary transition-colors"
        to="/profile/saved"
      >
        View all saved →
      </Link>
    </Card>
  );
}
