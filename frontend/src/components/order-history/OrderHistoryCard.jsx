import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currency.js";
import { getLatestOrderStatusMeta } from "../../services/orderStatus.js";

const statusStyles = {
  placed: {
    card: "bg-surface-container-lowest border-primary-light/40 shadow-[0_4px_16px_rgba(36,36,38,0.04)] hover:shadow-stitch hover:border-primary-light",
    badge: "bg-primary-container text-on-primary",
    icon: "receipt_long",
  },
  preparing: {
    card: "bg-surface-container-lowest border-primary-light/40 shadow-[0_4px_16px_rgba(36,36,38,0.04)] hover:shadow-stitch hover:border-primary-light",
    badge: "bg-primary-container text-on-primary",
    icon: "restaurant",
  },
  completed: {
    card: "bg-surface-container-lowest border-primary-light/40 shadow-[0_4px_16px_rgba(36,36,38,0.04)] hover:shadow-stitch hover:border-primary-light",
    badge:
      "bg-secondary-container text-on-secondary-container",
    icon: "check_circle",
  },
  "on-the-way": {
    card: "bg-surface-light border-tertiary-fixed-dim/50 shadow-[0_4px_16px_rgba(36,36,38,0.04)] hover:shadow-stitch",
    badge:
      "bg-tertiary-fixed text-on-tertiary-fixed-variant animate-pulse",
    icon: "directions_bike",
  },
  cancelled: {
    card: "bg-surface-container-lowest border-surface-variant opacity-75 hover:opacity-100",
    badge: "bg-error-container text-on-error-container",
    icon: "cancel",
  },
};

export default function OrderHistoryCard({ order }) {
  const status = getLatestOrderStatusMeta(order);
  const styles = statusStyles[status.type] ?? statusStyles.completed;
  const isCancelled = status.type === "cancelled";
  const isActive = status.type === "on-the-way";
  const trackingPath = order.trackingPath ?? (isActive ? `/orders/${order.id}/tracking` : "/orders");

  return (
    <article
      className={`${styles.card} border rounded-xl p-6 transition-all flex flex-col gap-stack-md`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0 ${
              isCancelled ? "grayscale" : ""
            }`}
          >
            <img
              alt={order.image.alt}
              className="w-full h-full object-cover"
              src={order.image.src}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-card-title text-card-title text-on-surface truncate">
              {order.restaurantName}
            </h3>
            <p className="font-metadata text-metadata text-on-surface-variant">
              {order.placedAt}
            </p>
          </div>
        </div>
        <span
          className={`${styles.badge} px-3 py-1 rounded-full font-metadata text-metadata flex items-center gap-1 shrink-0`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {styles.icon}
          </span>
          {status.label}
        </span>
      </div>

      <div className="border-t border-surface-variant pt-stack-md flex justify-between items-end gap-4">
        <div>
          <p
            className={
              isCancelled
                ? "font-body-md text-body-md text-on-surface-variant line-through"
                : "font-body-md text-body-md text-on-surface"
            }
          >
            {order.itemsSummary}
          </p>
          <p
            className={
              isCancelled
                ? "font-button text-button text-on-surface-variant mt-2"
                : "font-button text-button text-on-surface mt-2"
            }
          >
            {formatCurrency(order.totalCents)}
            {order.estimatedDelivery ? (
              <span className="font-metadata text-metadata text-on-surface-variant font-normal">
                {" "}
                • Est. delivery {order.estimatedDelivery}
              </span>
            ) : null}
            {order.refunded ? (
              <span className="font-metadata text-metadata font-normal">
                {" "}
                • Refunded
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isActive ? (
            <Link
              className="px-4 py-2 rounded-lg bg-surface-container-lowest text-primary font-button text-button shadow-sm hover:bg-surface-container transition-colors cursor-pointer active:scale-95 duration-200"
              to={trackingPath}
            >
              Track Order
            </Link>
          ) : (
            <Link
              className={
                isCancelled
                  ? "px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface-variant font-button text-button hover:bg-surface-container transition-colors cursor-pointer active:scale-95 duration-200"
                  : "px-4 py-2 rounded-lg bg-transparent border border-primary-container text-primary-container font-button text-button hover:bg-surface transition-colors cursor-pointer active:scale-95 duration-200"
              }
              to={trackingPath}
            >
              View details
            </Link>
          )}
          {status.type === "completed" ? (
            <button
              className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-button text-button hover:bg-secondary transition-colors cursor-pointer active:scale-95 duration-200"
              type="button"
            >
              Reorder
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
