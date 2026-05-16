import { formatCurrency } from "../../utils/currency.js";

export default function CartItem({
  item,
  muted,
  onDecrement,
  onIncrement,
  onRemove,
}) {
  const textColor = muted ? "text-on-surface-variant" : "text-on-background";
  const lineTotal = item.quantity * item.unitPriceCents;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`font-body-md text-body-md font-semibold ${textColor}`}
            >
              {item.quantity}x
            </span>
            <span className={`font-body-md text-body-md ${textColor}`}>
              {item.name}
            </span>
          </div>
          {item.notes ? (
            <div className="font-metadata text-metadata text-on-surface-variant mt-1 pl-6">
              {item.notes}
            </div>
          ) : null}
        </div>
        <div className={`font-body-md text-body-md font-semibold ${textColor}`}>
          {formatCurrency(lineTotal)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pl-6">
        <div className="flex items-center rounded-full border border-surface-variant bg-surface-container-lowest overflow-hidden">
          <button
            aria-label={`Decrease ${item.name}`}
            className="w-8 h-8 grid place-items-center text-on-surface-variant hover:text-primary hover:bg-surface transition-colors"
            onClick={onDecrement}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              remove
            </span>
          </button>
          <span className="w-9 text-center font-metadata text-metadata text-on-surface">
            {item.quantity}
          </span>
          <button
            aria-label={`Increase ${item.name}`}
            className="w-8 h-8 grid place-items-center text-on-surface-variant hover:text-primary hover:bg-surface transition-colors"
            onClick={onIncrement}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>

        <button
          aria-label={`Remove ${item.name}`}
          className="font-metadata text-metadata text-error hover:underline decoration-error flex items-center gap-1"
          onClick={onRemove}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Remove
        </button>
      </div>
    </div>
  );
}
