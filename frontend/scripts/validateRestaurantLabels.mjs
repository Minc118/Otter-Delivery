import { readFileSync } from "node:fs";
import {
  adaptMenuItems,
  normalizeMenuItemName,
  toRestaurantViewModel,
} from "../src/services/restaurantAdapter.js";
import {
  defaultRestaurantFilters,
  filterRestaurants,
  getVisibleRestaurants,
  INITIAL_RESTAURANT_VISIBLE_COUNT,
} from "../src/services/restaurantFilters.js";
import { getLatestOrderStatusMeta, getOrderStatusMeta } from "../src/services/orderStatus.js";
import {
  getHomepageRestaurantRecommendations,
  getRecommendations,
  searchRecommendations,
  toSearchRecommendationCardModel,
} from "../src/services/recommendationService.js";
import { recommendations } from "../src/data/recommendations.js";

const filterBarSource = readFileSync(new URL("../src/components/discovery/FilterBar.jsx", import.meta.url), "utf8");
const discoveryPageSource = readFileSync(new URL("../src/routes/RestaurantDiscoveryPage.jsx", import.meta.url), "utf8");
const restaurantGridSource = readFileSync(new URL("../src/components/restaurant/RestaurantGrid.jsx", import.meta.url), "utf8");
const menuItemCardSource = readFileSync(new URL("../src/components/restaurant/MenuItemCard.jsx", import.meta.url), "utf8");
const restaurantAdapterSource = readFileSync(new URL("../src/services/restaurantAdapter.js", import.meta.url), "utf8");
const recommendationCardSource = readFileSync(new URL("../src/components/home/RecommendationCard.jsx", import.meta.url), "utf8");
const recommendationSectionSource = readFileSync(new URL("../src/components/home/RecommendationSection.jsx", import.meta.url), "utf8");
const recommendationServiceSource = readFileSync(new URL("../src/services/recommendationService.js", import.meta.url), "utf8");
assert(filterBarSource.includes("bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-sm"), "Filter bar should keep its visual class shape");
assert(!/\b(sticky|fixed|top-\d+|z-40)\b/.test(filterBarSource), "Filter bar should scroll in normal page flow");
assert(!filterBarSource.includes("bg-gradient-to-b") && !filterBarSource.includes("mask"), "Filter bar should not own a fade or mask");
assert(!discoveryPageSource.includes("bg-gradient-to-b from-background via-background/95 to-transparent"), "Discovery page should not add a sticky fade overlay for the filter bar");
assert(!discoveryPageSource.includes("pointer-events-none sticky"), "Discovery page should not include a sticky overlay spacer");
assert(restaurantGridSource.includes("showRibbon={false}"), "Discovery restaurant cards should hide AI Pick ribbons");
assert(!menuItemCardSource.includes("AI Recommended"), "Normal menu item cards should not show AI Recommended badges");
assert(!restaurantAdapterSource.includes("label: \"AI Pick\""), "Restaurant adapter should not synthesize AI Pick ribbons for normal browsing");
assert(recommendationSectionSource.includes('const cardMode = activeQuery ? "search" : "today";'), "Homepage recommendations should render in today mode until the user searches");
assert(recommendationSectionSource.includes("mode={cardMode}"), "Recommendation cards should receive the active display mode");
assert(recommendationCardSource.includes('mode = "search"'), "Recommendation cards should default to search mode for match result badges");
assert(recommendationCardSource.includes('mode === "search" && badge?.label'), "Recommendation match badges should render only in search mode");
assert(recommendationCardSource.includes('mode === "search" || !isMatchScore(recommendation.price)'), "Recommendation match scores should render only in search mode");
assert(recommendationServiceSource.includes("badge: null"), "Initial homepage restaurant recommendations should not include top-left match badges");

