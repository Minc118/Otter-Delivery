export const checkoutDeliveryAddress = {
  label: "TU Berlin",
  line1: "Marchstraße 23",
  city: "Berlin",
  postalCode: "10587",
  region: "Berlin",
  country: "Germany",
  note: "Meet at the main entrance",
  latitude: 52.5164,
  longitude: 13.3235,
  coordinateSource: "demo_tu_berlin",
};

export const demoDeliveryLocations = [
  {
    match: ["tu berlin"],
    latitude: 52.5164,
    longitude: 13.3235,
    coordinateSource: "demo_tu_berlin",
  },
  {
    match: ["marchstrasse", "berlin"],
    latitude: 52.5164,
    longitude: 13.3235,
    coordinateSource: "demo_tu_berlin",
  },
  {
    match: ["strasse des 17 juni", "berlin"],
    latitude: 52.5096,
    longitude: 13.326,
    coordinateSource: "demo_ernst_reuter_platz",
  },
];

export const defaultRestaurantPickupLocation = {
  lat: 52.52,
  lng: 13.405,
};

export const paymentMethods = [
  {
    id: "credit-card",
    label: "Credit card",
    icon: "credit_card",
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: "account_balance_wallet",
  },
  {
    id: "apple-pay",
    label: "Apple Pay",
    icon: "phone_iphone",
  },
  {
    id: "cash-on-delivery",
    label: "Cash on delivery",
    icon: "payments",
  },
];

export const checkoutRestaurantMeta = {
  "pizza-otter": {
    rating: "4.8 Excellent",
    image: {
      alt: "Pizza Restaurant",
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSUUeBMXx_HWxOJT_MnmXfnjZQxYbjXj5M4KwbuTDzvElPYKUKyCiPTP8yEci_ygW4itmXgMD4hPMBFfPkUhwgEz1dwF2eGqehWXHl8RdOR_V2GfPBuE_W756Mx7hUEOlbGjpkofm7fk2-KvpMl2IlQehZKHr11ulmJjRDVQUmlNPIUbr_AMW7nFgDx3oOH3XDm1oXd4AtM5jLbvSY-mxyIcsuyCxC5X8BmuxNDUFe5mipgMr7UNexbzvq1TgcR18Goe2eLKpVF1A",
    },
  },
  "green-bowl-house": {
    rating: "4.8 Excellent",
    image: {
      alt: "Green Bowl House",
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQFpQrYG4LpNRtVlfivKSl3ZheRPZ5TMzRJT2gGA-UHouXoQmZcStRnSpOVQszDPkN8009jor73icejL1cZ845YVJf8P-ZoJAuJ3T5tWezYTKuk-VktHr3e6ywT3zcwlEehA-dkaS7v00AIqTB8RJWtEbYjX6qttBqbL8ZZlGMr7e0f88hmQC2n4LVTOJ6wEEHXftC3-ACMXpj1y19K5tCY6OIKz1qb61vDasgGvJhhbAeEJRTRbaAw4fwDZf1k5iTgq0lzdlzYB8",
    },
  },
};
