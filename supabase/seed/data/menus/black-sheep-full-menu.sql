-- Black Sheep - Full Menu (Edgartown gourmet luncheonette & mercantile)
-- Source: https://www.blacksheeponmv.com/ + ToastTab + TripAdvisor + MV Times + Barton & Gray + reviews
-- Note: Black Sheep is in Edgartown (MV Airport), not Vineyard Haven
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Black Sheep');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Sandwiches
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'House Roast Beef with Brie', 'sandwich', 'Sandwiches', 18.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Roasted Turkey with Provolone', 'sandwich', 'Sandwiches', 17.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Country Ham with Swiss', 'sandwich', 'Sandwiches', 17.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'MV BLT', 'sandwich', 'Sandwiches', 16.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Chicken Salad Sandwich', 'sandwich', 'Sandwiches', 17.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Italian Sub', 'sandwich', 'Sandwiches', 18.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Lobster Salad Roll', 'lobster roll', 'Sandwiches', 34.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Daily Special Panini', 'sandwich', 'Sandwiches', 18.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Grilled Cheese', 'sandwich', 'Sandwiches', 14.00),
-- Salads
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Arugula Salad with Goat Cheese', 'salad', 'Salads', 16.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Caesar Salad', 'salad', 'Salads', 14.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Grain Bowl', 'salad', 'Salads', 17.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Kale Salad', 'salad', 'Salads', 15.00),
-- Soups & Sides
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Soup du Jour', 'soup', 'Soups & Sides', 10.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'House-Made Chips', 'sides', 'Soups & Sides', 6.00),
-- Prepared Foods
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Housemade Gnocchi', 'pasta', 'Prepared Foods', 22.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Cracklebread Pizza', 'pizza', 'Prepared Foods', 18.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Quiche of the Day', 'breakfast', 'Prepared Foods', 16.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Mac and Cheese', 'pasta', 'Prepared Foods', 16.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Lasagna', 'pasta', 'Prepared Foods', 22.00),
-- Cheese & Charcuterie
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Cheese Board', 'apps', 'Cheese & Charcuterie', 28.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Charcuterie Board', 'apps', 'Cheese & Charcuterie', 30.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Spanish Board', 'apps', 'Cheese & Charcuterie', 32.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Mediterranean Platter', 'apps', 'Cheese & Charcuterie', 26.00),
-- Bakery
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Croissant', 'dessert', 'Bakery', 5.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Scones', 'dessert', 'Bakery', 5.00),
((SELECT id FROM restaurants WHERE name = 'Black Sheep'), 'Cookies', 'dessert', 'Bakery', 4.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Sandwiches', 'Salads', 'Soups & Sides', 'Prepared Foods', 'Cheese & Charcuterie', 'Bakery']
WHERE name = 'Black Sheep';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Black Sheep');

-- Should show 30 dishes
