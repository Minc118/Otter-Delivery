import { useEffect } from "react";
import { useParams } from "react-router-dom";
import MenuSection from "../components/restaurant/MenuSection.jsx";
import RestaurantHero from "../components/restaurant/RestaurantHero.jsx";
import {
  getFallbackRestaurant,
  getRestaurantById,
} from "../services/catalogService.js";
import { getMenuItemsForRestaurant } from "../services/menuService.js";

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const restaurant = getRestaurantById(id) ?? getFallbackRestaurant();
  const menuItems = getMenuItemsForRestaurant(restaurant.id);
  const pageTitle = restaurant.detail?.name ?? restaurant.name;

  useEffect(() => {
    document.title = `${pageTitle} - Otter Delivery`;
  }, [pageTitle]);

  return (
    <div className="bg-background min-h-full pb-stack-lg">
      <RestaurantHero restaurant={restaurant} />
      <MenuSection items={menuItems} restaurant={restaurant} />
    </div>
  );
}
