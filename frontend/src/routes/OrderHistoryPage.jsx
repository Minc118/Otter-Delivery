import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState.jsx";
import OrderHistoryCard from "../components/order-history/OrderHistoryCard.jsx";
import OrderHistoryFilters from "../components/order-history/OrderHistoryFilters.jsx";
import PageShell from "../components/layout/PageShell.jsx";
import {
  getCustomerOrderHistory,
  OrderHistoryLoginRequiredError,
} from "../services/orderHistoryService.js";
import { getLatestOrderStatusMeta } from "../services/orderStatus.js";
import useCart from "../hooks/useCart.js";
import { normalizeMenuItemName } from "../services/restaurantAdapter.js";

export default function OrderHistoryPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [ordersFromService, setOrdersFromService] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const { trackedOrders } = useCart();
  const profile = readStoredProfile();
  const profileId = profile?.id ? String(profile.id) : null;
  const localOrders = trackedOrders
    .filter((order) => String(order.customerId ?? "") === String(profileId ?? ""))
    .map(toLocalHistoryOrder);
  const localOrderIds = new Set(localOrders.map((order) => String(order.id)));
  const orders = [
    ...localOrders,
    ...ordersFromService.filter((order) => !localOrderIds.has(String(order.id))),
  ].filter((order) =>
    activeFilter === "all" ? true : getLatestOrderStatusMeta(order).type === activeFilter,
  );

  useEffect(() => {
    document.title = "Order History - Otter Delivery";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOrderHistory() {
      if (!profileId) {
        setOrdersFromService([]);
        setStatus("login-required");
        setError("");
        return;
      }

      setStatus("loading");
      setError("");

      try {
        const loadedOrders = await getCustomerOrderHistory(profileId);
        if (!cancelled) {
          setOrdersFromService(loadedOrders);
          setStatus("success");
        }
      } catch (loadError) {
        if (!cancelled) {
          setOrdersFromService([]);
          setStatus(
            loadError instanceof OrderHistoryLoginRequiredError
              ? "login-required"
              : "error",
          );
          setError(loadError.message);
        }
      }
    }

    loadOrderHistory();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

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

        {status === "login-required" ? (
          <EmptyState
            actionLabel="Log in"
            description="Please log in to view your order history."
            icon="person"
            title="Login required"
            to="/login?returnTo=/orders"
          />
        ) : status === "loading" && orders.length === 0 ? (
          <EmptyState
            description="Loading your orders from Order Service."
            icon="receipt_long"
            title="Loading orders"
          />
        ) : orders.length > 0 ? (
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
            description={
              status === "error"
                ? error || "Order history is currently unavailable."
                : "Looks like you haven't placed any orders in this filter yet."
            }
            icon="receipt_long"
            title={status === "error" ? "Could not load order history" : "No orders yet"}
            to="/restaurants"
          />
        )}
      </PageShell>
    </div>
  );
}

function toLocalHistoryOrder(order) {
  const status = getLatestOrderStatusMeta(order);
  const itemSummary = (order.items ?? [])
    .slice(0, 3)
    .map((item) => `${item.quantity ?? 1}x ${normalizeMenuItemName(item.name ?? item.itemName ?? "Item")}`)
    .join(", ");

  return {
    ...order,
    image: order.restaurantImage ?? {
      alt: order.restaurantName ?? "Restaurant",
      src: "",
    },
    itemsSummary: itemSummary || "Order items",
    placedAt: order.deliveredAt
      ? "Delivered"
      : order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : "Recent order",
    status: status.label,
    statusType: status.type,
    trackingPath: `/orders/${order.id}/tracking`,
  };
}

function readStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem("profile"));
  } catch {
    return null;
  }
}
