package com.otterdelivery.restaurantservice.config;

import com.otterdelivery.restaurantservice.entity.Address;
import com.otterdelivery.restaurantservice.entity.Category;
import com.otterdelivery.restaurantservice.entity.FoodItem;
import com.otterdelivery.restaurantservice.entity.Restaurant;
import com.otterdelivery.restaurantservice.repository.CategoryRepository;
import com.otterdelivery.restaurantservice.repository.FoodItemRepository;
import com.otterdelivery.restaurantservice.repository.RestaurantRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Configuration
@Profile("dev")
@ConditionalOnProperty(name = "seed.demo-data", havingValue = "true")
public class DemoDataSeeder {

    private static final String IMAGE_RAMEN =
            "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_BURGER =
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_PIZZA =
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_PASTA =
            "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_SUSHI =
            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_SALAD_BOWL =
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_CURRY =
            "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_PHO =
            "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_KOREAN_BOWL =
            "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80";
    private static final String IMAGE_TACOS =
            "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=1200";
    private static final String IMAGE_MEDITERRANEAN_BOWL =
            "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200";
    private static final String IMAGE_SEAFOOD_BOWL =
            "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=1200";

    @Bean
    CommandLineRunner seedRestaurantDemoData(
            RestaurantRepository restaurantRepository,
            CategoryRepository categoryRepository,
            FoodItemRepository foodItemRepository
    ) {
        return args -> {
            for (DemoRestaurant demoRestaurant : demoRestaurants()) {
                upsertRestaurant(demoRestaurant, restaurantRepository, categoryRepository, foodItemRepository);
            }
        };
    }

    private static void upsertRestaurant(
            DemoRestaurant demo,
            RestaurantRepository restaurantRepository,
            CategoryRepository categoryRepository,
            FoodItemRepository foodItemRepository
    ) {
        Restaurant existingRestaurant = restaurantRepository.findByNameIgnoreCase(demo.name()).stream()
                .findFirst()
                .orElse(null);

        Restaurant restaurant = existingRestaurant != null ? existingRestaurant : new Restaurant();
        applyRestaurantFields(restaurant, demo);
        Restaurant savedRestaurant = restaurantRepository.save(restaurant);

        Category category = categoryRepository
                .findByRestaurantIdAndNameIgnoreCase(savedRestaurant.getId(), demo.categoryName())
                .stream()
                .findFirst()
                .orElseGet(Category::new);
        category.setName(demo.categoryName());
        category.setDescription(demo.categoryDescription());
        category.setRestaurant(savedRestaurant);
        Category savedCategory = categoryRepository.save(category);

        for (DemoItem demoItem : demo.items()) {
            FoodItem foodItem = findExistingFoodItem(savedRestaurant, demo, demoItem, foodItemRepository)
                    .orElseGet(FoodItem::new);
            foodItem.setName(demoItem.name());
            foodItem.setDescription(demoItem.description());
            foodItem.setPrice(new BigDecimal(demoItem.price()));
            foodItem.setAvailable(true);
            foodItem.setPreparationTimeMinutes(demoItem.preparationTimeMinutes());
            foodItem.setImageUrl(demoItem.imageUrl());
            foodItem.setCategory(savedCategory);
            FoodItem savedFoodItem = foodItemRepository.save(foodItem);
            deactivateLegacyDuplicates(savedRestaurant, demo, demoItem, savedFoodItem, foodItemRepository);
        }
    }

    private static void deactivateLegacyDuplicates(
            Restaurant savedRestaurant,
            DemoRestaurant demo,
            DemoItem demoItem,
            FoodItem savedFoodItem,
            FoodItemRepository foodItemRepository
    ) {
        for (String legacyName : legacyItemNames(demo.name(), demoItem.name())) {
            foodItemRepository
                    .findByRestaurantIdAndNameIgnoreCase(savedRestaurant.getId(), legacyName)
                    .stream()
                    .filter(foodItem -> !foodItem.getId().equals(savedFoodItem.getId()))
                    .forEach(foodItem -> {
                        foodItem.setAvailable(false);
                        foodItemRepository.save(foodItem);
                    });
        }
    }

    private static java.util.Optional<FoodItem> findExistingFoodItem(
            Restaurant savedRestaurant,
            DemoRestaurant demo,
            DemoItem demoItem,
            FoodItemRepository foodItemRepository
    ) {
        java.util.Optional<FoodItem> existing = foodItemRepository
                .findByRestaurantIdAndNameIgnoreCase(savedRestaurant.getId(), demoItem.name())
                .stream()
                .findFirst();
        if (existing.isPresent()) {
            return existing;
        }

        for (String legacyName : legacyItemNames(demo.name(), demoItem.name())) {
            existing = foodItemRepository
                    .findByRestaurantIdAndNameIgnoreCase(savedRestaurant.getId(), legacyName)
                    .stream()
                    .findFirst();
            if (existing.isPresent()) {
                return existing;
            }
        }

        return java.util.Optional.empty();
    }

