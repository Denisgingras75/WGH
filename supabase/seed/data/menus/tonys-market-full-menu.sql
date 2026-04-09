-- Tony's Market - Full Menu
-- Source: tonysmarketmv.com (2025 Take Out Menu PDF + website)
-- Run this in Supabase SQL Editor

-- Delete old dishes
DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tony''s Market');

-- Insert complete menu (32 items)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === BREAKFAST SANDWICHES (6) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Bacon, Egg & Cheese', 'breakfast sandwich', 'Breakfast Sandwiches', 8.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Sausage, Egg & Cheese', 'breakfast sandwich', 'Breakfast Sandwiches', 8.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Ham, Egg & Cheese', 'breakfast sandwich', 'Breakfast Sandwiches', 8.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Veggie Egg & Cheese', 'breakfast sandwich', 'Breakfast Sandwiches', 8.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Egg & Cheese', 'breakfast sandwich', 'Breakfast Sandwiches', 6.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Breakfast Wrap', 'wrap', 'Breakfast Sandwiches', 10.00),

-- === COLD SPECIALTY SANDWICHES (6) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Italian Sub', 'sandwich', 'Cold Specialty Sandwiches', 14.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Turkey Club', 'sandwich', 'Cold Specialty Sandwiches', 14.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'BLT', 'sandwich', 'Cold Specialty Sandwiches', 12.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Chicken Salad Sandwich', 'sandwich', 'Cold Specialty Sandwiches', 13.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Tuna Salad Sandwich', 'sandwich', 'Cold Specialty Sandwiches', 13.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Egg Salad Sandwich', 'sandwich', 'Cold Specialty Sandwiches', 13.00),

-- === HOT SPECIALTY SANDWICHES (5) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Chicken Parm Sandwich', 'sandwich', 'Hot Specialty Sandwiches', 14.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Chicken Filet Sandwich', 'sandwich', 'Hot Specialty Sandwiches', 13.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Buffalo Chicken Sandwich', 'sandwich', 'Hot Specialty Sandwiches', 13.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Reuben', 'sandwich', 'Hot Specialty Sandwiches', 14.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Grilled Cheese', 'sandwich', 'Hot Specialty Sandwiches', 8.00),

-- === BUILD YOUR OWN SANDWICH (3) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Build Your Own Sandwich (Full)', 'sandwich', 'Build Your Own', 13.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Build Your Own Sandwich (Small)', 'sandwich', 'Build Your Own', 10.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Build Your Own Wrap', 'wrap', 'Build Your Own', 13.00),

-- === TONY''S BOWLS (3) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Grilled Chicken Bowl', 'chicken', 'Tony''s Bowls', 16.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Flank Steak Bowl', 'steak', 'Tony''s Bowls', 16.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Salmon Bowl', 'fish', 'Tony''s Bowls', 16.00),

-- === WRAPS (2) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Island Veggie Wrap', 'wrap', 'Wraps', 12.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Chicken Caesar Wrap', 'wrap', 'Wraps', 13.00),

-- === SALADS (3) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'House Salad', 'salad', 'Salads', 10.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Caesar Salad', 'salad', 'Salads', 10.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Grilled Chicken Salad', 'salad', 'Salads', 14.00),

-- === HOT FOODS (4) ===
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Chicken Wings (8)', 'wings', 'Hot Foods', 14.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Chicken Fingers', 'tendys', 'Hot Foods', 12.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Hot Dog', 'entree', 'Hot Foods', 5.00),
((SELECT id FROM restaurants WHERE name = 'Tony''s Market'), 'Fries', 'fries', 'Hot Foods', 6.00);

-- Update menu section order
UPDATE restaurants
SET menu_section_order = ARRAY['Breakfast Sandwiches', 'Cold Specialty Sandwiches', 'Hot Specialty Sandwiches', 'Build Your Own', 'Tony''s Bowls', 'Wraps', 'Salads', 'Hot Foods']
WHERE name = 'Tony''s Market';

-- Verify
SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tony''s Market');
