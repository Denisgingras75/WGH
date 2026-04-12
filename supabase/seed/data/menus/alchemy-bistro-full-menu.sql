-- Alchemy Bistro & Bar - Full Menu
-- Source: alchemyedgartown.com/dinner + alchemyedgartown.com/latenight
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === TO SHARE (6) ===
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Bread Service', 'apps', 'To Share', 9.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Mixed Mediterranean Olives', 'apps', 'To Share', 16.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Smoked Blue Fish Pate', 'apps', 'To Share', 26.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Tuna Tartare', 'fish', 'To Share', 30.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Jumbo Stuffed Pork Meatball', 'pork', 'To Share', 30.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Fritto Misto', 'calamari', 'To Share', 28.00),

-- === APPETIZERS (4) ===
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Creamy Asparagus Soup', 'soup', 'Appetizers', 21.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Maple Brooks Farm''s Burrata', 'apps', 'Appetizers', 24.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Jonah Crab & Grilled Asparagus Salad', 'salad', 'Appetizers', 24.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Steamed Maine Mussels', 'mussels', 'Appetizers', 30.00),

-- === ENTREES (6) ===
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Seafood Fra Diavolo', 'pasta', 'Entrees', 58.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Atlantic Black Bass', 'fish', 'Entrees', 56.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Miso Glaze Salmon', 'fish', 'Entrees', 54.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Roasted Boneless Half Chicken', 'chicken', 'Entrees', 49.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), '10 oz Prime Ribeye Steak', 'steak', 'Entrees', 69.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Alchemy''s Wagyu Burger', 'burger', 'Entrees', 32.00),

-- === SIDES (4) ===
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Grilled Asparagus', 'veggies', 'Sides', 14.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Crispy Brussels Sprouts & Bacon', 'veggies', 'Sides', 16.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Roasted Garlic Mashed Potatoes', 'sides', 'Sides', 14.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Truffle Fries', 'fries', 'Sides', 14.00),

-- === DESSERTS (3) ===
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Chocolate Pot de Creme', 'dessert', 'Desserts', 18.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Carrot Cake', 'dessert', 'Desserts', 18.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'House Made Seasonal Scoops', 'ice cream', 'Desserts', 6.00),

-- === LATE NIGHT - BAR SNACKS (6) ===
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Hot Dog Tower', 'apps', 'Late Night Bar Snacks', 29.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Italian Nachos', 'apps', 'Late Night Bar Snacks', 16.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Grilled Cheese & Soup', 'sandwich', 'Late Night Bar Snacks', 18.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Tabasco Fries', 'fries', 'Late Night Bar Snacks', 12.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Late Night Truffle Fries', 'fries', 'Late Night Bar Snacks', 12.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'French Fries', 'fries', 'Late Night Bar Snacks', 12.00),

-- === LATE NIGHT - FLATBREAD PIZZAS (3) ===
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Cheese Flatbread', 'pizza', 'Late Night Flatbreads', 21.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'Pepperoni Flatbread', 'pizza', 'Late Night Flatbreads', 24.00),
((SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar'), 'La Fiamma Rossa Flatbread', 'pizza', 'Late Night Flatbreads', 24.00);

UPDATE restaurants
SET menu_section_order = ARRAY['To Share', 'Appetizers', 'Entrees', 'Sides', 'Desserts', 'Late Night Bar Snacks', 'Late Night Flatbreads']
WHERE name = 'Alchemy Bistro & Bar';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Alchemy Bistro & Bar');
