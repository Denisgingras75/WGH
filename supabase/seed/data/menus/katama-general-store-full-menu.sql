-- Katama General Store - Full Menu
-- Source: katamageneralfood.square.site, katama-general-store.res-menu.net, reviews
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Katama General Store');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === BREAKFAST (3) ===
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Breakfast Sandwich', 'breakfast sandwich', 'Breakfast', 7.95),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Bagel with Butter', 'breakfast', 'Breakfast', 3.50),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Blueberry Scone', 'breakfast', 'Breakfast', 5.00),

-- === KANSAS CITY BBQ SMOKED ON SITE (4) ===
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Baby Back Ribs', 'ribs', 'Kansas City BBQ Smoked On Site', 28.00),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Brisket Sandwich', 'sandwich', 'Kansas City BBQ Smoked On Site', 18.00),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'St Louis Ribs', 'ribs', 'Kansas City BBQ Smoked On Site', 26.00),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Pulled Pork Sandwich', 'pork', 'Kansas City BBQ Smoked On Site', 16.00),

-- === SANDWICHES & ROLLS (5) ===
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Lobster Roll', 'lobster roll', 'Sandwiches & Rolls', 32.00),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Ham & Brie', 'sandwich', 'Sandwiches & Rolls', 9.95),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'BLT on Ciabatta', 'sandwich', 'Sandwiches & Rolls', 14.00),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Curried Chicken Salad Wrap', 'wrap', 'Sandwiches & Rolls', 14.00),
((SELECT id FROM restaurants WHERE name = 'Katama General Store'), 'Tuna Poke', 'pokebowl', 'Sandwiches & Rolls', 16.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Breakfast', 'Kansas City BBQ Smoked On Site', 'Sandwiches & Rolls']
WHERE name = 'Katama General Store';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Katama General Store');
