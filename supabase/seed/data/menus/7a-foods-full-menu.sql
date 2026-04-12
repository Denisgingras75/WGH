-- 7aFoods - Full Menu
-- Source: order.toasttab.com/online/7a-foods + 7afoods.com/menu
-- Note: 7a's prepared food (sandwiches, soups, salads) rotates daily.
-- This covers their fixed baked goods + well-documented standard items.
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = '7aFoods');

-- Insert menu (40 items)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === BAKED GOODS (24) ===
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Biscuit', 'pastry', 'Baked Goods', 2.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Special Biscuit', 'pastry', 'Baked Goods', 3.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Chocolate Chip Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Ginger Molasses Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Oatmeal Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Peanut Butter Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Compost Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Chocolate Chip Peanut Butter Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Sugar Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Breakfast Cookie', 'dessert', 'Baked Goods', 4.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Lemon Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'White Choc Cranberry Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Banana White Choc Chip Cookie', 'dessert', 'Baked Goods', 3.50),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Blueberry Muffin', 'pastry', 'Baked Goods', 3.75),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Special Muffin', 'pastry', 'Baked Goods', 3.75),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Lemon Bar', 'dessert', 'Baked Goods', 4.25),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Crumb Cake', 'dessert', 'Baked Goods', 4.25),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Orange Blossom', 'pastry', 'Baked Goods', 4.25),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Scone', 'pastry', 'Baked Goods', 3.75),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Brownie', 'dessert', 'Baked Goods', 4.25),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Carrot Cake', 'dessert', 'Baked Goods', 4.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Bread Pudding', 'dessert', 'Baked Goods', 3.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Lemon Cake', 'dessert', 'Baked Goods', 3.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Special Scone', 'pastry', 'Baked Goods', 4.00),

-- === BREAKFAST (6) ===
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Egg Sandwich', 'breakfast sandwich', 'Breakfast', 8.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Egg & Bacon Sandwich', 'breakfast sandwich', 'Breakfast', 10.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Egg & Sausage Sandwich', 'breakfast sandwich', 'Breakfast', 10.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Bagel with Cream Cheese', 'breakfast', 'Breakfast', 5.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Bagel with Lox', 'breakfast', 'Breakfast', 12.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Daily Frittata', 'breakfast', 'Breakfast', 8.00),

-- === SANDWICHES (6) ===
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'The Liz Lemon', 'sandwich', 'Sandwiches', 16.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Chicken Salad Sandwich', 'sandwich', 'Sandwiches', 14.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Tuna Melt', 'sandwich', 'Sandwiches', 14.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Pulled Pork Sandwich', 'pork', 'Sandwiches', 15.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Fall Vegetable Melt', 'sandwich', 'Sandwiches', 14.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Grilled Cheese', 'sandwich', 'Sandwiches', 10.00),

-- === SOUPS & SALADS (4) ===
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Soup of the Day', 'soup', 'Soups & Salads', 8.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Curried Lentil Soup', 'soup', 'Soups & Salads', 8.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Farm Salad', 'salad', 'Soups & Salads', 12.00),
((SELECT id FROM restaurants WHERE name = '7aFoods'), 'Daily Grain Bowl', 'salad', 'Soups & Salads', 14.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Baked Goods', 'Breakfast', 'Sandwiches', 'Soups & Salads']
WHERE name = '7aFoods';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = '7aFoods');
