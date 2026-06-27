import { normalizeDeliveryEtaModel } from "./deliveryEta.js";
import {
  getRoutePoints,
  normalizeRoutePoint,
} from "./routeGeometry.js";

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
      simulationOrder: getTrackedDeliveryOrder(order),
    }))
    .filter((entry) => entry.simulationOrder)
    .sort(
      (left, right) =>
        right.simulationOrder.trackingStartedAt -
        left.simulationOrder.trackingStartedAt,
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
