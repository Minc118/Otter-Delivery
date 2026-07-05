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

export function toLocalHistoryOrder(order) {
  const itemSummary = (order.items ?? [])
    .slice(0, 3)
    .map((item) => {
      const quantity = item.quantity ?? 1;
      const name = normalizeMenuItemName(item.name ?? item.itemName ?? "Item");
      return `${quantity}x ${name}`;
    })
    .join(", ");

  return {
    ...order,
    customerId: order.customerId,
    image: order.restaurantImage ?? order.image ?? {
      alt: order.restaurantName ?? "Restaurant",
      src: ORDER_HISTORY_FALLBACK_IMAGE,
    },
    itemsSummary: itemSummary || order.itemsSummary || "Order items",
    placedAt: order.deliveredAt
      ? "Delivered"
      : order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : order.placedAt ?? "Recent order",
    trackingPath: `/orders/${order.id}/tracking`,
  };
}

export function mergeOrderHistory({
  profileId,
  serviceOrders = [],
  trackedOrders = [],
}) {
  const normalizedProfileId = profileId == null ? null : String(profileId);
  const localOrders = (trackedOrders ?? [])
    .filter((order) => isOrderForProfile(order, normalizedProfileId))
    .map(toLocalHistoryOrder);
  const localById = new Map(localOrders.map((order) => [String(order.id), order]));
  const merged = [
    ...localOrders,
    ...(serviceOrders ?? []).map((order) => {
      const localOrder = localById.get(String(order.id));
      return localOrder ? { ...order, ...localOrder } : order;
    }).filter((order) => !localById.has(String(order.id))),
  ];

  return merged.sort((left, right) => orderSortTime(right) - orderSortTime(left));
}

export function isOrderForProfile(order, profileId) {
  if (!profileId) {
    return false;
  }
  const customerId = order?.customerId ?? order?.profileId ?? order?.userId;
  return customerId != null && String(customerId) === String(profileId);
}

function orderSortTime(order) {
  return Number(order?.deliveredAt ?? order?.trackingStartedAt ?? order?.createdAt ?? 0);
}
