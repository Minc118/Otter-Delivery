import { normalizeDeliveryEtaModel } from "./deliveryEta.js";
import {
  getRoutePoints,
  normalizeRoutePoint,
} from "./routeGeometry.js";

const RECENT_ACTIVE_ORDER_GRACE_PERIOD_MS = 15 * 60 * 1000;

export function getTrackedDeliveryOrder(order) {
  const id = normalizeId(order?.id ?? order?.orderId);
  const trackingStartedAt = Number(order?.trackingStartedAt);
  const estimate = normalizeRouteEstimate(order?.routeEstimate);
  const assignment = order?.assignment;
  const assignmentOrderId = normalizeId(assignment?.orderId);
  const assignmentMatches = !assignmentOrderId || assignmentOrderId === id;
  const hasAssignment = Boolean(
    order?.assignmentStatus === "assigned" &&
      assignmentMatches &&
      (assignment || order?.assignedDriver),
  );
  const pickupLocation = normalizeRoutePoint(
    estimate?.originLocation ?? order.pickupLocation,
  );
  const deliveryLocation = normalizeRoutePoint(
    estimate?.destinationLocation ?? toDeliveryLocation(order.deliveryAddress),
  );
  const routePoints = getRoutePoints({
    routePoints: estimate?.routePoints,
    encodedPolyline: estimate?.encodedPolyline,
    pickupLocation,
    deliveryLocation,
  });
  const hasTrackableCoordinates = Boolean(
    pickupLocation && deliveryLocation && routePoints.length >= 2,
  );

  if (
    !id ||
    !hasAssignment ||
    !hasTrackableCoordinates ||
    !Number.isFinite(trackingStartedAt) ||
    trackingStartedAt <= 0
  ) {
    return null;
  }

  return {
    id,
    deliveredAt: normalizeTimestamp(order.deliveredAt),
    etaModel: normalizeDeliveryEtaModel(
      order.deliveryEta,
      estimate?.durationSeconds,
    ),
    routePoints,
    encodedPolyline: estimate?.encodedPolyline,
    routeDurationSeconds: estimate?.durationSeconds,
    pickupLocation,
    deliveryLocation,
    driverLocation: normalizeRoutePoint(
      order.assignedDriver?.currentLocation ??
        order.assignedDriver?.location,
    ),
    trackingStartedAt,
  };
}

export const getActiveDeliveryOrder = getTrackedDeliveryOrder;

export function getTrackedDeliveryOrders(orders) {
  return (Array.isArray(orders) ? orders : [])
    .map((order) => ({
      order,
      simulationOrder:
        getTrackedDeliveryOrder(order) ?? getLocalTrackedDeliveryOrder(order),
    }))
    .filter((entry) => entry.simulationOrder)
    .sort(
      (left, right) =>
        getTrackedOrderSortTime(right.order) - getTrackedOrderSortTime(left.order),
    );
}

function getLocalTrackedDeliveryOrder(order) {
  const snapshot = order?.trackingSnapshot ?? {};
  const id = normalizeId(order?.id ?? order?.orderId);
  const assignmentStatus = normalizeAssignmentStatus(order?.assignmentStatus);
  const pickupLocation = normalizeRoutePoint(order?.pickupLocation ?? snapshot.pickupLocation);
  const deliveryLocation = normalizeRoutePoint(
    order?.deliveryLocation ?? snapshot.deliveryLocation ?? toDeliveryLocation(order?.deliveryAddress),
  );
  const routePoints = getRoutePoints({
    pickupLocation,
    deliveryLocation,
    routePoints: order?.routePoints ?? snapshot.routePoints,
  });

  if (!id || !assignmentStatus) {
    return null;
  }

  return {
    id,
    assignmentStatus,
    deliveredAt: normalizeTimestamp(order.deliveredAt),
    etaModel: normalizeDeliveryEtaModel(order.deliveryEta),
    pickupLocation,
    deliveryLocation,
    routePoints,
    trackingStartedAt: normalizeTimestamp(order.trackingStartedAt),
  };
}

