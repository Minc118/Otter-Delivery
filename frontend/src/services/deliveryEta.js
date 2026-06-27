const DEFAULT_PREPARATION_MINUTES = 20;
const DEFAULT_DRIVER_TO_PICKUP_MINUTES = 12;
const DEFAULT_PICKUP_PAUSE_MINUTES = 3;
const MINIMUM_DELIVERY_ROUTE_MINUTES = 8;
const MINIMUM_TOTAL_ETA_MINUTES = 40;

export function createDeliveryEtaModel(routeDurationSeconds) {
  const deliveryRouteMinutes = Math.max(
    MINIMUM_DELIVERY_ROUTE_MINUTES,
    Math.ceil((Number(routeDurationSeconds) || 0) / 60),
  );
  const baseTotalMinutes =
    DEFAULT_PREPARATION_MINUTES +
    DEFAULT_DRIVER_TO_PICKUP_MINUTES +
    DEFAULT_PICKUP_PAUSE_MINUTES +
    deliveryRouteMinutes;
  const preparationMinutes =
    DEFAULT_PREPARATION_MINUTES +
    Math.max(0, MINIMUM_TOTAL_ETA_MINUTES - baseTotalMinutes);

  return {
    deliveryRouteMinutes,
    driverToPickupMinutes: DEFAULT_DRIVER_TO_PICKUP_MINUTES,
    pickupPauseMinutes: DEFAULT_PICKUP_PAUSE_MINUTES,
    preparationMinutes,
    totalEtaMinutes:
      preparationMinutes +
      DEFAULT_DRIVER_TO_PICKUP_MINUTES +
      DEFAULT_PICKUP_PAUSE_MINUTES +
      deliveryRouteMinutes,
  };
}

export function normalizeDeliveryEtaModel(model, routeDurationSeconds) {
  const fallback = createDeliveryEtaModel(routeDurationSeconds);
  if (!model || typeof model !== "object") {
    return fallback;
  }

  const normalized = {
    deliveryRouteMinutes: positiveNumber(
      model.deliveryRouteMinutes,
      fallback.deliveryRouteMinutes,
    ),
    driverToPickupMinutes: positiveNumber(
      model.driverToPickupMinutes,
      fallback.driverToPickupMinutes,
    ),
    pickupPauseMinutes: positiveNumber(
      model.pickupPauseMinutes,
      fallback.pickupPauseMinutes,
    ),
    preparationMinutes: positiveNumber(
      model.preparationMinutes,
      fallback.preparationMinutes,
    ),
  };

  return {
    ...normalized,
    totalEtaMinutes: Math.max(
      MINIMUM_TOTAL_ETA_MINUTES,
      Object.values(normalized).reduce((total, value) => total + value, 0),
    ),
  };
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
