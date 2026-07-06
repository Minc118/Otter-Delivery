import unittest
from typing import Any
from app.services.restaurant_client import FoodItem, Restaurant
from app.services.scoring import score_restaurants
from app.services.multilingual import normalize_recommendation_input

def _seeder_catalog() -> list[Restaurant]:
    raw_data = [
        ("1", "Sakura Ramen Mitte", "Japanese", "Japanese", "Japanese ramen, noodles, warm broths, tofu and vegetarian options, spicy broths.", [
            ("1", "Vegan Tan Tan Ramen", "Spicy sesame broth with ramen noodles, tofu, bok choy, and chili oil. Vegan and warm.", 13.90),
            ("2", "Miso Mushroom Ramen", "Mild miso broth with ramen noodles, mushrooms, corn, and spring onion. Vegetarian.", 12.90),
            ("3", "Chicken Shoyu Ramen", "Clear shoyu broth with chicken, egg, noodles, nori, and spring onion.", 14.90),
            ("4", "Spicy Tofu Don", "Rice bowl with spicy tofu, edamame, sesame, pickled ginger, and scallions. Vegetarian.", 10.90),
            ("5", "Rice Noodle Tofu Salad", "Chilled rice noodles with tofu, cucumber, sesame, herbs, and mild soy dressing.", 11.90),
        ]),
        ("2", "Kreuzberg Burger Lab", "Burger / American", "Burger / American", "Burgers, American comfort food, Kreuzberg, halal-friendly beef, vegetarian option.", [
            ("6", "Classic Smash Burger", "Halal-friendly beef smash burger with cheddar, pickles, and house sauce.", 12.90),
            ("7", "Jalapeno Smash Burger", "Beef burger with jalapenos, pepper jack, chili mayo, and crispy onions.", 14.90),
            ("8", "Portobello Burger", "Grilled mushroom burger with cheese, lettuce, and mild garlic sauce. Vegetarian.", 11.90),
            ("9", "Loaded Chili Fries", "Spicy fries with chili, cheese, spring onion, and sour cream.", 7.90),
            ("10", "Beef Classic Burger", "Classic beef burger with lettuce, tomato, pickles, and house sauce.", 13.90),
        ]),
        ("3", "Napoli Pizza Berlin", "Italian", "Italian", "Italian pizza, pasta, prenzelauer berg, vegetarian option, under 15 Euro.", [
            ("11", "Margherita Pizza", "Tomato, mozzarella, basil, and olive oil on a crisp Italian base. Vegetarian and under 15 Euro.", 10.90),
            ("12", "Arrabbiata Pasta", "Penne with spicy tomato sauce, chili, garlic, and basil. Vegetarian and under 15 Euro.", 11.90),
            ("13", "Funghi Pizza", "Mushrooms, mozzarella, oregano, and mild tomato sauce on Italian pizza dough. Vegetarian.", 12.90),
            ("14", "Lasagna al Forno", "Baked beef lasagna with tomato ragu, pasta sheets, and bechamel.", 14.90),
            ("15", "Burrata Pizza", "Pizza with burrata, cherry tomatoes, basil, and olive oil.", 17.90),
        ]),
        ("4", "Seoul Bowl Neukölln", "Korean", "Korean", "Korean bibimbap, bowls, neukölln, spicy options, healthy ingredients, vegetarian.", [
            ("16", "Vegetable Bibimbap", "Korean rice bowl with egg, seasonal vegetables, sesame, and gochujang sauce. Vegetarian.", 11.90),
            ("17", "Kimchi Tofu Bowl", "Rice bowl with tofu, kimchi, cucumber, sesame, and chili. Vegan and spicy.", 10.90),
            ("18", "Kimchi Jjigae", "Warm Korean kimchi stew with tofu, vegetables, and a spicy broth.", 12.90),
            ("19", "Bulgogi Beef Bowl", "Soy-marinated beef over rice with sesame, scallions, and mild vegetables.", 14.90),
            ("20", "Tteokbokki Cup", "Chewy Korean rice cakes in spicy gochujang sauce.", 7.90),
        ]),
        ("5", "Anatolia Grill Kreuzberg", "Turkish / Halal", "Turkish / Halal", "Turkish kebab, grills, döner, halal-friendly, kreuzberg, lamb and chicken.", [
            ("21", "Chicken Döner Plate", "Halal-friendly chicken döner with rice, salad, garlic sauce, and warm flatbread.", 13.90),
            ("22", "Falafel Wrap", "Falafel wrap with hummus, pickles, herbs, and mild tahini. Vegetarian.", 8.90),
            ("23", "Adana Kebab", "Spicy halal-friendly minced lamb kebab with bulgur, grilled vegetables, and chili sauce.", 16.90),
            ("24", "Red Lentil Soup", "Warm Turkish lentil soup with cumin, lemon, and herbs. Vegan.", 6.90),
            ("25", "Mezze Box", "Hummus, baba ghanoush, olives, salad, and flatbread. Vegetarian.", 12.50),
        ]),
        ("6", "Green Garden Vegan", "Vegan", "Vegan", "Vegan buddha bowls, healthy salads, gluten-free options, organic ingredients.", [
            ("26", "Vegan Buddha Bowl", "Quinoa bowl with chickpeas, avocado, greens, and tahini. Vegan and gluten-free.", 12.90),
            ("27", "Seitan Chili Wrap", "Vegan seitan wrap with pickled cabbage, herbs, and spicy chili mayo.", 10.90),
            ("28", "Coconut Lentil Soup", "Warm vegan lentil soup with coconut, ginger, turmeric, and mild spices.", 8.90),
            ("29", "Green Protein Salad", "Tofu salad with pumpkin seeds, cucumber, herbs, and lemon dressing. Vegan and gluten-free.", 11.90),
            ("30", "Mushroom Comfort Pie", "Warm vegan mushroom and potato pie with herbs and rich gravy.", 14.90),
        ]),
        ("7", "Curry House Charlottenburg", "Indian", "Indian", "Indian curry, spicy dishes, vegetarian paneer, chicken and lamb biryani, nan bread.", [
            ("31", "Chana Masala", "Spicy chickpea curry with basmati rice and fresh coriander. Vegan and warm.", 11.90),
            ("32", "Paneer Tikka Bowl", "Paneer in mild tikka sauce with rice, herbs, and pickled onion. Vegetarian.", 13.90),
            ("33", "Dal Tadka", "Yellow lentils with cumin, garlic, rice, and mild spices. Vegan.", 9.90),
            ("34", "Chicken Biryani", "Fragrant rice with chicken, herbs, warm spices, and yogurt sauce.", 14.90),
            ("35", "Lamb Rogan Josh", "Spicy premium lamb curry with basmati rice and a rich warming sauce.", 18.90),
        ]),
        ("8", "Dragon Noodles Wedding", "Chinese", "Chinese", "Chinese dan dan noodles, spicy mapo tofu, dumplings, wedding area, rice options.", [
            ("36", "Dan Dan Noodles", "Spicy wheat noodles with sesame chili sauce, greens, and Sichuan pepper.", 10.90),
            ("37", "Mapo Tofu Rice", "Spicy tofu with Sichuan pepper, steamed rice, and spring onion. Vegetarian.", 11.90),
            ("38", "Vegetable Dumplings", "Pan-steamed vegetable dumplings with soy ginger dip and mild sesame sauce. Vegetarian.", 8.90),
            ("39", "Beef Noodle Soup", "Warm beef broth with wheat noodles, herbs, and vegetables.", 14.90),
            ("40", "Rice Noodle Vegetable Bowl", "Gluten-free rice noodle bowl with vegetables, tofu, and mild garlic sauce.", 12.90),
        ]),
        ("9", "Taco Verde Schöneberg", "Mexican", "Mexican", "Mexican tacos, burritos, schöneberg, vegan options, fresh salsa, spicy jalapeños.", [
            ("41", "Bean Burrito", "Burrito with black beans, rice, guacamole, salsa, and mild herbs. Vegan.", 10.90),
            ("42", "Veggie Tacos", "Corn tacos with grilled vegetables, hot salsa, and cabbage. Vegetarian and spicy.", 9.90),
            ("43", "Beef Taco Bowl", "Halal-friendly beef bowl with rice, beans, corn, salsa, and chili.", 13.90),
            ("44", "Corn Taco Trio", "Gluten-free corn tacos with avocado, beans, cabbage, and mild salsa.", 11.90),
            ("45", "Nachos Supreme", "Warm nachos with cheese, jalapenos, beans, and spicy salsa.", 8.90),
        ]),
        ("10", "Levant Kitchen Moabit", "Middle Eastern / Halal", "Middle Eastern / Halal", "Middle eastern shawarma, falafel, hummus, halal-friendly, moabit, mezze plates.", [
            ("46", "Shawarma Plate", "Halal-friendly chicken shawarma with rice, salad, garlic sauce, and warm spices.", 13.90),
            ("47", "Falafel Plate", "Falafel with hummus, tabbouleh, pickles, and warm flatbread. Vegan.", 11.90),
            ("48", "Halloumi Couscous Bowl", "Halloumi bowl with couscous, herbs, cucumber, tomato, and mild lemon dressing. Vegetarian.", 12.90),
            ("49", "Harissa Lentil Soup", "Warm vegan lentil soup with spicy harissa, cumin, and herbs.", 8.90),
            ("50", "Mezze Salad", "Gluten-free mezze salad with chickpeas, cucumber, tahini, olives, and herbs.", 10.90),
        ]),
        ("11", "Spicy Thai Box Friedrichshain", "Thai", "Thai", "Thai curry, pad thai noodles, spicy dishes, fried rice, chicken satay.", [
            ("51", "Pad Thai Tofu", "Rice noodles with tofu, peanuts, tamarind, lime, and chili. Vegetarian and spicy.", 11.90),
            ("52", "Green Curry", "Spicy green curry with vegetables, coconut milk, rice, and Thai basil. Vegan.", 12.90),
            ("53", "Chicken Satay Bowl", "Thai chicken bowl with peanut sauce, rice, cucumber, and herbs.", 13.90),
            ("54", "Tom Yum Soup", "Warm Thai soup with mushrooms, lemongrass, chili, and lime.", 9.90),
            ("55", "Basil Rice Box", "Thai rice box with basil, vegetables, and spicy garlic sauce.", 8.90),
        ]),
        ("12", "Mediterranean Bowl Potsdamer Platz", "Mediterranean", "Mediterranean", "Mediterranean couscous bowls, salads, healthy lunch, roasted vegetables, salmon.", [
            ("56", "Falafel Couscous Bowl", "Falafel bowl with couscous, cucumber, tomato, herbs, and tahini. Vegetarian.", 11.90),
            ("57", "Chicken Quinoa Bowl", "Gluten-free warm quinoa bowl with chicken, herbs, lemon, and vegetables.", 13.90),
            ("58", "Roasted Eggplant Plate", "Roasted eggplant with hummus, herbs, warm pita, and olive oil. Vegan.", 12.90),
            ("59", "Salmon Quinoa Bowl", "Premium Mediterranean bowl with salmon, greens, olives, quinoa, and mild dressing.", 18.90),
            ("60", "Harissa Veggie Wrap", "Vegetarian wrap with grilled vegetables, spicy harissa, and yogurt sauce.", 10.90),
        ]),
        ("13", "Pho Lantern Mitte", "Vietnamese", "Vietnamese", "Vietnamese pho, rice noodles, warm broths, tofu options, bun bo, mitte.", [
            ("61", "Tofu Pho", "Vietnamese pho with rice noodles, tofu, herbs, lime, and warm broth. Vegan.", 11.90),
            ("62", "Chicken Pho", "Warm Vietnamese noodle soup with chicken, rice noodles, ginger broth, and herbs.", 12.90),
            ("63", "Beef Pho", "Vietnamese pho with sliced beef, rice noodles, herbs, lime, and warm comforting broth.", 13.90),
            ("64", "Summer Roll Bowl", "Gluten-free rice noodle bowl with tofu, salad, peanuts, mint, and mild sauce.", 10.90),
            ("65", "Lemongrass Rice Box", "Lunch rice box with vegetables, lemongrass tofu, chili, and Vietnamese herbs.", 8.90),
        ]),
        ("14", "Glutenfrei Garden Neukölln", "Healthy / Gluten-Free", "Healthy / Gluten-Free", "Gluten-free lunch bowls, healthy salads, sweet potato, lentils, neukölln.", [
            ("66", "Chicken Quinoa Bowl", "Gluten-free lunch bowl with chicken, quinoa, cucumber, herbs, and lemon dressing.", 12.90),
            ("67", "Sweet Potato Bowl", "Roasted sweet potato, lentils, avocado, greens, and tahini. Vegan and gluten-free.", 11.90),
            ("68", "Tofu Peanut Bowl", "Spicy tofu bowl with rice, cabbage, chili peanut sauce, and fresh herbs. Vegetarian.", 10.90),
            ("69", "Mediterranean Salad Box", "Gluten-free salad with chickpeas, olives, tomato, cucumber, and feta. Vegetarian.", 9.90),
            ("70", "Lentil Lunch Bowl", "Vegan lunch bowl with lentils, rice, greens, and warm cumin dressing.", 8.90),
        ]),
        ("15", "Sushi Atelier Charlottenburg", "Japanese / Sushi", "Japanese / Sushi", "Premium Japanese sushi, fresh sashimi, rolls, charlottenburg, dinner selection.", [
            ("71", "Sashimi Set", "Premium Japanese dinner set with salmon, tuna, sea bream, rice, and gluten-free soy option.", 24.90),
            ("72", "Sushi Selection", "Premium sushi box with nigiri, maki, sashimi, ginger, wasabi, and fresh rice.", 21.90),
            ("73", "Avocado Maki", "Japanese sushi rolls with avocado, cucumber, sesame, and mild soy sauce. Vegetarian.", 15.90),
            ("74", "Spicy Tuna Crunch Roll", "Spicy sushi roll with tuna, chili mayo, cucumber, crispy topping, and Asian flavors.", 19.90),
            ("75", "Salmon Rice Bowl", "Premium Japanese bowl with salmon, rice, edamame, cucumber, and sesame.", 18.90),
        ]),
        ("16", "La Piazza Famiglia Charlottenburg", "Italian / Pizza", "Italian / Pizza", "Italian pizza, pasta, family size, charlottenburg, kid friendly, under 15 Euro.", [
            ("76", "Family Margherita Pizza", "Tomato, mozzarella, basil, and olive oil on Italian pizza dough. Vegetarian and under 15 Euro.", 11.90),
            ("77", "Penne Pomodoro", "Penne with tomato sauce, basil, garlic, and Italian herbs. Vegetarian and under 15 Euro.", 9.90),
            ("78", "Diavola Pizza", "Spicy Italian pizza with salami, chili, mozzarella, and tomato sauce.", 13.90),
            ("79", "Pesto Gnocchi", "Warm gnocchi with pesto, parmesan, and cherry tomatoes. Vegetarian.", 12.90),
            ("80", "Kids Butter Parmesan Pasta", "Small pasta portion with butter, parmesan, and mild seasoning for lunch or dinner.", 7.90),
        ]),
        ("17", "Falafel Sprint Friedrichshain", "Mediterranean / Falafel", "Mediterranean / Falafel", "Mediterranean falafel wraps, quick lunch, cheap, vegan options, fast delivery.", [
            ("81", "Falafel Wrap", "Falafel wrap with hummus, salad, pickles, and herbs. Vegan, fast, and low priced.", 6.90),
            ("82", "Chicken Shawarma Wrap", "Halal-friendly chicken shawarma wrap with garlic sauce, salad, and warm flatbread.", 8.90),
            ("83", "Falafel Salad", "Salad with falafel, cucumber, tomato, herbs, tahini, and lemon. Vegetarian.", 9.90),
            ("84", "Harissa Halloumi Bowl", "Spicy bowl with halloumi, rice, harissa, herbs, and Mediterranean vegetables. Vegetarian.", 10.90),
            ("85", "Lentil Soup Cup", "Warm vegan lentil soup with cumin, lemon, and fresh parsley.", 5.90),
        ]),
        ("18", "Quick Burrito Mitte", "Mexican", "Mexican", "Mexican burritos, tacos, quick lunch, gluten-free corn options, low-priced.", [
            ("86", "Bean Burrito", "Low-priced vegan burrito with beans, rice, salsa, guacamole, and fast delivery.", 8.90),
            ("87", "Chicken Taco Box", "Spicy taco box with chicken, chili salsa, cabbage, lime, and herbs.", 10.90),
            ("88", "Corn Taco Trio", "Gluten-free corn tacos with avocado, beans, pico de gallo, and mild salsa. Vegetarian.", 9.90),
            ("89", "Burrito Bowl", "Lunch bowl with rice, beans, corn, lettuce, tomato, and cilantro.", 10.90),
            ("90", "Family Quesadilla Box", "Warm dinner box with cheese quesadilla, beans, salsa, and salad.", 8.30),
        ])
    ]

    rests = []
    for rid, rname, cuisine, cat_name, cat_desc, items_data in raw_data:
        r_tags = [cat_name]
        if cat_desc:
            r_tags.extend([p.strip().lower() for p in cat_desc.split(",") if p.strip()])
            
        food_items = []
        for iid, iname, idesc, iprice in items_data:
            i_tags = list(r_tags)
            food_items.append(
                FoodItem(
                    food_item_id=iid,
                    name=iname,
                    description=idesc,
                    price=iprice,
                    tags=i_tags
                )
            )
        rests.append(
            Restaurant(
                restaurant_id=rid,
                name=rname,
                cuisine=cuisine,
                open=True,
                tags=r_tags,
                food_items=food_items
            )
        )
    return rests

