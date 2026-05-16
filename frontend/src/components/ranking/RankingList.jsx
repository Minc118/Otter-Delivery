import { getRankedRestaurants } from "../../services/rankingService.js";
import RankingCard from "./RankingCard.jsx";

export default function RankingList() {
  const restaurants = getRankedRestaurants();

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-stack-lg">
      {restaurants.map((restaurant) => (
        <RankingCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </section>
  );
}