    private static List<String> legacyItemNames(String restaurantName, String currentItemName) {
        if ("Anatolia Grill Kreuzberg".equals(restaurantName) && "Chicken Döner Plate".equals(currentItemName)) {
            return List.of("Halal Chicken Döner Plate");
        }
        if ("Falafel Sprint Friedrichshain".equals(restaurantName) && "Falafel Wrap".equals(currentItemName)) {
            return List.of("Cheap Falafel Wrap");
        }
        if ("Glutenfrei Garden Neukölln".equals(restaurantName) && "Chicken Quinoa Bowl".equals(currentItemName)) {
            return List.of("Gluten-Free Chicken Quinoa Bowl");
        }
        if ("Glutenfrei Garden Neukölln".equals(restaurantName) && "Lentil Lunch Bowl".equals(currentItemName)) {
            return List.of("Cheap Lentil Lunch Bowl");
        }
        if ("Taco Verde Schöneberg".equals(restaurantName) && "Corn Taco Trio".equals(currentItemName)) {
            return List.of("Gluten-Free Corn Taco Trio");
        }
        if ("Quick Burrito Mitte".equals(restaurantName) && "Corn Taco Trio".equals(currentItemName)) {
            return List.of("Gluten-Free Corn Taco Trio");
        }
        if ("Quick Burrito Mitte".equals(restaurantName) && "Burrito Bowl".equals(currentItemName)) {
            return List.of("Healthy Burrito Bowl");
        }
        if ("Levant Kitchen Moabit".equals(restaurantName) && "Shawarma Plate".equals(currentItemName)) {
            return List.of("Halal Shawarma Plate", "Halal Chicken Shawarma Bowl", "Chicken Shawarma Bowl");
        }
        if ("Sushi Atelier Charlottenburg".equals(restaurantName) && "Sushi Selection".equals(currentItemName)) {
            return List.of("Premium Sushi Box");
        }
        if ("Sushi Atelier Charlottenburg".equals(restaurantName) && "Sashimi Set".equals(currentItemName)) {
            return List.of("Premium Sashimi Set");
        }
        if ("Pho Lantern Mitte".equals(restaurantName) && "Beef Pho".equals(currentItemName)) {
            return List.of("Bun Bo Noodles");
        }

        return List.of();
    }

    private static void applyRestaurantFields(Restaurant restaurant, DemoRestaurant demo) {
        restaurant.setName(demo.name());
        restaurant.setDescription(demo.description());
        restaurant.setPhoneNumber(demo.phoneNumber());
        restaurant.setEmail(demo.email());
        restaurant.setOpen(demo.open());
        restaurant.setDeliveryRadiusKm(demo.deliveryRadiusKm());
        restaurant.setOpeningTime(demo.openingTime());
        restaurant.setClosingTime(demo.closingTime());

        Address address = new Address();
        address.setStreet(demo.street());
        address.setCity("Berlin");
        address.setPostalCode(demo.postalCode());
        address.setCountry("Germany");
        address.setLatitude(demo.latitude());
        address.setLongitude(demo.longitude());
        restaurant.setAddress(address);
    }

