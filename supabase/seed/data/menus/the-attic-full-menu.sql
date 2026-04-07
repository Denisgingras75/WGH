-- The Attic - Full Menu (Vineyard Haven gastropub)
-- Source: the-attic-menu-2025-fall.pdf
-- Run this in Supabase SQL Editor
-- IMPORTANT: Delete existing The Attic dishes first to avoid duplicates

-- Fix town
UPDATE restaurants SET town = 'Vineyard Haven' WHERE name = 'The Attic';

-- Delete old dishes
DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Attic');

-- Insert complete menu (34 items)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Starters
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Short Rib Poutine', 'pork', 'Starters', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Crispy Sweet Chili Brussel Sprouts', 'apps', 'Starters', 16.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Tuna Tartar', 'apps', 'Starters', 22.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Fried Cheese Curds', 'apps', 'Starters', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Attic Wings', 'wings', 'Starters', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Waterside''s House Potato Chips', 'apps', 'Starters', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Beer Battered Onion Rings', 'onion rings', 'Starters', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Portuguese Mussels', 'mussels', 'Starters', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'House-made Crab Cakes', 'crab', 'Starters', 24.00),
-- Salads & Soups
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Attic Salad', 'salad', 'Salads & Soups', 16.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Butternut Squash & Spinach Salad', 'salad', 'Salads & Soups', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Caesar Salad', 'salad', 'Salads & Soups', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'French Onion Soup', 'soup', 'Salads & Soups', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Soup of the Day', 'soup', 'Salads & Soups', 12.00),
-- Burgers
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Classic Burger', 'burger', 'Burgers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Attic Smash Burger', 'burger', 'Burgers', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Veggie Burger', 'burger', 'Burgers', 17.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Turkey Burger', 'burger', 'Burgers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Mr. Bowen', 'burger', 'Burgers', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Black & Bleu Burger', 'burger', 'Burgers', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Firehouse Burger', 'burger', 'Burgers', 20.00),
-- Handhelds
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Attic Fried Chicken Sandwich', 'fried chicken', 'Handhelds', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Pulled Pork Sandwich', 'pork', 'Handhelds', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Fried Codfish Sandwich', 'fish-sandwich', 'Handhelds', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'American Wagyu Hot Dog', 'entree', 'Handhelds', 16.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Lobster Roll', 'lobster roll', 'Handhelds', 38.00),
-- Mac & Cheese
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Classic Mac & Cheese', 'pasta', 'Mac & Cheese', 16.00),
-- Entrees
((SELECT id FROM restaurants WHERE name = 'The Attic'), '12 oz Prime N.Y. Strip', 'steak', 'Entrees', 48.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Hoisin Glazed Salmon Rice Bowl', 'fish', 'Entrees', 35.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Herb Roasted 1/2 Chicken', 'chicken', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Fish & Chips', 'fish-and-chips', 'Entrees', 24.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Harissa Roasted Cauliflower', 'veggies', 'Entrees', 22.00),
-- Sides
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Hand-cut Fries', 'fries', 'Sides', 8.00),
((SELECT id FROM restaurants WHERE name = 'The Attic'), 'Side Salad', 'salad', 'Sides', 8.00);

-- Update menu_section_order
UPDATE restaurants
SET menu_section_order = ARRAY['Starters', 'Salads & Soups', 'Burgers', 'Handhelds', 'Mac & Cheese', 'Entrees', 'Sides']
WHERE name = 'The Attic';

-- Verify
SELECT COUNT(*) as dish_count
FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Attic');

-- Should show 34 dishes
