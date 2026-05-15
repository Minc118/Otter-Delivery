export default function DeliveryMap({ order }) {
  return (
    <div className="lg:col-span-2 rounded-xl overflow-hidden border border-surface bg-surface-container-lowest h-[400px] lg:h-[600px] relative shadow-[0_12px_32px_rgba(36,36,38,0.04)]">
      <img
        alt={order.mapImage.alt}
        className="w-full h-full object-cover"
        src={order.mapImage.src}
      />
      <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-sm p-3 rounded-lg border border-surface shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary-container p-2 rounded-full text-on-primary">
            <span className="material-symbols-outlined text-sm">
              directions_bike
            </span>
          </div>
          <div>
            <p className="font-metadata text-metadata text-on-surface-variant">
              Your Rider
            </p>
            <p className="font-card-title text-card-title text-on-surface text-[16px]">
              {order.rider.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
