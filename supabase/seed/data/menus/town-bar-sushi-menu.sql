-- Town Bar - Sushi Menu Addition
-- Source: Toast ordering page (order.toasttab.com/online/town-bar-and-grill-mv)
-- Run this in Supabase SQL Editor
-- Adds sushi menu items alongside existing main menu dishes

-- Sushi Appetizers & Bowls (65 items total)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  -- Sushi Appetizers
  ('Fried Veggie Spring Roll', 'apps', 'Sushi Appetizers', 11.00),
  ('Pork Gyoza', 'apps', 'Sushi Appetizers', 9.00),
  ('Shrimp Shumai', 'shrimp', 'Sushi Appetizers', 10.00),
  ('Edamame', 'apps', 'Sushi Appetizers', 9.00),
  ('Seaweed Salad', 'salad', 'Sushi Appetizers', 9.00),
  ('Panko Shrimp', 'shrimp', 'Sushi Appetizers', 16.00),
  ('Rice Paper Wraps', 'apps', 'Sushi Appetizers', 13.00),
  ('Fish Poke Bowl', 'pokebowl', 'Sushi Appetizers', 27.00),
  ('Vegetable Poke Bowl', 'pokebowl', 'Sushi Appetizers', 24.00),
  ('Yuzu Yellowtail', 'sushi', 'Sushi Appetizers', 19.00),
  ('Hama-Chili', 'sushi', 'Sushi Appetizers', 19.00),
  ('Citrus Salmon', 'sushi', 'Sushi Appetizers', 19.00),
  ('Tuna Tataki', 'sushi', 'Sushi Appetizers', 19.00),

  -- Nigiri & Sashimi
  ('Nigiri 5 Pcs Mix', 'sushi', 'Nigiri & Sashimi', 16.00),
  ('Nigiri 10 Pcs Mix', 'sushi', 'Nigiri & Sashimi', 30.00),
  ('Sashimi 7 Pcs Mix', 'sushi', 'Nigiri & Sashimi', 22.00),
  ('Sashimi 12 Pcs Mix', 'sushi', 'Nigiri & Sashimi', 38.00),
  ('Nigiri & Sashimi Combo', 'sushi', 'Nigiri & Sashimi', 30.00),
  ('Salmon Lover', 'sushi', 'Nigiri & Sashimi', 35.00),
  ('Tuna Lover', 'sushi', 'Nigiri & Sashimi', 35.00),

  -- Regular Rolls
  ('Sweet Potato Roll', 'sushi', 'Regular Rolls', 9.00),
  ('Asparagus Tempura Roll', 'sushi', 'Regular Rolls', 9.00),
  ('Cucumber Roll', 'sushi', 'Regular Rolls', 9.00),
  ('Avocado Roll', 'sushi', 'Regular Rolls', 10.00),
  ('Avo-Mango-Cucumber Roll', 'sushi', 'Regular Rolls', 10.00),
  ('Mixed Veggie Roll', 'sushi', 'Regular Rolls', 11.00),
  ('California Roll', 'sushi', 'Regular Rolls', 11.00),
  ('Spicy California Roll', 'sushi', 'Regular Rolls', 11.00),
  ('Shrimp Avocado Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Eel Avocado Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Tempura Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Cooked Salmon Avocado Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Alaska Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Philadelphia Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Hawaiian Roll', 'sushi', 'Regular Rolls', 14.00),
  ('Tuna Avocado Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Salmon Avocado Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Yellowtail Avocado Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Spicy Tuna Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Spicy Crunchy Salmon Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Spicy Yellowtail Roll', 'sushi', 'Regular Rolls', 12.00),
  ('Spicy Trio', 'sushi', 'Regular Rolls', 33.00),
  ('Hosomaki Roll', 'sushi', 'Regular Rolls', 11.00),
  ('Hosomaki Trio', 'sushi', 'Regular Rolls', 29.00),

  -- Special Rolls
  ('Smokey Veggie Roll', 'sushi', 'Special Rolls', 19.00),
  ('Two Some Crab Roll', 'sushi', 'Special Rolls', 19.00),
  ('Great Wall Roll', 'sushi', 'Special Rolls', 20.00),
  ('Niagara Fall Roll', 'sushi', 'Special Rolls', 22.00),
  ('Spider Roll', 'sushi', 'Special Rolls', 18.00),
  ('Dragon Roll', 'sushi', 'Special Rolls', 19.00),
  ('Pink Lady Roll', 'sushi', 'Special Rolls', 19.00),
  ('Panko Sweetie Roll', 'sushi', 'Special Rolls', 19.00),
  ('Shrimp Tower Roll', 'sushi', 'Special Rolls', 22.00),
  ('Tropical Salmon Roll', 'sushi', 'Special Rolls', 21.00),
  ('Rainbow Roll', 'sushi', 'Special Rolls', 21.00),
  ('Red Velvet Roll', 'sushi', 'Special Rolls', 21.00),
  ('Chipotle Salmon Roll', 'sushi', 'Special Rolls', 21.00),
  ('Dynamic Crunch Roll', 'sushi', 'Special Rolls', 21.00),
  ('One Punch Roll', 'sushi', 'Special Rolls', 21.00),
  ('Hanabi Roll', 'sushi', 'Special Rolls', 21.00),
  ('King Island Roll', 'sushi', 'Special Rolls', 21.00),
  ('Propose Roll', 'sushi', 'Special Rolls', 21.00),
  ('Tiger Roll', 'sushi', 'Special Rolls', 21.00),
  ('Grilled Tuna Roll', 'sushi', 'Special Rolls', 21.00),
  ('Refresh Roll', 'sushi', 'Special Rolls', 21.00),
  ('Naruto Roll', 'sushi', 'Special Rolls', 20.00),
  ('Spicy Naruto Roll', 'sushi', 'Special Rolls', 19.00),
  ('Super Hot Roll', 'sushi', 'Special Rolls', 21.00)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Town Bar'
  AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

-- Update menu_section_order to include sushi sections
UPDATE restaurants
SET menu_section_order = ARRAY['Snacks & Shareables', 'Wings', 'Salads', 'Burgers', 'Sandwiches', 'Entrees', 'Sushi Appetizers', 'Nigiri & Sashimi', 'Regular Rolls', 'Special Rolls']
WHERE name = 'Town Bar';

-- Verify import
SELECT menu_section, COUNT(*) as dish_count
FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Town Bar')
GROUP BY menu_section
ORDER BY menu_section;
