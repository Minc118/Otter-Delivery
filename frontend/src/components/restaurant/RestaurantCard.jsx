
import { Link } from "react-router-dom";
export default function RestaurantCard({ restaurant }) {

  return (
      <article className="bg-surface-container-lowest rounded-xl border p-5">
        <h3 className="text-xl font-bold mb-2">
          {restaurant.name}
        </h3>

        <p className="mb-2">
          {restaurant.description}
        </p>

        <p className="mb-2">
          City: {restaurant.address?.city}
        </p>

        <p className="mb-4">
          Status: {restaurant.open ? "Open" : "Closed"}
        </p>

        <Link
            className="bg-blue-500 text-white px-4 py-2 rounded"
            to={`/restaurants/${restaurant.id}`}
        >
          View restaurant
        </Link>
      </article>
  );
}