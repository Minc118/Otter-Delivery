export function getRestaurantSubtotalCents(group) {
  return group.items.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );
}

export function getCartItemCount(groups) {
  return groups.reduce(
    (total, group) =>
      total +
      group.items.reduce((groupTotal, item) => groupTotal + item.quantity, 0),
    0,
  );
}
