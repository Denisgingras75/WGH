-- Among The Flowers Cafe - Full Menu (Edgartown breakfast & lunch cafe)
-- Source: https://amongtheflowersmv.com/menu + TripAdvisor + Yelp + Postcard + reviews
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Breakfast
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Classic Omelette', 'breakfast', 'Breakfast', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Smoked Salmon Omelette', 'breakfast', 'Breakfast', 19.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Veggie Omelette', 'breakfast', 'Breakfast', 17.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Belgian Waffle', 'waffles', 'Breakfast', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Fresh Fruit Waffle', 'waffles', 'Breakfast', 18.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Classic Crepe', 'breakfast', 'Breakfast', 15.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Strawberry Nutella Crepe', 'breakfast', 'Breakfast', 17.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Blueberry French Toast', 'breakfast', 'Breakfast', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Blueberry Pancakes', 'pancakes', 'Breakfast', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Avocado Toast', 'breakfast', 'Breakfast', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Corned Beef Hash and Eggs', 'breakfast', 'Breakfast', 18.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Eggs Benedict', 'eggs-benedict', 'Breakfast', 18.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Breakfast Sandwich', 'breakfast sandwich', 'Breakfast', 14.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Greek Yogurt and Granola Bowl', 'breakfast', 'Breakfast', 15.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'House-Made Granola with Fresh Fruit', 'breakfast', 'Breakfast', 14.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Acai Bowl', 'breakfast', 'Breakfast', 16.00),
-- Bakery
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Cinnamon Roll', 'dessert', 'Bakery', 7.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Blueberry Muffin', 'dessert', 'Bakery', 5.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Morning Glory Muffin', 'dessert', 'Bakery', 5.00),
-- Quiche & Savory
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Broccoli Cheddar Quiche', 'breakfast', 'Quiche & Savory', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Quiche of the Day', 'breakfast', 'Quiche & Savory', 16.00),
-- Salads
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Garden Salad', 'salad', 'Salads', 14.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Caesar Salad', 'salad', 'Salads', 15.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Grilled Chicken Salad', 'salad', 'Salads', 18.00),
-- Soups
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'New England Clam Chowder', 'chowder', 'Soups', 12.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Soup of the Day', 'soup', 'Soups', 10.00),
-- Sandwiches & Wraps
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Lobster Roll', 'lobster roll', 'Sandwiches & Wraps', 32.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Chicken Salad Sandwich', 'sandwich', 'Sandwiches & Wraps', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Roast Beef and Cheddar Sandwich', 'sandwich', 'Sandwiches & Wraps', 17.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Turkey Club', 'sandwich', 'Sandwiches & Wraps', 17.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'BLT', 'sandwich', 'Sandwiches & Wraps', 15.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Quinoa Hummus Veggie Wrap', 'wrap', 'Sandwiches & Wraps', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Grilled Chicken Wrap', 'wrap', 'Sandwiches & Wraps', 17.00),
-- Dinner (Summer Patio)
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Steamed Mussels', 'mussels', 'Dinner', 18.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Smoked Bluefish Pate', 'apps', 'Dinner', 16.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'New England Clam Bake', 'seafood', 'Dinner', 48.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Grilled Swordfish', 'fish', 'Dinner', 34.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Pan Seared Scallops', 'scallops', 'Dinner', 36.00),
((SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe'), 'Grilled Chicken Paillard', 'chicken', 'Dinner', 28.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Breakfast', 'Bakery', 'Quiche & Savory', 'Salads', 'Soups', 'Sandwiches & Wraps', 'Dinner']
WHERE name = 'Among The Flowers Cafe';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Among The Flowers Cafe');

-- Should show 39 dishes
