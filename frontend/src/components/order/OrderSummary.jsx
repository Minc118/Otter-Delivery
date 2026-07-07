import { formatCurrency } from "../../utils/currency.js";

function getOrderTotalCents(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemSubtotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );

  return (
    itemSubtotal +
    (order?.deliveryFeeCents ?? 0) +
    (order?.serviceFeeCents ?? 0)
  );
}

export default function OrderSummary({ order }) {
  if (!order) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface shadow-[0_12px_32px_rgba(36,36,38,0.04)]">
        <h2 className="font-card-title text-card-title text-on-surface">
          Order unavailable
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          We could not load the order summary for this tracking route.
        </p>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const totalCents = getOrderTotalCents(order);
  const restaurantImage = order.restaurant?.image;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface shadow-[0_12px_32px_rgba(36,36,38,0.04)]">
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-surface-variant">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container">
          {restaurantImage?.src ? (
            <img
              alt={restaurantImage.alt ?? order.restaurant?.name ?? "Restaurant"}
              className="w-full h-full object-cover"
              src={restaurantImage.src}
            />
          ) : null}
        </div>
        <div>
          <h2 className="font-card-title text-card-title text-on-surface">
            {order.restaurant?.name ?? "Restaurant"}
          </h2>
          <p className="font-metadata text-metadata text-on-surface-variant">
            Order #{order.displayId}
          </p>
        </div>
      </div>

      {order.deliveryAddress ? (
        <div className="mb-6 rounded-lg bg-surface-light p-3 border border-surface">
          <p className="font-metadata text-metadata text-on-surface-variant">
            Delivery to {order.deliveryAddress.label}
          </p>
          <p className="font-body-md text-body-md text-on-surface mt-1">
            {order.deliveryAddress.line1}, {order.deliveryAddress.postalCode}{" "}
            {order.deliveryAddress.city}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 mb-6">
        {items.length > 0 ? items.map((item) => (
          <div className="flex justify-between items-center gap-4" key={item.id}>
            <span className="font-body-md text-body-md text-on-surface">
              {item.quantity}x {item.name}
            </span>
            <span className="font-body-md text-body-md text-on-surface">
              {formatCurrency((item.quantity ?? 1) * (item.unitPriceCents ?? 0))}
            </span>
          </div>
        )) : (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Order items unavailable
          </p>
        )}
        <div className="flex justify-between items-center text-on-surface-variant">
          <span className="font-metadata text-metadata">Delivery Fee</span>
          <span className="font-metadata text-metadata">
            {formatCurrency(order.deliveryFeeCents ?? 0)}
          </span>
        </div>
        <div className="flex justify-between items-center text-on-surface-variant">
          <span className="font-metadata text-metadata">Service Fee</span>
          <span className="font-metadata text-metadata">
            {formatCurrency(order.serviceFeeCents ?? 0)}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-surface-variant flex justify-between items-center">
        <span className="font-card-title text-card-title text-on-surface">
          Total
        </span>
        <span className="font-card-title text-card-title text-on-surface">
          {formatCurrency(totalCents)}
        </span>
      </div>
    </div>
  );
}
