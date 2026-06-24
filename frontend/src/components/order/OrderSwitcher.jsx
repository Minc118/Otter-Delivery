import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDeliveryTiming } from "../../hooks/useDeliverySimulation.js";
import { getTrackedDeliveryOrders } from "../../services/trackingState.js";

export default function OrderSwitcher({
  currentOrderId,
  onSelectOrder,
  trackedOrders,
}) {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  const deliveries = useMemo(
    () => getTrackedDeliveryOrders(trackedOrders),
    [trackedOrders],
  );

  useEffect(() => {
    if (deliveries.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(intervalId);
  }, [deliveries.length]);

  if (deliveries.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-surface bg-surface-container-lowest px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-card-title text-[15px] text-on-surface">
          Your deliveries
        </p>
        <p className="font-metadata text-metadata text-on-surface-variant">
          Switch between active and recent orders
        </p>
      </div>
      <label className="sr-only" htmlFor="tracked-order-switcher">
        Switch tracked order
      </label>
      <select
        className="min-w-0 rounded-lg border-surface-variant bg-surface-bright px-3 py-2 font-metadata text-metadata text-on-surface focus:border-primary focus:ring-primary sm:min-w-[260px]"
        id="tracked-order-switcher"
        onChange={(event) => {
          const orderId = event.target.value;
          onSelectOrder(orderId);
          navigate(`/orders/${orderId}/tracking`);
        }}
        value={String(currentOrderId)}
      >
        {deliveries.map(({ order, simulationOrder }) => {
          const timing = getDeliveryTiming(simulationOrder, now);
          return (
            <option key={simulationOrder.id} value={simulationOrder.id}>
              {formatOrderLabel(order, simulationOrder.id, timing)}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function formatOrderLabel(order, orderId, timing) {
  const displayId = String(order.displayId ?? orderId).replace(/^ORDER-/i, "");
  return `Order #${displayId} · ${getTimingLabel(timing)}`;
}

function getTimingLabel(timing) {
  if (!timing || timing.phase === "DELIVERED") {
    return "Delivered";
  }
  if (timing.phase === "PICKING_UP") {
    return "Picking up";
  }
  if (timing.phase === "DRIVER_ASSIGNED") {
    return "Preparing";
  }
  if (timing.phase === "HEADING_TO_PICKUP") {
    return "Heading to pickup";
  }

  return `Arriving in ${timing.remainingMinutes} min`;
}
