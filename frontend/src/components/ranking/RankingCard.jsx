import Card from "../ui/Card.jsx";

export default function RankingCard({ restaurant }) {
  return (
    <Card
      as="article"
      className="group flex flex-col sm:flex-row h-auto sm:h-[220px]"
      hover
    >
      <div className="w-full sm:w-[200px] h-[200px] sm:h-full relative flex-shrink-0">
        <div className="absolute top-4 left-4 bg-primary-container text-white w-10 h-10 rounded-full flex items-center justify-center font-button text-button z-10 font-bold shadow-md">
          #{restaurant.rank}
        </div>
        <img
          alt={restaurant.image.alt}
          className="w-full h-full object-cover"
          src={restaurant.image.src}
        />
      </div>

      <div className="p-6 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex justify-between items-start mb-2 gap-3">
            <h2 className="font-card-title text-card-title text-on-surface">
              {restaurant.name}
            </h2>
            <span className="bg-surface-container-low px-2 py-1 rounded text-metadata font-metadata text-on-surface-variant flex items-center gap-1 shrink-0">
              <span
                className="material-symbols-outlined text-[16px] text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {restaurant.rating}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mb-3">
            {restaurant.cuisine} • {restaurant.priceTier}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-surface-container px-2 py-1 rounded-[8px] font-metadata text-metadata text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                schedule
              </span>
              {restaurant.eta}
            </span>
            <span className="bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded-[8px] font-metadata text-metadata">
              {restaurant.highlight}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low p-3 rounded-lg flex items-start gap-2">
          <span className="material-symbols-outlined text-primary-container mt-0.5">
            chat_bubble
          </span>
          <p className="font-metadata text-metadata text-on-surface-variant italic">
            “{restaurant.quote}”
          </p>
        </div>
      </div>
    </Card>
  );
}
