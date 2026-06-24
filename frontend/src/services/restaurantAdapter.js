const CURRENCY = "EUR";

const RESTAURANT_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQFpQrYG4LpNRtVlfivKSl3ZheRPZ5TMzRJT2gGA-UHouXoQmZcStRnSpOVQszDPkN8009jor73icejL1cZ845YVJf8P-ZoJAuJ3T5tWezYTKuk-VktHr3e6ywT3zcwlEehA-dkaS7v00AIqTB8RJWtEbYjX6qttBqbL8ZZlGMr7e0f88hmQC2n4LVTOJ6wEEHXftC3-ACMXpj1y19K5tCY6OIKz1qb61vDasgGvJhhbAeEJRTRbaAw4fwDZf1k5iTgq0lzdlzYB8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-lQs5K7n7zJdbm6-MaZ2qTx2e9H5HcTDpLbIabdp2Zick0JaCUH2ogRqK8NwT6mr10dydrKxTTHJsQFUpEjzVBnltTmYifLDYsb1KewsmEDp6s2xfRpZwDQb9v2rt4p-i97qDeDEzMpDWfdGGijyS6SIetuU5Gs_S-yQcZ0mc1Cby5GXUPKgEPMAujj9Ja7qkzGCuhU7Vnnk2MCp7ngLMxynpsOafPpV8_jmuOyLa8ToPEWtezpCmZtTPZYR9svmoIdZ9sESkWDA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4tDnZ1-P6jHiJUhgAneI7osHNdC2c2IZ9_LhmRhOlQwahinAG5L3dpejECEFmiRYpDJIZLnYRDUH7cgjPKXaaz_7qO1WwpmDywFxoAJI59aZCvYn99jcdcWvvUr2M7JnvcU1JHgXc9nNgZ4n31fRHmpHW1NcY2j2zfrbW8s6QxPW-t9yNRaSynF_WGBNsmVaU6d7Mal5T8FRHnL2MQN9uCzXAW1l340UjDY_n4dkfM2Vq9GYNp3imoIqLQLTSm9rY3rXWwtBKwzs",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB7kftjOB4DNU2AqzOvfQLUk8dnWple-b9SWyfJT2_mSGDBoinOnmrT0Z3MbBixnjYwP703r8ijxetBLdsTmSlNCruiv-FWY4evwZAYmap7EtG-F4lTw191PDDXKgvW2F22Goq44zL4FzQDYq_dteNeUoCQPVqTAciRXoADS_cQEApBnMIuMw8RQNMOrOUg7fIqSW4DiBxc8qoUDID7NKM6tefW89eIGPjiZ8c6bTP53dIPHkLmL7O0VsoqgB_pAiwae1M1NBXPfiU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDIWhsPb7K0oWYUduk76iBbf-AdcjJjzzp1kABPhxBnb2Uk0DM13OcKszhC10G0HZ5krL7hGrp0srA_sCkJhZUxnKgbMVLLFyQ-0DoYBpjINiFpN5UnKq9yz0VcU-W3rD946CNTFBP-mvwq4Z96ZW5reS_kTas1cj-_8ladi4iaLYJx_yghxCrte-omzI3qWE13wRlI41f2irkkKO-3trOFqRZr6qTYj9KmeFBAUW88Rx8qxO8RUWkRgNUn-XBFMgPhtuCstsVeFR0",
];

const HERO_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDXMvw3jTewUzXTIrEt_gz8nDdBZMxyV6wK2RIwjW5p00_IrLmoqVEOOM5BLrNqGc5a2Rb6DirMIN3QOlhW3zR_F7Dh-2Bg5WF6WFb-Ym-Nq5GCw8eHw7LlwS2zwl1pwEwQ-L8rOsORZDW2b2KN8fv8gPpfP21m1wfV6ROHMiTKeTyrSjWirLGXzl4HCxLYvKXEoZlCIoA77pbpLpULvHpSDHLU4D7XazCEitmOHDRQa2SGeRtxO8fnRhFOeyYcypuenah5vU68BBs",
  ...RESTAURANT_IMAGES,
];

