import { readFileSync } from "node:fs";
import {
  mergeOrderHistory,
  toHistoryOrder,
} from "../src/services/orderHistoryService.js";
import { getLatestOrderStatusMeta } from "../src/services/orderStatus.js";
import { createPlacedOrderFromTrackingOrder } from "../src/services/checkoutService.js";
import { getOrderById } from "../src/services/orderService.js";

const cartContextSource = readFileSync(
  new URL("../src/context/CartContext.jsx", import.meta.url),
  "utf8",
);
const orderHistoryPageSource = readFileSync(
  new URL("../src/routes/OrderHistoryPage.jsx", import.meta.url),
  "utf8",
);
const profilePageSource = readFileSync(
  new URL("../src/routes/ProfilePage.jsx", import.meta.url),
  "utf8",
);
const profileServiceSource = readFileSync(
  new URL("../src/services/profileService.js", import.meta.url),
  "utf8",
);
const orderServiceSource = readFileSync(
  new URL("../src/services/orderService.js", import.meta.url),
  "utf8",
);

assert(
  cartContextSource.includes("customerId: profile.id"),
  "Checkout must send the logged-in profile id as customerId.",
);
assert(
  cartContextSource.includes("customerId: profile.id,") ||
    cartContextSource.includes("customerId: profile.id"),
  "Placed order cache must retain the profile/customer id.",
);
assert(
  orderHistoryPageSource.includes("getCustomerOrderHistory(profileId)"),
  "Order History must fetch durable orders from order-service by profile id.",
);
assert(
  orderHistoryPageSource.includes("mergeOrderHistory({"),
  "Order History must merge local tracked orders with durable service orders.",
);
assert(
  orderHistoryPageSource.includes("login-required"),
  "Order History must show a login-required state when no profile is stored.",
);
assert(
  !orderHistoryPageSource.includes("getOrderHistory(\"all\")"),
  "Order History must not use static demo order history as its source of truth.",
);
assert(
  profilePageSource.includes("getCustomerOrderHistory(activeProfile.id)"),
  "Profile order panel must read orders from order-service, not profile-service.",
);
assert(
  profilePageSource.includes("mergeOrderHistory({"),
  "Profile order panel must merge local tracked orders with durable service orders.",
);
assert(
  !profileServiceSource.includes("/orders"),
  "Profile service client must not expose order-history endpoints.",
);

const adapted = toHistoryOrder({
  id: 42,
  customerId: 2,
  restaurantId: 14,
  status: "CREATED",
  totalPrice: 27.8,
  createdAt: "2026-07-05T12:34:00",
  items: [{ itemName: "Beef Pho", quantity: 2 }],
});

assert(adapted.id === "42", "Adapter should expose a string id for route links.");
assert(adapted.customerId === 2, "Adapter should preserve customerId.");
assert(adapted.restaurantId === 14, "Adapter should preserve restaurantId.");
assert(adapted.totalCents === 2780, "Adapter should convert totalPrice to cents.");
assert(adapted.itemsSummary === "2x Beef Pho", "Adapter should summarize order items.");
assert(adapted.trackingPath === "/orders/42/tracking", "Adapter should build tracking path.");

const staleServiceOrder = toHistoryOrder({
  id: 7,
  customerId: 2,
  restaurantId: 14,
  status: "CREATED",
  totalPrice: 14.9,
  createdAt: "2026-07-05T12:00:00Z",
  items: [{ itemName: "Beef Pho", quantity: 1 }],
});
const localTrackedOrder = {
  id: "7",
  customerId: 2,
  restaurantId: 14,
  restaurantName: "Pho Lantern Mitte",
  createdAt: Date.parse("2026-07-05T12:00:00Z"),
  trackingStartedAt: Date.parse("2026-07-05T12:05:00Z"),
  trackingStatus: "DRIVER_ASSIGNED",
  items: [{ name: "Beef Pho", quantity: 1 }],
  totalCents: 1490,
  trackingSnapshot: {
    latestStatus: "DRIVER_ASSIGNED",
    pickupLocation: { lat: 52.5262, lng: 13.4084 },
    deliveryLocation: { lat: 52.52, lng: 13.4 },
    routePoints: [
      { lat: 52.5262, lng: 13.4084 },
      { lat: 52.52, lng: 13.4 },
    ],
  },
};
const merged = mergeOrderHistory({
  profileId: 2,
  serviceOrders: [staleServiceOrder],
  trackedOrders: [localTrackedOrder, { ...localTrackedOrder, id: "other", customerId: 99 }],
});

assert(merged.length === 1, "Merge should dedupe local/service copies and keep only the active profile's orders.");
assert(merged[0].restaurantName === "Pho Lantern Mitte", "Local tracked order should enrich stale service order display.");
assert(merged[0].trackingPath === "/orders/7/tracking", "Merged profile orders should link to tracking.");
assert(getLatestOrderStatusMeta(merged[0]).label === "Driver assigned", "Local tracking status should override stale CREATED.");

const delivered = mergeOrderHistory({
  profileId: 2,
  serviceOrders: [staleServiceOrder],
  trackedOrders: [{ ...localTrackedOrder, deliveredAt: Date.now(), trackingStatus: "DELIVERED" }],
})[0];
assert(getLatestOrderStatusMeta(delivered).label === "Delivered", "Delivered local state should override stale CREATED.");