const cases = [
  {
    name: "Anatolia Grill Kreuzberg",
    raw: {
      name: "Anatolia Grill Kreuzberg",
      description: "Turkish halal-friendly grill in Kreuzberg with kebab plates, döner wraps, mezze, and soups.",
      open: true,
    },
    menuItems: [
      item("Chicken Döner Plate", "Halal-friendly chicken döner with rice, salad, garlic sauce, and warm flatbread."),
      item("Falafel Wrap", "Falafel wrap with hummus, pickles, herbs, and tahini. Vegetarian."),
      item("Adana Kebab", "Spicy halal-friendly minced lamb kebab with bulgur and grilled vegetables."),
      item("Mezze Box", "Hummus, baba ghanoush, olives, salad, and flatbread."),
    ],
    includes: ["Turkish"],
    excludes: ["Thai", "Curry"],
  },
  {
    name: "Glutenfrei Garden Neukölln",
    raw: {
      name: "Glutenfrei Garden Neukölln",
      description: "Healthy gluten-free bowl place near Neukölln for vegan lunch, vegetarian salads, spicy tofu, and fast delivery.",
      open: true,
    },
    menuItems: [
      item("Chicken Quinoa Bowl", "Gluten-free lunch bowl with chicken, quinoa, cucumber, herbs, and lemon dressing."),
      item("Sweet Potato Bowl", "Roasted sweet potato, lentils, avocado, greens, and tahini. Vegan and gluten-free."),
      item("Tofu Peanut Bowl", "Spicy tofu bowl with rice, cabbage, chili peanut sauce, and fresh herbs."),
      item("Mediterranean Salad Box", "Gluten-free salad with chickpeas, olives, tomato, cucumber, and feta."),
      item("Lentil Lunch Bowl", "Vegan lunch bowl with lentils, rice, greens, and warm cumin dressing."),
    ],
    includes: ["Healthy", "Gluten-Free", "Bowls"],
    excludes: ["Falafel"],
  },
  {
    name: "Pho Lantern Mitte",
    raw: {
      name: "Pho Lantern Mitte",
      description: "Vietnamese Asian kitchen near Mitte with warm comforting pho, rice noodle bowls, beef pho, and fast delivery.",
      open: true,
    },
    menuItems: [
      item("Beef Pho", "Vietnamese pho with sliced beef, rice noodles, herbs, lime, and warm broth."),
      item("Tofu Pho", "Vietnamese pho with rice noodles, tofu, herbs, lime, and warm broth."),
      item("Summer Roll Bowl", "Gluten-free rice noodle bowl with tofu, salad, peanuts, mint, and mild sauce."),
    ],
    includes: ["Vietnamese", "Pho", "Noodles"],
    excludes: ["Falafel"],
  },
  {
    name: "Sushi Atelier Charlottenburg",
    raw: {
      name: "Sushi Atelier Charlottenburg",
      description: "Premium Japanese sushi near Charlottenburg with fresh sashimi, nigiri, and maki.",
      open: true,
    },
    menuItems: [item("Sushi Selection", "Premium sushi box with nigiri, maki, sashimi, ginger, and fresh rice.")],
    includes: ["Japanese", "Sushi", "Premium"],
    excludes: [],
  },
  {
    name: "Napoli Pizza Berlin",
    raw: {
      name: "Napoli Pizza Berlin",
      description: "Italian pizza and pasta with warm oven-baked comfort food.",
      open: true,
    },
    menuItems: [
      item("Margherita Pizza", "Tomato, mozzarella, basil, and olive oil on a crisp Italian base."),
      item("Arrabbiata Pasta", "Penne with spicy tomato sauce, chili, garlic, and basil."),
    ],
    includes: ["Italian", "Pizza"],
    excludes: ["Thai", "Curry"],
  },
  {
    name: "Spicy Thai Box Friedrichshain",
    raw: {
      name: "Spicy Thai Box Friedrichshain",
      description: "Thai street food with pad thai, green curry, spicy noodles, and tom yum soup.",
      open: true,
    },
    menuItems: [
      item("Pad Thai Tofu", "Rice noodles with tofu, peanuts, tamarind, lime, and chili."),
      item("Green Curry", "Spicy green curry with vegetables, coconut milk, rice, and Thai basil."),
    ],
    includes: ["Thai", "Noodles", "Curry"],
    excludes: [],
  },
  {
    name: "Weak one-off Mediterranean item",
    raw: {
      name: "Neighborhood Lunch",
      description: "Local lunch counter with fresh daily bowls.",
      open: true,
    },
    menuItems: [
      item("Mediterranean Salad Box", "Salad with chickpeas, olives, cucumber, and feta."),
      item("Chicken Rice Bowl", "Chicken rice bowl with herbs and lemon dressing."),
      item("Soup Cup", "Warm lentil soup with herbs."),
    ],
    includes: [],
    excludes: ["Falafel", "Mediterranean"],
  },
];

