import { formatCurrency } from "../../utils/currency.js";

export default function CheckoutItemsList({ items }) {
  return (
    <div className="bg-surface-container-lowest border border-surface rounded-3xl p-stack-md flex flex-col gap-stack-sm">
      {items.map((item) => (
        <div
          className="flex justify-between items-start py-stack-sm border-b border-surface last:border-0"
          key={item.id}
        >
          <div className="flex gap-stack-md">
            <span className="font-metadata text-metadata font-bold px-2 py-1 bg-surface rounded-md h-fit">
              {item.quantity}x
            </span>
            <div>
              <h3 className="font-body-md text-body-md font-semibold text-dark-text">
                {item.name}
              </h3>
              {item.notes ? (
                <p className="font-metadata text-metadata text-on-surface-variant mt-1">
                  {item.notes}
                </p>
              ) : null}
            </div>
          </div>
          <span className="font-body-md text-body-md font-semibold text-dark-text">
            {formatCurrency(item.quantity * item.unitPriceCents)}
          </span>
        </div>
      ))}
    </div>
  );
}
