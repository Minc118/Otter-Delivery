import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CheckoutItemsList from "../components/checkout/CheckoutItemsList.jsx";
import CheckoutSummaryPanel from "../components/checkout/CheckoutSummaryPanel.jsx";
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector.jsx";
import PageShell from "../components/layout/PageShell.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import useCart from "../hooks/useCart.js";
import { checkoutDeliveryAddress, paymentMethods } from "../data/checkout.js";
import { getRestaurantSubtotalCents } from "../utils/cartTotals.js";
import { getRestaurantCheckoutMeta } from "../services/checkoutService.js";

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const {
    checkoutDraft,
    deliveryFeeCents,
    placeCheckoutOrder,
    selectedGroup,
  } = useCart();
  const checkoutGroup = checkoutDraft ?? selectedGroup;
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].id);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const restaurantMeta = checkoutGroup
    ? getRestaurantCheckoutMeta(checkoutGroup.restaurantId)
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
    const order = await placeCheckoutOrder(paymentMethod);

    if (order) {
      navigate(`/orders/${order.id}/success`);
    }

    setIsPlacingOrder(false);
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
                    <span className="material-symbols-outlined">home</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-metadata text-metadata text-on-surface-variant uppercase tracking-wider mb-1">
                      Delivery to: {checkoutDeliveryAddress.label}
                    </h3>
                    <p className="font-body-md text-body-md text-dark-text">
                      {checkoutDeliveryAddress.line1},{" "}
                      {checkoutDeliveryAddress.city},{" "}
                      {checkoutDeliveryAddress.region}
                    </p>
                  </div>
                  <button
                    className="text-primary font-metadata text-metadata hover:underline px-2 py-1 rounded hover:bg-surface transition-colors"
                    type="button"
                  >
                    Edit
                  </button>
                </div>
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
