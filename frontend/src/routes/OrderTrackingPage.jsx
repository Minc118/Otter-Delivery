import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DeliveryMap from "../components/order/DeliveryMap.jsx";
import OrderSummary from "../components/order/OrderSummary.jsx";
import SupportCard from "../components/order/SupportCard.jsx";
import TrackingStatusHeader from "../components/order/TrackingStatusHeader.jsx";
import useCart from "../hooks/useCart.js";
import { getOrderTracking } from "../services/driverService.js";
import { getOrderById } from "../services/orderService.js";

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { lastPlacedOrder } = useCart();
  const [tracking, setTracking] = useState(null);
  const order = getTrackingOrder({
    fallbackOrder: getOrderById(id),
    id,
    lastPlacedOrder,
    tracking,
  });

  useEffect(() => {
    document.title = "Order Tracking - Otter Delivery";
  }, []);

  useEffect(() => {
    let cancelled = false;

    getOrderTracking(id)
      .then((nextTracking) => {
        if (!cancelled) {
          setTracking(nextTracking);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTracking(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="bg-background min-h-full">
      <div className="w-full max-w-container-max mx-auto px-margin-x py-stack-lg flex flex-col gap-stack-lg">
        <TrackingStatusHeader order={order} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <DeliveryMap order={order} />
          <div className="flex flex-col gap-stack-md">
            <OrderSummary order={order} />
            <SupportCard />
          </div>
        </section>
      </div>
    </div>
  );
}

function getTrackingOrder({ fallbackOrder, id, lastPlacedOrder, tracking }) {
  if (lastPlacedOrder?.id !== id) {
    return fallbackOrder;
  }

  const assignedDriverName =
    lastPlacedOrder.assignedDriver?.name ?? fallbackOrder.rider.name;
  const hasTracking = tracking?.assignment || tracking?.events?.length > 0;

  return {
    ...fallbackOrder,
    id: lastPlacedOrder.id,
    displayId: lastPlacedOrder.displayId,
    rider: {
      name: assignedDriverName,
    },
    statusText: hasTracking ? "Driver assigned" : fallbackOrder.statusText,
    statusTitle:
      lastPlacedOrder.assignmentStatus === "assigned"
        ? "Driver accepted your order"
        : fallbackOrder.statusTitle,
    restaurant: {
      name: lastPlacedOrder.restaurantName,
      image: lastPlacedOrder.restaurantImage,
    },
    items: lastPlacedOrder.items,
    deliveryFeeCents: lastPlacedOrder.deliveryFeeCents,
    serviceFeeCents: 0,
  };
}