    private static List<DemoRestaurant> demoRestaurants() {
        return List.of(
                restaurant(
                        "Sakura Ramen Mitte",
                        "Japanese ramen in Mitte with warm comforting noodle bowls, shoyu and miso broths, tofu options, and a few spicy broths.",
                        "+493012345001",
                        "sakura.ramen.mitte@otter.demo",
                        true,
                        6.0,
                        LocalTime.of(10, 30),
                        LocalTime.of(22, 30),
                        "Rosenthaler Straße 40",
                        "10178",
                        52.5246,
                        13.4026,
                        "Japanese",
                        "Japanese ramen, noodles, warm broths, tofu and vegetarian options, spicy broths.",
                        List.of(
                                item("Vegan Tan Tan Ramen", "Spicy sesame broth with ramen noodles, tofu, bok choy, and chili oil. Vegan and warm.", "13.90", 20, IMAGE_RAMEN),
                                item("Miso Mushroom Ramen", "Mild miso broth with ramen noodles, mushrooms, corn, and spring onion. Vegetarian.", "12.90", 18, IMAGE_RAMEN),
                                item("Chicken Shoyu Ramen", "Clear shoyu broth with chicken, egg, noodles, nori, and spring onion.", "14.90", 22, IMAGE_RAMEN),
                                item("Spicy Tofu Don", "Rice bowl with spicy tofu, edamame, sesame, pickled ginger, and scallions. Vegetarian.", "10.90", 15, IMAGE_KOREAN_BOWL),
                                item("Rice Noodle Tofu Salad", "Chilled rice noodles with tofu, cucumber, sesame, herbs, and mild soy dressing.", "11.90", 14, IMAGE_SALAD_BOWL)
                        )
                ),
                restaurant(
                        "Kreuzberg Burger Lab",
                        "Burger and American comfort food in Kreuzberg with smash burgers, fries, vegetarian burger options, and halal-friendly beef.",
                        "+493012345002",
                        "kreuzberg.burger.lab@otter.demo",
                        true,
                        5.0,
                        LocalTime.of(11, 0),
                        LocalTime.of(23, 30),
                        "Oranienstraße 185",
                        "10999",
                        52.5007,
                        13.4215,
                        "Burger / American",
                        "Burgers, American comfort food, Kreuzberg, halal-friendly beef, vegetarian option.",
                        List.of(
                                item("Classic Smash Burger", "Halal-friendly beef smash burger with cheddar, pickles, and house sauce.", "12.90", 16, IMAGE_BURGER),
                                item("Jalapeno Smash Burger", "Beef burger with jalapenos, pepper jack, chili mayo, and crispy onions.", "14.90", 18, IMAGE_BURGER),
                                item("Portobello Burger", "Grilled mushroom burger with cheese, lettuce, and mild garlic sauce. Vegetarian.", "11.90", 15, IMAGE_BURGER),
                                item("Loaded Chili Fries", "Spicy fries with chili, cheese, spring onion, and sour cream.", "7.90", 10, IMAGE_BURGER),
                                item("Beef Classic Burger", "Classic beef burger with lettuce, tomato, pickles, and house sauce.", "13.90", 18, IMAGE_BURGER)
                        )
                ),
                restaurant(
                        "Napoli Pizza Berlin",
                        "Italian pizza in Prenzlauer Berg with vegetarian classics, warm oven-baked comfort food, and several options under 15 Euro.",
                        "+493012345003",
                        "napoli.pizza.berlin@otter.demo",
                        true,
                        7.0,
                        LocalTime.of(11, 0),
                        LocalTime.of(23, 0),
                        "Kastanienallee 82",
                        "10435",
                        52.5384,
                        13.4096,
                        "Italian",
                        "Italian, pizza, pasta, vegetarian options, warm comfort food, under 15 Euro.",
                        List.of(
                                item("Margherita Pizza", "Tomato, mozzarella, basil, and olive oil on a crisp Italian base. Vegetarian and under 15 Euro.", "10.90", 14, IMAGE_PIZZA),
                                item("Arrabbiata Pasta", "Penne with spicy tomato sauce, chili, garlic, and basil. Vegetarian and under 15 Euro.", "11.90", 16, IMAGE_PASTA),
                                item("Funghi Pizza", "Mushrooms, mozzarella, oregano, and mild tomato sauce on Italian pizza dough. Vegetarian.", "12.90", 15, IMAGE_PIZZA),
                                item("Lasagna al Forno", "Baked beef lasagna with tomato ragu, pasta sheets, and bechamel.", "14.90", 22, IMAGE_PASTA),
                                item("Burrata Pizza", "Pizza with burrata, cherry tomatoes, basil, and olive oil.", "17.90", 18, IMAGE_PIZZA)
                        )
                ),
                restaurant(
                        "Seoul Bowl Neukölln",
                        "Korean bowls in Neukölln with bibimbap, bulgogi rice bowls, spicy kimchi, tofu options, and warming stews.",
                        "+493012345004",
                        "seoul.bowl.neukoelln@otter.demo",
                        true,
                        6.0,
                        LocalTime.of(10, 30),
                        LocalTime.of(22, 30),
                        "Weserstraße 44",
                        "12045",
                        52.4860,
                        13.4302,
                        "Korean",
                        "Korean, Asian bowls, bibimbap, kimchi, spicy, warm and comforting.",
                        List.of(
                                item("Vegetable Bibimbap", "Korean rice bowl with egg, seasonal vegetables, sesame, and gochujang sauce. Vegetarian.", "11.90", 16, IMAGE_KOREAN_BOWL),
                                item("Kimchi Tofu Bowl", "Rice bowl with tofu, kimchi, cucumber, sesame, and chili. Vegan and spicy.", "10.90", 15, IMAGE_KOREAN_BOWL),
                                item("Kimchi Jjigae", "Warm Korean kimchi stew with tofu, vegetables, and a spicy broth.", "12.90", 20, IMAGE_KOREAN_BOWL),
                                item("Bulgogi Beef Bowl", "Soy-marinated beef over rice with sesame, scallions, and mild vegetables.", "14.90", 18, IMAGE_KOREAN_BOWL),
                                item("Tteokbokki Cup", "Chewy Korean rice cakes in spicy gochujang sauce.", "7.90", 12, IMAGE_KOREAN_BOWL)
                        )
                ),
                restaurant(
                        "Anatolia Grill Kreuzberg",
                        "Turkish halal-friendly grill in Kreuzberg with kebab plates, döner wraps, mezze, and warm comforting soups.",
                        "+493012345005",
                        "anatolia.grill.kreuzberg@otter.demo",
                        true,
                        5.0,
                        LocalTime.of(10, 0),
                        LocalTime.of(23, 30),
                        "Kottbusser Damm 95",
                        "10967",
                        52.4949,
                        13.4219,
                        "Turkish / Halal",
                        "Turkish, halal-friendly, grill, kebab, wraps, mezze, warm and comforting.",
                        List.of(
                                item("Chicken Döner Plate", "Halal-friendly chicken döner with rice, salad, garlic sauce, and warm flatbread.", "13.90", 18, IMAGE_TACOS),
                                item("Falafel Wrap", "Falafel wrap with hummus, pickles, herbs, and mild tahini. Vegetarian.", "8.90", 10, IMAGE_TACOS),
                                item("Adana Kebab", "Spicy halal-friendly minced lamb kebab with bulgur, grilled vegetables, and chili sauce.", "16.90", 22, IMAGE_TACOS),
                                item("Red Lentil Soup", "Warm Turkish lentil soup with cumin, lemon, and herbs. Vegan.", "6.90", 8, IMAGE_CURRY),
                                item("Mezze Box", "Hummus, baba ghanoush, olives, salad, and flatbread. Vegetarian.", "12.50", 12, IMAGE_MEDITERRANEAN_BOWL)
                        )
                ),
                restaurant(
                        "Green Garden Vegan",
                        "Vegan Friedrichshain kitchen for healthy lunch bowls, gluten-free salads, spicy wraps, and warm plant-based comfort food.",
                        "+493012345006",
                        "green.garden.vegan@otter.demo",
                        true,
                        6.0,
                        LocalTime.of(9, 30),
                        LocalTime.of(22, 0),
                        "Boxhagener Straße 58",
                        "10245",
                        52.5095,
                        13.4598,
                        "Vegan",
                        "Vegan, healthy bowls, gluten-free salads, spicy wraps, Friedrichshain.",
                        List.of(
                                item("Vegan Buddha Bowl", "Quinoa bowl with chickpeas, avocado, greens, and tahini. Vegan and gluten-free.", "12.90", 12, IMAGE_SALAD_BOWL),
                                item("Seitan Chili Wrap", "Vegan seitan wrap with pickled cabbage, herbs, and spicy chili mayo.", "10.90", 10, IMAGE_TACOS),
                                item("Coconut Lentil Soup", "Warm vegan lentil soup with coconut, ginger, turmeric, and mild spices.", "8.90", 8, IMAGE_CURRY),
                                item("Green Protein Salad", "Tofu salad with pumpkin seeds, cucumber, herbs, and lemon dressing. Vegan and gluten-free.", "11.90", 10, IMAGE_SALAD_BOWL),
                                item("Mushroom Comfort Pie", "Warm vegan mushroom and potato pie with herbs and rich gravy.", "14.90", 18, IMAGE_CURRY)
                        )
                ),
                restaurant(
                        "Curry House Charlottenburg",
                        "Indian curries in Charlottenburg with vegan lentils, vegetarian paneer, spicy masala, and warm comforting biryani.",
                        "+493012345007",
                        "curry.house.charlottenburg@otter.demo",
                        true,
                        7.0,
                        LocalTime.of(11, 0),
                        LocalTime.of(23, 0),
                        "Kantstraße 87",
                        "10627",
                        52.5064,
                        13.3031,
                        "Indian",
                        "Indian, curry, masala, dal, vegetarian and vegan options, spicy, warm.",
                        List.of(
                                item("Chana Masala", "Spicy chickpea curry with basmati rice and fresh coriander. Vegan and warm.", "11.90", 18, IMAGE_CURRY),
                                item("Paneer Tikka Bowl", "Paneer in mild tikka sauce with rice, herbs, and pickled onion. Vegetarian.", "13.90", 20, IMAGE_CURRY),
                                item("Dal Tadka", "Yellow lentils with cumin, garlic, rice, and mild spices. Vegan.", "9.90", 16, IMAGE_CURRY),
                                item("Chicken Biryani", "Fragrant rice with chicken, herbs, warm spices, and yogurt sauce.", "14.90", 22, IMAGE_CURRY),
                                item("Lamb Rogan Josh", "Spicy premium lamb curry with basmati rice and a rich warming sauce.", "18.90", 24, IMAGE_CURRY)
                        )
                ),
                restaurant(
                        "Dragon Noodles Wedding",
                        "Chinese noodle bar in Wedding with Sichuan-style spicy noodles, tofu rice bowls, dumplings, and warm soups.",
                        "+493012345008",
                        "dragon.noodles.wedding@otter.demo",
                        true,
                        6.0,
                        LocalTime.of(10, 30),
                        LocalTime.of(22, 30),
                        "Müllerstraße 156",
                        "13353",
                        52.5421,
                        13.3598,
                        "Chinese",
                        "Chinese, Asian, noodles, Sichuan-style spice, tofu option, warm soups.",
                        List.of(
                                item("Dan Dan Noodles", "Spicy wheat noodles with sesame chili sauce, greens, and Sichuan pepper.", "10.90", 14, IMAGE_PHO),
                                item("Mapo Tofu Rice", "Spicy tofu with Sichuan pepper, steamed rice, and spring onion. Vegetarian.", "11.90", 16, IMAGE_KOREAN_BOWL),
                                item("Vegetable Dumplings", "Pan-steamed vegetable dumplings with soy ginger dip and mild sesame sauce. Vegetarian.", "8.90", 12, IMAGE_TACOS),
                                item("Beef Noodle Soup", "Warm beef broth with wheat noodles, herbs, and vegetables.", "14.90", 22, IMAGE_PHO),
                                item("Rice Noodle Vegetable Bowl", "Gluten-free rice noodle bowl with vegetables, tofu, and mild garlic sauce.", "12.90", 16, IMAGE_SALAD_BOWL)
                        )
                ),
                restaurant(
                        "Taco Verde Schöneberg",
                        "Mexican Schöneberg taqueria with tacos, burritos, bean fillings, spicy salsa, and casual comfort snacks.",
                        "+493012345009",
                        "taco.verde.schoeneberg@otter.demo",
                        true,
                        5.0,
                        LocalTime.of(11, 0),
                        LocalTime.of(23, 0),
                        "Akazienstraße 24",
                        "10823",
                        52.4864,
                        13.3549,
                        "Mexican",
                        "Mexican, tacos, burritos, spicy salsa, bean and vegetarian options.",
                        List.of(
                                item("Bean Burrito", "Burrito with black beans, rice, guacamole, salsa, and mild herbs. Vegan.", "10.90", 12, IMAGE_TACOS),
                                item("Veggie Tacos", "Corn tacos with grilled vegetables, hot salsa, and cabbage. Vegetarian and spicy.", "9.90", 10, IMAGE_TACOS),
                                item("Beef Taco Bowl", "Halal-friendly beef bowl with rice, beans, corn, salsa, and chili.", "13.90", 14, IMAGE_TACOS),
                                item("Corn Taco Trio", "Gluten-free corn tacos with avocado, beans, cabbage, and mild salsa.", "11.90", 12, IMAGE_TACOS),
                                item("Nachos Supreme", "Warm nachos with cheese, jalapenos, beans, and spicy salsa.", "8.90", 10, IMAGE_TACOS)
                        )
                ),
                restaurant(
                        "Levant Kitchen Moabit",
                        "Middle Eastern halal-friendly kitchen in Moabit with shawarma bowls, vegetarian mezze, falafel, and comforting soups.",
                        "+493012345010",
                        "levant.kitchen.moabit@otter.demo",
                        true,
                        6.0,
                        LocalTime.of(10, 30),
                        LocalTime.of(22, 30),
                        "Turmstraße 31",
                        "10551",
                        52.5261,
                        13.3436,
                        "Middle Eastern / Halal",
                        "Middle Eastern, halal-friendly, shawarma, falafel, mezze, warm bowls.",
                        List.of(
                                item("Shawarma Plate", "Halal-friendly chicken shawarma with rice, salad, garlic sauce, and warm spices.", "13.90", 16, IMAGE_MEDITERRANEAN_BOWL),
                                item("Falafel Plate", "Falafel with hummus, tabbouleh, pickles, and warm flatbread. Vegan.", "11.90", 12, IMAGE_MEDITERRANEAN_BOWL),
                                item("Halloumi Couscous Bowl", "Halloumi bowl with couscous, herbs, cucumber, tomato, and mild lemon dressing. Vegetarian.", "12.90", 14, IMAGE_SALAD_BOWL),
                                item("Harissa Lentil Soup", "Warm vegan lentil soup with spicy harissa, cumin, and herbs.", "8.90", 10, IMAGE_CURRY),
                                item("Mezze Salad", "Gluten-free mezze salad with chickpeas, cucumber, tahini, olives, and herbs.", "10.90", 10, IMAGE_SALAD_BOWL)
                        )
                ),
                restaurant(
                        "Spicy Thai Box Friedrichshain",
                        "Thai street food in Friedrichshain with pad thai, green curry, satay bowls, spicy noodles, and warm tom yum soup.",
                        "+493012345011",
                        "spicy.thai.box.friedrichshain@otter.demo",
                        true,
                        6.0,
                        LocalTime.of(10, 30),
                        LocalTime.of(22, 45),
                        "Warschauer Straße 34",
                        "10243",
                        52.5086,
                        13.4522,
                        "Thai",
                        "Thai, Asian, pad thai, green curry, spicy noodles, warm soups.",
                        List.of(
                                item("Pad Thai Tofu", "Rice noodles with tofu, peanuts, tamarind, lime, and chili. Vegetarian and spicy.", "11.90", 14, IMAGE_PHO),
                                item("Green Curry", "Spicy green curry with vegetables, coconut milk, rice, and Thai basil. Vegan.", "12.90", 18, IMAGE_CURRY),
                                item("Chicken Satay Bowl", "Thai chicken bowl with peanut sauce, rice, cucumber, and herbs.", "13.90", 16, IMAGE_KOREAN_BOWL),
                                item("Tom Yum Soup", "Warm Thai soup with mushrooms, lemongrass, chili, and lime.", "9.90", 12, IMAGE_PHO),
                                item("Basil Rice Box", "Thai rice box with basil, vegetables, and spicy garlic sauce.", "8.90", 12, IMAGE_KOREAN_BOWL)
                        )
                ),
                restaurant(
                        "Mediterranean Bowl Potsdamer Platz",
                        "Mediterranean healthy lunch bowls near Potsdamer Platz with grains, vegetarian mezze, salmon, and warm comfort plates.",
                        "+493012345012",
                        "mediterranean.bowl.potsdamer@otter.demo",
                        true,
                        7.0,
                        LocalTime.of(9, 30),
                        LocalTime.of(22, 0),
                        "Potsdamer Straße 85",
                        "10785",
                        52.5034,
                        13.3656,
                        "Mediterranean",
                        "Mediterranean, healthy bowls, salads, vegetarian mezze, warm plates.",
                        List.of(
                                item("Falafel Couscous Bowl", "Falafel bowl with couscous, cucumber, tomato, herbs, and tahini. Vegetarian.", "11.90", 12, IMAGE_MEDITERRANEAN_BOWL),
                                item("Chicken Quinoa Bowl", "Gluten-free warm quinoa bowl with chicken, herbs, lemon, and vegetables.", "13.90", 16, IMAGE_SALAD_BOWL),
                                item("Roasted Eggplant Plate", "Roasted eggplant with hummus, herbs, warm pita, and olive oil. Vegan.", "12.90", 14, IMAGE_MEDITERRANEAN_BOWL),
                                item("Salmon Quinoa Bowl", "Premium Mediterranean bowl with salmon, greens, olives, quinoa, and mild dressing.", "18.90", 18, IMAGE_SEAFOOD_BOWL),
                                item("Harissa Veggie Wrap", "Vegetarian wrap with grilled vegetables, spicy harissa, and yogurt sauce.", "10.90", 12, IMAGE_TACOS)
                        )
                ),
                restaurant(
                        "Pho Lantern Mitte",
                        "Vietnamese Asian kitchen near Mitte with warm comforting pho, rice noodle bowls, tofu options, spicy bun bo, and fast delivery.",
                        "+493012345013",
                        "pho.lantern.mitte@otter.demo",
                        true,
                        5.5,
                        LocalTime.of(10, 30),
                        LocalTime.of(22, 30),
                        "Alte Schönhauser Straße 12",
                        "10119",
                        52.5262,
                        13.4084,
                        "Vietnamese",
                        "Vietnamese, Asian, pho, rice noodles, bowls, tofu option, fast delivery, Mitte.",
                        List.of(
                                item("Tofu Pho", "Vietnamese pho with rice noodles, tofu, herbs, lime, and warm broth. Vegan.", "11.90", 16, IMAGE_PHO),
                                item("Chicken Pho", "Warm Vietnamese noodle soup with chicken, rice noodles, ginger broth, and herbs.", "12.90", 18, IMAGE_PHO),
                                item("Beef Pho", "Vietnamese pho with sliced beef, rice noodles, herbs, lime, and warm comforting broth.", "13.90", 18, IMAGE_PHO),
                                item("Summer Roll Bowl", "Gluten-free rice noodle bowl with tofu, salad, peanuts, mint, and mild sauce.", "10.90", 12, IMAGE_SALAD_BOWL),
                                item("Lemongrass Rice Box", "Lunch rice box with vegetables, lemongrass tofu, chili, and Vietnamese herbs.", "8.90", 12, IMAGE_KOREAN_BOWL)
                        )
                ),
                restaurant(
                        "Glutenfrei Garden Neukölln",
                        "Healthy gluten-free bowl place near Neukölln for vegan lunch, vegetarian salads, spicy tofu, and fast delivery.",
                        "+493012345014",
                        "glutenfrei.garden.neukoelln@otter.demo",
                        true,
                        5.0,
                        LocalTime.of(9, 0),
                        LocalTime.of(21, 30),
                        "Sonnenallee 67",
                        "12045",
                        52.4865,
                        13.4331,
                        "Healthy / Gluten-Free",
                        "Healthy, gluten-free, vegan, vegetarian, salad, bowl, lunch, fast delivery, Neukölln.",
                        List.of(
                                item("Chicken Quinoa Bowl", "Gluten-free lunch bowl with chicken, quinoa, cucumber, herbs, and lemon dressing.", "12.90", 14, IMAGE_SALAD_BOWL),
                                item("Sweet Potato Bowl", "Roasted sweet potato, lentils, avocado, greens, and tahini. Vegan and gluten-free.", "11.90", 12, IMAGE_SALAD_BOWL),
                                item("Tofu Peanut Bowl", "Spicy tofu bowl with rice, cabbage, chili peanut sauce, and fresh herbs. Vegetarian.", "10.90", 12, IMAGE_KOREAN_BOWL),
                                item("Mediterranean Salad Box", "Gluten-free salad with chickpeas, olives, tomato, cucumber, and feta. Vegetarian.", "9.90", 10, IMAGE_SALAD_BOWL),
                                item("Lentil Lunch Bowl", "Vegan lunch bowl with lentils, rice, greens, and warm cumin dressing.", "8.90", 10, IMAGE_SALAD_BOWL)
                        )
                ),
                restaurant(
                        "Sushi Atelier Charlottenburg",
                        "Premium Japanese sushi near Charlottenburg for dinner with fresh sashimi, nigiri, maki, and refined Asian rice bowls.",
                        "+493012345015",
                        "sushi.atelier.charlottenburg@otter.demo",
                        true,
                        6.5,
                        LocalTime.of(12, 0),
                        LocalTime.of(23, 0),
                        "Savignyplatz 5",
                        "10623",
                        52.5062,
                        13.3193,
                        "Japanese / Sushi",
                        "Premium Japanese sushi, sashimi, nigiri, maki, dinner, Charlottenburg.",
                        List.of(
                                item("Sashimi Set", "Premium Japanese dinner set with salmon, tuna, sea bream, rice, and gluten-free soy option.", "24.90", 20, IMAGE_SUSHI),
                                item("Sushi Selection", "Premium sushi box with nigiri, maki, sashimi, ginger, wasabi, and fresh rice.", "21.90", 18, IMAGE_SUSHI),
                                item("Avocado Maki", "Japanese sushi rolls with avocado, cucumber, sesame, and mild soy sauce. Vegetarian.", "15.90", 14, IMAGE_SUSHI),
                                item("Spicy Tuna Crunch Roll", "Spicy sushi roll with tuna, chili mayo, cucumber, crispy topping, and Asian flavors.", "19.90", 18, IMAGE_SUSHI),
                                item("Salmon Rice Bowl", "Premium Japanese bowl with salmon, rice, edamame, cucumber, and sesame.", "18.90", 16, IMAGE_SEAFOOD_BOWL)
                        )
                ),
                restaurant(
                        "La Piazza Famiglia Charlottenburg",
                        "Family-friendly Italian pizza and pasta near Charlottenburg with warm comfort food, vegetarian options, dinner, and many dishes under 15 Euro.",
                        "+493012345016",
                        "la.piazza.famiglia.charlottenburg@otter.demo",
                        true,
                        6.0,
                        LocalTime.of(11, 0),
                        LocalTime.of(22, 30),
                        "Wilmersdorfer Straße 102",
                        "10629",
                        52.5070,
                        13.3068,
                        "Italian / Pizza",
                        "Italian, pizza, pasta, vegetarian, family-friendly, warm, under 15 Euro, Charlottenburg.",
                        List.of(
                                item("Family Margherita Pizza", "Tomato, mozzarella, basil, and olive oil on Italian pizza dough. Vegetarian and under 15 Euro.", "11.90", 15, IMAGE_PIZZA),
                                item("Penne Pomodoro", "Penne with tomato sauce, basil, garlic, and Italian herbs. Vegetarian and under 15 Euro.", "9.90", 14, IMAGE_PASTA),
                                item("Diavola Pizza", "Spicy Italian pizza with salami, chili, mozzarella, and tomato sauce.", "13.90", 16, IMAGE_PIZZA),
                                item("Pesto Gnocchi", "Warm gnocchi with pesto, parmesan, and cherry tomatoes. Vegetarian.", "12.90", 17, IMAGE_PASTA),
                                item("Kids Butter Parmesan Pasta", "Small pasta portion with butter, parmesan, and mild seasoning for lunch or dinner.", "7.90", 10, IMAGE_PASTA)
                        )
                ),
                restaurant(
                        "Falafel Sprint Friedrichshain",
                        "Fast cheap Mediterranean falafel near Friedrichshain with falafel wraps, halal-friendly shawarma, warm soups, salads, and fast delivery.",
                        "+493012345017",
                        "falafel.sprint.friedrichshain@otter.demo",
                        true,
                        4.5,
                        LocalTime.of(10, 0),
                        LocalTime.of(22, 0),
                        "Simon-Dach-Straße 23",
                        "10245",
                        52.5102,
                        13.4567,
                        "Mediterranean / Falafel",
                        "Mediterranean, falafel, wraps, halal-friendly shawarma, cheap, fast delivery, Friedrichshain.",
                        List.of(
                                item("Falafel Wrap", "Falafel wrap with hummus, salad, pickles, and herbs. Vegan, fast, and low priced.", "6.90", 8, IMAGE_TACOS),
                                item("Chicken Shawarma Wrap", "Halal-friendly chicken shawarma wrap with garlic sauce, salad, and warm flatbread.", "8.90", 10, IMAGE_TACOS),
                                item("Falafel Salad", "Salad with falafel, cucumber, tomato, herbs, tahini, and lemon. Vegetarian.", "9.90", 10, IMAGE_SALAD_BOWL),
                                item("Harissa Halloumi Bowl", "Spicy bowl with halloumi, rice, harissa, herbs, and Mediterranean vegetables. Vegetarian.", "10.90", 12, IMAGE_MEDITERRANEAN_BOWL),
                                item("Lentil Soup Cup", "Warm vegan lentil soup with cumin, lemon, and fresh parsley.", "5.90", 7, IMAGE_CURRY)
                        )
                ),
                restaurant(
                        "Quick Burrito Mitte",
                        "Fast cheap Mexican burritos near Mitte with spicy tacos, bean burritos, lunch bowls, and family-friendly dinner boxes.",
                        "+493012345018",
                        "quick.burrito.mitte@otter.demo",
                        true,
                        5.0,
                        LocalTime.of(10, 30),
                        LocalTime.of(22, 30),
                        "Friedrichstraße 141",
                        "10117",
                        52.5204,
                        13.3867,
                        "Mexican",
                        "Mexican, burrito, tacos, spicy salsa, cheap, fast delivery, Mitte.",
                        List.of(
                                item("Bean Burrito", "Low-priced vegan burrito with beans, rice, salsa, guacamole, and fast delivery.", "8.90", 10, IMAGE_TACOS),
                                item("Chicken Taco Box", "Spicy taco box with chicken, chili salsa, cabbage, lime, and herbs.", "10.90", 12, IMAGE_TACOS),
                                item("Corn Taco Trio", "Gluten-free corn tacos with avocado, beans, pico de gallo, and mild salsa. Vegetarian.", "9.90", 10, IMAGE_TACOS),
                                item("Burrito Bowl", "Lunch bowl with rice, beans, corn, lettuce, tomato, and cilantro.", "10.90", 12, IMAGE_TACOS),
                                item("Family Quesadilla Box", "Warm dinner box with cheese quesadilla, beans, salsa, and salad.", "8.30", 11, IMAGE_TACOS)
                        )
                )
        );
    }