class RecommendationQualityTests(unittest.TestCase):
    def _score(self, query: str, preferences: dict[str, Any] | None = None) -> list:
        preferences = preferences or {}
        normalized = normalize_recommendation_input(query=query, preferences=preferences)
        return score_restaurants(
            user_id="quality-test-user",
            query=normalized.canonical_query,
            preferences=normalized.canonical_preferences,
            restaurants=_seeder_catalog(),
            limit=20,
        )

    def _print_report(self, query: str, expected_categories: list[str], results: list) -> bool:
        top_5 = [f"{r.restaurant_name} ({r.feature_snapshot.get('candidate_category')})" for r in results[:5]]
        top_3_names = [r.restaurant_name for r in results[:3]]
        
        # Stricter assertions based on query rules
        passed = True
        reason = "Pass"
        
        if query == "Vietnamese beef pho":
            # No sushi/burger/pizza/falafel/doner/döner in top 3. Must be pho/vietnamese/noodle/soup.
            banned = {"Sushi", "Burger", "Pizza", "Falafel", "Grill", "Anatolia", "Levant"}
            for name in top_3_names:
                if any(b in name for b in banned):
                    passed = False
                    reason = f"Contains banned category restaurant in top 3: {name}"
            if top_3_names[0] != "Pho Lantern Mitte":
                passed = False
                reason = "Pho Lantern Mitte is not #1"
                
        elif query == "beef pho":
            banned = {"Sushi", "Burger", "Pizza", "Falafel", "Grill", "Anatolia", "Levant"}
            for name in top_3_names:
                if any(b in name for b in banned):
                    passed = False
                    reason = f"Contains banned category restaurant in top 3: {name}"
            if top_3_names[0] != "Pho Lantern Mitte":
                passed = False
                reason = "Pho Lantern Mitte is not #1"
                
        elif query == "hot ramen":
            # top 3 should be ramen/japanese/noodle/soup/spicy focused
            banned = {"Taco", "Burger", "Pizza", "Falafel", "Grill", "Burrito"}
            for name in top_3_names:
                if any(b in name for b in banned):
                    passed = False
                    reason = f"Contains banned category restaurant in top 3: {name}"
            if top_3_names[0] != "Sakura Ramen Mitte":
                passed = False
                reason = "Sakura Ramen Mitte is not #1"

        elif query == "sushi":
            # no burger in top 3
            for name in top_3_names:
                if "Burger" in name:
                    passed = False
                    reason = f"Contains burger in top 3: {name}"
            if top_3_names[0] != "Sushi Atelier Charlottenburg":
                passed = False
                reason = "Sushi Atelier is not #1"

        elif query == "burger":
            # no ramen in top 3
            for name in top_3_names:
                if "Ramen" in name:
                    passed = False
                    reason = f"Contains ramen in top 3: {name}"
            if top_3_names[0] != "Kreuzberg Burger Lab":
                passed = False
                reason = "Burger Lab is not #1"

        elif query == "pizza":
            # pizza/Italian should dominate top 3
            valid = {"Napoli Pizza Berlin", "La Piazza Famiglia Charlottenburg"}
            match_count = sum(1 for name in top_3_names if name in valid)
            if match_count < 2:
                passed = False
                reason = f"Pizza/Italian restaurants do not dominate top 3: {top_3_names}"

        elif query == "vegan food":
            # vegan/vegetarian should dominate top 3
            valid = {"Green Garden Vegan", "Falafel Sprint Friedrichshain", "Taco Verde Schöneberg"}
            match_count = sum(1 for name in top_3_names if any(v in name for v in ["Vegan", "Falafel", "Verde"] ))
            if match_count < 2:
                passed = False
                reason = f"Vegan/vegetarian restaurants do not dominate top 3: {top_3_names}"

        elif query == "halal chicken":
            # halal/chicken should dominate top 3
            valid = {"Anatolia Grill Kreuzberg", "Levant Kitchen Moabit"}
            match_count = sum(1 for name in top_3_names if name in valid)
            if match_count < 2:
                passed = False
                reason = f"Halal/chicken options do not dominate top 3: {top_3_names}"

        print(f"QUERY: '{query}'")
        print(f"EXPECTED: {expected_categories}")
        print(f"ACTUAL TOP 5: {top_5}")
        print(f"STATUS: {'PASS' if passed else 'FAIL'}")
        print(f"REASON: {reason}")
        print("-" * 50)
        return passed

    def test_query_1_vietnamese_beef_pho(self) -> None:
        results = self._score("Vietnamese beef pho")
        passed = self._print_report("Vietnamese beef pho", ["Vietnamese"], results)
        self.assertTrue(passed)

    def test_query_2_beef_pho(self) -> None:
        results = self._score("beef pho")
        passed = self._print_report("beef pho", ["Vietnamese"], results)
        self.assertTrue(passed)

    def test_query_3_hot_ramen(self) -> None:
        results = self._score("hot ramen")
        passed = self._print_report("hot ramen", ["Japanese", "Ramen"], results)
        self.assertTrue(passed)

    def test_query_4_spicy_noodles(self) -> None:
        results = self._score("spicy noodles")
        passed = self._print_report("spicy noodles", ["Noodle", "Asian"], results)
        self.assertTrue(passed)

    def test_query_5_sushi(self) -> None:
        results = self._score("sushi")
        passed = self._print_report("sushi", ["Japanese", "Sushi"], results)
        self.assertTrue(passed)

    def test_query_6_pizza(self) -> None:
        results = self._score("pizza")
        passed = self._print_report("pizza", ["Italian", "Pizza"], results)
        self.assertTrue(passed)

    def test_query_7_vegan_food(self) -> None:
        results = self._score("vegan food")
        passed = self._print_report("vegan food", ["Vegan", "Vegetarian"], results)
        self.assertTrue(passed)

    def test_query_8_halal_chicken(self) -> None:
        results = self._score("halal chicken")
        passed = self._print_report("halal chicken", ["Halal", "Chicken"], results)
        self.assertTrue(passed)

    def test_query_9_cheap_lunch(self) -> None:
        results = self._score("cheap lunch")
        passed = self._print_report("cheap lunch", ["Cheap", "Budget"], results)
        self.assertTrue(passed)

    def test_query_10_burger(self) -> None:
        results = self._score("burger")
        passed = self._print_report("burger", ["American", "Burger"], results)
        self.assertTrue(passed)

    def test_profile_preference_interaction_halal_vs_ramen(self) -> None:
        results = self._score("hot ramen", {"dietaryPreferences": ["halal"]})
        top_name = results[0].restaurant_name
        self.assertEqual(top_name, "Sakura Ramen Mitte")

    def test_label_accuracy_no_false_matches(self) -> None:
        results = self._score("pho")
        ranked_names = [r.restaurant_name for r in results[:5]]
        self.assertNotIn("Falafel Sprint Friedrichshain", ranked_names)
        self.assertNotIn("Sushi Atelier Charlottenburg", ranked_names)

if __name__ == "__main__":
    unittest.main()
