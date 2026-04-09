-- The Ritz Cafe - Full Menu
-- Source: Actual menu photo (April 2026)
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard');

-- Insert complete menu (15 items)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Bar Bites
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Chicken Wings', 'wings', 'Bar Bites', 15.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Chicken Tenders', 'tendys', 'Bar Bites', 11.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Pretzel Sticks', 'apps', 'Bar Bites', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Cup of Chili', 'soup', 'Bar Bites', 6.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Frito Pie', 'entree', 'Bar Bites', 9.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Onion Rings', 'onion rings', 'Bar Bites', 9.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'French Fries', 'fries', 'Bar Bites', 7.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'The Hot Mess', 'apps', 'Bar Bites', 22.00),
-- Handhelds
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Reliable Ritz Burger', 'burger', 'Handhelds', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'BBQ Burger', 'burger', 'Handhelds', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Chicken Sandwich', 'fried chicken', 'Handhelds', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Chicken Caesar Wrap', 'wrap', 'Handhelds', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Chicken Bacon Ranch Wrap', 'wrap', 'Handhelds', 15.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Whiskey Grilled Cheese', 'sandwich', 'Handhelds', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard'), 'Chili Cheese Dog', 'entree', 'Handhelds', 10.00);

-- Update menu_section_order
UPDATE restaurants
SET menu_section_order = ARRAY['Bar Bites', 'Handhelds']
WHERE name = 'The Ritz • Martha''s Vineyard';

-- Verify
SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Ritz • Martha''s Vineyard');

-- Should show 15 dishes
