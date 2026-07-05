import useCart from "../../hooks/useCart.js";
import {
  applyImageFallback,
  toCartItemViewModel,
  toRestaurantCartMeta,
} from "../../services/restaurantAdapter.js";
import { getRecommendationAttributionForRestaurant } from "../../services/recommendationService.js";

export default function MenuItemCard({ item, restaurant }) {
  const { addItem } = useCart();
  const restaurantName = restaurant?.name ?? "Green Bowl House";
  const restaurantId =
    restaurant?.restaurantId ?? restaurant?.id ?? "green-bowl-house";
  const restaurantMeta = toRestaurantCartMeta(restaurant);
  const recommendationAttribution =
    getRecommendationAttributionForRestaurant(restaurantId);

  return (
    <article
      className="bg-surface-container-lowest border border-surface hover:border-primary-light rounded-xl overflow-hidden hover:shadow-[0_12px_32px_rgba(36,36,38,0.08)] transition-all duration-300 flex flex-col relative"
    >
      <div className="h-48 overflow-hidden">
        <img
          alt={item.image.alt}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(event) => applyImageFallback(event, item.image.fallbackSrc)}
          src={item.image.src}
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="font-card-title text-card-title text-on-background">
            {item.name}
          </h3>
          <span className="font-card-title text-card-title text-on-background shrink-0">
            {item.price}
          </span>
        </div>
        <p className="text-on-surface-variant mb-4 flex-grow">
          {item.description}
        </p>
        <button
          className="bg-primary-container hover:bg-surface-tint text-on-primary font-button text-button py-3 px-4 rounded-[16px] transition-colors duration-200 w-full flex justify-center items-center gap-2"
          onClick={() =>
            addItem({
              restaurantId,
              restaurantName,
              restaurantMeta,
              recommendationAttribution,
              item: {
                ...toCartItemViewModel(item),
                restaurantId,
                restaurantName,
                restaurantMeta,
              },
            })
          }
          type="button"
        >
          Add to cart
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </article>
  );
}
