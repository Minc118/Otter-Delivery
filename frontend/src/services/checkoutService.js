import {
  checkoutDeliveryAddress,
  checkoutRestaurantMeta,
} from "../data/checkout.js";
import { getRestaurantSubtotalCents } from "../utils/cartTotals.js";

function cloneItems(items) {
  return items.map((item) => ({ ...item }));
}

function createOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);

  return `ot-${timestamp}-${random}`;
}

export function cloneCartGroup(group) {
  if (!group) {
    return null;
  }

  return {
    ...group,
    items: cloneItems(group.items),
  };
}

export function getRestaurantCheckoutMeta(restaurantId) {
  return (
    checkoutRestaurantMeta[restaurantId] ?? {
      rating: "4.8 Excellent",
      image: {
        alt: "Restaurant",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSUUeBMXx_HWxOJT_MnmXfnjZQxYbjXj5M4KwbuTDzvElPYKUKyCiPTP8yEci_ygW4itmXgMD4hPMBFfPkUhwgEz1dwF2eGqehWXHl8RdOR_V2GfPBuE_W756Mx7hUEOlbGjpkofm7fk2-KvpMl2IlQehZKHr11ulmJjRDVQUmlNPIUbr_AMW7nFgDx3oOH3XDm1oXd4AtM5jLbvSY-mxyIcsuyCxC5X8BmuxNDUFe5mipgMr7UNexbzvq1TgcR18Goe2eLKpVF1A",
      },
    }
  );
}

export function createMockPlacedOrder({
  deliveryFeeCents,
  group,
  paymentMethod,
}) {
  const subtotalCents = getRestaurantSubtotalCents(group);
  const restaurantMeta = getRestaurantCheckoutMeta(group.restaurantId);
  const id = createOrderId();

  return {
    id,
    assignmentStatus: "pending",
    displayId: id.toUpperCase(),
    restaurantId: group.restaurantId,
    restaurantName: group.restaurantName,
    restaurantImage: restaurantMeta.image,
    items: cloneItems(group.items),
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents,
    paymentMethod,
    deliveryAddress: checkoutDeliveryAddress,
    estimatedDeliveryTime: "approx. 40 min",
  };
}

export function createPlacedOrderFromTrackingOrder(order) {
  const subtotalCents = order.items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );

  return {
    id: order.id,
    displayId: order.displayId,
    restaurantId: order.restaurant.name.toLowerCase().replace(/\s+/g, "-"),
    restaurantName: order.restaurant.name,
    restaurantImage: order.restaurant.image,
    items: order.items,
    subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: subtotalCents + order.deliveryFeeCents + order.serviceFeeCents,
    paymentMethod: "credit-card",
    deliveryAddress: checkoutDeliveryAddress,
    estimatedDeliveryTime: "approx. 40 min",
  };
}
