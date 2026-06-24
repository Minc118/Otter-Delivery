import { useEffect, useMemo, useState } from "react";
import {
  getRoutePoints,
  hashOrderId,
  interpolateRoute,
  normalizeRoutePoint,
} from "../services/routeGeometry.js";
import { normalizeDeliveryEtaModel } from "../services/deliveryEta.js";

// Delivery time is accelerated for demos while remaining slow enough to follow.
const DEMO_SPEED_FACTOR = 6;
const MIN_SIMULATION_DURATION_MS = 60000;
const SIMULATION_STORAGE_PREFIX = "otter-delivery-simulation:";

export default function useDeliverySimulation(
  order,
  { tickIntervalMs = 500 } = {},
) {
  const orderId = order?.id == null ? null : String(order.id);
  const routePoints = useMemo(
    () =>
      orderId
        ? getRoutePoints({
            routePoints: order?.routePoints,
            encodedPolyline: order?.encodedPolyline,
            pickupLocation: order?.pickupLocation,
            deliveryLocation: order?.deliveryLocation,
          })
        : [],
    [
      orderId,
      order?.routePoints,
      order?.encodedPolyline,
      order?.pickupLocation,
      order?.deliveryLocation,
    ],
  );
  const seed = useMemo(() => (orderId ? hashOrderId(orderId) : 0), [orderId]);
  const startedAt = useMemo(
    () =>
      orderId ? getSimulationStart(orderId, order?.trackingStartedAt) : null,
    [orderId, order?.trackingStartedAt],
  );
  const [now, setNow] = useState(() => Date.now());

  const simulation =
    order && startedAt
      ? createSimulationSnapshot({
          now,
          order,
          routePoints,
          seed,
          startedAt,
        })
      : null;

  useEffect(() => {
    if (!simulation || simulation.phase === "DELIVERED") {
      return undefined;
    }

    const intervalId = window.setInterval(
      () => setNow(Date.now()),
      tickIntervalMs,
    );
    return () => window.clearInterval(intervalId);
  }, [simulation?.phase, tickIntervalMs]);

  return simulation
    ? {
        ...simulation,
        routePoints,
      }
    : null;
}

function createSimulationSnapshot({
  now,
  order,
  routePoints,
  seed,
  startedAt,
}) {
  const timing = createDeliveryTiming({ now, order, startedAt });
  const { phase, routeProgress } = timing;

  let position;
  let visualRouteProgress = 0;
  if (phase === "DRIVER_ASSIGNED" || phase === "HEADING_TO_PICKUP") {
    position = {
      headingDegrees: 0,
      location:
        normalizeRoutePoint(order.driverLocation) ??
        normalizeRoutePoint(order.pickupLocation),
    };
  } else if (phase === "PICKING_UP") {
    position = interpolateRoute(routePoints, 0);
  } else if (phase === "ON_THE_WAY" || phase === "ARRIVING_SOON") {
    visualRouteProgress = smoothSeededProgress(routeProgress, seed);
    position = interpolateRoute(routePoints, visualRouteProgress);
  } else {
    visualRouteProgress = 1;
    position = interpolateRoute(routePoints, 1);
  }

  const copy = phaseCopy[phase];

  return {
    deliveredAt: timing.deliveredAt,
    driverHeading: position.headingDegrees,
    driverLocation: position.location,
    estimatedArrival:
      phase === "DELIVERED"
        ? "Delivered"
        : `approx. ${timing.remainingMinutes} min`,
    phase,
    progress: timing.progress,
    remainingMinutes: timing.remainingMinutes,
    routeProgress: visualRouteProgress,
    statusText: copy.statusText,
    statusTitle: copy.statusTitle,
  };
}

export function getDeliveryTiming(order, now = Date.now()) {
  if (!order?.id) {
    return null;
  }

  const startedAt = getSimulationStart(
    String(order.id),
    order.trackingStartedAt,
  );
  return startedAt ? createDeliveryTiming({ now, order, startedAt }) : null;
}

