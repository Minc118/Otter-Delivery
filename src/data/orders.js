export const orders = [
  {
    id: "ot-9824",
    isActive: true,
    displayId: "OT-9824",
    statusTitle: "Arriving in 40 min",
    statusText: "Rider is on the way",
    estimatedArrival: "7:45 PM",
    rider: {
      name: "Alex M.",
    },
    mapImage: {
      alt: "Delivery Map",
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDsQ2GCuHxjwERrJ-qrFDG4RbfBaLx1SDfxWdgIvdtlzWoaF5CBO9BcZBFzOE2BQgvuK0uDxUO6cMWfbCsJzTVv8O39DZ7Frqz_TNkNN7-EOs9e6mSdaPWj0XhUPWsZU66j6ebvw_WDzCFHtw44Q77ATBW5KxZrRfAJgJbefUF207SGkUS2vKhZuP01g8I1nAcY87oJnGIujjUI5Uze9U9NmE65efz1Mbmh7VMDR8DMyR5tycklpv8fLYoYq1jWBDeDWxbp6jg7vP4",
    },
    restaurant: {
      name: "Pizza Otter",
      image: {
        alt: "Pizza Otter",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD60GkDh96FYf6UhGCoSdoVpVM1IjLqBOUMsB9J7t91w1mUrgwjuqmxQBbJTHREZ4Fdm5dXe0wbXFIK2ZbGlLFxQaEawsyVltZ8Tf-JbTchu98ENfRYek40j9vw8kA2T4gl1oJncUu4TpybaNbeh80xKEftkHT1t4ipc-9UrCdgx1mjh0K94pTCFkUcUXbcg4957Z4RL_Y2cNPV0i1PFEw9HitRXDJR8PsdU1zI47eBU06poMZMrvjntOaC8Sg8gGmhq22clDaD1vI",
      },
    },
    items: [
      {
        id: "margherita-pizza-large",
        name: "Margherita Pizza (Large)",
        quantity: 1,
        unitPriceCents: 2400,
      },
      {
        id: "garlic-knots",
        name: "Garlic Knots",
        quantity: 2,
        unitPriceCents: 425,
      },
    ],
    deliveryFeeCents: 399,
    serviceFeeCents: 250,
  },
];

export const activeOrder = orders.find((order) => order.isActive) ?? null;
