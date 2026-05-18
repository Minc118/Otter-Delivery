const DRIVER_API_BASE_URL =
  import.meta.env.VITE_DRIVER_API_URL ?? "http://localhost:8003";

async function requestDriverService(path, options = {}) {
  const response = await fetch(`${DRIVER_API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ?? "Driver Service request failed.";
    throw new Error(message);
  }

  return payload;
}

export function assignDriverToOrder(orderId) {
  return requestDriverService("/drivers/assign", {
    body: JSON.stringify({ orderId }),
    method: "POST",
  });
}

export function getOrderTracking(orderId) {
  return requestDriverService(`/orders/${orderId}/tracking`);
}
