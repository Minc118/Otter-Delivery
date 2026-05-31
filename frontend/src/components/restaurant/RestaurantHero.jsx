export default function RestaurantHero({ restaurant }) {
  return (
      <section className="max-w-container-max mx-auto px-margin-x pt-stack-lg pb-stack-md">
        <div className="bg-white rounded-xl p-8 shadow">
          <h1 className="text-4xl font-bold mb-4">
            {restaurant.name}
          </h1>

          <p className="mb-4">
            {restaurant.description}
          </p>

          <p>
            <strong>City:</strong> {restaurant.address?.city}
          </p>

          <p>
            <strong>Status:</strong> {restaurant.open ? "Open" : "Closed"}
          </p>

          <p>
            <strong>Delivery Radius:</strong> {restaurant.deliveryRadiusKm} km
          </p>
        </div>
      </section>
  );
}