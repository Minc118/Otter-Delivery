import CartItem from "./CartItem.jsx";

export default function CartRestaurantGroup({
  group,
  isSelected,
  onDecrementItem,
  onIncrementItem,
  onRemoveItem,
  onRemoveRestaurant,
  onSelect,
}) {
  return (
    <section
      className={`bg-surface-container-lowest rounded-xl overflow-hidden transition-opacity ${
        isSelected
          ? "border-2 border-primary"
          : "border border-surface-variant opacity-75 hover:opacity-100"
      }`}
    >
      <div
        className={`p-stack-md flex items-center justify-between border-b border-surface-variant ${
          isSelected ? "bg-surface" : "bg-surface-container-lowest"
        }`}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            checked={isSelected}
            className="w-5 h-5 text-primary border-outline focus:ring-primary focus:ring-offset-surface-container-lowest"
            name="cart_restaurant"
            onChange={() => onSelect(group.restaurantId)}
            type="radio"
          />
          <span className="font-card-title text-card-title text-on-background">
            {group.restaurantName}
          </span>
        </label>
        <div className="flex items-center gap-2">
          {isSelected ? (
            <span className="font-metadata text-metadata text-primary bg-primary-fixed px-3 py-1 rounded-full">
              Ordering from here
            </span>
          ) : null}
          <button
            aria-label={`Remove ${group.restaurantName} from cart`}
            className="w-9 h-9 grid place-items-center rounded-full text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
            onClick={() => onRemoveRestaurant(group.restaurantId)}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              delete
            </span>
          </button>
        </div>
      </div>

      <div className="p-stack-md flex flex-col gap-stack-md">
        {group.items.map((item) => (
          <CartItem
            item={item}
            key={item.id}
            muted={!isSelected}
            onDecrement={() => onDecrementItem(group.restaurantId, item.id)}
            onIncrement={() => onIncrementItem(group.restaurantId, item.id)}
            onRemove={() => onRemoveItem(group.restaurantId, item.id)}
          />
        ))}
        {isSelected ? (
          <button
            className="text-primary font-metadata text-metadata flex items-center gap-1 mt-2 hover:underline decoration-primary w-fit"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add more items
          </button>
        ) : null}
      </div>

      {!isSelected ? (
        <div className="px-stack-md pb-stack-md">
          <div className="bg-surface-container p-3 rounded-lg flex items-start gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]">
              info
            </span>
            <p className="font-metadata text-metadata text-on-surface-variant">
              You can only order from one restaurant at a time. Select to switch.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
