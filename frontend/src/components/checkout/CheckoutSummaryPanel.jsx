import { formatCurrency } from "../../utils/currency.js";

export default function CheckoutSummaryPanel({
  buttonLabel,
  deliveryFeeCents,
  onPrimaryAction,
  subtotalCents,
  totalCents,
}) {
  return (
    <div className="bg-surface-container-lowest border border-surface rounded-3xl p-stack-lg shadow-stitch">
      <h2 className="font-card-title text-card-title mb-stack-md border-b border-surface pb-stack-sm">
        Order Summary
      </h2>
      <div className="flex flex-col gap-stack-sm mb-stack-md border-b border-surface pb-stack-md">
        <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotalCents)}</span>
        </div>
        <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
          <span>Delivery fee</span>
          <span>{formatCurrency(deliveryFeeCents)}</span>
        </div>
      </div>
      <div className="flex justify-between font-card-title text-card-title text-dark-text mb-stack-lg">
        <span>Total</span>
        <span>{formatCurrency(totalCents)}</span>
      </div>
      <button
        className="w-full bg-primary-container hover:bg-surface-tint text-on-primary font-button text-button py-[18px] px-6 rounded-2xl transition-colors duration-300 flex justify-center items-center gap-2"
        onClick={onPrimaryAction}
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
