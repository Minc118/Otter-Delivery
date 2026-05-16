import { Link } from "react-router-dom";

export default function RecommendationCard({ recommendation }) {
  return (
    <article className="bg-surface-light rounded-xl overflow-hidden border border-surface flex flex-col hover:ai-shadow hover:border-primary-light transition-all duration-300">
      <div className="h-48 relative">
        <img
          alt={recommendation.image.alt}
          className="w-full h-full object-cover"
          src={recommendation.image.src}
        />
        <div className="absolute top-4 left-4 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full font-metadata text-metadata flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-sm">
            {recommendation.badge.icon}
          </span>
          {recommendation.badge.label}
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
          from {recommendation.restaurant.name}
        </p>
        <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface mb-4 flex-grow">
          <p className="font-body-md text-body-md text-dark-text italic text-sm">
            “{recommendation.reason}”
          </p>
        </div>
        <div className="flex gap-2 mb-6">
          {recommendation.tags.map((tag) => (
            <span
              className="bg-surface text-on-surface-variant px-2 py-1 rounded font-metadata text-[12px]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          className="w-full py-3 border border-primary-container text-primary-container rounded-lg font-button text-button hover:bg-surface transition-colors text-center"
          to={`/restaurants/${recommendation.restaurant.id}`}
        >
          View restaurant
        </Link>
      </div>
    </article>
  );
}
