import { getRestaurantSubtotalCents } from "../../utils/cartTotals.js";
import { formatCurrency } from "../../utils/currency.js";

export default function CartSummary({
  deliveryFeeCents,
  onPlaceOrder,
  selectedGroup,
}) {
  if (!selectedGroup) {
    return null;
  }

  const subtotalCents = getRestaurantSubtotalCents(selectedGroup);
  const totalCents = subtotalCents + deliveryFeeCents;

  return (
    <div className="bg-surface-container-lowest border-t border-surface-variant p-margin-x flex flex-col gap-stack-md z-10">
      <div className="flex justify-between items-center font-body-md text-body-md text-on-surface-variant">
        <span>Subtotal ({selectedGroup.restaurantName})</span>
        <span>{formatCurrency(subtotalCents)}</span>
      </div>
      <div className="flex justify-between items-center font-body-md text-body-md text-on-surface-variant">
        <span>Delivery fee</span>
        <span>{formatCurrency(deliveryFeeCents)}</span>
      </div>
      <div className="w-full h-px bg-surface-variant my-1" />
      <div className="flex justify-between items-center font-section-title text-section-title text-on-background">
        <span>Total</span>
        <span>{formatCurrency(totalCents)}</span>
      </div>
      <div className="flex items-center justify-center gap-2 text-primary bg-surface-light py-2 px-4 rounded-lg font-metadata text-metadata mt-2">
        <span className="material-symbols-outlined text-[18px]">schedule</span>
        Estimated delivery time: approx. 40 min
      </div>
      <button
        className="w-full bg-primary-container hover:bg-surface-tint text-on-primary font-button text-button py-4 rounded-xl transition-colors duration-200 mt-2 shadow-sm flex justify-center items-center gap-2"
        onClick={onPlaceOrder}
        type="button"
      >
        Place Order
        <span className="material-symbols-outlined text-[20px]">
          arrow_forward
        </span>
      </button>
    </div>
  );
}
