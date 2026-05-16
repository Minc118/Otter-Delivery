import { Link } from "react-router-dom";

export default function RestaurantCard({ restaurant }) {
  const actionClass = restaurant.featuredAction
    ? "bg-primary-container hover:bg-surface-tint text-on-primary py-3"
    : "bg-transparent border-2 border-primary-container text-primary-container hover:bg-surface py-2.5";

  return (
    <article className="bg-surface-container-lowest rounded-xl border border-surface hover:border-primary-light transition-all duration-300 custom-shadow-hover overflow-hidden flex flex-col group relative">
      {restaurant.ribbon ? (
        <div
          className={`absolute -top-1 -right-1 z-10 font-metadata text-metadata px-4 py-1 rounded-bl-xl rounded-tr-xl font-bold shadow-sm flex items-center gap-1 border border-surface-container-lowest ${restaurant.ribbon.className}`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {restaurant.ribbon.icon}
          </span>
          {restaurant.ribbon.label}
        </div>
      ) : null}

      <div className="h-48 relative overflow-hidden bg-surface-container">
        <img
          alt={restaurant.image.alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={restaurant.image.src}
        />
        <div className="absolute top-3 left-3 bg-surface-container-lowest text-on-surface font-metadata text-metadata px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <span
            className="material-symbols-outlined text-[16px] text-tertiary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          {restaurant.rating}
        </div>
        <div className="absolute top-3 right-3 bg-surface-container-lowest text-on-surface font-metadata text-metadata px-3 py-1 rounded-full shadow-sm">
          {restaurant.eta}
        </div>
      </div>

      <div
        className={`p-5 flex flex-col flex-grow ${
          restaurant.mutedBody ? "bg-[#FAFAF8]" : ""
        }`}
      >
        <div className="flex justify-between items-start mb-2 gap-3">
          <h3 className="font-card-title text-card-title text-on-background line-clamp-1">
            {restaurant.name}
          </h3>
          <span className="font-metadata text-metadata text-on-surface-variant bg-surface px-2 py-1 rounded shrink-0">
            {restaurant.priceTier}
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mb-3">
          {restaurant.cuisine}
        </p>
        <p className="font-body-md text-body-md text-on-surface mb-4 line-clamp-2">
          {restaurant.description}
        </p>
        <div className="flex gap-2 mb-5 flex-wrap">
          {restaurant.tags.map((tag) => (
            <span
              className="bg-surface text-on-surface font-metadata text-metadata px-2 py-1 rounded-md text-xs"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-surface-variant">
          <Link
            className={`w-full font-button text-button rounded-lg transition-colors duration-200 flex justify-center items-center gap-2 ${actionClass}`}
            to={`/restaurants/${restaurant.id}`}
          >
            View restaurant
            {restaurant.featuredAction ? (
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </article>
  );
}
