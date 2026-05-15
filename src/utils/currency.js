export function formatCurrency(cents) {
  return `€${(cents / 100).toFixed(2)}`;
}

export function priceToCents(price) {
  if (typeof price === "number") {
    return Math.round(price * 100);
  }

  const normalized = String(price).replace(/[^\d.,-]/g, "").replace(",", ".");
  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}
