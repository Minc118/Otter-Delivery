package com.otterdelivery.restaurantservice.config;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoDataSeederValidationTest {

    private static final Map<String, Bounds> POSTAL_CODE_BOUNDS = Map.ofEntries(
            Map.entry("10117", new Bounds(52.50, 52.54, 13.36, 13.41)),
            Map.entry("10119", new Bounds(52.51, 52.54, 13.39, 13.43)),
            Map.entry("10178", new Bounds(52.51, 52.54, 13.39, 13.43)),
            Map.entry("10243", new Bounds(52.49, 52.53, 13.42, 13.47)),
            Map.entry("10245", new Bounds(52.49, 52.53, 13.43, 13.48)),
            Map.entry("10435", new Bounds(52.52, 52.56, 13.39, 13.43)),
            Map.entry("10551", new Bounds(52.51, 52.54, 13.32, 13.37)),
            Map.entry("10623", new Bounds(52.49, 52.52, 13.29, 13.34)),
            Map.entry("10627", new Bounds(52.49, 52.52, 13.28, 13.33)),
            Map.entry("10629", new Bounds(52.49, 52.52, 13.28, 13.33)),
            Map.entry("10785", new Bounds(52.49, 52.52, 13.35, 13.39)),
            Map.entry("10823", new Bounds(52.47, 52.50, 13.33, 13.38)),
            Map.entry("10967", new Bounds(52.48, 52.51, 13.39, 13.44)),
            Map.entry("10999", new Bounds(52.48, 52.51, 13.39, 13.44)),
            Map.entry("12045", new Bounds(52.47, 52.50, 13.41, 13.45)),
            Map.entry("13353", new Bounds(52.53, 52.56, 13.33, 13.38))
    );

    @Test
    void demoRestaurantsAreCompleteAndIdempotentByName() throws Exception {
        List<RestaurantSeed> restaurants = demoRestaurants();
        Set<String> restaurantNames = new HashSet<>();

        for (RestaurantSeed restaurant : restaurants) {
            assertTrue(restaurantNames.add(normalize(restaurant.name())),
                    "Duplicate restaurant name: " + restaurant.name());
            assertFalse(restaurant.items().isEmpty(), restaurant.name() + " has no menu items");
            assertTrue(restaurant.items().size() >= 4, restaurant.name() + " should have at least 4 items");

            Set<String> itemNames = new HashSet<>();
            for (ItemSeed item : restaurant.items()) {
                assertTrue(itemNames.add(normalize(item.name())),
                        "Duplicate menu item in " + restaurant.name() + ": " + item.name());
                assertFalse(item.name().isBlank(), restaurant.name() + " has blank item name");
                assertFalse(item.description().isBlank(), item.name() + " has blank description");
                assertTrue(item.price().compareTo(new BigDecimal("4.00")) >= 0, item.name() + " is priced too low");
                assertTrue(item.price().compareTo(new BigDecimal("30.00")) <= 0, item.name() + " is priced too high");
                assertTrue(item.preparationTimeMinutes() > 0, item.name() + " has invalid prep time");
                assertTrue(item.imageUrl().startsWith("https://"), item.name() + " needs a stable https image URL");
            }
        }
    }

    @Test
    void cuisineAndRecommendationSignalsStayCoherent() throws Exception {
        for (RestaurantSeed restaurant : demoRestaurants()) {
            String identity = restaurant.identityText();
            String menu = restaurant.menuText();
            BigDecimal averagePrice = restaurant.averagePrice();

            if (containsAny(identity, "turkish", "kebab", "grill", "döner", "doner")) {
                assertFalse(containsAny(identity, "thai"), restaurant.name() + " must not be labeled Thai");
                assertFalse(containsAny(identity, "curry") && !containsAny(menu, "curry"),
                        restaurant.name() + " must not be labeled Curry without curry menu items");
            }

            if (containsAny(identity, "italian", "pizza", "pasta")) {
                assertFalse(containsAny(identity, "asian", "thai", "curry"),
                        restaurant.name() + " has unrelated Asian/Thai/Curry labels");
            }

            if (containsAny(identity, "burger", "american")) {
                assertFalse(containsAny(identity, "thai", "indian", "curry"),
                        restaurant.name() + " has unrelated Thai/Indian/Curry labels");
            }

            if (containsAny(identity, "sushi")) {
                assertTrue(containsAny(identity, "japanese", "sushi"), restaurant.name() + " needs Japanese/Sushi labels");
                assertTrue(containsAny(identity, "premium"), restaurant.name() + " is sushi-premium positioned");
            }

            if (containsAny(identity, "vietnamese")) {
                assertTrue(containsAny(identity, "pho"), restaurant.name() + " needs pho signal");
                assertTrue(containsAny(identity, "noodles", "rice noodles", "bowls"), restaurant.name() + " needs noodle/bowl signal");
            }

            if (containsAny(identity, "vegan") && !containsAny(restaurant.categoryName(), "vegan")) {
                assertTrue(restaurant.itemSupportCount("vegan") >= 2,
                        restaurant.name() + " uses restaurant-level vegan with too little menu support");
            }

            if (containsAny(identity, "gluten-free") && !containsAny(restaurant.categoryName(), "gluten-free")) {
                assertTrue(restaurant.itemSupportCount("gluten-free") >= 2,
                        restaurant.name() + " uses restaurant-level gluten-free with too little menu support");
            }

            if (containsAny(identity, "cheap")) {
                assertTrue(averagePrice.compareTo(new BigDecimal("10.50")) <= 0,
                        restaurant.name() + " uses cheap label but average price is " + averagePrice);
            }

            if (containsAny(identity, "premium")) {
                assertTrue(averagePrice.compareTo(new BigDecimal("18.00")) >= 0,
                        restaurant.name() + " uses premium label but average price is " + averagePrice);
            }

            for (ItemSeed item : restaurant.items()) {
                if (containsAny(item.description(), "premium")) {
                    assertTrue(item.price().compareTo(new BigDecimal("18.00")) >= 0,
                            item.name() + " uses premium label below premium price");
                }
            }
        }
    }

    @Test
    void coordinatesMatchBerlinPostalAreas() throws Exception {
        for (RestaurantSeed restaurant : demoRestaurants()) {
            assertTrue(restaurant.latitude() >= 52.33 && restaurant.latitude() <= 52.68,
                    restaurant.name() + " latitude is outside Berlin");
            assertTrue(restaurant.longitude() >= 13.08 && restaurant.longitude() <= 13.76,
                    restaurant.name() + " longitude is outside Berlin");

            Bounds bounds = POSTAL_CODE_BOUNDS.get(restaurant.postalCode());
            assertTrue(bounds != null, restaurant.name() + " has no postal-code coordinate bounds");
            assertTrue(bounds.contains(restaurant.latitude(), restaurant.longitude()),
                    restaurant.name() + " coordinates do not match postal area " + restaurant.postalCode());
        }
    }

    @Test
    void imageUrlsAreStableAndCuisineAppropriate() throws Exception {
        List<RestaurantSeed> restaurants = demoRestaurants();
        Map<String, List<String>> imageUsage = new HashMap<>();

        for (RestaurantSeed restaurant : restaurants) {
            for (ItemSeed item : restaurant.items()) {
                URI imageUri = URI.create(item.imageUrl());
                String host = imageUri.getHost();
                assertTrue(host != null, item.name() + " image URL needs a host");
                assertTrue("https".equals(imageUri.getScheme()), item.name() + " image URL must use https");
                assertTrue(host.equals("images.unsplash.com") || host.equals("images.pexels.com"),
                        item.name() + " should use the approved generic image hosts");
                assertFalse(item.imageUrl().contains("lh3.googleusercontent.com"),
                        item.name() + " should not use old Google-hosted generated image URLs");

                imageUsage.computeIfAbsent(item.imageUrl(), ignored -> new ArrayList<>())
                        .add(restaurant.name() + " / " + item.name());
                assertPlausibleImageForDish(item);
            }
        }

        assertTrue(imageUsage.size() >= 10, "Demo data should use a varied image set");
        for (Map.Entry<String, List<String>> usage : imageUsage.entrySet()) {
            assertTrue(usage.getValue().size() <= 18,
                    "Image URL is reused too often: " + usage.getKey() + " -> " + usage.getValue());
        }
    }

    @Test
    void menuItemNamesDoNotExposeRecommendationMetadata() throws Exception {
        Set<String> bannedNameTerms = Set.of(
                "cheap",
                "fast delivery",
                "halal",
                "halal-friendly",
                "premium",
                "healthy",
                "gluten-free",
                "gluten free",
                "budget",
                "budget-friendly"
        );

        for (RestaurantSeed restaurant : demoRestaurants()) {
            for (ItemSeed item : restaurant.items()) {
                String name = normalize(item.name());
                for (String banned : bannedNameTerms) {
                    assertFalse(name.contains(banned), item.name() + " contains metadata label: " + banned);
                }
                assertFalse(item.name().contains(",") || item.name().contains("/"),
                        item.name() + " looks like a keyword list rather than a dish name");
                assertTrue(item.name().split("\\s+").length <= 5,
                        item.name() + " is too long for a realistic menu name");
            }
        }
    }

    @Test
    void demoDataSupportsCoreRecommendationIntentsWithoutFalseLabels() throws Exception {
        List<RestaurantSeed> restaurants = demoRestaurants();

        RestaurantSeed glutenfreiGarden = findRestaurant(restaurants, "Glutenfrei Garden Neukölln");
        assertTrue(containsAny(glutenfreiGarden.identityText(), "healthy", "gluten-free", "bowl", "salad"),
                "Glutenfrei Garden needs healthy/gluten-free/bowl/salad identity");
        assertFalse(containsAny(glutenfreiGarden.identityText(), "falafel"),
                "Glutenfrei Garden must not use restaurant-level falafel labels");
        assertFalse(containsAny(glutenfreiGarden.menuText(), "falafel"),
                "Glutenfrei Garden menu must not imply falafel support");

        assertTrue(hasItemContaining(restaurants, "falafel"),
                "Demo data needs at least one explicit falafel item");
        assertTrue(hasRestaurantWithIdentity(restaurants, "turkish", "halal")
                        && hasItemContaining(findRestaurant(restaurants, "Anatolia Grill Kreuzberg"), "halal", "döner"),
                "Demo data needs a Turkish halal-friendly döner/grill option");
        assertTrue(hasRestaurantWithIdentity(restaurants, "japanese", "sushi", "premium")
                        && hasItemContaining(findRestaurant(restaurants, "Sushi Atelier Charlottenburg"), "sushi"),
                "Demo data needs premium Japanese sushi support");
        assertTrue(hasHealthyGlutenFreeBowl(restaurants),
                "Demo data needs a healthy gluten-free bowl option");

        RestaurantSeed phoLantern = findRestaurant(restaurants, "Pho Lantern Mitte");
        assertTrue(containsAny(phoLantern.identityText(), "vietnamese", "pho", "noodles"),
                "Pho Lantern needs Vietnamese/Pho/Noodles identity");
        assertTrue(hasItemContaining(phoLantern, "beef", "pho"),
                "Pho Lantern needs a clear beef pho item for multilingual beef-pho queries");

        RestaurantSeed falafelSprint = findRestaurant(restaurants, "Falafel Sprint Friedrichshain");
        assertFalse(containsAny(falafelSprint.identityText() + " " + falafelSprint.menuText(), "vietnamese", "pho"),
                "Falafel restaurant must not contain Vietnamese/pho signals");
    }

    @Test
    void legacyMenuItemNamesAreMappedToCorrectedNames() throws Exception {
        assertLegacyMapping("Anatolia Grill Kreuzberg", "Chicken Döner Plate", "Halal Chicken Döner Plate");
        assertLegacyMapping("Falafel Sprint Friedrichshain", "Falafel Wrap", "Cheap Falafel Wrap");
        assertLegacyMapping("Glutenfrei Garden Neukölln", "Chicken Quinoa Bowl", "Gluten-Free Chicken Quinoa Bowl");
        assertLegacyMapping("Glutenfrei Garden Neukölln", "Lentil Lunch Bowl", "Cheap Lentil Lunch Bowl");
        assertLegacyMapping("Taco Verde Schöneberg", "Corn Taco Trio", "Gluten-Free Corn Taco Trio");
        assertLegacyMapping("Quick Burrito Mitte", "Burrito Bowl", "Healthy Burrito Bowl");
        assertLegacyMapping("Levant Kitchen Moabit", "Shawarma Plate", "Halal Shawarma Plate");
        assertLegacyMapping("Levant Kitchen Moabit", "Shawarma Plate", "Chicken Shawarma Bowl");
        assertLegacyMapping("Pho Lantern Mitte", "Beef Pho", "Bun Bo Noodles");
        assertLegacyMapping("Sushi Atelier Charlottenburg", "Sushi Selection", "Premium Sushi Box");
        assertLegacyMapping("Sushi Atelier Charlottenburg", "Sashimi Set", "Premium Sashimi Set");
    }

    private static List<RestaurantSeed> demoRestaurants() throws Exception {
        Method demoRestaurants = DemoDataSeeder.class.getDeclaredMethod("demoRestaurants");
        demoRestaurants.setAccessible(true);
        List<?> records = (List<?>) demoRestaurants.invoke(null);
        List<RestaurantSeed> result = new ArrayList<>();

        for (Object record : records) {
            List<ItemSeed> items = new ArrayList<>();
            for (Object item : (List<?>) invoke(record, "items")) {
                items.add(new ItemSeed(
                        (String) invoke(item, "name"),
                        (String) invoke(item, "description"),
                        new BigDecimal((String) invoke(item, "price")),
                        (Integer) invoke(item, "preparationTimeMinutes"),
                        (String) invoke(item, "imageUrl")
                ));
            }

            result.add(new RestaurantSeed(
                    (String) invoke(record, "name"),
                    (String) invoke(record, "description"),
                    (String) invoke(record, "street"),
                    (String) invoke(record, "postalCode"),
                    (Double) invoke(record, "latitude"),
                    (Double) invoke(record, "longitude"),
                    (String) invoke(record, "categoryName"),
                    (String) invoke(record, "categoryDescription"),
                    items
            ));
        }

        assertEquals(18, result.size(), "Unexpected demo restaurant count");
        return result;
    }

    private static Object invoke(Object target, String methodName) throws Exception {
        Method method = target.getClass().getDeclaredMethod(methodName);
        method.setAccessible(true);
        return method.invoke(target);
    }

    @SuppressWarnings("unchecked")
    private static void assertLegacyMapping(String restaurantName, String correctedName, String legacyName) throws Exception {
        Method legacyItemNames = DemoDataSeeder.class.getDeclaredMethod("legacyItemNames", String.class, String.class);
        legacyItemNames.setAccessible(true);
        List<String> mappings = (List<String>) legacyItemNames.invoke(null, restaurantName, correctedName);
        assertTrue(mappings.contains(legacyName),
                restaurantName + " must map legacy item '" + legacyName + "' to '" + correctedName + "'");
    }

    private static boolean containsAny(String text, String... terms) {
        String normalized = normalize(text);
        for (String term : terms) {
            if (normalized.contains(normalize(term))) {
                return true;
            }
        }
        return false;
    }

    private static RestaurantSeed findRestaurant(List<RestaurantSeed> restaurants, String name) {
        return restaurants.stream()
                .filter(restaurant -> restaurant.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Missing restaurant: " + name));
    }

    private static boolean hasRestaurantWithIdentity(List<RestaurantSeed> restaurants, String... terms) {
        return restaurants.stream()
                .anyMatch(restaurant -> containsAll(restaurant.identityText(), terms));
    }

    private static boolean hasItemContaining(List<RestaurantSeed> restaurants, String... terms) {
        return restaurants.stream().anyMatch(restaurant -> hasItemContaining(restaurant, terms));
    }

    private static boolean hasItemContaining(RestaurantSeed restaurant, String... terms) {
        return restaurant.items().stream()
                .anyMatch(item -> containsAll(item.name() + " " + item.description(), terms));
    }

    private static boolean hasHealthyGlutenFreeBowl(List<RestaurantSeed> restaurants) {
        return restaurants.stream()
                .flatMap(restaurant -> restaurant.items().stream())
                .anyMatch(item -> containsAll(item.name() + " " + item.description(), "gluten-free", "bowl"));
    }

    private static boolean containsAll(String text, String... terms) {
        String normalized = normalize(text);
        for (String term : terms) {
            if (!normalized.contains(normalize(term))) {
                return false;
            }
        }
        return true;
    }

    private static String normalize(String text) {
        return String.valueOf(text).toLowerCase(Locale.ROOT);
    }

    private static void assertPlausibleImageForDish(ItemSeed item) {
        String name = normalize(item.name() + " " + item.description());

        if (containsAny(name, "ramen")) {
            assertTrue(item.imageUrl().contains("photo-1569718212165"), item.name() + " should use the ramen image");
        }
        if (containsAny(name, "burger", "fries")) {
            assertTrue(item.imageUrl().contains("photo-1568901346375"), item.name() + " should use the burger image");
        }
        if (containsAny(name, "pizza")) {
            assertTrue(item.imageUrl().contains("photo-1513104890138"), item.name() + " should use the pizza image");
        }
        if (containsAny(name, "pasta", "gnocchi", "lasagna", "penne")) {
            assertTrue(item.imageUrl().contains("photo-1473093295043"), item.name() + " should use the pasta image");
        }
        if (containsAny(name, "sushi", "sashimi", "maki", "tuna crunch")) {
            assertTrue(item.imageUrl().contains("photo-1579871494447"), item.name() + " should use the sushi image");
        }
        if (containsAny(name, "pho", "noodle soup", "tom yum", "pad thai")) {
            assertTrue(item.imageUrl().contains("photo-1582878826629"), item.name() + " should use the noodle soup image");
        }
        if (containsAny(name, "curry", "masala", "dal", "biryani", "rogan josh")) {
            assertTrue(item.imageUrl().contains("photo-1585937421612"), item.name() + " should use the curry image");
        }
        if (containsAny(name, "taco", "burrito", "quesadilla", "nachos", "wrap", "döner", "doner", "kebab")) {
            assertTrue(item.imageUrl().contains("pexels-photo-461198"), item.name() + " should use the taco/wrap image");
        }
        if (containsAny(name, "salad", "quinoa", "buddha bowl")
                && !containsAny(name, "wrap", "döner", "doner", "kebab", "taco", "burrito", "shawarma", "quesadilla")) {
            assertTrue(item.imageUrl().contains("photo-1512621776951")
                            || item.imageUrl().contains("pexels-photo-1640777")
                            || item.imageUrl().contains("pexels-photo-262959"),
                    item.name() + " should use a salad/bowl image");
        }
    }

    private record RestaurantSeed(
            String name,
            String description,
            String street,
            String postalCode,
            double latitude,
            double longitude,
            String categoryName,
            String categoryDescription,
            List<ItemSeed> items
    ) {
        String identityText() {
            return String.join(" ", name, description, street, postalCode, categoryName, categoryDescription);
        }

        String menuText() {
            List<String> parts = new ArrayList<>();
            for (ItemSeed item : items) {
                parts.add(item.name());
                parts.add(item.description());
            }
            return String.join(" ", parts);
        }

        int itemSupportCount(String term) {
            int count = 0;
            for (ItemSeed item : items) {
                if (containsAny(item.name() + " " + item.description(), term)) {
                    count++;
                }
            }
            return count;
        }

        BigDecimal averagePrice() {
            BigDecimal total = BigDecimal.ZERO;
            for (ItemSeed item : items) {
                total = total.add(item.price());
            }
            return total.divide(BigDecimal.valueOf(items.size()), 2, java.math.RoundingMode.HALF_UP);
        }
    }

    private record ItemSeed(
            String name,
            String description,
            BigDecimal price,
            int preparationTimeMinutes,
            String imageUrl
    ) {
    }

    private record Bounds(double minLat, double maxLat, double minLon, double maxLon) {
        boolean contains(double latitude, double longitude) {
            return latitude >= minLat && latitude <= maxLat && longitude >= minLon && longitude <= maxLon;
        }
    }
}
