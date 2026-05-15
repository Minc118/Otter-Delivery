import { orderHistory } from "../data/orderHistory.js";

export function getOrderHistory(status = "all") {
  if (status === "all") {
    return orderHistory;
  }

  return orderHistory.filter((order) => order.statusType === status);
}
