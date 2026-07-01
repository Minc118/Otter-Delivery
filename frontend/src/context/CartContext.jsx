import { createContext, useMemo, useState } from "react";
import {
  cloneCartGroup,
  getRestaurantCheckoutMeta,
  getRestaurantPickupLocation,
  resolveDeliveryAddressCoordinates,
  toDriverLocation,
} from "../services/checkoutService.js";
import {
  getDeliveryFeeCents,
  getInitialCartGroups,
} from "../services/cartService.js";
import {
  assignDriverToOrder,
  estimateDelivery,
} from "../services/driverService.js";
import { checkoutDeliveryAddress } from "../data/checkout.js";
import { createDeliveryEtaModel } from "../services/deliveryEta.js";
import {
  isRecentActiveTrackedOrder,
  sanitizeTrackedOrdersById,
} from "../services/trackingState.js";
import { getCartItemCount } from "../utils/cartTotals.js";
import { priceToCents } from "../utils/currency.js";

const ORDER_SERVICE_BASE_URL =
  import.meta.env.VITE_ORDER_SERVICE_URL ?? "http://localhost:8002";
const DELIVERY_ADDRESS_STORAGE_KEY = "otter-delivery-address";
const LAST_ORDER_STORAGE_KEY = "otter-last-placed-order";
const TRACKED_ORDERS_STORAGE_KEY = "otter-tracked-orders-v1";
const ACTIVE_ORDER_ID_STORAGE_KEY = "otter-active-order-id";

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function storeValue(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStoredValue(key) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

function readInitialTrackingSnapshot() {
  const activeOrderId = readStoredValue(ACTIVE_ORDER_ID_STORAGE_KEY, null);
  const storedOrders = readStoredValue(TRACKED_ORDERS_STORAGE_KEY, null);

  if (storedOrders && typeof storedOrders === "object") {
    const sanitizedOrders = sanitizeTrackedOrdersById(storedOrders, activeOrderId);
    storeValue(TRACKED_ORDERS_STORAGE_KEY, sanitizedOrders);
    return {
      activeOrderId: sanitizedOrders[String(activeOrderId)]
        ? activeOrderId
        : null,
      ordersById: sanitizedOrders,
    };
  }

  const legacyOrder = readStoredValue(LAST_ORDER_STORAGE_KEY, null);
  const legacyOrders = legacyOrder?.id
    ? sanitizeTrackedOrdersById(
        { [String(legacyOrder.id)]: legacyOrder },
        activeOrderId,
      )
    : {};

  if (Object.keys(legacyOrders).length > 0) {
    storeValue(TRACKED_ORDERS_STORAGE_KEY, legacyOrders);
  }

  return {
    activeOrderId: legacyOrders[String(activeOrderId)] ? activeOrderId : null,
    ordersById: legacyOrders,
  };
}

export const CartContext = createContext(null);
export function CartProvider({ children }) {
  const [cartWarning, setCartWarning] = useState(null);
  const [initialTrackingSnapshot] = useState(readInitialTrackingSnapshot);
  const initialCartGroups = getInitialCartGroups();
  const deliveryFeeCents = getDeliveryFeeCents();
  const [cartGroups, setCartGroups] = useState(initialCartGroups);
  const [checkoutDraft, setCheckoutDraft] = useState(
    cloneCartGroup(initialCartGroups[0]),
  );
  const [deliveryAddress, setDeliveryAddress] = useState(() =>
    readStoredValue(DELIVERY_ADDRESS_STORAGE_KEY, checkoutDeliveryAddress),
  );
  const [trackedOrdersById, setTrackedOrdersById] = useState(() =>
    initialTrackingSnapshot.ordersById,
  );
  const [activeOrderId, setActiveOrderId] = useState(() =>
    initialTrackingSnapshot.activeOrderId,
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    initialCartGroups[0]?.restaurantId ?? null,
  );

  const itemCount = useMemo(() => getCartItemCount(cartGroups), [cartGroups]);
  const trackedOrders = useMemo(
    () =>
      Object.values(trackedOrdersById).sort(
        (left, right) =>
          Number(right.trackingStartedAt ?? right.createdAt ?? 0) -
          Number(left.trackingStartedAt ?? left.createdAt ?? 0),
      ),
    [trackedOrdersById],
  );
  const lastPlacedOrder =
    trackedOrdersById[String(activeOrderId)] ?? trackedOrders[0] ?? null;
  const selectedGroup = useMemo(
    () =>
      cartGroups.find((group) => group.restaurantId === selectedRestaurantId) ??
      cartGroups[0] ??
      null,
    [cartGroups, selectedRestaurantId],
  );

  function selectRestaurant(restaurantId) {
    setSelectedRestaurantId(restaurantId);
  }

  function beginCheckout() {
    const draft = cloneCartGroup(selectedGroup);
    setCheckoutDraft(draft);

    return draft;
  }

  function updateDeliveryAddress(nextAddress) {
    const normalizedAddress = resolveDeliveryAddressCoordinates(
      nextAddress,
      deliveryAddress,
    );
    setDeliveryAddress(normalizedAddress);
    storeValue(DELIVERY_ADDRESS_STORAGE_KEY, normalizedAddress);
  }

  function rememberPlacedOrder(order) {
    const orderId = String(order.id);
    setTrackedOrdersById((currentOrders) => {
      const nextOrders = { ...currentOrders, [orderId]: order };
      storeValue(TRACKED_ORDERS_STORAGE_KEY, nextOrders);
      return nextOrders;
    });
    setActiveOrderId(orderId);
    storeValue(ACTIVE_ORDER_ID_STORAGE_KEY, orderId);
    storeValue(LAST_ORDER_STORAGE_KEY, order);
  }

  function markDeliveryDelivered(orderId, deliveredAt) {
    const normalizedId = String(orderId);
    setTrackedOrdersById((currentOrders) => {
      const currentOrder = currentOrders[normalizedId];
      if (!currentOrder || currentOrder.deliveredAt) {
        return currentOrders;
      }

      const deliveredOrder = { ...currentOrder, deliveredAt };
      const nextOrders = {
        ...currentOrders,
        [normalizedId]: deliveredOrder,
      };
      storeValue(TRACKED_ORDERS_STORAGE_KEY, nextOrders);
      if (String(activeOrderId) === normalizedId) {
        storeValue(LAST_ORDER_STORAGE_KEY, deliveredOrder);
      }
      return nextOrders;
    });
  }

  function selectTrackedOrder(orderId) {
    const normalizedId = String(orderId);
    if (!trackedOrdersById[normalizedId]) {
      return;
    }

    setActiveOrderId(normalizedId);
    storeValue(ACTIVE_ORDER_ID_STORAGE_KEY, normalizedId);
    storeValue(LAST_ORDER_STORAGE_KEY, trackedOrdersById[normalizedId]);
  }

  function markTrackingUnavailable(orderId) {
    const normalizedId = String(orderId);

    setTrackedOrdersById((currentOrders) => {
      const currentOrder = currentOrders[normalizedId];
      if (!currentOrder) {
        return currentOrders;
      }

      if (isRecentActiveTrackedOrder(currentOrder, activeOrderId)) {
        const pendingOrder = {
          ...currentOrder,
          assignedDriver: undefined,
          assignment: undefined,
          assignmentStatus: "pending",
          deliveryEta: undefined,
          routeEstimate: undefined,
          trackingStartedAt: undefined,
        };
        const nextOrders = {
          ...currentOrders,
          [normalizedId]: pendingOrder,
        };
        storeValue(TRACKED_ORDERS_STORAGE_KEY, nextOrders);
        storeValue(LAST_ORDER_STORAGE_KEY, pendingOrder);
        return nextOrders;
      }

      const nextOrders = { ...currentOrders };
      delete nextOrders[normalizedId];
      storeValue(TRACKED_ORDERS_STORAGE_KEY, nextOrders);

      if (String(activeOrderId) === normalizedId) {
        const nextActiveOrder = Object.values(nextOrders)[0] ?? null;
        if (nextActiveOrder) {
          const nextActiveOrderId = String(nextActiveOrder.id);
          setActiveOrderId(nextActiveOrderId);
          storeValue(ACTIVE_ORDER_ID_STORAGE_KEY, nextActiveOrderId);
          storeValue(LAST_ORDER_STORAGE_KEY, nextActiveOrder);
        } else {
          setActiveOrderId(null);
          removeStoredValue(ACTIVE_ORDER_ID_STORAGE_KEY);
          removeStoredValue(LAST_ORDER_STORAGE_KEY);
        }
      }

      return nextOrders;
    });
  }

  function removeEmptyGroups(groups) {
    return groups.filter((group) => group.items.length > 0);
  }

  function addItem({ restaurantId, restaurantName, restaurantMeta, item }) {
    const itemId = String(item.id ?? item.menuItemId ?? item.foodItemId);
    const unitPriceCents =
      item.unitPriceCents ?? item.priceCents ?? priceToCents(item.price);
    const cartItem = {
      id: itemId,
      foodItemId: item.foodItemId,
      menuItemId: item.menuItemId,
      name: item.name,
      description: item.description,
      quantity: 1,
      unitPriceCents,
      price: item.price,
      image: item.image,
      currency: item.currency,
      restaurantId,
      restaurantName,
    };
    const existingGroup = cartGroups[0];

    if (existingGroup && existingGroup.restaurantId !== restaurantId) {
      setCartWarning(
        `Your cart already contains items from ${existingGroup.restaurantName}. Please clear your cart before ordering from another restaurant.`,
      );

      return;
    }

    setCartWarning(null);

    setCartGroups((currentGroups) => {
      const groupIndex = currentGroups.findIndex(
        (group) => group.restaurantId === restaurantId,
      );

      if (groupIndex === -1) {
        return [
          ...currentGroups,
          {
            restaurantId,
            restaurantName,
            restaurantMeta,
            items: [cartItem],
          },
        ];
      }

      return currentGroups.map((group, index) => {
        if (index !== groupIndex) {
          return group;
        }

        const existingItem = group.items.find((item) => item.id === itemId);

        if (!existingItem) {
          return {
            ...group,
            restaurantMeta: group.restaurantMeta ?? restaurantMeta,
            items: [...group.items, cartItem],
          };
        }

        return {
          ...group,
          restaurantMeta: group.restaurantMeta ?? restaurantMeta,
          items: group.items.map((cartItem) =>
            cartItem.id === itemId
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem,
          ),
        };
      });
    });
  }

  function updateItemQuantity(restaurantId, itemId, nextQuantity) {
    const quantity = Math.max(0, Number(nextQuantity) || 0);

    setCartGroups((currentGroups) =>
      removeEmptyGroups(
        currentGroups.map((group) => {
          if (group.restaurantId !== restaurantId) {
            return group;
          }

          return {
            ...group,
            items: group.items
              .map((item) =>
                item.id === itemId ? { ...item, quantity } : item,
              )
              .filter((item) => item.quantity > 0),
          };
        }),
      ),
    );
  }

  function incrementItem(restaurantId, itemId) {
    setCartGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.restaurantId !== restaurantId) {
          return group;
        }

        return {
          ...group,
          items: group.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }),
    );
  }

  function decrementItem(restaurantId, itemId) {
    setCartGroups((currentGroups) =>
      removeEmptyGroups(
        currentGroups.map((group) => {
          if (group.restaurantId !== restaurantId) {
            return group;
          }

          return {
            ...group,
            items: group.items
              .map((item) =>
                item.id === itemId
                  ? { ...item, quantity: item.quantity - 1 }
                  : item,
              )
              .filter((item) => item.quantity > 0),
          };
        }),
      ),
    );
  }

  function removeItem(restaurantId, itemId) {
    setCartGroups((currentGroups) =>
      removeEmptyGroups(
        currentGroups.map((group) => {
          if (group.restaurantId !== restaurantId) {
            return group;
          }

          return {
            ...group,
            items: group.items.filter((item) => item.id !== itemId),
          };
        }),
      ),
    );
  }

  function removeRestaurant(restaurantId) {
    setCartGroups((currentGroups) =>
      currentGroups.filter((group) => group.restaurantId !== restaurantId),
    );
  }

  async function placeCheckoutOrder(paymentMethod) {
    const group = checkoutDraft ?? selectedGroup;

    if (!group) {
      return null;
    }

    const profile = JSON.parse(localStorage.getItem("profile"));

    const response = await fetch(`${ORDER_SERVICE_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: profile.id,
        restaurantId: group.restaurantId,
        items: group.items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create order");
    }

    const backendOrder = await response.json();
    const restaurantMeta = getRestaurantCheckoutMeta(
      group.restaurantId,
      group.restaurantMeta,
    );
    const pickupLocation = getRestaurantPickupLocation(group);

    const orderId = String(backendOrder.id);
    const placedOrder = {
      id: orderId,
      assignmentStatus: "pending",
      createdAt: Date.now(),
      deliveryLocation: toDriverLocation(deliveryAddress),
      displayId: `ORDER-${backendOrder.id}`,
      estimatedDeliveryTime: "approx. 40 min",
      restaurantId: group.restaurantId,
      restaurantName: group.restaurantName,
      restaurantImage: restaurantMeta.image,
      items: group.items,
      paymentMethod,
      deliveryAddress: { ...deliveryAddress },
      pickupLocation,
      deliveryFeeCents,
      totalCents: Math.round(backendOrder.totalPrice * 100),
      trackingStatus: "DRIVER_ASSIGNMENT_PENDING",
    };

    rememberPlacedOrder(placedOrder);
    setCheckoutDraft(null);
    removeRestaurant(group.restaurantId);

    try {
      const assignment = await assignDriverToOrder(placedOrder.id);
      let assignedOrder = {
        ...placedOrder,
        assignedDriver: assignment.driver,
        assignment: assignment.assignment,
        assignmentStatus: "assigned",
        trackingStartedAt: Date.now(),
      };

      rememberPlacedOrder(assignedOrder);

      try {
        const routeEstimate = await estimateDelivery({
          orderId: placedOrder.id,
          pickupLocation,
          customerLocation: toDriverLocation(deliveryAddress),
        });
        const deliveryEta = createDeliveryEtaModel(
          routeEstimate.estimate?.durationSeconds ??
            routeEstimate.durationSeconds,
        );
        assignedOrder = {
          ...assignedOrder,
          deliveryEta,
          routeEstimate,
          estimatedDeliveryTime: `approx. ${deliveryEta.totalEtaMinutes} min`,
        };
        rememberPlacedOrder(assignedOrder);
      } catch {
        console.warn("Route estimate unavailable; using the demo tracking route.");
      }

      return assignedOrder;
    } catch {
      const unassignedOrder = {
        ...placedOrder,
        assignmentStatus: "failed",
        trackingStatus: "DRIVER_ASSIGNMENT_UNAVAILABLE",
      };

      rememberPlacedOrder(unassignedOrder);
      return unassignedOrder;
    }
  }

  const value = useMemo(
    () => ({
      addItem,
      beginCheckout,
      cartGroups,
      checkoutDraft,
      decrementItem,
      deliveryAddress,
      deliveryFeeCents,
      incrementItem,
      itemCount,
      lastPlacedOrder,
      activeOrderId,
      markDeliveryDelivered,
      markTrackingUnavailable,
      placeCheckoutOrder,
      removeItem,
      removeRestaurant,
      restaurantCount: cartGroups.length,
      selectedGroup,
      selectedRestaurantId: selectedGroup?.restaurantId ?? null,
      selectRestaurant,
      selectTrackedOrder,
      trackedOrders,
      updateItemQuantity,
      updateDeliveryAddress,
      cartWarning,
      setCartWarning,
    }),
    [
      cartGroups,
      checkoutDraft,
      deliveryAddress,
      itemCount,
      lastPlacedOrder,
      activeOrderId,
      selectedGroup,
      trackedOrders,
      cartWarning,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
