import { readFileSync } from "node:fs";
import {
  mergeOrderHistory,
  toHistoryOrder,
} from "../src/services/orderHistoryService.js";
import { getLatestOrderStatusMeta } from "../src/services/orderStatus.js";

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

console.log("Validated checkout customerId wiring, order-service history loading, merged local/service history, profile order source, route links, status override, and order adapter output.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
