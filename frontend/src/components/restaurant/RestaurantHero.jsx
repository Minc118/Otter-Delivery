export default function RestaurantHero({ restaurant }) {
  const detail = restaurant.detail ?? {};
  const name = detail.name ?? restaurant.name;
  const fallbackImage = restaurant.image ?? { alt: restaurant.name, src: "" };
  const heroImage = detail.heroImage ?? fallbackImage;
  const categories =
    detail.categories ?? restaurant.cuisine?.replaceAll(" • ", ", ") ?? "Local favorites";
  const ratingCount = detail.ratingCount ?? "200+ ratings";

  return (
    <section className="max-w-container-max mx-auto px-margin-x pt-stack-lg pb-stack-md">
      <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-stack-md">
        <img
          alt={heroImage.alt}
          className="w-full h-full object-cover"
          src={heroImage.src}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <h1 className="font-display-hero text-display-hero mb-2">{name}</h1>
          <div className="flex flex-wrap items-center gap-3 font-metadata text-metadata">
            <span className="flex items-center gap-1">
              <span
                className="material-symbols-outlined text-tertiary-fixed-dim"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {restaurant.rating} ({ratingCount})
            </span>
            <span aria-hidden="true">•</span>
            <span>{categories}</span>
            <span aria-hidden="true">•</span>
            <span>{restaurant.priceTier}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
