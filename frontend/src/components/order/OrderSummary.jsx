import { formatCurrency } from "../../utils/currency.js";

function getOrderTotalCents(order) {
  const itemSubtotal = order.items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );

  return itemSubtotal + order.deliveryFeeCents + order.serviceFeeCents;
}

export default function OrderSummary({ order }) {
  const totalCents = getOrderTotalCents(order);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface shadow-[0_12px_32px_rgba(36,36,38,0.04)]">
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-surface-variant">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container">
          <img
            alt={order.restaurant.image.alt}
            className="w-full h-full object-cover"
            src={order.restaurant.image.src}
          />
        </div>
        <div>
          <h2 className="font-card-title text-card-title text-on-surface">
            {order.restaurant.name}
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
        {order.items.map((item) => (
          <div className="flex justify-between items-center gap-4" key={item.id}>
            <span className="font-body-md text-body-md text-on-surface">
              {item.quantity}x {item.name}
            </span>
            <span className="font-body-md text-body-md text-on-surface">
              {formatCurrency(item.quantity * item.unitPriceCents)}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center text-on-surface-variant">
          <span className="font-metadata text-metadata">Delivery Fee</span>
          <span className="font-metadata text-metadata">
            {formatCurrency(order.deliveryFeeCents)}
          </span>
        </div>
        <div className="flex justify-between items-center text-on-surface-variant">
          <span className="font-metadata text-metadata">Service Fee</span>
          <span className="font-metadata text-metadata">
            {formatCurrency(order.serviceFeeCents)}
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
