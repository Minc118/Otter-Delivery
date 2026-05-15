import { defaultMenuItems, menuItemsByRestaurant } from "../data/menuItems.js";

export function getMenuItemsForRestaurant(restaurantId) {
  return menuItemsByRestaurant[restaurantId] ?? defaultMenuItems;
}
