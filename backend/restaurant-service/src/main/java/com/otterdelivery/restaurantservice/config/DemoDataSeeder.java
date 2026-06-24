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

    private static final String IMAGE_HEALTHY_BOWL =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCQFpQrYG4LpNRtVlfivKSl3ZheRPZ5TMzRJT2gGA-UHouXoQmZcStRnSpOVQszDPkN8009jor73icejL1cZ845YVJf8P-ZoJAuJ3T5tWezYTKuk-VktHr3e6ywT3zcwlEehA-dkaS7v00AIqTB8RJWtEbYjX6qttBqbL8ZZlGMr7e0f88hmQC2n4LVTOJ6wEEHXftC3-ACMXpj1y19K5tCY6OIKz1qb61vDasgGvJhhbAeEJRTRbaAw4fwDZf1k5iTgq0lzdlzYB8";
    private static final String IMAGE_ITALIAN =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuA-lQs5K7n7zJdbm6-MaZ2qTx2e9H5HcTDpLbIabdp2Zick0JaCUH2ogRqK8NwT6mr10dydrKxTTHJsQFUpEjzVBnltTmYifLDYsb1KewsmEDp6s2xfRpZwDQb9v2rt4p-i97qDeDEzMpDWfdGGijyS6SIetuU5Gs_S-yQcZ0mc1Cby5GXUPKgEPMAujj9Ja7qkzGCuhU7Vnnk2MCp7ngLMxynpsOafPpV8_jmuOyLa8ToPEWtezpCmZtTPZYR9svmoIdZ9sESkWDA";
    private static final String IMAGE_SUSHI =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuD4tDnZ1-P6jHiJUhgAneI7osHNdC2c2IZ9_LhmRhOlQwahinAG5L3dpejECEFmiRYpDJIZLnYRDUH7cgjPKXaaz_7qO1WwpmDywFxoAJI59aZCvYn99jcdcWvvUr2M7JnvcU1JHgXc9nNgZ4n31fRHmpHW1NcY2j2zfrbW8s6QxPW-t9yNRaSynF_WGBNsmVaU6d7Mal5T8FRHnL2MQN9uCzXAW1l340UjDY_n4dkfM2Vq9GYNp3imoIqLQLTSm9rY3rXWwtBKwzs";
    private static final String IMAGE_BURGER =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuB7kftjOB4DNU2AqzOvfQLUk8dnWple-b9SWyfJT2_mSGDBoinOnmrT0Z3MbBixnjYwP703r8ijxetBLdsTmSlNCruiv-FWY4evwZAYmap7EtG-F4lTw191PDDXKgvW2F22Goq44zL4FzQDYq_dteNeUoCQPVqTAciRXoADS_cQEApBnMIuMw8RQNMOrOUg7fIqSW4DiBxc8qoUDID7NKM6tefW89eIGPjiZ8c6bTP53dIPHkLmL7O0VsoqgB_pAiwae1M1NBXPfiU";
    private static final String IMAGE_THAI =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDIWhsPb7K0oWYUduk76iBbf-AdcjJjzzp1kABPhxBnb2Uk0DM13OcKszhC10G0HZ5krL7hGrp0srA_sCkJhZUxnKgbMVLLFyQ-0DoYBpjINiFpN5UnKq9yz0VcU-W3rD946CNTFBP-mvwq4Z96ZW5reS_kTas1cj-_8ladi4iaLYJx_yghxCrte-omzI3qWE13wRlI41f2irkkKO-3trOFqRZr6qTYj9KmeFBAUW88Rx8qxO8RUWkRgNUn-XBFMgPhtuCstsVeFR0";
    private static final String IMAGE_CAFE =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuA_0AKLUoX_nyuKrX7tSpqn_zSX8UUshE6zGgI149HNhTIjC9tpSTnj-l-c56pr6cgtagAfCuoG0uKjJh30yTa_oAG5Z0T7hGp4RfPsjGuMkxrGiHSVYSC7bxYzjpIAKV_mUOopzj4ifMvzUBBpiHsb_-UPfvckpHAlA-pkUj_uyiMErAluyB9u686BvEiaM2Wnf1CYB3Z41rsvoT54Ctbb5yupQAgCSPq4vpjZneG_IaemaDKZy1Uf3p7gGlIWZAIY5O502e_RM-g";
    private static final String IMAGE_CURRY_BOWL =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCpxAakvMhynGTCftLJngM7xHbrkbL_qcRRpM98mxGqfZtl9CsHjkDK2i9ySjQrF1Ba37uEzIIOB1JrrXCxeNN9RpvFMt8G3GtXnwS3p1YnOk4tAPcLgcyZrWIk_pH180vR6ituD0Lyw5a9okVD8JhQfi6i-oN9CS48M8NnrhPjmjvE5yJ6xRH7sEHn5jpLNI_FRFxmkD_PJus_n-x_knMsxngDTHF9Uq4sjXjrExtmLtPfsVej0oKAvEhDgTQaBnAsDgLECkNhGCQ";
    private static final String IMAGE_SALAD =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAVawCn0N0DmdgIYobUY8rbTz6fPu7o-d85E3pFocqJI9jvg02h3wOhkaIzCQ9Dg_s3ep3aLVlTrShNLfnvJ1N0YTOo9o7nuJYn0O2JE4OpbN6Xsbj6V-IriOItJZE-peNouml7QxDedFRb9SIDT2_x8hMS8XappTeZS5to2jJPeBRFjgjt-ehEW8rZ9GLYmo6hx3ZanNXDPC9VIjsMgyRrEhe8-zMnSuxsyr7vwuhtGtweo5CkBV9kQaxRHn5WdleX7Kc-ETtQWts";
    private static final String IMAGE_WRAP =
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAy_4z88Coqr90sFaDUsS2OTJzv8864zORyS8Mtq8hPdaZyCHBgzIuv7lPb1BacU92HggQf8Nh6_4_mPMj4Af3RCslwuyWBYWpuHWAP1a4wUHfAkiZSVUYEytqpKH_ItSBefrbC5kmMsgGq4DOYG2aIglAjlo37ZYB2awzTLyXJBhpvZopJlV_g1EgbR5l_2fJjmARcKMuCO1VbHYxsNN6vN830dzOQBlj7GtL_ESs8HIawo4VqvWKyJF8ZVFXHoOblqJGG1QIYAgY";

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
        Restaurant restaurant = restaurantRepository.findByNameIgnoreCase(demo.name()).stream()
                .findFirst()
                .orElseGet(Restaurant::new);

        restaurant.setName(demo.name());
        restaurant.setDescription(demo.description());
        restaurant.setPhoneNumber(demo.phoneNumber());
        restaurant.setEmail(demo.email());
        restaurant.setOpen(demo.open());
        restaurant.setDeliveryRadiusKm(demo.deliveryRadiusKm());
        restaurant.setOpeningTime(demo.openingTime());
        restaurant.setClosingTime(demo.closingTime());

        Address address = restaurant.getAddress() != null ? restaurant.getAddress() : new Address();
        address.setStreet(demo.street());
        address.setCity("Berlin");
        address.setPostalCode(demo.postalCode());
        address.setCountry("Germany");
        address.setLatitude(demo.latitude());
        address.setLongitude(demo.longitude());
        restaurant.setAddress(address);

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
            FoodItem foodItem = foodItemRepository
                    .findByCategoryIdAndNameIgnoreCase(savedCategory.getId(), demoItem.name())
                    .stream()
                    .findFirst()
                    .orElseGet(FoodItem::new);
            foodItem.setName(demoItem.name());
            foodItem.setDescription(demoItem.description());
            foodItem.setPrice(new BigDecimal(demoItem.price()));
            foodItem.setAvailable(true);
            foodItem.setPreparationTimeMinutes(demoItem.preparationTimeMinutes());
            foodItem.setImageUrl(demoItem.imageUrl());
            foodItem.setCategory(savedCategory);
            foodItemRepository.save(foodItem);
        }
    }

    private static List<DemoRestaurant> demoRestaurants() {
        return List.of(
                restaurant(
                        "Sakura Ramen Mitte",
                        "Japanese ramen in Mitte with warm comforting noodle bowls, cheap Asian lunch options, vegan and vegetarian sides, and spicy broths for recommendation demos.",
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
                        "Japanese ramen, noodles, bowls, vegetarian, vegan, spicy, warm and comforting.",
                        List.of(
                                item("Vegan Tan Tan Ramen", "Vegan spicy noodles with sesame broth, tofu, bok choy, and chili oil; warm and comforting Asian food.", "13.90", 20, IMAGE_THAI),
                                item("Miso Mushroom Ramen", "Vegetarian mild ramen with miso broth, mushrooms, corn, and spring onion; comforting and healthy.", "12.90", 18, IMAGE_SUSHI),
                                item("Chicken Shoyu Ramen", "Warm shoyu ramen with chicken, egg, noodles, and nori for a classic Japanese bowl.", "14.90", 22, IMAGE_SUSHI),
                                item("Spicy Tofu Don", "Cheap vegetarian rice bowl with spicy tofu, edamame, sesame, and pickled ginger.", "10.90", 15, IMAGE_CURRY_BOWL),
                                item("Gluten-Free Soba Salad", "Healthy gluten-free soba-style salad with cucumber, tofu, sesame, and mild soy dressing.", "11.90", 14, IMAGE_SALAD)
                        )
                ),
                restaurant(
                        "Kreuzberg Burger Lab",
                        "Burger and American comfort food in Kreuzberg with premium smash burgers, vegetarian burgers, spicy fries, and halal-friendly beef options.",
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
                        "Burgers, American comfort food, Kreuzberg, halal-friendly beef, vegetarian, spicy.",
                        List.of(
                                item("Halal Smash Burger", "Halal-friendly beef smash burger with cheddar, pickles, and house sauce; warm comfort food.", "12.90", 16, IMAGE_BURGER),
                                item("Spicy Jalapeno Burger", "Premium spicy burger with jalapenos, pepper jack, chili mayo, and crispy onions.", "14.90", 18, IMAGE_BURGER),
                                item("Vegetarian Portobello Burger", "Vegetarian burger with grilled mushroom, cheese, lettuce, and mild garlic sauce.", "11.90", 15, IMAGE_BURGER),
                                item("Loaded Chili Fries", "Cheap spicy fries with chili, cheese, spring onion, and sour cream.", "7.90", 10, IMAGE_BURGER),
                                item("Gluten-Free Bun Burger", "Gluten-free bun option with beef patty, tomato, lettuce, and mild sauce.", "13.90", 18, IMAGE_BURGER)
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
                        "Italian, pizza, pasta, vegetarian, warm comfort food, under 15 Euro.",
                        List.of(
                                item("Margherita Pizza", "Vegetarian Italian pizza with tomato, mozzarella, and basil; warm comfort food under 15 Euro.", "10.90", 14, IMAGE_ITALIAN),
                                item("Spicy Arrabbiata Pasta", "Vegetarian spicy tomato pasta with chili, garlic, and basil; Italian food under 15 Euro.", "11.90", 16, IMAGE_ITALIAN),
                                item("Funghi Pizza", "Vegetarian pizza with mushrooms, mozzarella, oregano, and mild tomato sauce.", "12.90", 15, IMAGE_ITALIAN),
                                item("Lasagna al Forno", "Warm comforting baked lasagna with beef, tomato, and bechamel.", "14.90", 22, IMAGE_ITALIAN),
                                item("Premium Burrata Pizza", "Premium pizza with burrata, cherry tomatoes, basil, and olive oil.", "17.90", 18, IMAGE_ITALIAN)
                        )
                ),
                restaurant(
                        "Seoul Bowl Neukölln",
                        "Korean bowls in Neukölln with spicy vegetarian bibimbap, cheap Asian rice bowls, vegan tofu, and warming stews.",
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
                        "Korean, Asian bowls, vegetarian, vegan, spicy, warm and comforting.",
                        List.of(
                                item("Vegetarian Bibimbap", "Vegetarian Korean rice bowl with egg, seasonal vegetables, gochujang, and spicy sauce.", "11.90", 16, IMAGE_CURRY_BOWL),
                                item("Vegan Kimchi Tofu Bowl", "Vegan spicy tofu bowl with kimchi, rice, cucumber, sesame, and chili.", "10.90", 15, IMAGE_CURRY_BOWL),
                                item("Kimchi Jjigae", "Warm comforting spicy kimchi stew with tofu and vegetables.", "12.90", 20, IMAGE_THAI),
                                item("Bulgogi Beef Bowl", "Korean beef bowl with rice, soy marinade, sesame, and mild vegetables.", "14.90", 18, IMAGE_CURRY_BOWL),
                                item("Cheap Tteokbokki Cup", "Cheap spicy rice cakes with gochujang sauce for a quick Asian snack.", "7.90", 12, IMAGE_WRAP)
                        )
                ),
                restaurant(
                        "Anatolia Grill Kreuzberg",
                        "Turkish halal grill in Kreuzberg with warm soups, vegetarian mezze, spicy kebab plates, and affordable wraps.",
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
                        "Turkish, halal, Kreuzberg, vegetarian, spicy, warm, cheap.",
                        List.of(
                                item("Halal Chicken Döner Plate", "Halal chicken döner with rice, salad, garlic sauce, and warm flatbread.", "13.90", 18, IMAGE_WRAP),
                                item("Vegetarian Falafel Wrap", "Cheap vegetarian falafel wrap with hummus, pickles, herbs, and mild tahini.", "8.90", 10, IMAGE_WRAP),
                                item("Spicy Adana Kebab", "Spicy halal minced lamb kebab with bulgur, grilled vegetables, and chili sauce.", "16.90", 22, IMAGE_WRAP),
                                item("Red Lentil Soup", "Warm comforting Turkish lentil soup; vegan and mild.", "6.90", 8, IMAGE_CURRY_BOWL),
                                item("Mezze Box", "Vegetarian mezze with hummus, baba ghanoush, olives, salad, and flatbread.", "12.50", 12, IMAGE_SALAD)
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
                        "Vegan, healthy bowls, gluten-free, vegetarian, spicy, Friedrichshain.",
                        List.of(
                                item("Vegan Buddha Bowl", "Healthy vegan gluten-free bowl with quinoa, chickpeas, avocado, greens, and tahini.", "12.90", 12, IMAGE_HEALTHY_BOWL),
                                item("Spicy Seitan Wrap", "Vegan spicy seitan wrap with pickled cabbage, herbs, and chili mayo.", "10.90", 10, IMAGE_WRAP),
                                item("Coconut Lentil Soup", "Warm comforting vegan lentil soup with coconut, ginger, and mild spices.", "8.90", 8, IMAGE_CURRY_BOWL),
                                item("Green Protein Salad", "Healthy gluten-free vegan salad with tofu, pumpkin seeds, cucumber, and herbs.", "11.90", 10, IMAGE_SALAD),
                                item("Premium Mushroom Comfort Pie", "Warm vegan mushroom and potato pie with herbs and rich gravy.", "14.90", 18, IMAGE_CURRY_BOWL)
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
                        "Indian, curry, vegan, vegetarian, spicy, warm, gluten-free.",
                        List.of(
                                item("Chana Masala", "Vegan spicy chickpea curry with rice; warm comforting and gluten-free.", "11.90", 18, IMAGE_CURRY_BOWL),
                                item("Paneer Tikka Bowl", "Vegetarian paneer in mild tikka sauce with rice and herbs.", "13.90", 20, IMAGE_CURRY_BOWL),
                                item("Dal Tadka", "Cheap vegan yellow lentils with cumin, garlic, rice, and mild spices.", "9.90", 16, IMAGE_CURRY_BOWL),
                                item("Chicken Biryani", "Warm comforting rice with chicken, herbs, spices, and yogurt sauce.", "14.90", 22, IMAGE_CURRY_BOWL),
                                item("Spicy Lamb Rogan Josh", "Premium spicy lamb curry with basmati rice and rich warming sauce.", "17.90", 24, IMAGE_CURRY_BOWL)
                        )
                ),
                restaurant(
                        "Dragon Noodles Wedding",
                        "Chinese noodle bar in Wedding with spicy noodles, vegetarian tofu, dumplings, cheap Asian bowls, and warm soups.",
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
                        "Chinese, Asian, noodles, spicy, vegetarian, cheap, warm.",
                        List.of(
                                item("Dan Dan Noodles", "Spicy noodles with sesame chili sauce, greens, and warming Sichuan flavor.", "10.90", 14, IMAGE_THAI),
                                item("Mapo Tofu Rice", "Vegetarian spicy tofu with Sichuan pepper, rice, and spring onion.", "11.90", 16, IMAGE_CURRY_BOWL),
                                item("Vegetable Dumplings", "Cheap vegetarian dumplings with soy ginger dip and mild sesame sauce.", "8.90", 12, IMAGE_WRAP),
                                item("Beef Noodle Soup", "Warm comforting beef broth with wheat noodles, herbs, and vegetables.", "14.90", 22, IMAGE_THAI),
                                item("Gluten-Free Rice Noodle Bowl", "Gluten-free rice noodle bowl with vegetables, tofu, and mild garlic sauce.", "12.90", 16, IMAGE_SALAD)
                        )
                ),
                restaurant(
                        "Taco Verde Schöneberg",
                        "Mexican Schöneberg taqueria with vegan beans, spicy vegetarian tacos, halal-friendly beef bowls, and cheap comfort snacks.",
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
                        "Mexican, vegan, vegetarian, spicy, halal-friendly, gluten-free, cheap.",
                        List.of(
                                item("Vegan Bean Burrito", "Vegan burrito with black beans, rice, guacamole, salsa, and mild herbs.", "10.90", 12, IMAGE_WRAP),
                                item("Spicy Veggie Tacos", "Vegetarian spicy tacos with grilled vegetables, hot salsa, and corn tortillas.", "9.90", 10, IMAGE_WRAP),
                                item("Halal Beef Taco Bowl", "Halal-friendly beef bowl with rice, beans, corn, salsa, and chili.", "13.90", 14, IMAGE_CURRY_BOWL),
                                item("Gluten-Free Corn Tacos", "Gluten-free corn tacos with avocado, beans, cabbage, and mild salsa.", "11.90", 12, IMAGE_WRAP),
                                item("Cheap Nachos Supreme", "Cheap warm nachos with cheese, jalapenos, beans, and spicy salsa.", "8.90", 10, IMAGE_WRAP)
                        )
                ),
                restaurant(
                        "Levant Kitchen Moabit",
                        "Middle Eastern halal kitchen in Moabit with warm bowls, vegetarian mezze, vegan falafel, and comforting soups.",
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
                        "Middle Eastern, halal, vegan, vegetarian, warm, healthy bowls.",
                        List.of(
                                item("Halal Chicken Shawarma Bowl", "Halal chicken shawarma bowl with rice, salad, garlic sauce, and warm spices.", "13.90", 16, IMAGE_CURRY_BOWL),
                                item("Vegan Falafel Plate", "Vegan falafel with hummus, tabbouleh, pickles, and warm flatbread.", "11.90", 12, IMAGE_WRAP),
                                item("Vegetarian Halloumi Bowl", "Healthy vegetarian bowl with halloumi, couscous, herbs, and mild lemon dressing.", "12.90", 14, IMAGE_SALAD),
                                item("Spicy Harissa Lentil Soup", "Warm comforting vegan lentil soup with spicy harissa and herbs.", "8.90", 10, IMAGE_CURRY_BOWL),
                                item("Gluten-Free Mezze Salad", "Gluten-free mezze salad with chickpeas, cucumber, tahini, olives, and herbs.", "10.90", 10, IMAGE_SALAD)
                        )
                ),
                restaurant(
                        "Spicy Thai Box Friedrichshain",
                        "Thai street food in Friedrichshain with spicy noodles, vegan curries, cheap Asian boxes, and warm comforting soups.",
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
                        "Thai, Asian, spicy noodles, vegan, vegetarian, cheap, warm.",
                        List.of(
                                item("Spicy Pad Thai Tofu", "Vegetarian spicy noodles with tofu, peanuts, tamarind, lime, and chili.", "11.90", 14, IMAGE_THAI),
                                item("Vegan Green Curry", "Vegan spicy green curry with vegetables, coconut milk, rice, and basil.", "12.90", 18, IMAGE_CURRY_BOWL),
                                item("Mild Chicken Satay Bowl", "Mild Thai chicken bowl with peanut sauce, rice, cucumber, and herbs.", "13.90", 16, IMAGE_CURRY_BOWL),
                                item("Tom Yum Soup", "Warm comforting spicy Thai soup with mushrooms, lemongrass, and chili.", "9.90", 12, IMAGE_THAI),
                                item("Cheap Basil Rice Box", "Cheap Asian rice box with basil, vegetables, and spicy garlic sauce.", "8.90", 12, IMAGE_CURRY_BOWL)
                        )
                ),
                restaurant(
                        "Mediterranean Bowl Potsdamer Platz",
                        "Mediterranean healthy lunch bowls near Potsdamer Platz with gluten-free grains, vegetarian mezze, premium fish, and warm comfort plates.",
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
                        "Mediterranean, healthy bowls, gluten-free, vegetarian, vegan, premium.",
                        List.of(
                                item("Healthy Falafel Bowl", "Healthy vegetarian bowl with falafel, couscous, cucumber, tomato, and tahini.", "11.90", 12, IMAGE_HEALTHY_BOWL),
                                item("Gluten-Free Chicken Quinoa Bowl", "Gluten-free warm quinoa bowl with chicken, herbs, lemon, and vegetables.", "13.90", 16, IMAGE_SALAD),
                                item("Vegan Roasted Eggplant Plate", "Vegan Mediterranean plate with roasted eggplant, hummus, herbs, and warm pita.", "12.90", 14, IMAGE_CURRY_BOWL),
                                item("Premium Salmon Bowl", "Premium Mediterranean bowl with salmon, greens, olives, quinoa, and mild dressing.", "18.90", 18, IMAGE_SALAD),
                                item("Spicy Harissa Veggie Wrap", "Vegetarian spicy wrap with grilled vegetables, harissa, and yogurt sauce.", "10.90", 12, IMAGE_WRAP)
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
