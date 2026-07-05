import { readFileSync } from "node:fs";
import { toHistoryOrder } from "../src/services/orderHistoryService.js";

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

console.log("Validated checkout customerId wiring, order-service history loading, login state, profile order source, and order adapter output.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
