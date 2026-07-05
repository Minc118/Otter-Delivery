const CURRENCY = "EUR";

const RESTAURANT_IMAGES = [
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
];

const HERO_IMAGES = [
  ...RESTAURANT_IMAGES,
];

const MENU_IMAGES = [
  "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ...RESTAURANT_IMAGES,
];

const LEGACY_MENU_ITEM_NAMES = new Map([
  ["halal chicken döner plate", "Chicken Döner Plate"],
  ["halal chicken doner plate", "Chicken Döner Plate"],
  ["cheap falafel wrap", "Falafel Wrap"],
  ["cheap lentil lunch bowl", "Lentil Lunch Bowl"],
  ["gluten-free chicken quinoa bowl", "Chicken Quinoa Bowl"],
  ["gluten free chicken quinoa bowl", "Chicken Quinoa Bowl"],
  ["gluten-free corn taco trio", "Corn Taco Trio"],
  ["gluten free corn taco trio", "Corn Taco Trio"],
  ["healthy burrito bowl", "Burrito Bowl"],
  ["halal shawarma plate", "Shawarma Plate"],
  ["halal chicken shawarma bowl", "Shawarma Plate"],
  ["chicken shawarma bowl", "Shawarma Plate"],
  ["premium sushi box", "Sushi Selection"],
  ["premium sashimi set", "Sashimi Set"],
  ["bun bo noodles", "Beef Pho"],
]);

const CUISINE_RULES = [
  {
    label: "Turkish • Halal-friendly • Grill",
    match: ["turkish", "döner", "doner", "kebab", "adana", "mezze"],
  },
  {
    label: "Vietnamese • Pho • Noodles",
    match: ["vietnamese", "pho", "bun bo", "rice noodle"],
  },
  {
    label: "Korean • Bibimbap • Bowls",
    match: ["korean", "bibimbap", "kimchi", "bulgogi", "tteokbokki"],
  },
  {
    label: "Indian • Curry • Masala",
    match: ["indian", "masala", "dal", "biryani", "paneer", "rogan", "chana"],
  },
  {
    label: "Mexican • Tacos • Burritos",
    match: ["mexican", "taco", "tacos", "burrito", "quesadilla", "nachos"],
  },
  {
    label: "Mediterranean • Falafel • Bowls",
    match: ["mediterranean", "falafel", "shawarma", "halloumi", "mezze"],
  },
  {
    label: "Japanese • Ramen • Noodles",
    match: ["ramen", "shoyu", "miso broth"],
  },
  {
    label: "Japanese • Sushi • Premium",
    match: ["sushi", "sashimi", "nigiri", "maki"],
  },
  {
    label: "Thai • Noodles • Curry",
    match: ["thai", "pad thai", "tom yum", "green curry"],
  },
  {
    label: "Italian • Pizza • Authentic",
    match: ["pizza", "pasta", "napoli", "italian"],
  },
  {
    label: "American • Burgers • Comfort Food",
    match: ["burger", "fries", "shake"],
  },
  {
    label: "Healthy • Gluten-Free • Bowls",
    match: ["gluten-free"],
  },
  {
    label: "Healthy • Bowls • Salads",
    match: ["gluten-free", "healthy", "salad", "bowl", "quinoa"],
  },
  {
    label: "Cafe • Bakery • Breakfast",
    match: ["coffee", "cafe", "bakery", "breakfast"],
  },
];