    private static DemoRestaurant restaurant(
            String name,
            String description,
            String phoneNumber,
            String email,
            boolean open,
            double deliveryRadiusKm,
            LocalTime openingTime,
            LocalTime closingTime,
            String street,
            String postalCode,
            double latitude,
            double longitude,
            String categoryName,
            String categoryDescription,
            List<DemoItem> items
    ) {
        return new DemoRestaurant(
                name,
                description,
                phoneNumber,
                email,
                open,
                deliveryRadiusKm,
                openingTime,
                closingTime,
                street,
                postalCode,
                latitude,
                longitude,
                categoryName,
                categoryDescription,
                items
        );
    }

    private static DemoItem item(
            String name,
            String description,
            String price,
            int preparationTimeMinutes,
            String imageUrl
    ) {
        return new DemoItem(name, description, price, preparationTimeMinutes, imageUrl);
    }

    private record DemoRestaurant(
            String name,
            String description,
            String phoneNumber,
            String email,
            boolean open,
            double deliveryRadiusKm,
            LocalTime openingTime,
            LocalTime closingTime,
            String street,
            String postalCode,
            double latitude,
            double longitude,
            String categoryName,
            String categoryDescription,
            List<DemoItem> items
    ) {
    }

    private record DemoItem(
            String name,
            String description,
            String price,
            int preparationTimeMinutes,
            String imageUrl
    ) {
    }
}
