import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState.jsx";
import OrderHistoryCard from "../components/order-history/OrderHistoryCard.jsx";
import OrderHistoryFilters from "../components/order-history/OrderHistoryFilters.jsx";
import PageShell from "../components/layout/PageShell.jsx";
import { getOrderHistory } from "../services/orderHistoryService.js";

export default function OrderHistoryPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const orders = getOrderHistory(activeFilter);

  useEffect(() => {
    document.title = "Order History - Otter Delivery";
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <PageShell className="py-stack-lg flex flex-col gap-stack-lg">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-stack-md">
          <div>
            <h1 className="font-page-title text-page-title text-on-surface">
              Order History
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              View and manage your past and current orders.
            </p>
          </div>
          <OrderHistoryFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {orders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {orders.map((order) => (
              <OrderHistoryCard
                key={order.id}
                order={order}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            actionLabel="Explore Restaurants"
            description="Looks like you haven't placed any orders in this filter yet."
            icon="receipt_long"
            title="No orders yet"
            to="/restaurants"
          />
        )}
      </PageShell>
    </div>
  );
}
