export const currentUserProfile = {
  user: {
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    language: "English (US)",
    avatar: {
      alt: "User Avatar",
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP9X-25NHA31n2YY_PoYcoiAUDLFooA0q0-h-dqwFmP8d4h5nYtmMhCgK9dp4gB293MR0pQLcpIrHe_lnJ7kW636Hotf_TIlUXKfES657-3sWv8DxxTbAiOZH9cvghfoTJeBgIyGay-H-_z9g2OlGz8FM6QhDNYZA9f1l6M9Iet65-FU0HlhKJR_ef0erubeeoCYa_X19uXEGwBVPMJpuRFZAFneVJTM-iWBxBf8JMkYhyNW6yafEaLO1b5dEWbIjj4U87kUuX3mk",
    },
  },
  discoveryInsight: {
    title: "Smarter Discovery",
    body: "Otter uses your preferences to recommend better dishes tailored just for you.",
  },
  preferences: {
    cuisines: ["Japanese", "Mexican", "Italian"],
    dietaryNeeds: ["Vegetarian", "Dairy-Free"],
    spiceLevel: {
      label: "Medium",
      value: 2,
      max: 3,
    },
    priceRange: {
      label: "Moderate",
      display: "€€",
    },
  },
  settings: {
    language: {
      selected: "en",
      options: [
        { value: "en", label: "English (US)" },
        { value: "es", label: "Español" },
        { value: "fr", label: "Français" },
        { value: "zh", label: "中文" },
        { value: "ja", label: "日本語" },
      ],
    },
    translation: {
      autoTranslateMenus: true,
      showOriginalNames: true,
    },
    dietary: [
      { id: "vegetarian", label: "Vegetarian", selected: false },
      { id: "vegan", label: "Vegan", selected: true },
      { id: "halal", label: "Halal", selected: false },
      { id: "gluten-free", label: "Gluten-free", selected: true },
    ],
    notifications: {
      orderUpdates: true,
      aiRecommendations: true,
      promotionalOffers: false,
    },
  },
  savedRestaurants: [
    {
      id: "oceanside-sushi",
      name: "Oceanside Sushi",
      cuisine: "Japanese",
      rating: "4.8",
      description:
        "Fresh sushi and sashimi with bright, precise flavors for quiet weeknight dinners.",
      savedAt: "Saved for sushi nights",
      tags: ["Japanese", "Premium cuts"],
      restaurantPath: "/restaurants/tokyo-sushi-bar",
      image: {
        alt: "Sushi Restaurant",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVj5gx-VoPYsw-dTy-GPTLur-caBIDJRIgW3A5uzG5l3ilUG1gkfX5YJ6SossMm8ZgP0Y_nopZuVtiEtsrLN6wX3wrnPix85SEKX2zqNAJ_sj1LP8YCCkxSl28YGX5gehL4fet_NUBVWd7kXVYnyg3Q6kel57RTzi8ZPxvwmO1aTJ2_4MPmyI6Nfk0etcGNe9eav1o-ul3xMTiW1ADHKA4OZmWefi5No-YAxuH4pJs-jpnxdKW5ewYBpvdUNUo1Zghl_7WQBt4WW8",
      },
    },
    {
      id: "luigis-oven",
      name: "Luigi's Oven",
      cuisine: "Italian",
      rating: "4.6",
      description:
        "A warm Italian option for pasta, pizza, and simple comfort-food cravings.",
      savedAt: "Saved after a reorder",
      tags: ["Italian", "Comfort"],
      restaurantPath: "/restaurants/rustic-italian-kitchen",
      image: {
        alt: "Pizza",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFINHidthWfu9hqlurOJ1KOzCRmwDu4ecliCxiGyAjnd1cp3pbYGeDNljVyv9hM6a3auHXfSEdEr6FWdkXSmv25Y4NGKaEb5CPikhYmGujeX7WgQvbfcAROIA-BEOGtjkNMs6wsVC9RofE6K5AqLBTx75xmjXGm8birdvMnuP3GQgYMW5_xy7uj5yNBrF-2HgbSb6t9N0A8nvoP_e-h3ylEIllb1G-1eo6PiL3bFomi3AJPTwLtlkbuAK-YcP_AV2cQqg6gP5BeJI",
      },
    },
    {
      id: "green-bowl-house",
      name: "Green Bowl House",
      cuisine: "Healthy",
      rating: "4.8",
      description:
        "Fresh bowls and salads for lighter meals that still feel complete.",
      savedAt: "Saved by AI preference match",
      tags: ["Vegetarian", "Healthy"],
      restaurantPath: "/restaurants/green-bowl-house",
      image: {
        alt: "Green Bowl House",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQFpQrYG4LpNRtVlfivKSl3ZheRPZ5TMzRJT2gGA-UHouXoQmZcStRnSpOVQszDPkN8009jor73icejL1cZ845YVJf8P-ZoJAuJ3T5tWezYTKuk-VktHr3e6ywT3zcwlEehA-dkaS7v00AIqTB8RJWtEbYjX6qttBqbL8ZZlGMr7e0f88hmQC2n4LVTOJ6wEEHXftC3-ACMXpj1y19K5tCY6OIKz1qb61vDasgGvJhhbAeEJRTRbaAw4fwDZf1k5iTgq0lzdlzYB8",
      },
    },
    {
      id: "spicy-thai-express",
      name: "Spicy Thai Express",
      cuisine: "Thai",
      rating: "4.7",
      description:
        "Bold curries and street-style dishes when you want something spicy.",
      savedAt: "Saved from rankings",
      tags: ["Spicy", "Fast favorite"],
      restaurantPath: "/restaurants/spicy-thai-express",
      image: {
        alt: "Spicy Thai Express",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDIWhsPb7K0oWYUduk76iBbf-AdcjJjzzp1kABPhxBnb2Uk0DM13OcKszhC10G0HZ5krL7hGrp0srA_sCkJhZUxnKgbMVLLFyQ-0DoYBpjINiFpN5UnKq9yz0VcU-W3rD946CNTFBP-mvwq4Z96ZW5reS_kTas1cj-_8ladi4iaLYJx_yghxCrte-omzI3qWE13wRlI41f2irkkKO-3trOFqRZr6qTYj9KmeFBAUW88Rx8qxO8RUWkRgNUn-XBFMgPhtuCstsVeFR0",
      },
    },
  ],
  recentOrders: [
    {
      id: "green-bowl-co",
      restaurantName: "Green Bowl Co.",
      status: "Delivered",
      summary: "Spicy Tofu Bowl",
      totalCents: 1850,
    },
    {
      id: "taco-stand",
      restaurantName: "Taco Stand",
      status: "Delivered",
      summary: "3x Al Pastor Tacos",
      totalCents: 1200,
    },
  ],
};
