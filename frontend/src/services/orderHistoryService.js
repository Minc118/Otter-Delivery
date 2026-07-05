import { orderHistory } from "../data/orderHistory.js";
import { normalizeMenuItemName } from "./restaurantAdapter.js";

const env = import.meta.env ?? {};
const ORDER_SERVICE_BASE_URL =
  env.VITE_ORDER_SERVICE_URL ?? "http://localhost:8002";
const ORDER_HISTORY_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";

export function getOrderHistory(status = "all") {
  if (status === "all") {
    return orderHistory;
  }

  return orderHistory.filter((order) => order.statusType === status);
}

export class OrderHistoryLoginRequiredError extends Error {
  constructor() {
    super("Please log in to view your order history.");
    this.name = "OrderHistoryLoginRequiredError";
  }
}

export class OrderHistoryServiceUnavailableError extends Error {
  constructor() {
    super("Order history is currently unavailable.");
    this.name = "OrderHistoryServiceUnavailableError";
  }
}

export async function getCustomerOrderHistory(profileId) {
  if (!profileId) {
    throw new OrderHistoryLoginRequiredError();
  }

  let response;
  try {
    response = await fetch(
      `${ORDER_SERVICE_BASE_URL}/orders/customer/${encodeURIComponent(profileId)}`,
    );
  } catch {
    throw new OrderHistoryServiceUnavailableError();
  }

  if (!response.ok) {
    throw new OrderHistoryServiceUnavailableError();
  }

  const orders = await response.json();
  return Array.isArray(orders) ? orders.map(toHistoryOrder) : [];
}

export function toHistoryOrder(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemSummary = items
    .slice(0, 3)
    .map((item) => {
      const quantity = item.quantity ?? 1;
      const name = normalizeMenuItemName(item.itemName ?? item.name ?? "Item");
      return `${quantity}x ${name}`;
    })
    .join(", ");
  const createdAt = order.createdAt ? Date.parse(order.createdAt) : NaN;
  const totalPrice = Number(order.totalPrice);

  return {
    id: String(order.id),
    customerId: order.customerId,
    restaurantId: order.restaurantId,
    restaurantName: `Restaurant #${order.restaurantId}`,
    image: {
      alt: `Restaurant ${order.restaurantId}`,
      src: ORDER_HISTORY_FALLBACK_IMAGE,
    },
    items,
    itemsSummary: itemSummary || "Order items",
    placedAt: Number.isFinite(createdAt)
      ? new Date(createdAt).toLocaleString()
      : "Recent order",
    status: order.status,
    totalCents: Number.isFinite(totalPrice) ? Math.round(totalPrice * 100) : 0,
    trackingPath: `/orders/${order.id}/tracking`,
    createdAt: Number.isFinite(createdAt) ? createdAt : undefined,
  };
}
