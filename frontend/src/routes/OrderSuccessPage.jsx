import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../components/layout/PageShell.jsx";
import useCart from "../hooks/useCart.js";
import { getOrderById } from "../services/orderService.js";
import { createPlacedOrderFromTrackingOrder } from "../services/checkoutService.js";
import { formatCurrency } from "../utils/currency.js";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { lastPlacedOrder } = useCart();
  const fallbackOrder = createPlacedOrderFromTrackingOrder(getOrderById(id));
  const order = lastPlacedOrder?.id === id ? lastPlacedOrder : fallbackOrder;
  const itemsSubtotalCents = order.items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );
  const feesCents = order.totalCents - itemsSubtotalCents;

  useEffect(() => {
    document.title = "Order Placed - Otter Delivery";
  }, []);

  const assignmentMessage = getAssignmentMessage(order);

  return (
    <div
      className="bg-surface-container-lowest min-h-screen"
      style={{
        backgroundImage: "radial-gradient(circle at top, #f2f8f8 0%, #ffffff 100%)",
      }}
    >
      <PageShell className="py-stack-lg flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="bg-surface-container-lowest border border-surface rounded-[28px] shadow-stitch max-w-2xl w-full p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
            <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-primary-light" />
            <div className="absolute top-20 right-20 w-6 h-6 rounded-full bg-surface-light" />
            <div className="absolute bottom-20 left-24 w-5 h-5 rounded-full bg-secondary-container" />
            <div className="absolute bottom-10 right-10 w-3 h-3 rounded-full bg-tertiary-fixed" />
          </div>

          <div className="mx-auto w-24 h-24 bg-secondary-fixed rounded-full flex items-center justify-center mb-8 relative z-10">
            <span
              className="material-symbols-outlined text-primary-container text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>

          <h1 className="font-page-title text-page-title text-on-surface mb-4 relative z-10">
            Order placed successfully
          </h1>
          <p className="text-on-surface-variant mb-10 max-w-md mx-auto relative z-10">
            {assignmentMessage}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left relative z-10">
            <SuccessStat
              label="Restaurant"
              value={order.restaurantName}
            />
            <SuccessStat
              label="Order Number"
              value={`#${order.displayId}`}
            />
            <SuccessStat
              label="Est. Delivery"
              value={order.estimatedDeliveryTime}
            />
            <SuccessStat
              label="Total"
              value={formatCurrency(order.totalCents)}
            />
          </div>

          <div className="bg-surface-bright rounded-2xl p-6 border border-surface mb-10 text-left relative z-10">
            <h3 className="font-card-title text-card-title text-on-surface mb-4 pb-4 border-b border-surface-variant">
              Order Summary
            </h3>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li
                  className="flex justify-between items-center gap-4"
                  key={item.id}
                >
                  <span className="text-on-surface">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-on-surface-variant">
                    {formatCurrency(item.quantity * item.unitPriceCents)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between items-center pt-3 border-t border-surface-variant border-dashed mt-3">
                <span className="text-on-surface font-metadata text-metadata">
                  Delivery & Fees
                </span>
                <span className="text-on-surface-variant">
                  {formatCurrency(feesCents)}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-light rounded-2xl p-5 border border-surface mb-10 text-left relative z-10">
            <p className="font-metadata text-metadata uppercase tracking-wider text-on-surface-variant mb-2">
              Delivery to {order.deliveryAddress.label}
            </p>
            <p className="text-on-surface">
              {order.deliveryAddress.line1}, {order.deliveryAddress.postalCode}{" "}
              {order.deliveryAddress.city}
            </p>
            {order.deliveryAddress.note ? (
              <p className="font-metadata text-metadata text-on-surface-variant mt-2">
                Note: {order.deliveryAddress.note}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
            <Link
              className="w-full sm:w-auto bg-primary-container text-on-primary font-button text-button py-4 px-8 rounded-[16px] hover:bg-surface-tint transition-colors duration-200 active:scale-95"
              to={`/orders/${order.id}/tracking`}
            >
              Track order
            </Link>
            <Link
              className="w-full sm:w-auto bg-transparent text-primary-container border border-primary-container font-button text-button py-4 px-8 rounded-[16px] hover:bg-surface transition-colors duration-200 active:scale-95 inline-flex justify-center items-center"
              to="/restaurants"
            >
              Back to restaurants
            </Link>
          </div>
        </div>
      </PageShell>
    </div>
  );
}

function getAssignmentMessage(order) {
  if (order.assignmentStatus === "assigned" && order.assignedDriver?.name) {
    return `${order.assignedDriver.name} accepted the delivery and is heading to the restaurant.`;
  }

  if (order.assignmentStatus === "failed") {
    return "Your order was placed, but no driver could be assigned automatically yet.";
  }

  return "Your order has been received and the restaurant will start preparing it soon.";
}

function SuccessStat({ label, value }) {
  return (
    <div className="bg-surface-bright rounded-2xl p-4 border border-surface">
      <span className="text-on-surface-variant text-metadata font-metadata block mb-1">
        {label}
      </span>
      <span className="text-on-surface font-metadata text-metadata font-bold">
        {value}
      </span>
    </div>
  );
}
