import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCart from "../../hooks/useCart.js";
import EmptyState from "../ui/EmptyState.jsx";
import CartRestaurantGroup from "./CartRestaurantGroup.jsx";
import CartSummary from "./CartSummary.jsx";

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    beginCheckout,
    cartGroups,
    decrementItem,
    deliveryFeeCents,
    incrementItem,
    removeItem,
    removeRestaurant,
    restaurantCount,
    selectedGroup,
    selectedRestaurantId,
    selectRestaurant,
  } = useCart();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Close cart drawer"
        className="absolute inset-0 bg-inverse-surface/20 cursor-default"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Shopping cart"
        className="absolute top-0 right-0 h-full min-h-0 w-full max-w-[480px] bg-surface-container-lowest custom-shadow z-10 flex flex-col"
      >
        <div className="flex items-center justify-between p-margin-x border-b border-surface-variant bg-surface-container-lowest z-10">
          <h2 className="font-section-title text-section-title text-on-background">
            Your Cart
            <span className="text-outline font-body-md text-body-md ml-2">
              ({restaurantCount} restaurants)
            </span>
          </h2>
          <button
            aria-label="Close cart"
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-margin-x flex flex-col gap-stack-lg bg-background">
          {restaurantCount > 0 ? (
            cartGroups.map((group) => (
              <CartRestaurantGroup
                group={group}
                isSelected={group.restaurantId === selectedRestaurantId}
                key={group.restaurantId}
                onDecrementItem={decrementItem}
                onIncrementItem={incrementItem}
                onRemoveItem={removeItem}
                onRemoveRestaurant={removeRestaurant}
                onSelect={selectRestaurant}
              />
            ))
          ) : (
            <EmptyState
              description="Add dishes from a restaurant when you are ready to build an order."
              icon="shopping_cart"
              title="Your cart is empty"
            />
          )}
        </div>

        {selectedGroup ? (
          <CartSummary
            deliveryFeeCents={deliveryFeeCents}
            onCheckout={() => {
              beginCheckout();
              onClose();
              navigate("/orders/confirm");
            }}
            selectedGroup={selectedGroup}
          />
        ) : null}
      </aside>
    </div>
  );
}
