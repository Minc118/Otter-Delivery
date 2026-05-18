import { createContext, useMemo, useState } from "react";
import {
  cloneCartGroup,
  createMockPlacedOrder,
} from "../services/checkoutService.js";
import {
  getDeliveryFeeCents,
  getInitialCartGroups,
} from "../services/cartService.js";
import { assignDriverToOrder } from "../services/driverService.js";
import { getCartItemCount } from "../utils/cartTotals.js";
import { priceToCents } from "../utils/currency.js";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const initialCartGroups = getInitialCartGroups();
  const deliveryFeeCents = getDeliveryFeeCents();
  const [cartGroups, setCartGroups] = useState(initialCartGroups);
  const [checkoutDraft, setCheckoutDraft] = useState(
    cloneCartGroup(initialCartGroups[0]),
  );
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    initialCartGroups[0]?.restaurantId ?? null,
  );

  const itemCount = useMemo(() => getCartItemCount(cartGroups), [cartGroups]);
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

  function removeEmptyGroups(groups) {
    return groups.filter((group) => group.items.length > 0);
  }

  function addItem({ restaurantId, restaurantName, item }) {
    const unitPriceCents = item.priceCents ?? priceToCents(item.price);

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
            items: [
              {
                id: item.id,
                name: item.name,
                quantity: 1,
                unitPriceCents,
              },
            ],
          },
        ];
      }

      return currentGroups.map((group, index) => {
        if (index !== groupIndex) {
          return group;
        }

        const existingItem = group.items.find(
          (cartItem) => cartItem.id === item.id,
        );

        if (!existingItem) {
          return {
            ...group,
            items: [
              ...group.items,
              {
                id: item.id,
                name: item.name,
                quantity: 1,
                unitPriceCents,
              },
            ],
          };
        }

        return {
          ...group,
          items: group.items.map((cartItem) =>
            cartItem.id === item.id
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

    const placedOrder = createMockPlacedOrder({
      deliveryFeeCents,
      group,
      paymentMethod,
    });

    setLastPlacedOrder(placedOrder);
    setCheckoutDraft(null);
    removeRestaurant(group.restaurantId);

    try {
      const assignment = await assignDriverToOrder(placedOrder.id);
      const assignedOrder = {
        ...placedOrder,
        assignedDriver: assignment.driver,
        assignment: assignment.assignment,
        assignmentStatus: "assigned",
      };

      setLastPlacedOrder(assignedOrder);
      return assignedOrder;
    } catch (error) {
      const unassignedOrder = {
        ...placedOrder,
        assignmentError: error.message,
        assignmentStatus: "failed",
      };

      setLastPlacedOrder(unassignedOrder);
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
      deliveryFeeCents,
      incrementItem,
      itemCount,
      lastPlacedOrder,
      placeCheckoutOrder,
      removeItem,
      removeRestaurant,
      restaurantCount: cartGroups.length,
      selectedGroup,
      selectedRestaurantId: selectedGroup?.restaurantId ?? null,
      selectRestaurant,
      updateItemQuantity,
    }),
    [cartGroups, checkoutDraft, itemCount, lastPlacedOrder, selectedGroup],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
