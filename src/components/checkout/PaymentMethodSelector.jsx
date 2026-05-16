export default function PaymentMethodSelector({
  methods,
  selectedPaymentMethod,
  onPaymentMethodChange,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
      {methods.map((method) => {
        const isSelected = method.id === selectedPaymentMethod;

        return (
          <label
            className="cursor-pointer relative"
            key={method.id}
          >
            <input
              checked={isSelected}
              className="peer sr-only"
              name="payment"
              onChange={() => onPaymentMethodChange(method.id)}
              type="radio"
            />
            <span className="h-full bg-surface-container-lowest border-2 border-surface peer-checked:border-primary-container rounded-2xl p-stack-md transition-all duration-200 flex items-center gap-stack-md hover:border-outline-variant">
              <span
                className={`material-symbols-outlined ${
                  isSelected ? "text-primary-container" : "text-on-surface-variant"
                }`}
              >
                {method.icon}
              </span>
              <span className="font-body-md text-body-md text-dark-text font-medium flex-grow">
                {method.label}
              </span>
              <span
                className={`material-symbols-outlined text-primary-container transition-opacity ${
                  isSelected ? "opacity-100" : "opacity-0"
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
