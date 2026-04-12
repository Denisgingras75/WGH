-- Back Door Donuts - Full Menu
-- Source: backdoordonuts.com/menu (April 2026)
-- Run this in Supabase SQL Editor
-- IMPORTANT: Replaces all existing Back Door Donuts dishes (full refresh)

-- Delete old dishes
DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Back Door Donuts');

-- Insert complete menu (48 items — skipping coffee drinks and savory bread)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Donuts (23 items)
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Apple Cider Donut', 'donuts', 'Donuts', 4.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Apple Fritter', 'donuts', 'Donuts', 9.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Boston Cream Donut', 'donuts', 'Donuts', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Buttercrunch Donut', 'donuts', 'Donuts', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Buttermilk Glazed Donut', 'donuts', 'Donuts', 3.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Chocolate Coconut Donut', 'donuts', 'Donuts', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Chocolate Frosted Donut', 'donuts', 'Donuts', 3.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Chocolate Glazed Donut', 'donuts', 'Donuts', 3.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Cinnamon Roll', 'donuts', 'Donuts', 6.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Cinnamon Sugar Donut', 'donuts', 'Donuts', 6.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Coconut Donut', 'donuts', 'Donuts', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Double Chocolate Donut', 'donuts', 'Donuts', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'GF Boston Cream Donut', 'donuts', 'Donuts', 4.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'GF Chocolate Frosted Donut', 'donuts', 'Donuts', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Honey Dipped Donut', 'donuts', 'Donuts', 3.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Lemon Jelly Donut', 'donuts', 'Donuts', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Maple Bacon Donut', 'donuts', 'Donuts', 4.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Mini Fritter', 'donuts', 'Donuts', 2.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Old Fashioned Donut', 'donuts', 'Donuts', 2.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Party Donut', 'donuts', 'Donuts', 3.25),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Plain GF Donut', 'donuts', 'Donuts', 3.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Powdered Donut', 'donuts', 'Donuts', 3.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Raspberry Jelly Donut', 'donuts', 'Donuts', 3.50),
-- Baked Goods (3 dessert items — skipping Cheese Bread and Linguica Roll which are savory)
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Brownie', 'dessert', 'Baked Goods', 5.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Cream Puff', 'dessert', 'Baked Goods', 4.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Eclair', 'dessert', 'Baked Goods', 4.00),
-- Cookies (7 items)
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Black & White Cookie', 'dessert', 'Cookies', 5.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Chocolate Chip Cookie', 'dessert', 'Cookies', 4.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Florentine Cookie', 'dessert', 'Cookies', 5.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Hermit Cookie', 'dessert', 'Cookies', 3.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Oatmeal Cookie', 'dessert', 'Cookies', 4.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Peanut Butter Cookie', 'dessert', 'Cookies', 4.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Sugar Cookie', 'dessert', 'Cookies', 3.00),
-- Croissants (6 items — savory ones categorized as breakfast sandwich)
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Almond Croissant', 'dessert', 'Croissants', 6.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Chocolate Croissant', 'dessert', 'Croissants', 6.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Plain Croissant', 'breakfast', 'Croissants', 4.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Ham & Swiss Croissant', 'breakfast sandwich', 'Croissants', 7.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Ham, Egg & Cheese Croissant', 'breakfast sandwich', 'Croissants', 7.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Spinach Feta Croissant', 'breakfast sandwich', 'Croissants', 7.50),
-- Danish (3 items)
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Blueberry Danish', 'breakfast', 'Danish', 4.25),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Cheese Danish', 'breakfast', 'Danish', 4.25),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Lemon Danish', 'breakfast', 'Danish', 4.25),
-- Muffins (5 items)
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Apple Walnut Muffin', 'breakfast', 'Muffins', 4.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Blueberry Muffin', 'breakfast', 'Muffins', 4.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Chocolate Chip Muffin', 'breakfast', 'Muffins', 4.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Cranberry Muffin', 'breakfast', 'Muffins', 4.50),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Lemon Muffin', 'breakfast', 'Muffins', 4.50),
-- Scones (4 items)
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Blueberry Scone', 'breakfast', 'Scones', 5.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Chocolate Chip Scone', 'breakfast', 'Scones', 5.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Cinnamon Scone', 'breakfast', 'Scones', 5.00),
((SELECT id FROM restaurants WHERE name = 'Back Door Donuts'), 'Cranberry Scone', 'breakfast', 'Scones', 5.00);

-- Update menu_section_order
UPDATE restaurants
SET menu_section_order = ARRAY['Donuts', 'Baked Goods', 'Cookies', 'Croissants', 'Danish', 'Muffins', 'Scones']
WHERE name = 'Back Door Donuts';

-- Verify import
SELECT COUNT(*) as dish_count
FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Back Door Donuts');

-- Should show 48 dishes
