import MenuItemCard from "./MenuItemCard.jsx";

export default function MenuSection({ items, restaurant }) {
  return (
    <section className="max-w-container-max mx-auto px-margin-x py-stack-md">
      <h2 className="font-section-title text-section-title mb-stack-md">
        Popular Items
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {items.map((item) => (
          <MenuItemCard item={item} key={item.id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
}
