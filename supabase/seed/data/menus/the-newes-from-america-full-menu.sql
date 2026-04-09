-- The Newes From America - Full Menu
-- Source: farawaymarthasvineyard.com/the-newes-from-america (via Uber Eats delivery menu)
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Newes From America');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Starters
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Spinach Artichoke Dip', 'apps', 'Starters', 15.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Crispy Brussels Sprouts', 'apps', 'Starters', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Pub Wings', 'wings', 'Starters', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Point Judith Calamari', 'calamari', 'Starters', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Bag O'' Rings', 'onion rings', 'Starters', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Bag O'' Fries', 'fries', 'Starters', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Skillet Mushrooms', 'apps', 'Starters', 18.00),

-- Soups and Salads
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'New England Clam Chowder', 'chowder', 'Soups and Salads', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Classic French Onion', 'soup', 'Soups and Salads', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Chicory Salad', 'salad', 'Soups and Salads', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Caesar Salad', 'salad', 'Soups and Salads', 17.00),

-- Sandwiches
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'French Dip', 'sandwich', 'Sandwiches', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Crispy Chicken Sandwich', 'fried chicken', 'Sandwiches', 23.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), '1742 Burger', 'burger', 'Sandwiches', 27.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Reuben', 'sandwich', 'Sandwiches', 21.00),

-- Mains
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Chicken Pot Pie', 'chicken', 'Mains', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Fish and Chips', 'fish-and-chips', 'Mains', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Bangers and Mash', 'entree', 'Mains', 24.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Pork Ribs', 'ribs', 'Mains', 27.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), '10 oz New York Strip', 'steak', 'Mains', 42.00),
((SELECT id FROM restaurants WHERE name = 'The Newes From America'), 'Roasted Cod', 'fish', 'Mains', 36.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Starters', 'Soups and Salads', 'Sandwiches', 'Mains']
WHERE name = 'The Newes From America';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Newes From America');