function hashString(value) {
  return String(value ?? "")
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function pickByHash(values, seed) {
  return values[hashString(seed) % values.length];
}

function textBlob(raw, menuItems = []) {
  return [
    raw?.name,
    raw?.description,
    raw?.category,
    raw?.cuisine,
    ...menuItems.flatMap((item) => [
      item?.name,
      item?.description,
      item?.category,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isUsableImageUrl(source) {
  if (typeof source !== "string" || !source.trim()) {
    return false;
  }

  try {
    const url = new URL(source);
    const host = url.hostname.toLowerCase();

    return (
      ["http:", "https:"].includes(url.protocol) &&
      !host.includes("example.com") &&
      !host.includes("placeholder")
    );
  } catch {
    return false;
  }
}

function normalizeImage(source, fallbackSrc, alt) {
  if (isUsableImageUrl(source)) {
    return { alt, src: source, fallbackSrc };
  }

  if (isUsableImageUrl(source?.src)) {
    return {
      alt: source.alt ?? alt,
      src: source.src,
      fallbackSrc: source.fallbackSrc ?? fallbackSrc,
    };
  }

  return { alt, src: fallbackSrc, fallbackSrc };
}

export function applyImageFallback(event, fallbackSrc) {
  if (!fallbackSrc || event.currentTarget.src === fallbackSrc) {
    return;
  }

  event.currentTarget.src = fallbackSrc;
}

export function normalizeMenuItemName(name) {
  const normalized = String(name ?? "")
    .trim()
    .toLowerCase();

  return LEGACY_MENU_ITEM_NAMES.get(normalized) ?? name;
}

function inferCuisine(raw, menuItems) {
  if (raw?.cuisine || raw?.category) {
    return raw.cuisine ?? raw.category;
  }

  const restaurantText = textBlob(raw, []);
  const directRule = CUISINE_RULES.find(({ match }) =>
    match.some((term) => restaurantText.includes(term)),
  );
  if (directRule) {
    return directRule.label;
  }

  const menuSupportedRule = CUISINE_RULES.find(({ label, match }) => {
    const supportCount = countMatchingMenuItems(menuItems, match);
    const needsMultipleItems = label.startsWith("Mediterranean") || label.startsWith("Italian");
    return supportCount >= (needsMultipleItems ? 2 : 1);
  });

  return menuSupportedRule?.label ?? "Local • Fresh • Favorites";
}

function inferTags(raw, menuItems) {
  const restaurantText = textBlob(raw, []);
  const text = textBlob(raw, menuItems);
  const veganItems = countMatchingMenuItems(menuItems, ["vegan"]);
  const vegetarianItems = countMatchingMenuItems(menuItems, ["vegetarian", "falafel", "paneer"]);
  const spicyItems = countMatchingMenuItems(menuItems, ["spicy", "chili", "harissa", "gochujang"]);
  const freshItems = countMatchingMenuItems(menuItems, ["salad", "bowl", "quinoa", "healthy"]);
  const tags = [];

  if (raw?.open !== false) tags.push("Open now");
  if (restaurantText.includes("vegan") || veganItems >= 2) tags.push("Vegan");
  if (restaurantText.includes("vegetarian") || vegetarianItems >= 2) tags.push("Vegetarian");
  if (restaurantText.includes("spicy") || spicyItems >= 2) tags.push("Spicy");
  if (text.includes("pizza") || text.includes("burger")) tags.push("Crowd pleaser");
  if (restaurantText.includes("healthy") || freshItems >= 2) tags.push("Fresh picks");
  if (tags.length === 0) tags.push("Local favorite");

  return [...new Set(tags)].slice(0, 3);
}

function countMatchingMenuItems(menuItems, terms) {
  return menuItems.filter((item) => {
    const itemText = [item?.name, item?.description, item?.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return terms.some((term) => itemText.includes(term));
  }).length;
}

function fallbackRating(raw) {
  return (4.5 + (hashString(raw?.name ?? raw?.id) % 5) / 10).toFixed(1);
}

function fallbackEta(raw) {
  const options = ["30-40 min", "35-45 min", "40 min", "40-50 min"];
  return pickByHash(options, raw?.name ?? raw?.id);
}

function numericPrice(value) {
  if (typeof value === "number") return value;

  const parsed = Number.parseFloat(
    String(value ?? "").replace(/[^\d.,-]/g, "").replace(",", "."),
  );

  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value) {
  const amount = numericPrice(value);
  return amount === null ? "€12.00" : `€${amount.toFixed(2)}`;
}

function priceToCents(value) {
  const amount = numericPrice(value);
  return amount === null ? 1200 : Math.round(amount * 100);
}

function estimatePriceTier(menuItems = []) {
  const prices = menuItems
    .map((item) => numericPrice(item?.price))
    .filter((price) => price !== null);

  if (prices.length === 0) return "€€";

  const average = prices.reduce((total, price) => total + price, 0) / prices.length;

  if (average < 10) return "€";
  if (average > 18) return "€€€";
  return "€€";
}

export function toRestaurantViewModel(rawRestaurant, options = {}) {
  if (!rawRestaurant) return null;

  const menuItems = options.menuItems ?? [];
  const restaurantId = String(
    rawRestaurant.restaurantId ?? rawRestaurant.id ?? hashString(rawRestaurant.name),
  );
  const name = rawRestaurant.name ?? rawRestaurant.restaurantName ?? "Local Restaurant";
  const image = normalizeImage(
    rawRestaurant.image ?? rawRestaurant.imageUrl,
    pickByHash(RESTAURANT_IMAGES, `${restaurantId}:${name}`),
    name,
  );
  const heroImage = normalizeImage(
    rawRestaurant.heroImage ?? rawRestaurant.heroImageUrl ?? rawRestaurant.bannerImageUrl,
    pickByHash(HERO_IMAGES, `hero:${restaurantId}:${name}`),
    `${name} hero`,
  );
  const cuisine = inferCuisine(rawRestaurant, menuItems);

  return {
    ...rawRestaurant,
    id: restaurantId,
    restaurantId,
    name,
    rating: rawRestaurant.rating ? String(rawRestaurant.rating) : fallbackRating(rawRestaurant),
    eta: rawRestaurant.eta ?? rawRestaurant.deliveryTime ?? fallbackEta(rawRestaurant),
    priceTier: rawRestaurant.priceTier ?? estimatePriceTier(menuItems),
    cuisine,
    currency: rawRestaurant.currency ?? CURRENCY,
    description:
      rawRestaurant.description ??
      "Freshly prepared favorites from a local kitchen, available for delivery today.",
    tags:
      Array.isArray(rawRestaurant.tags) && rawRestaurant.tags.length > 0
        ? rawRestaurant.tags
        : inferTags(rawRestaurant, menuItems),
    image,
    open: rawRestaurant.open ?? rawRestaurant.available ?? true,
    featuredAction: rawRestaurant.featuredAction ?? true,
    mutedBody: rawRestaurant.mutedBody ?? hashString(name) % 4 === 0,
    ribbon:
      rawRestaurant.ribbon ??
      (hashString(restaurantId) % 5 === 0
        ? {
            label: "AI Pick",
            icon: "auto_awesome",
            className: "bg-tertiary-fixed text-on-tertiary-fixed",
          }
        : null),
    detail: {
      ...(rawRestaurant.detail ?? {}),
      name: rawRestaurant.detail?.name ?? name,
      ratingCount: rawRestaurant.detail?.ratingCount ?? "200+ ratings",
      categories: rawRestaurant.detail?.categories ?? cuisine.replaceAll(" • ", ", "),
      heroImage: rawRestaurant.detail?.heroImage ?? heroImage,
    },
    raw: rawRestaurant.raw ?? rawRestaurant,
  };
}

export function toMenuItemViewModel(rawMenuItem, restaurant = null) {
  const restaurantId = restaurant?.restaurantId ?? restaurant?.id ?? null;
  const foodItemId = String(
    rawMenuItem.foodItemId ?? rawMenuItem.menuItemId ?? rawMenuItem.id,
  );
  const menuItemId = String(rawMenuItem.menuItemId ?? rawMenuItem.foodItemId ?? rawMenuItem.id);
  const id = String(rawMenuItem.id ?? foodItemId);
  const name = normalizeMenuItemName(rawMenuItem.name ?? rawMenuItem.itemName ?? "Menu item");
  const available = rawMenuItem.available ?? rawMenuItem.open ?? true;
  const price = rawMenuItem.price ?? rawMenuItem.amount ?? rawMenuItem.unitPrice;
  const image = normalizeImage(
    rawMenuItem.image ?? rawMenuItem.imageUrl,
    pickByHash(MENU_IMAGES, `${restaurantId}:${id}:${name}`),
    name,
  );

  return {
    ...rawMenuItem,
    id,
    foodItemId,
    menuItemId,
    restaurantId,
    name,
    description:
      rawMenuItem.description ??
      (available
        ? "Prepared fresh by the restaurant kitchen."
        : "This item is currently unavailable."),
    price: formatPrice(price),
    priceCents: rawMenuItem.priceCents ?? priceToCents(price),
    currency: rawMenuItem.currency ?? CURRENCY,
    image,
    available,
    aiRecommended: rawMenuItem.aiRecommended ?? false,
    raw: rawMenuItem.raw ?? rawMenuItem,
  };
}

export function toCartItemViewModel(menuItem) {
  const priceCents = menuItem.priceCents ?? priceToCents(menuItem.price);

  return {
    id: String(menuItem.id ?? menuItem.menuItemId ?? menuItem.foodItemId),
    foodItemId: menuItem.foodItemId ? String(menuItem.foodItemId) : undefined,
    menuItemId: menuItem.menuItemId ? String(menuItem.menuItemId) : undefined,
    restaurantId: menuItem.restaurantId ? String(menuItem.restaurantId) : undefined,
    name: normalizeMenuItemName(menuItem.name),
    description: menuItem.description,
    image: menuItem.image,
    price: menuItem.price,
    priceCents,
    unitPriceCents: priceCents,
    currency: menuItem.currency ?? CURRENCY,
  };
}

export function toRestaurantCartMeta(restaurant) {
  if (!restaurant) return null;

  return {
    id: restaurant.id,
    restaurantId: restaurant.restaurantId ?? restaurant.id,
    name: restaurant.name,
    rating: restaurant.rating,
    eta: restaurant.eta,
    priceTier: restaurant.priceTier,
    cuisine: restaurant.cuisine,
    image: restaurant.image,
    address: restaurant.address ?? restaurant.raw?.address ?? null,
    currency: restaurant.currency ?? CURRENCY,
  };
}

export function adaptRestaurant(rawRestaurant, options = {}) {
  return toRestaurantViewModel(rawRestaurant, options);
}

export function adaptRestaurants(rawRestaurants = []) {
  return rawRestaurants.map((restaurant) => toRestaurantViewModel(restaurant));
}

export function adaptMenuItems(rawItems = [], restaurant = null) {
  return rawItems
    .filter((item) => item.available ?? item.open ?? true)
    .map((item, index) => ({
      ...toMenuItemViewModel(item, restaurant),
      aiRecommended: item.aiRecommended ?? index === 0,
    }));
}

export function getFallbackRestaurantViewModel() {
  return toRestaurantViewModel({
    id: "green-bowl-house",
    name: "Green Bowl House",
    description:
      "Fresh, locally sourced ingredients crafted into nourishing bowls designed to fuel your day with vibrant energy.",
  });
}