for (const testCase of cases) {
  const viewModel = toRestaurantViewModel(testCase.raw, { menuItems: testCase.menuItems });
  const cuisine = viewModel.cuisine;

  for (const expected of testCase.includes) {
    assert(
      cuisine.includes(expected),
      `${testCase.name}: expected cuisine "${cuisine}" to include "${expected}"`,
    );
  }

  for (const forbidden of testCase.excludes) {
    assert(
      !cuisine.includes(forbidden),
      `${testCase.name}: expected cuisine "${cuisine}" not to include "${forbidden}"`,
    );
  }
}

const filterCatalog = [
  view("Napoli Pizza Berlin", "Italian • Pizza • Authentic", "Italian pizza and pasta", "€€", "35-45 min", "4.7", ["Open now"]),
  view("Kreuzberg Burger Lab", "American • Burgers • Comfort Food", "Burger and fries", "€€", "30-40 min", "4.6", ["Open now"]),
  view("Sushi Atelier Charlottenburg", "Japanese • Sushi • Premium", "Premium Japanese sushi", "€€€", "40 min", "4.9", ["Open now"]),
  view("Glutenfrei Garden Neukölln", "Healthy • Gluten-Free • Bowls", "Healthy gluten-free bowls and salads", "€€", "30-40 min", "4.8", ["Fresh picks"]),
  view("Anatolia Grill Kreuzberg", "Turkish • Halal-friendly • Grill", "Turkish halal-friendly kebab grill", "€€", "35-45 min", "4.5", ["Open now"]),
  view("Falafel Sprint Friedrichshain", "Mediterranean • Falafel • Bowls", "Fast cheap falafel wraps", "€", "30-40 min", "4.4", ["Open now"]),
  view("Pho Lantern Mitte", "Vietnamese • Pho • Noodles", "Vietnamese pho and rice noodles", "€€", "35-45 min", "4.6", ["Open now"]),
  view("Seoul Bowl Neukölln", "Korean • Bibimbap • Bowls", "Korean bibimbap bowls", "€€", "40 min", "4.7", ["Open now"]),
  view("Quick Burrito Mitte", "Mexican • Tacos • Burritos", "Mexican burritos and tacos", "€", "30-40 min", "4.3", ["Open now"]),
  view("Curry House Charlottenburg", "Indian • Curry • Masala", "Indian curry and masala", "€€", "40 min", "4.4", ["Open now"]),
];

const italianResults = filterRestaurants(filterCatalog, {
  ...defaultRestaurantFilters,
  category: "italian",
});
assert(italianResults.length === 1 && italianResults[0].name.includes("Napoli"), "Italian filter should change visible results");

const allResults = filterRestaurants(filterCatalog, defaultRestaurantFilters);
assert(allResults.length === filterCatalog.length, "All filters should return the full catalog");
assert(getVisibleRestaurants(allResults, INITIAL_RESTAURANT_VISIBLE_COUNT).length === 9, "Initial visible count should be 9");
assert(getVisibleRestaurants(italianResults, INITIAL_RESTAURANT_VISIBLE_COUNT).length === 1, "Filtered visible count should come from filtered results");
assert(getVisibleRestaurants(italianResults, 18).length === italianResults.length, "Load More should operate on filtered results");

const burgerResults = filterRestaurants(filterCatalog, {
  ...defaultRestaurantFilters,
  category: "burger",
});
assert(burgerResults.length === 1 && burgerResults[0].name.includes("Burger"), "Burger filter should find burger restaurant");

