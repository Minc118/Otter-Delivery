import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DeliveryMap from "../components/order/DeliveryMap.jsx";
import OrderSwitcher from "../components/order/OrderSwitcher.jsx";
import OrderSummary from "../components/order/OrderSummary.jsx";
import SupportCard from "../components/order/SupportCard.jsx";
import TrackingStatusHeader from "../components/order/TrackingStatusHeader.jsx";
import useCart from "../hooks/useCart.js";
import useDeliverySimulation from "../hooks/useDeliverySimulation.js";
import {
  getOrderTracking,
  isTrackingNotFoundError,
} from "../services/driverService.js";
import { getOrderById } from "../services/orderService.js";
import { normalizeRouteEstimate } from "../services/trackingState.js";
import { getRoutePoints, normalizeRoutePoint } from "../services/routeGeometry.js";
import {
  getTrackingStatusText,
  getTrackingStatusTitle,
} from "../services/orderStatus.js";

export default function OrderTrackingPage() {
  const { id } = useParams();
  const {
    markDeliveryDelivered,
    markTrackingUnavailable,
    selectTrackedOrder,
    trackedOrders,
  } = useCart();
  const [tracking, setTracking] = useState(null);
  const [trackingUnavailableOrderIds, setTrackingUnavailableOrderIds] =
    useState(() => new Set());
  const storedOrder = trackedOrders.find(
    (order) => String(order.id) === String(id),
  );
  const liveTrackingMissing = trackingUnavailableOrderIds.has(String(id));
  const trackingUnavailable =
    liveTrackingMissing ||
    storedOrder?.trackingStatus === "tracking_unavailable";
  const isNumericRouteId = isNumericOrderId(id);
  const staticFallbackOrder = isNumericRouteId ? null : getOrderById(id);
  const baseOrder = getTrackingOrder({
    fallbackOrder: staticFallbackOrder,
    id,
    isTrackingUnavailable: trackingUnavailable,
    storedOrder,
    tracking,
  });
  const simulation = useDeliverySimulation(baseOrder, {
    disabled: trackingUnavailable || !baseOrder,
  });
  const order = baseOrder
    ? {
        ...baseOrder,
        ...simulation,
        items: Array.isArray(baseOrder.items) ? baseOrder.items : [],
        routeProgress: simulation?.routeProgress ?? baseOrder.routeProgress ?? 0,
      }
    : null;
  const canShowRouteMap = !trackingUnavailable && hasRouteMap(order);

  useEffect(() => {
    document.title = "Order Tracking - Otter Delivery";
    document.body.classList.add("tracking-responsive");

    return () => document.body.classList.remove("tracking-responsive");
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!shouldRequestBackendTracking(storedOrder, liveTrackingMissing)) {
      setTracking(null);
      return undefined;
    }

    setTracking(null);
    getOrderTracking(id)
      .then((nextTracking) => {
        if (!cancelled) {
          setTracking(nextTracking);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          if (isTrackingNotFoundError(error)) {
            setTrackingUnavailableOrderIds((currentOrderIds) => {
              const nextOrderIds = new Set(currentOrderIds);
              nextOrderIds.add(String(id));
              return nextOrderIds;
            });
            markTrackingUnavailable(id);
          }
          setTracking(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, liveTrackingMissing, markTrackingUnavailable, storedOrder]);

  useEffect(() => {
    if (storedOrder) {
      selectTrackedOrder(id);
    }
  }, [id, selectTrackedOrder, storedOrder]);

  useEffect(() => {
    if (
      simulation?.phase === "DELIVERED" &&
      storedOrder &&
      !storedOrder.deliveredAt
    ) {
      markDeliveryDelivered(id, simulation.deliveredAt);
    }
  }, [id, markDeliveryDelivered, simulation, storedOrder]);

  const isOrderNotFound = !order;

  if (isOrderNotFound) {
    return (
      <div className="bg-background min-h-full flex items-center justify-center p-8 text-center min-h-[460px]">
        <div className="max-w-md">
          <span className="material-symbols-outlined mb-4 text-5xl text-error">
            error
          </span>
          <h2 className="font-section-title text-section-title text-on-surface">
            Order tracking unavailable
          </h2>
          <p className="mt-3 font-body-md text-body-md text-on-surface-variant font-medium">
            We could not find tracking information for order #{id}. The driver service may have been restarted, or this order ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full">
      <div className="w-full max-w-container-max mx-auto px-margin-x py-stack-lg flex flex-col gap-stack-lg">
        <OrderSwitcher
          currentOrderId={id}
          onSelectOrder={selectTrackedOrder}
          trackedOrders={trackedOrders}
        />
        <TrackingStatusHeader order={order} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 flex flex-col gap-stack-lg">
            {trackingUnavailable ? (
              <PendingTrackingPanel order={order} />
            ) : (
              simulation || canShowRouteMap ? (
                <DeliveryMap order={order} />
              ) : (
                <PendingTrackingPanel order={order} />
              )
            )}
          </div>
          <div className="flex flex-col gap-stack-md">
            <OrderSummary order={order} />
            <SupportCard />
          </div>
        </section>
      </div>
    </div>
  );
}

function shouldRequestBackendTracking(storedOrder, liveTrackingMissing = false) {
  return Boolean(
    !liveTrackingMissing &&
      storedOrder?.trackingStatus !== "tracking_unavailable" &&
      storedOrder?.assignmentStatus === "assigned" &&
      !storedOrder.deliveredAt &&
      storedOrder.trackingStartedAt &&
      (storedOrder.assignment || storedOrder.assignedDriver),
  );
}

function isNumericOrderId(orderId) {
  return /^\d+$/.test(String(orderId ?? "").trim());
}

function getTrackingOrder({
  fallbackOrder,
  id,
  isTrackingUnavailable = false,
  storedOrder,
  tracking,
}) {
  if (String(storedOrder?.id) !== String(id)) {
    return fallbackOrder;
  }

  const snapshot = storedOrder.trackingSnapshot ?? {};
  const assignmentStatus = storedOrder.assignmentStatus;
  const isUnavailable =
    isTrackingUnavailable ||
    storedOrder.trackingStatus === "tracking_unavailable";
  const displayStatus = isUnavailable
    ? "tracking_unavailable"
    : (storedOrder.deliveredAt ? "delivered" : assignmentStatus);
  const assignedDriverName = isUnavailable
    ? null
    : (storedOrder.assignedDriver?.name ?? snapshot.driver?.name ?? "Driver pending");
  const hasTracking =
    !isUnavailable && (tracking?.assignment || tracking?.events?.length > 0);
  const routeEstimate = normalizeRouteEstimate(
    storedOrder.routeEstimate ?? snapshot.routeEstimate,
  );
  const latestTrackedLocation = [...(tracking?.events ?? [])]
    .reverse()
    .find((event) => event.location)?.location;

  return {
    ...(fallbackOrder ?? {}),
    id: storedOrder.id,
    displayId: storedOrder.displayId,
    etaModel: storedOrder.deliveryEta,
    phase: isUnavailable ? null : fallbackOrder?.phase,
    trackingStatus: isUnavailable
      ? "tracking_unavailable"
      : storedOrder.trackingStatus,
    rider: assignedDriverName ? { name: assignedDriverName } : null,
    statusText: getTrackingStatusText(displayStatus, hasTracking),
    statusTitle: getTrackingStatusTitle(displayStatus),
    estimatedArrival:
      isUnavailable
        ? "Unavailable"
        : (storedOrder.deliveredAt
            ? "Delivered"
            : storedOrder.estimatedDeliveryTime ?? snapshot.estimatedDeliveryTime ?? routeEstimate?.etaLabel ?? "Pending"),
    routePoints: routeEstimate?.routePoints ?? snapshot.routePoints,
    encodedPolyline: routeEstimate?.encodedPolyline ?? snapshot.encodedPolyline,
    routeProvider:
      routeEstimate?.provider ?? snapshot.routeProvider ??
      (storedOrder.assignmentStatus === "assigned" ||
      storedOrder.assignmentStatus === "failed" ||
      storedOrder.assignmentStatus === "pending"
        ? "coordinate_fallback"
        : null),
    routeDurationSeconds: routeEstimate?.durationSeconds ?? snapshot.routeDurationSeconds,
    pickupLocation:
      routeEstimate?.originLocation ?? storedOrder.pickupLocation ?? snapshot.pickupLocation,
    deliveryLocation:
      routeEstimate?.destinationLocation ??
      storedOrder.deliveryLocation ??
      snapshot.deliveryLocation ?? {
        lat: storedOrder.deliveryAddress?.latitude,
        lng: storedOrder.deliveryAddress?.longitude,
      },
    driverLocation:
      isUnavailable
        ? null
        : (latestTrackedLocation ?? storedOrder.assignedDriver?.currentLocation),
    deliveryAddress: storedOrder.deliveryAddress,
    trackingStartedAt: storedOrder.trackingStartedAt,
    restaurant: {
      name: storedOrder.restaurantName,
      image: storedOrder.restaurantImage,
    },
    items: Array.isArray(storedOrder.items) ? storedOrder.items : [],
    deliveryFeeCents: storedOrder.deliveryFeeCents,
    serviceFeeCents: 0,
  };
}

function hasRouteMap(order) {
  const pickupLocation = normalizeRoutePoint(order?.pickupLocation);
  const deliveryLocation = normalizeRoutePoint(order?.deliveryLocation);
  return Boolean(
    pickupLocation &&
      deliveryLocation &&
      getRoutePoints({
        pickupLocation,
        deliveryLocation,
        routePoints: order?.routePoints,
        encodedPolyline: order?.encodedPolyline,
      }).length >= 2,
  );
}

function PendingTrackingPanel({ order }) {
  const isUnavailable = order.trackingStatus === "tracking_unavailable";
  return (
    <div className="lg:col-span-2 flex min-h-[460px] items-center justify-center rounded-xl border border-surface bg-surface-container-lowest p-8 text-center shadow-[0_12px_32px_rgba(36,36,38,0.04)] lg:min-h-[620px]">
      <div className="max-w-md">
        <span className={`material-symbols-outlined mb-4 text-5xl ${isUnavailable ? "text-error" : "text-primary"}`}>
          {isUnavailable ? "error" : "restaurant"}
        </span>
        <h2 className="font-section-title text-section-title text-on-surface">
          {isUnavailable ? "Tracking unavailable" : "Preparing your order"}
        </h2>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          {isUnavailable
            ? "We could not connect to the driver tracking service for this order. It may have been completed or the service was restarted."
            : `Tracking map for order #${order.displayId} will appear when saved route information is available. Older orders without a route snapshot show this summary instead.`}
        </p>
      </div>
    </div>
  );
}