export function sanitizeTrackedOrdersById(
  storedOrders,
  activeOrderId,
) {
  if (!storedOrders || typeof storedOrders !== "object") {
    return {};
  }

  return Object.values(storedOrders).reduce((ordersById, order) => {
    const sanitizedOrder = sanitizeTrackedOrder(order);
    if (sanitizedOrder) {
      ordersById[String(sanitizedOrder.id)] = sanitizedOrder;
    }
    return ordersById;
  }, {});
}

export function isRecentActiveTrackedOrder(
  order,
  activeOrderId,
  now = Date.now(),
) {
  const id = normalizeId(order?.id ?? order?.orderId);
  const createdAt = normalizeTimestamp(
    order?.createdAt ?? order?.trackingStartedAt,
  );

  return Boolean(
    id &&
      String(activeOrderId) === id &&
      createdAt &&
      now - createdAt <= RECENT_ACTIVE_ORDER_GRACE_PERIOD_MS,
  );
}

function sanitizeTrackedOrder(order) {
  if (!order || typeof order !== "object") {
    return null;
  }

  const id = normalizeId(order.id ?? order.orderId);
  const createdAt = normalizeTimestamp(order.createdAt);
  const trackingStartedAt = normalizeTimestamp(order.trackingStartedAt);
  const deliveredAt = normalizeTimestamp(order.deliveredAt);
  const assignmentStatus = normalizeAssignmentStatus(order.assignmentStatus);

  if (!id || !assignmentStatus || (!createdAt && !trackingStartedAt)) {
    return null;
  }

  if (
    assignmentStatus === "assigned" &&
    (!trackingStartedAt || (!order.assignment && !order.assignedDriver))
  ) {
    return null;
  }

  return {
    ...order,
    assignmentStatus,
    createdAt: createdAt ?? trackingStartedAt,
    deliveredAt: deliveredAt ?? undefined,
    id,
    trackingStartedAt: trackingStartedAt ?? undefined,
  };
}

function normalizeAssignmentStatus(status) {
  const normalizedStatus = String(status ?? "").toLowerCase();
  return ["assigned", "failed", "pending"].includes(normalizedStatus)
    ? normalizedStatus
    : null;
}

function getTrackedOrderSortTime(order) {
  return (
    normalizeTimestamp(order?.trackingStartedAt) ??
    normalizeTimestamp(order?.createdAt) ??
    0
  );
}

export function normalizeRouteEstimate(routeEstimate) {
  if (!routeEstimate || typeof routeEstimate !== "object") {
    return null;
  }

  const estimate =
    routeEstimate.estimate && typeof routeEstimate.estimate === "object"
      ? routeEstimate.estimate
      : routeEstimate;

  return {
    destinationLocation: normalizeRoutePoint(
      estimate.destinationLocation ??
      estimate.deliveryLocation ??
      estimate.customerLocation,
    ),
    durationSeconds: Number(estimate.durationSeconds) || undefined,
    encodedPolyline: estimate.encodedPolyline,
    etaLabel: routeEstimate.etaLabel ?? estimate.etaLabel,
    originLocation: normalizeRoutePoint(
      estimate.originLocation ?? estimate.pickupLocation,
    ),
    provider: estimate.provider ?? routeEstimate.provider,
    routePoints: getRoutePoints({
      routePoints: estimate.routePoints,
      encodedPolyline: estimate.encodedPolyline,
      pickupLocation: estimate.originLocation ?? estimate.pickupLocation,
      deliveryLocation:
        estimate.destinationLocation ??
        estimate.deliveryLocation ??
        estimate.customerLocation,
    }),
  };
}

function normalizeId(id) {
  if (id == null || String(id).trim() === "") {
    return null;
  }

  return String(id);
}

function normalizeTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function toDeliveryLocation(address) {
  return normalizeRoutePoint({
    latitude: address?.latitude,
    longitude: address?.longitude,
  });
}
