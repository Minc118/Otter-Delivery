import {
  checkoutDeliveryAddress,
  checkoutRestaurantMeta,
  demoDeliveryLocations,
  defaultRestaurantPickupLocation,
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

export function getRestaurantCheckoutMeta(restaurantId, restaurantMeta = null) {
  if (restaurantMeta?.image) {
    return {
      rating: restaurantMeta.rating ?? "4.8 Excellent",
      image: restaurantMeta.image,
    };
  }

  return (
    checkoutRestaurantMeta[restaurantId] ?? {
      rating: "4.8 Excellent",
      image: {
        alt: "Restaurant",
        src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
        fallbackSrc: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
      },
    }
  );
}

export function getRestaurantPickupLocation(group) {
  const address = group?.restaurantMeta?.address;
  const latitude = Number(address?.latitude ?? address?.lat);
  const longitude = Number(address?.longitude ?? address?.lng);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { lat: latitude, lng: longitude };
  }

  return { ...defaultRestaurantPickupLocation };
}

export function toDriverLocation(address) {
  const latitude = Number(address?.latitude);
  const longitude = Number(address?.longitude);

  return {
    lat: Number.isFinite(latitude)
      ? latitude
      : checkoutDeliveryAddress.latitude,
    lng: Number.isFinite(longitude)
      ? longitude
      : checkoutDeliveryAddress.longitude,
  };
}

export function resolveDeliveryAddressCoordinates(nextAddress, storedAddress) {
  const address = {
    ...nextAddress,
    label: String(nextAddress.label ?? "").trim(),
    line1: String(nextAddress.line1 ?? "").trim(),
    postalCode: String(nextAddress.postalCode ?? "").trim(),
    city: String(nextAddress.city ?? "").trim(),
    region: String(nextAddress.region ?? "").trim(),
    country: String(nextAddress.country ?? "").trim(),
    note: String(nextAddress.note ?? "").trim(),
  };

  if (
    hasSamePhysicalAddress(address, storedAddress) &&
    hasValidCoordinates(storedAddress)
  ) {
    return {
      ...address,
      latitude: Number(storedAddress.latitude),
      longitude: Number(storedAddress.longitude),
      coordinateSource: storedAddress.coordinateSource ?? "stored",
    };
  }

  const searchableAddress = normalizeAddressText(address);
  const demoLocation = demoDeliveryLocations.find(({ match }) =>
    match.every((part) => searchableAddress.includes(part)),
  );

  return {
    ...address,
    latitude: demoLocation?.latitude ?? checkoutDeliveryAddress.latitude,
    longitude: demoLocation?.longitude ?? checkoutDeliveryAddress.longitude,
    coordinateSource:
      demoLocation?.coordinateSource ?? "demo_fallback_berlin",
  };
}

function hasSamePhysicalAddress(left, right) {
  if (!right) {
    return false;
  }

  const fields = ["line1", "postalCode", "city", "region", "country"];
  return fields.every(
    (field) => normalizeAddressPart(left[field]) === normalizeAddressPart(right[field]),
  );
}

function hasValidCoordinates(address) {
  return (
    Number.isFinite(Number(address?.latitude)) &&
    Number.isFinite(Number(address?.longitude))
  );
}

function normalizeAddressText(address) {
  return [
    address.label,
    address.line1,
    address.postalCode,
    address.city,
    address.region,
    address.country,
  ]
    .map(normalizeAddressPart)
    .join(" ");
}

function normalizeAddressPart(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ß", "ss")
    .toLowerCase()
    .trim();
}

export function createMockPlacedOrder({
  deliveryFeeCents,
  group,
  paymentMethod,
}) {
  const subtotalCents = getRestaurantSubtotalCents(group);
  const restaurantMeta = getRestaurantCheckoutMeta(
    group.restaurantId,
    group.restaurantMeta,
  );
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
  if (!order) {
    return null;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotalCents = items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );

  return {
    id: order.id,
    displayId: order.displayId,
    restaurantId: order.restaurant.name.toLowerCase().replace(/\s+/g, "-"),
    restaurantName: order.restaurant.name,
    restaurantImage: order.restaurant.image,
    items,
    subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: subtotalCents + order.deliveryFeeCents + order.serviceFeeCents,
    paymentMethod: "credit-card",
    deliveryAddress: checkoutDeliveryAddress,
    estimatedDeliveryTime: "approx. 40 min",
  };
}
