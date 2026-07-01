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

export default function OrderTrackingPage() {
  const { id } = useParams();
  const {
    markDeliveryDelivered,
    markTrackingUnavailable,
    selectTrackedOrder,
    trackedOrders,
  } = useCart();
  const [tracking, setTracking] = useState(null);
  const storedOrder = trackedOrders.find(
    (order) => String(order.id) === String(id),
  );
  const baseOrder = getTrackingOrder({
    fallbackOrder: getOrderById(id),
    id,
    storedOrder,
    tracking,
  });
  const simulation = useDeliverySimulation(baseOrder);
  const order = {
    ...baseOrder,
    ...simulation,
    routeProgress: simulation?.routeProgress ?? baseOrder?.routeProgress ?? 0,
  };
  const canShowRouteMap = hasRouteMap(order);

  useEffect(() => {
    document.title = "Order Tracking - Otter Delivery";
    document.body.classList.add("tracking-responsive");

    return () => document.body.classList.remove("tracking-responsive");
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!shouldRequestBackendTracking(storedOrder)) {
      setTracking(null);
      return undefined;
    }

    getOrderTracking(id)
      .then((nextTracking) => {
        if (!cancelled) {
          setTracking(nextTracking);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          if (isTrackingNotFoundError(error)) {
            markTrackingUnavailable(id);
          }
          setTracking(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, markTrackingUnavailable, storedOrder]);

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
          {simulation || canShowRouteMap ? (
            <DeliveryMap order={order} />
          ) : (
            <PendingTrackingPanel order={order} />
          )}
          <div className="flex flex-col gap-stack-md">
            <OrderSummary order={order} />
            <SupportCard />
          </div>
        </section>
      </div>
    </div>
  );
}

function shouldRequestBackendTracking(storedOrder) {
  return Boolean(
    storedOrder?.assignmentStatus === "assigned" &&
      storedOrder.trackingStartedAt &&
      (storedOrder.assignment || storedOrder.assignedDriver),
  );
}

function getTrackingOrder({ fallbackOrder, id, storedOrder, tracking }) {
  if (String(storedOrder?.id) !== String(id)) {
    return fallbackOrder;
  }

  const assignmentStatus = storedOrder.assignmentStatus;
  const assignedDriverName =
    storedOrder.assignedDriver?.name ?? "Driver pending";
  const hasTracking = tracking?.assignment || tracking?.events?.length > 0;
  const routeEstimate = normalizeRouteEstimate(storedOrder.routeEstimate);
  const latestTrackedLocation = [...(tracking?.events ?? [])]
    .reverse()
    .find((event) => event.location)?.location;

  return {
    ...fallbackOrder,
    id: storedOrder.id,
    displayId: storedOrder.displayId,
    etaModel: storedOrder.deliveryEta,
    rider: {
      name: assignedDriverName,
    },
    statusText: getStatusText(assignmentStatus, hasTracking),
    statusTitle: getStatusTitle(assignmentStatus),
    estimatedArrival:
      storedOrder.estimatedDeliveryTime ?? routeEstimate?.etaLabel ?? "Pending",
    routePoints: routeEstimate?.routePoints,
    encodedPolyline: routeEstimate?.encodedPolyline,
    routeProvider:
      routeEstimate?.provider ??
      (storedOrder.assignmentStatus === "assigned" ||
      storedOrder.assignmentStatus === "failed" ||
      storedOrder.assignmentStatus === "pending"
        ? "coordinate_fallback"
        : null),
    routeDurationSeconds: routeEstimate?.durationSeconds,
    pickupLocation:
      routeEstimate?.originLocation ?? storedOrder.pickupLocation,
    deliveryLocation:
      routeEstimate?.destinationLocation ?? {
        lat: storedOrder.deliveryAddress.latitude,
        lng: storedOrder.deliveryAddress.longitude,
      },
    driverLocation:
      latestTrackedLocation ?? storedOrder.assignedDriver?.currentLocation,
    deliveryAddress: storedOrder.deliveryAddress,
    trackingStartedAt: storedOrder.trackingStartedAt,
    restaurant: {
      name: storedOrder.restaurantName,
      image: storedOrder.restaurantImage,
    },
    items: storedOrder.items,
    deliveryFeeCents: storedOrder.deliveryFeeCents,
    serviceFeeCents: 0,
  };
}

function getStatusText(assignmentStatus, hasTracking) {
  if (hasTracking) {
    return "Driver assigned";
  }
  if (assignmentStatus === "failed") {
    return "Driver assignment temporarily unavailable";
  }
  return "Preparing order";
}

function getStatusTitle(assignmentStatus) {
  if (assignmentStatus === "assigned") {
    return "Driver accepted your order";
  }
  if (assignmentStatus === "failed") {
    return "We are still assigning a driver";
  }
  return "Your order is being prepared";
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
  return (
    <div className="lg:col-span-2 flex min-h-[460px] items-center justify-center rounded-xl border border-surface bg-surface-container-lowest p-8 text-center shadow-[0_12px_32px_rgba(36,36,38,0.04)] lg:min-h-[620px]">
      <div className="max-w-md">
        <span className="material-symbols-outlined mb-4 text-5xl text-primary">
          restaurant
        </span>
        <h2 className="font-section-title text-section-title text-on-surface">
          Preparing your order
        </h2>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          Tracking map for order #{order.displayId} will appear once route
          information is available. No sample driver location is being shown.
        </p>
      </div>
    </div>
  );
}
