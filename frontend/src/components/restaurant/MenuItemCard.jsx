import useCart from "../../hooks/useCart.js";
import {
  toCartItemViewModel,
  toRestaurantCartMeta,
} from "../../services/restaurantAdapter.js";

export default function MenuItemCard({ item, restaurant }) {
  const { addItem } = useCart();

  const restaurantName = restaurant?.name ?? "Restaurant";
  const restaurantId = restaurant?.id ?? "unknown";
  const restaurantMeta = toRestaurantCartMeta(restaurant);

  const imageUrl =
      item?.imageUrl ||
      item?.image?.src ||
      "https://via.placeholder.com/300x200";

  const cardClass = item.aiRecommended
      ? "bg-surface-light border border-surface-light"
      : "bg-surface-container-lowest border border-surface hover:border-primary-light";

  return (
      <article className={`${cardClass} rounded-xl overflow-hidden flex flex-col`}>
        {item.aiRecommended && (
            <div className="absolute top-4 left-4 z-10 bg-[#FFD278] px-3 py-1 rounded-full">
              AI Recommended
            </div>
        )}

        <div className="h-48 overflow-hidden">
          <img
              alt={item.name}
              src={imageUrl}
              className="w-full h-full object-cover"
          />
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between mb-2">
            <h3>{item.name}</h3>
            <span>{item.price}€</span>
          </div>

          <p className="text-sm text-gray-500 mb-4">{item.description}</p>

          {/*<button*/}
          {/*    onClick={() =>*/}
          {/*        addItem({*/}
          {/*          restaurantId,*/}
          {/*          restaurantName,*/}
          {/*          restaurantMeta,*/}
          {/*          item: {*/}
          {/*            ...toCartItemViewModel(item),*/}
          {/*            restaurantId,*/}
          {/*            restaurantName,*/}
          {/*            restaurantMeta,*/}
          {/*          },*/}
          {/*        })*/}
          {/*    }*/}
          {/*>*/}
          {/*  Add to cart*/}
          {/*</button>*/}
            <button
                onClick={() =>
                    addItem({
                        restaurantId,
                        restaurantName,
                        restaurantMeta,
                        item: {
                            ...toCartItemViewModel(item),
                            restaurantId,
                            restaurantName,
                            restaurantMeta,
                        },
                    })
                }
                className="mt-auto w-full bg-primary-container hover:bg-surface-tint text-on-primary font-button text-button rounded-lg py-3 transition-colors duration-200 flex items-center justify-center gap-2"
            >
    <span className="material-symbols-outlined text-[20px]">
        add
    </span>
                Add to cart
            </button>
        </div>
      </article>
  );
}