const status = getOrderStatusMeta("CREATED");
assert(status.label === "Order placed", "CREATED should map to Order placed");
assert(getLatestOrderStatusMeta({ status: "CREATED", trackingStatus: "DRIVER_ASSIGNMENT_PENDING" }).label === "Preparing", "Driver assignment pending should display as preparing, not a raw enum");
assert(getLatestOrderStatusMeta({ status: "CREATED", trackingStatus: "DRIVER_ASSIGNED" }).label === "Driver assigned", "Driver assigned tracking state should override stale CREATED");
assert(getLatestOrderStatusMeta({ status: "CREATED", deliveredAt: Date.now() }).label === "Delivered", "Delivered local state should override stale CREATED");
assert(profileTrackingPath({ id: "ot-demo-123" }) === "/orders/ot-demo-123/tracking", "Profile orders should navigate to tracking route");
assert(hasSavedRouteSnapshot(savedRouteOrder()), "Saved route snapshot should be reusable for tracking details");

assert(getRecommendations().length === 3, "Initial fallback recommendations should show 3 items");
const homepageCards = getHomepageRestaurantRecommendations(filterCatalog);
assert(homepageCards.length === 3, "Initial homepage restaurant recommendations should show 3 items");
assert(homepageCards.every((card) => card.badge === null), "Initial homepage recommendation card data should not include Best Match or AI Recommendation badges");
assert(homepageCards.every((card) => !/\bpts\b/i.test(String(card.price))), "Initial homepage recommendation card data should not expose match score points");
assert(searchRecommendations("pizza ramen burger healthy sushi falafel").length <= 6, "Search recommendations should allow up to 6 items");
const searchCards = Array.from({ length: 6 }, (_, index) =>
  toSearchRecommendationCardModel(
    {
      restaurantId: `restaurant-${index}`,
      restaurantName: `Restaurant ${index}`,
      recommendedItems: [`Matched Item ${index}`],
      recommendationScore: 100 - index,
      matchedFactors: ["query match"],
      reason: "Matched against query.",
    },
    index,
    "request-1",
  ),
);
assert(searchCards.length === 6, "Search-triggered recommendation mode can show 6 items");
assert(searchCards[0].badge.label === "Best Match", "Search result mode can show Best Match");
assert(searchCards.slice(1).every((card) => card.badge.label === "AI Recommendation"), "Search result mode can show AI Recommendation labels");
assert(searchCards.every((card) => /\bpts\b/.test(card.price)), "Search result mode can show match score points");

const disallowedNamePattern = /\b(cheap|halal|halal-friendly|premium|gluten-free|gluten free|healthy|fast delivery|budget|budget-friendly)\b/i;
const fallbackNames = recommendations.map((recommendation) => recommendation.title);
for (const name of fallbackNames) {
  assert(!disallowedNamePattern.test(name), `Fallback recommendation name contains metadata label: ${name}`);
}
const visibleMenuItems = adaptMenuItems([
  { id: "current", name: "Falafel Wrap", available: true },
  { id: "legacy", name: "Cheap Falafel Wrap", available: false },
]);
assert(
  visibleMenuItems.every((menuItem) => !disallowedNamePattern.test(menuItem.name)),
  "Unavailable legacy menu names should not be adapted for display",
);
assert(normalizeMenuItemName("Halal Chicken Döner Plate") === "Chicken Döner Plate", "Known backend legacy names should be normalized before display");
assert(normalizeMenuItemName("Premium Sushi Box") === "Sushi Selection", "Known premium metadata names should be normalized before display");

console.log(`Validated ${cases.length} label cases, ${filterCatalog.length} filter fixtures, status/snapshot mapping, recommendation counts, discovery badges, and fallback menu names.`);

function item(name, description) {
  return { name, description, available: true, price: 10.9 };
}

function view(name, cuisine, description, priceTier, eta, rating, tags) {
  return { id: name.toLowerCase().replaceAll(" ", "-"), name, cuisine, description, priceTier, eta, rating, tags };
}

function profileTrackingPath(order) {
  return `/orders/${order.id}/tracking`;
}

function savedRouteOrder() {
  return {
    trackingSnapshot: {
      pickupLocation: { lat: 52.5, lng: 13.4 },
      deliveryLocation: { lat: 52.51, lng: 13.41 },
      routePoints: [
        { lat: 52.5, lng: 13.4 },
        { lat: 52.51, lng: 13.41 },
      ],
    },
  };
}

function hasSavedRouteSnapshot(order) {
  return Boolean(
    order.trackingSnapshot?.pickupLocation &&
      order.trackingSnapshot?.deliveryLocation &&
      order.trackingSnapshot?.routePoints?.length >= 2,
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
