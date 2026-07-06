import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CheckoutItemsList from "../components/checkout/CheckoutItemsList.jsx";
import CheckoutSummaryPanel from "../components/checkout/CheckoutSummaryPanel.jsx";
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector.jsx";
import { MissingCheckoutProfileError } from "../context/CartContext.jsx";
import PageShell from "../components/layout/PageShell.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import useCart from "../hooks/useCart.js";
import { paymentMethods } from "../data/checkout.js";
import { getRestaurantSubtotalCents } from "../utils/cartTotals.js";
import { getRestaurantCheckoutMeta } from "../services/checkoutService.js";

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const {
    checkoutDraft,
    deliveryAddress,
    deliveryFeeCents,
    placeCheckoutOrder,
    selectedGroup,
    updateDeliveryAddress,
  } = useCart();
  const checkoutGroup = checkoutDraft ?? selectedGroup;
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].id);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState(deliveryAddress);
  const [orderError, setOrderError] = useState(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const restaurantMeta = checkoutGroup
    ? getRestaurantCheckoutMeta(
        checkoutGroup.restaurantId,
        checkoutGroup.restaurantMeta,
      )
    : null;
  const subtotalCents = useMemo(
    () => (checkoutGroup ? getRestaurantSubtotalCents(checkoutGroup) : 0),
    [checkoutGroup],
  );
  const totalCents = subtotalCents + deliveryFeeCents;

  useEffect(() => {
    document.title = "Order Confirmation - Otter Delivery";
  }, []);

  if (!checkoutGroup) {
    return (
      <div className="bg-background min-h-screen">
        <PageShell className="py-stack-lg">
          <EmptyState
            description="Add items to your cart before confirming an order."
            icon="shopping_cart"
            title="No order to confirm"
          />
          <div className="flex justify-center">
            <Link
              className="bg-primary-container hover:bg-surface-tint text-on-primary font-button text-button py-3 px-6 rounded-lg transition-colors"
              to="/restaurants"
            >
              Back to restaurants
            </Link>
          </div>
        </PageShell>
      </div>
    );
  }

  async function handlePayAndPlaceOrder() {
    if (isPlacingOrder) {
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);
    setRequiresLogin(false);
    try {
      const order = await placeCheckoutOrder(paymentMethod);

      if (order) {
        navigate(`/orders/${order.id}/success`);
      }
    } catch (error) {
      if (error instanceof MissingCheckoutProfileError) {
        setRequiresLogin(true);
        setOrderError(error.message);
        return;
      }

      setOrderError("The order could not be placed. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  function handleAddressChange(event) {
    const { name, value } = event.target;
    setAddressDraft((current) => ({ ...current, [name]: value }));
  }

  function handleAddressSave(event) {
    event.preventDefault();
    updateDeliveryAddress(addressDraft);
    setIsEditingAddress(false);
  }

  return (
    <div className="bg-background min-h-screen">
      <PageShell className="py-stack-lg md:py-16">
        <h1 className="font-page-title text-page-title mb-stack-lg">
          Confirm your order
        </h1>

        <div className="flex flex-col lg:flex-row gap-stack-lg lg:gap-[40px]">
          <div className="w-full lg:w-2/3 flex flex-col gap-stack-lg">
            <section>
              <div className="flex items-center gap-stack-md mb-stack-md">
                <img
                  alt={restaurantMeta.image.alt}
                  className="w-12 h-12 rounded-full object-cover border border-surface"
                  src={restaurantMeta.image.src}
                />
                <div>
                  <h2 className="font-card-title text-card-title">
                    {checkoutGroup.restaurantName}
                  </h2>
                  <div className="flex items-center gap-1 text-on-surface-variant mt-1">
                    <span
                      className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-metadata text-metadata">
                      {restaurantMeta.rating}
                    </span>
                  </div>
                </div>
              </div>
              <CheckoutItemsList items={checkoutGroup.items} />
            </section>

            <section>
              <h2 className="font-section-title text-card-title mb-stack-md">
                Delivery Details
              </h2>
              <div className="bg-surface-container-lowest border border-surface rounded-3xl p-stack-md hover:border-primary-light transition-colors duration-300 mb-stack-md">
                <div className="flex items-start gap-stack-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-metadata text-metadata text-on-surface-variant uppercase tracking-wider mb-1">
                      Delivery to: {deliveryAddress.label}
                    </h3>
                    <p className="font-body-md text-body-md text-dark-text">
                      {deliveryAddress.line1}, {deliveryAddress.postalCode}{" "}
                      {deliveryAddress.city}
                    </p>
                    <p className="font-metadata text-metadata text-on-surface-variant mt-1">
                      {[deliveryAddress.region, deliveryAddress.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {deliveryAddress.note ? (
                      <p className="font-metadata text-metadata text-on-surface-variant mt-2">
                        Note: {deliveryAddress.note}
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="text-primary font-metadata text-metadata hover:underline px-2 py-1 rounded hover:bg-surface transition-colors"
                    onClick={() => {
                      setAddressDraft(deliveryAddress);
                      setIsEditingAddress((current) => !current);
                    }}
                    type="button"
                  >
                    {isEditingAddress ? "Cancel" : "Edit"}
                  </button>
                </div>
                {isEditingAddress ? (
                  <DeliveryAddressForm
                    address={addressDraft}
                    onChange={handleAddressChange}
                    onSubmit={handleAddressSave}
                  />
                ) : null}
              </div>
              <div className="inline-flex items-center gap-stack-sm bg-surface-light px-stack-md py-stack-sm rounded-full border border-tertiary-fixed-dim/30">
                <span
                  className="material-symbols-outlined text-tertiary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  schedule
                </span>
                <span className="font-metadata text-metadata text-dark-text">
                  Estimated delivery time: approx. 40 min
                </span>
              </div>
            </section>

            <section>
              <h2 className="font-section-title text-card-title mb-stack-md">
                Payment Method
              </h2>
              <PaymentMethodSelector
                methods={paymentMethods}
                onPaymentMethodChange={setPaymentMethod}
                selectedPaymentMethod={paymentMethod}
              />
            </section>
          </div>

          <div className="w-full lg:w-1/3 relative">
            <div className="sticky top-28 flex flex-col gap-stack-md">
              <CheckoutSummaryPanel
                buttonLabel={isPlacingOrder ? "Placing order..." : "Pay and place order"}
                deliveryFeeCents={deliveryFeeCents}
                disabled={isPlacingOrder}
                onPrimaryAction={handlePayAndPlaceOrder}
                subtotalCents={subtotalCents}
                totalCents={totalCents}
              />
              {orderError ? (
                <div className="flex flex-col items-center gap-3" role="alert">
                  <p className="text-error font-metadata text-metadata text-center">
                    {orderError}
                  </p>
                  {requiresLogin ? (
                    <Link
                      className="bg-primary-container hover:bg-surface-tint text-on-primary font-button text-button py-2 px-5 rounded-xl transition-colors"
                      to="/login?returnTo=/orders/confirm"
                    >
                      Log in to continue
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <Link
                className="text-center font-metadata text-metadata text-on-surface-variant hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary underline-offset-4"
                to="/restaurants"
              >
                Back to restaurants
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
}

const addressFields = [
  { label: "Label", name: "label", type: "text" },
  { label: "Street / line 1", name: "line1", type: "text" },
  { label: "City", name: "city", type: "text" },
  { label: "Postal code", name: "postalCode", type: "text" },
  { label: "Region", name: "region", type: "text" },
  { label: "Country", name: "country", type: "text" },
];

function DeliveryAddressForm({ address, onChange, onSubmit }) {
  const inputClass =
    "w-full rounded-xl border border-surface bg-surface-bright px-3 py-2 text-on-surface focus:border-primary focus:ring-primary";

  return (
    <form className="mt-stack-md border-t border-surface pt-stack-md" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addressFields.map((field) => (
          <label className="font-metadata text-metadata text-on-surface-variant" key={field.name}>
            {field.label}
            <input
              className={`${inputClass} mt-1`}
              name={field.name}
              onChange={onChange}
              required
              type={field.type}
              value={address[field.name] ?? ""}
            />
          </label>
        ))}
      </div>
      <label className="font-metadata text-metadata text-on-surface-variant block mt-4">
        Delivery note (optional)
        <textarea
          className={`${inputClass} mt-1 min-h-20 resize-y`}
          name="note"
          onChange={onChange}
          value={address.note ?? ""}
        />
      </label>
      <div className="flex justify-end mt-4">
        <button
          className="bg-primary-container hover:bg-surface-tint text-on-primary font-button text-button py-2 px-5 rounded-xl transition-colors"
          type="submit"
        >
          Save delivery details
        </button>
      </div>
    </form>
  );
}
