import { currentUserProfile } from "../data/user.js";

export function getSavedRestaurants() {
  return currentUserProfile.savedRestaurants;
}
