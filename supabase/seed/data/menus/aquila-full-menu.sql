-- Aquila - Full Menu
-- Source: aquilamvy.com, ubereats.com/store/aquila-ymca (prices estimated from delivery platform)
-- Run this in Supabase SQL Editor
-- NOTE: Aquila is a Wampanoag-owned coffee & snack shop at Aquinnah Cliffs.
-- Prices below are estimated in-store prices (delivery platforms mark up ~15-20%).

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Aquila');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === SIGNATURE (1) ===
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Jaws Egg Melt', 'breakfast sandwich', 'Signature', 12.00),

-- === ACAI BOWLS (4) ===
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Circuit Ave Bowl', 'breakfast', 'Acai Bowls', 14.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Island Dream Bowl', 'breakfast', 'Acai Bowls', 14.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Summer Bliss Bowl', 'breakfast', 'Acai Bowls', 15.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Brazilian Bowl', 'breakfast', 'Acai Bowls', 15.00),

-- === OATMEAL BOWLS (2) ===
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Loaded Oatmeal Bowl', 'breakfast', 'Oatmeal Bowls', 16.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Peanut Butter Banana Oatmeal Bowl', 'breakfast', 'Oatmeal Bowls', 15.00),

-- === TOASTS (3) ===
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Peanut Butter Banana Toast', 'breakfast', 'Toasts', 11.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Avocado Toast', 'breakfast', 'Toasts', 12.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Caprese Toast', 'breakfast', 'Toasts', 13.00),

-- === SMOOTHIES (6) ===
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Strawberry Banana Smoothie', 'breakfast', 'Smoothies', 10.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Power Coffee Smoothie', 'breakfast', 'Smoothies', 10.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Green Machine Smoothie', 'breakfast', 'Smoothies', 10.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Blueberry Pancake Smoothie', 'breakfast', 'Smoothies', 10.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Mixed Berry Smoothie', 'breakfast', 'Smoothies', 10.00),
((SELECT id FROM restaurants WHERE name = 'Aquila'), 'Peaches n Cream Smoothie', 'breakfast', 'Smoothies', 10.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Signature', 'Acai Bowls', 'Oatmeal Bowls', 'Toasts', 'Smoothies']
WHERE name = 'Aquila';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Aquila');
