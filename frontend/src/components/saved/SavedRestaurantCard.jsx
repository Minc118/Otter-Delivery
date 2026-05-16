import { Link } from "react-router-dom";

export default function SavedRestaurantCard({ restaurant }) {
  return (
    <article className="bg-surface-container-lowest border border-primary-light/40 rounded-xl p-6 shadow-[0_4px_16px_rgba(36,36,38,0.04)] hover:shadow-stitch hover:border-primary-light transition-all flex flex-col gap-stack-md">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0">
            <img
              alt={restaurant.image.alt}
              className="w-full h-full object-cover"
              src={restaurant.image.src}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-card-title text-card-title text-on-surface truncate">
              {restaurant.name}
            </h3>
            <p className="font-metadata text-metadata text-on-surface-variant">
              {restaurant.cuisine} • {restaurant.rating} ★
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-metadata text-metadata flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-[16px]">
            bookmark
          </span>
          Saved
        </span>
      </div>

      <div className="border-t border-surface-variant pt-stack-md flex flex-col gap-stack-md">
        <div>
          <p className="font-body-md text-body-md text-on-surface">
            {restaurant.description}
          </p>
          <p className="font-metadata text-metadata text-on-surface-variant mt-2">
            {restaurant.savedAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {restaurant.tags.map((tag) => (
            <span
              className="bg-surface text-on-surface-variant px-2 py-1 rounded-md font-metadata text-metadata"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-transparent border border-outline-variant text-on-surface-variant font-button text-button hover:bg-surface transition-colors cursor-pointer active:scale-95 duration-200"
            type="button"
          >
            Remove
          </button>
          <Link
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-button text-button hover:bg-secondary transition-colors cursor-pointer active:scale-95 duration-200"
            to={restaurant.restaurantPath}
          >
            View restaurant
          </Link>
        </div>
      </div>
    </article>
  );
}