function createDeliveryTiming({ now, order, startedAt }) {
  const etaModel = normalizeDeliveryEtaModel(
    order.etaModel,
    order.routeDurationSeconds,
  );
  const totalEtaSeconds = etaModel.totalEtaMinutes * 60;
  const totalDurationMs = Math.max(
    MIN_SIMULATION_DURATION_MS,
    (totalEtaSeconds * 1000) / DEMO_SPEED_FACTOR,
  );
  const preparationDurationMs =
    totalDurationMs *
    (etaModel.preparationMinutes / etaModel.totalEtaMinutes);
  const approachDurationMs =
    totalDurationMs *
    (etaModel.driverToPickupMinutes / etaModel.totalEtaMinutes);
  const pickupDurationMs =
    totalDurationMs *
    (etaModel.pickupPauseMinutes / etaModel.totalEtaMinutes);
  const approachStartedAt = preparationDurationMs;
  const pickupStartedAt = approachStartedAt + approachDurationMs;
  const routeStartedAt = pickupStartedAt + pickupDurationMs;
  const routeDurationMs = totalDurationMs - routeStartedAt;
  const elapsedMs = clamp(now - startedAt, 0, totalDurationMs);
  const routeProgress = clamp(
    (elapsedMs - routeStartedAt) / routeDurationMs,
    0,
    1,
  );
  const approachProgress = clamp(
    (elapsedMs - approachStartedAt) / approachDurationMs,
    0,
    1,
  );

  let phase = "DELIVERED";
  if (elapsedMs < approachStartedAt) {
    phase = "DRIVER_ASSIGNED";
  } else if (elapsedMs < pickupStartedAt) {
    phase = "HEADING_TO_PICKUP";
  } else if (elapsedMs < routeStartedAt) {
    phase = "PICKING_UP";
  } else if (routeProgress < 0.82) {
    phase = "ON_THE_WAY";
  } else if (routeProgress < 1) {
    phase = "ARRIVING_SOON";
  }

  return {
    approachProgress,
    deliveredAt: startedAt + totalDurationMs,
    etaModel,
    phase,
    progress: elapsedMs / totalDurationMs,
    remainingMinutes: Math.ceil(
      (totalEtaSeconds * (1 - elapsedMs / totalDurationMs)) / 60,
    ),
    routeProgress,
    totalDurationMs,
  };
}

const phaseCopy = {
  DRIVER_ASSIGNED: {
    statusTitle: "The restaurant is preparing your order",
    statusText: "Driver assigned · preparing food",
  },
  HEADING_TO_PICKUP: {
    statusTitle: "Driver is heading to the restaurant",
    statusText: "Heading to pickup",
  },
  PICKING_UP: {
    statusTitle: "Your order is being picked up",
    statusText: "Picking up your order",
  },
  ON_THE_WAY: {
    statusTitle: "Your order is on the way",
    statusText: "Heading to your delivery address",
  },
  ARRIVING_SOON: {
    statusTitle: "Your driver is almost there",
    statusText: "Arriving soon",
  },
  DELIVERED: {
    statusTitle: "Your order has arrived",
    statusText: "Delivered",
  },
};

function smoothSeededProgress(progress, seed) {
  const seedPhase = ((seed % 1000) / 1000) * Math.PI * 2;
  const naturalVariation =
    Math.sin(progress * Math.PI * 4 + seedPhase) *
    0.008 *
    Math.sin(progress * Math.PI);
  return clamp(progress + naturalVariation, 0, 1);
}

function getSimulationStart(orderId, suggestedStart) {
  if (typeof window === "undefined") {
    return Date.now();
  }

  const storageKey = `${SIMULATION_STORAGE_PREFIX}${orderId}`;
  const storedStart = Number(window.localStorage.getItem(storageKey));
  if (Number.isFinite(storedStart) && storedStart > 0) {
    return storedStart;
  }

  const normalizedStart = Number(suggestedStart);
  return Number.isFinite(normalizedStart) && normalizedStart > 0
    ? normalizedStart
    : null;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
