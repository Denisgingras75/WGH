-- La Choza MV - Full Menu
-- Source: lachozamv.com (via Postmates delivery menu)
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'La Choza MV');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Snacks
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Queso + Chips', 'apps', 'Snacks', 8.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Chips + Salsa', 'apps', 'Snacks', 9.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Guacamole + Chips', 'apps', 'Snacks', 12.00),

-- House Specialties
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Chicken Burrito Bowl', 'burrito', 'House Specialties', 21.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Rice & Bean Burrito Bowl', 'burrito', 'House Specialties', 17.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Beef Burrito Bowl', 'burrito', 'House Specialties', 21.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Crunch-Wrap', 'wrap', 'House Specialties', 19.00),

-- Burritos + Bowls
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Pulled Pork Barbacoa Burrito', 'burrito', 'Burritos + Bowls', 18.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Shredded Chicken Burrito', 'burrito', 'Burritos + Bowls', 18.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Shredded Beef Burrito', 'burrito', 'Burritos + Bowls', 19.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Vegan Chorizo Burrito', 'burrito', 'Burritos + Bowls', 17.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Mexican Chorizo Burrito', 'burrito', 'Burritos + Bowls', 18.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Rice + Black Bean Burrito', 'burrito', 'Burritos + Bowls', 12.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Combo-Ritas', 'burrito', 'Burritos + Bowls', 22.00),

-- Quesadillas
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Cheese Quesadilla', 'quesadilla', 'Quesadillas', 12.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Build-Your-Own Quesadilla', 'quesadilla', 'Quesadillas', 18.00),

-- Tacos
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Mexican Chorizo Tacos', 'taco', 'Tacos', 12.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Pork Barbacoa Tacos', 'taco', 'Tacos', 12.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Shredded Beef Tacos', 'taco', 'Tacos', 12.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Chicken Tacos', 'taco', 'Tacos', 12.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Vegan Chorizo Tacos', 'taco', 'Tacos', 12.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Black Bean Tacos', 'taco', 'Tacos', 8.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Combo Tacos', 'taco', 'Tacos', 12.00),

-- Dessert
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Chocolate Chip Cookie', 'dessert', 'Dessert', 4.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Lemon White Chocolate Chip Cookie', 'dessert', 'Dessert', 4.00),
((SELECT id FROM restaurants WHERE name = 'La Choza MV'), 'Sugar Cookie', 'dessert', 'Dessert', 4.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Snacks', 'House Specialties', 'Burritos + Bowls', 'Quesadillas', 'Tacos', 'Dessert']
WHERE name = 'La Choza MV';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'La Choza MV');
