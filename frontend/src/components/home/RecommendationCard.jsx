import { Link } from "react-router-dom";

export default function RecommendationCard({ recommendation }) {
  const image = recommendation.image ?? { alt: recommendation.title, src: "" };
  const badge = recommendation.badge ?? { icon: "auto_awesome", label: "AI Pick" };
  const tags = recommendation.tags ?? [];
  const restaurantPath = `/restaurants/${recommendation.restaurant.id}`;
  const subtitle = recommendation.subtitle ?? `from ${recommendation.restaurant.name}`;

  return (
    <Link
      aria-label={`View ${recommendation.title}`}
      className="bg-surface-light rounded-xl overflow-hidden border border-surface flex flex-col hover:ai-shadow hover:border-primary-light transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-container"
      to={restaurantPath}
    >
      <div className="h-48 relative">
        <img
          alt={image.alt}
          className="w-full h-full object-cover"
          src={image.src}
        />
        <div className="absolute top-4 left-4 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full font-metadata text-metadata flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-sm">
            {badge.icon}
          </span>
          {badge.label}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3 className="font-card-title text-card-title text-on-surface">
            {recommendation.title}
          </h3>
          <span className="font-card-title text-card-title text-primary shrink-0">
            {recommendation.price}
          </span>
        </div>
        <p className="font-metadata text-metadata text-on-surface-variant mb-4">
          {subtitle}
        </p>
        <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface mb-4 flex-grow">
          <p className="font-body-md text-body-md text-dark-text italic text-sm">
            “{recommendation.reason}”
          </p>
        </div>
        <div className="flex gap-2 mb-6">
          {tags.map((tag) => (
            <span
              className="bg-surface text-on-surface-variant px-2 py-1 rounded font-metadata text-[12px]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <span
          className="w-full py-3 border border-primary-container text-primary-container rounded-lg font-button text-button hover:bg-surface transition-colors text-center"
        >
          View restaurant
        </span>
      </div>
    </Link>
  );
}
