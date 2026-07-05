const STATUS_MAP = {
  created: {
    label: "Order placed",
    type: "placed",
    title: "Your order has been placed",
    text: "Order placed",
  },
  placed: {
    label: "Order placed",
    type: "placed",
    title: "Your order has been placed",
    text: "Order placed",
  },
  confirmed: {
    label: "Confirmed",
    type: "placed",
    title: "Restaurant confirmed your order",
    text: "Confirmed",
  },
  preparing: {
    label: "Preparing",
    type: "preparing",
    title: "Your order is being prepared",
    text: "Preparing order",
  },
  pending: {
    label: "Preparing",
    type: "preparing",
    title: "Your order is being prepared",
    text: "Preparing order",
  },
  driver_assignment_pending: {
    label: "Preparing",
    type: "preparing",
    title: "Your order is being prepared",
    text: "Preparing order",
  },
  ready: {
    label: "Ready for pickup",
    type: "preparing",
    title: "Your order is ready for pickup",
    text: "Ready for pickup",
  },
  assigned: {
    label: "Driver assigned",
    type: "on-the-way",
    title: "Driver accepted your order",
    text: "Driver assigned",
  },
  driver_assigned: {
    label: "Driver assigned",
    type: "on-the-way",
    title: "Driver accepted your order",
    text: "Driver assigned",
  },
  picked_up: {
    label: "Out for delivery",
    type: "on-the-way",
    title: "Your order is on the way",
    text: "Out for delivery",
  },
  on_the_way: {
    label: "Out for delivery",
    type: "on-the-way",
    title: "Your order is on the way",
    text: "Out for delivery",
  },
  out_for_delivery: {
    label: "Out for delivery",
    type: "on-the-way",
    title: "Your order is on the way",
    text: "Out for delivery",
  },
  delivered: {
    label: "Delivered",
    type: "completed",
    title: "Delivered",
    text: "Delivered",
  },
  completed: {
    label: "Delivered",
    type: "completed",
    title: "Delivered",
    text: "Delivered",
  },
  cancelled: {
    label: "Cancelled",
    type: "cancelled",
    title: "Order cancelled",
    text: "Cancelled",
  },
  failed: {
    label: "Failed",
    type: "cancelled",
    title: "We are still assigning a driver",
    text: "Driver assignment temporarily unavailable",
  },
  driver_assignment_unavailable: {
    label: "Driver assignment unavailable",
    type: "cancelled",
    title: "We are still assigning a driver",
    text: "Driver assignment temporarily unavailable",
  },
};

export function getOrderStatusMeta(status, fallbackType = null) {
  const normalizedStatus = normalizeStatus(status);
  const normalizedFallbackType = normalizeStatus(fallbackType);

  return (
    STATUS_MAP[normalizedStatus] ??
    STATUS_MAP[normalizedFallbackType] ??
    {
      label: toTitleCase(status || fallbackType || "Order placed"),
      type: fallbackType || "placed",
      title: toTitleCase(status || fallbackType || "Order placed"),
      text: toTitleCase(status || fallbackType || "Order placed"),
    }
  );
}

export function getLatestOrderStatusMeta(order) {
  const snapshot = order?.trackingSnapshot ?? {};
  if (
    order?.deliveredAt ||
    snapshot.deliveredAt ||
    isDeliveredStatus(order?.status) ||
    isDeliveredStatus(order?.trackingStatus) ||
    isDeliveredStatus(snapshot.latestStatus)
  ) {
    return STATUS_MAP.delivered;
  }

  const status =
    order?.trackingStatus ??
    snapshot.latestStatus ??
    order?.assignmentStatus ??
    order?.status;
  return getOrderStatusMeta(status, order?.statusType);
}

export function getTrackingStatusTitle(assignmentStatus) {
  return getOrderStatusMeta(assignmentStatus).title;
}

export function getTrackingStatusText(assignmentStatus, hasTracking = false) {
  if (isDeliveredStatus(assignmentStatus)) {
    return STATUS_MAP.delivered.text;
  }
  if (hasTracking) {
    return STATUS_MAP.assigned.text;
  }
  return getOrderStatusMeta(assignmentStatus).text;
}

function normalizeStatus(status) {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function isDeliveredStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === "delivered" || normalized === "completed";
}

function toTitleCase(value) {
  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