const trackingPageSource = readFileSync(
  new URL("../src/routes/OrderTrackingPage.jsx", import.meta.url),
  "utf8",
);
assert(
  trackingPageSource.includes("isOrderNotFound"),
  "OrderTrackingPage must handle order not found fallback when the order is not in static or local tracked lists.",
);
assert(
  trackingPageSource.includes("const isOrderNotFound = !order;") &&
    trackingPageSource.includes("disabled: trackingUnavailable || !baseOrder") &&
    trackingPageSource.includes("const order = baseOrder"),
  "OrderTrackingPage must render its unavailable state before item-rendering components can read from a null order.",
);
assert(
  trackingPageSource.includes("isTrackingNotFoundError"),
  "OrderTrackingPage must detect tracking not found errors and mark them unavailable.",
);
assert(
  orderServiceSource.includes("?? null") &&
    !orderServiceSource.includes("orders[0]"),
  "Static order lookup must not silently fall back to the first demo order for missing route ids.",
);
assert(
  trackingPageSource.includes("const isNumericRouteId = isNumericOrderId(id);") &&
    trackingPageSource.includes("const staticFallbackOrder = isNumericRouteId ? null : getOrderById(id);") &&
    trackingPageSource.includes("const isOrderNotFound = !order;"),
  "OrderTrackingPage must prevent static/mock fallback for concrete numeric /orders/:id/tracking routes.",
);
assert(
  trackingPageSource.includes("items: Array.isArray(baseOrder.items) ? baseOrder.items : []") &&
    trackingPageSource.includes("items: Array.isArray(storedOrder.items) ? storedOrder.items : []"),
  "OrderTrackingPage must render missing order items as an empty list instead of reading .items from null or assuming items exists.",
);
assert(
  trackingPageSource.includes("liveTrackingMissing") &&
    trackingPageSource.includes("setTrackingUnavailableOrderIds") &&
    trackingPageSource.includes("isTrackingUnavailable: trackingUnavailable"),
  "OrderTrackingPage must keep a route-local TRACKING_NOT_FOUND override after local/static fallback data is merged.",
);
assert(
  trackingPageSource.includes("trackingStatus: isUnavailable") &&
    trackingPageSource.includes('? "tracking_unavailable"'),
  "TRACKING_NOT_FOUND must force the display order into tracking_unavailable.",
);
assert(
  trackingPageSource.includes('estimatedArrival:\n      isUnavailable\n        ? "Unavailable"'),
  "OrderTrackingPage must show ETA as Unavailable for tracking_unavailable orders."
);
assert(
  trackingPageSource.includes('driverLocation:\n      isUnavailable\n        ? null'),
  "OrderTrackingPage must set driverLocation to null to prevent driver marker from displaying on the map."
);
assert(
  trackingPageSource.includes("const canShowRouteMap = !trackingUnavailable && hasRouteMap(order);") &&
    trackingPageSource.includes("trackingUnavailable ? (\n              <PendingTrackingPanel order={order} />"),
  "OrderTrackingPage must render only the unavailable panel and suppress active map rendering for tracking_unavailable orders."
);
assert(
  trackingPageSource.includes("rider: assignedDriverName ? { name: assignedDriverName } : null") &&
    trackingPageSource.includes("phase: isUnavailable ? null"),
  "OrderTrackingPage must not keep active rider or live driver phase fields after TRACKING_NOT_FOUND."
);
assert(
  trackingPageSource.includes("staticFallbackOrder") &&
    trackingPageSource.includes("isTrackingUnavailable: trackingUnavailable") &&
    trackingPageSource.includes("const isUnavailable =\n    isTrackingUnavailable"),
  "Static/mock order fallback must be overridden by tracking_unavailable after TRACKING_NOT_FOUND."
);
assert(
  trackingPageSource.includes("storedOrder?.assignmentStatus === \"assigned\"") &&
    trackingPageSource.includes("storedOrder.trackingStartedAt") &&
    trackingPageSource.includes("getTrackingOrder({"),
  "New tracked checkout orders must still be eligible for live backend tracking and display.",
);
assert(
  trackingPageSource.includes("shouldRequestBackendTracking(storedOrder, liveTrackingMissing)") &&
    trackingPageSource.includes("!liveTrackingMissing") &&
    trackingPageSource.includes('storedOrder?.trackingStatus !== "tracking_unavailable"'),
  "OrderTrackingPage must stop backend tracking requests after tracking_unavailable is applied."
);

assert(
  cartContextSource.includes('trackingStatus: "tracking_unavailable"') &&
    cartContextSource.includes('assignmentStatus: "tracking_unavailable"'),
  "CartContext must persist tracking_unavailable status in local tracked orders when tracking is lost."
);

const missingOrder = getOrderById("999999");
assert(missingOrder === null, "getOrderById must return null for unknown order ids.");
assert(
  createPlacedOrderFromTrackingOrder(missingOrder) === null,
  "Missing getOrderById results must be safe for receipt/order rendering helpers.",
);
assert(
  !trackingPageSource.includes("const staticFallbackOrder = getOrderById(id);") &&
    !trackingPageSource.includes("staticFallbackOrder ?? getOrderById"),
  "Numeric /orders/:id/tracking routes must not use static fallback order data.",
);

const simulationSource = readFileSync(
  new URL("../src/hooks/useDeliverySimulation.js", import.meta.url),
  "utf8",
);
assert(
  simulationSource.includes('order?.trackingStatus === "tracking_unavailable"'),
  "useDeliverySimulation must stop local delivery simulation for tracking_unavailable orders."
);
assert(
  simulationSource.includes("disabled = false") &&
    simulationSource.includes("order && startedAt && !isTrackingUnavailable"),
  "useDeliverySimulation must support an explicit disabled state for local TRACKING_NOT_FOUND overrides."
);

console.log("Validated checkout customerId wiring, order-service history loading, merged local/service history, profile order source, route links, status override, and order adapter output.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
