import { Link } from "react-router-dom";
import Card from "../ui/Card.jsx";
import { formatCurrency } from "../../utils/currency.js";

export default function RecentOrdersCard({ orders }) {
  return (
    <Card
      className="p-6 transition-all duration-300 flex flex-col h-full"
      hover
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-section-title text-section-title text-on-surface">
          Recent
        </h3>
        <span className="material-symbols-outlined text-outline">history</span>
      </div>
      <div className="space-y-4 flex-grow">
        {orders.map((order) => (
          <div
            className="p-3 border border-surface rounded-lg"
            key={order.id}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-card-title text-[16px] text-on-surface">
                {order.restaurantName}
              </h4>
              <span className="font-metadata text-metadata text-on-surface-variant bg-surface px-2 py-0.5 rounded">
                {order.status}
              </span>
            </div>
            <p className="font-metadata text-metadata text-outline mb-2">
              {order.summary} • {formatCurrency(order.totalCents)}
            </p>
            <button
              className="text-primary-container hover:text-primary font-metadata text-metadata font-bold transition-colors"
              type="button"
            >
              Reorder
            </button>
          </div>
        ))}
      </div>
      <Link
        className="mt-4 inline-block font-button text-button text-primary-container hover:text-primary transition-colors"
        to="/profile/orders"
      >
        View full history →
      </Link>
    </Card>
  );
}
