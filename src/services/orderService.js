import { activeOrder, orders } from "../data/orders.js";

export function getActiveOrder() {
  return activeOrder;
}

export function getOrderById(id) {
  const normalizedId = id?.toLowerCase();

  return (
    orders.find((order) => order.id.toLowerCase() === normalizedId) ??
    orders[0] ??
    null
  );
}