const MENU_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCpxAakvMhynGTCftLJngM7xHbrkbL_qcRRpM98mxGqfZtl9CsHjkDK2i9ySjQrF1Ba37uEzIIOB1JrrXCxeNN9RpvFMt8G3GtXnwS3p1YnOk4tAPcLgcyZrWIk_pH180vR6ituD0Lyw5a9okVD8JhQfi6i-oN9CS48M8NnrhPjmjvE5yJ6xRH7sEHn5jpLNI_FRFxmkD_PJus_n-x_knMsxngDTHF9Uq4sjXjrExtmLtPfsVej0oKAvEhDgTQaBnAsDgLECkNhGCQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAVawCn0N0DmdgIYobUY8rbTz6fPu7o-d85E3pFocqJI9jvg02h3wOhkaIzCQ9Dg_s3ep3aLVlTrShNLfnvJ1N0YTOo9o7nuJYn0O2JE4OpbN6Xsbj6V-IriOItJZE-peNouml7QxDedFRb9SIDT2_x8hMS8XappTeZS5to2jJPeBRFjgjt-ehEW8rZ9GLYmo6hx3ZanNXDPC9VIjsMgyRrEhe8-zMnSuxsyr7vwuhtGtweo5CkBV9kQaxRHn5WdleX7Kc-ETtQWts",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAy_4z88Coqr90sFaDUsS2OTJzv8864zORyS8Mtq8hPdaZyCHBgzIuv7lPb1BacU92HggQf8Nh6_4_mPMj4Af3RCslwuyWBYWpuHWAP1a4wUHfAkiZSVUYEytqpKH_ItSBefrbC5kmMsgGq4DOYG2aIglAjlo37ZYB2awzTLyXJBhpvZopJlV_g1EgbR5l_2fJjmARcKMuCO1VbHYxsNN6vN830dzOQBlj7GtL_ESs8HIawo4VqvWKyJF8ZVFXHoOblqJGG1QIYAgY",
];

const CUISINE_RULES = [
  {
    label: "Italian • Pizza • Authentic",
    match: ["pizza", "pasta", "napoli", "italian"],
  },
  {
    label: "American • Burgers • Comfort Food",
    match: ["burger", "fries", "shake"],
  },
  {
    label: "Japanese • Sushi • Premium",
    match: ["sushi", "ramen", "japanese"],
  },
  {
    label: "Thai • Curry • Spicy",
    match: ["thai", "curry", "spicy"],
  },
  {
    label: "Healthy • Salad • Vegan Options",
    match: ["salad", "bowl", "vegan", "vegetarian"],
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
    return { alt, src: source };
  }

  if (isUsableImageUrl(source?.src)) {
    return {
      alt: source.alt ?? alt,
      src: source.src,
    };
  }

  return { alt, src: fallbackSrc };
}

function inferCuisine(raw, menuItems) {
  const text = textBlob(raw, menuItems);
  const rule = CUISINE_RULES.find(({ match }) =>
    match.some((term) => text.includes(term)),
  );

  return raw?.cuisine ?? raw?.category ?? rule?.label ?? "Local • Fresh • Favorites";
}

function inferTags(raw, menuItems) {
  const text = textBlob(raw, menuItems);
  const tags = [];

  if (raw?.open !== false) tags.push("Open now");
  if (text.includes("vegan")) tags.push("Vegan");
  if (text.includes("vegetarian")) tags.push("Vegetarian");
  if (text.includes("spicy")) tags.push("Spicy");
  if (text.includes("pizza") || text.includes("burger")) tags.push("Crowd pleaser");
  if (text.includes("salad") || text.includes("bowl")) tags.push("Fresh picks");
  if (tags.length === 0) tags.push("Local favorite");

  return [...new Set(tags)].slice(0, 3);
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
  const name = rawMenuItem.name ?? rawMenuItem.itemName ?? "Menu item";
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
    name: menuItem.name,
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
  return rawItems.map((item, index) => ({
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
