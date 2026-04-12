-- Vineyard Caribbean Cuisine - Full Menu
-- Source: vineyardcaribbeancuisine.com + Yelp reviews + articles
-- Run this in Supabase SQL Editor

-- Delete old dishes
DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine');

-- Insert complete menu (28 items)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === PLATTERS (8) ===
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Jerk Chicken Platter', 'chicken', 'Platters', 22.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Curry Goat Platter', 'entree', 'Platters', 25.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Oxtail Platter', 'entree', 'Platters', 28.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Brown Stew Chicken Platter', 'chicken', 'Platters', 22.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Curry Chicken Platter', 'curry', 'Platters', 22.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Jerk Pork Platter', 'pork', 'Platters', 22.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Escovitch Red Snapper', 'fish', 'Platters', 28.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Fried Red Snapper', 'fish', 'Platters', 28.00),

-- === SEAFOOD (4) ===
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Curry Shrimp', 'shrimp', 'Seafood', 25.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Jerk Shrimp', 'shrimp', 'Seafood', 25.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Steamed Fish', 'fish', 'Seafood', 26.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Ackee and Saltfish', 'fish', 'Seafood', 22.00),

-- === BREAKFAST (2) ===
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Ackee and Saltfish Breakfast', 'breakfast', 'Breakfast', 18.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Callaloo and Saltfish Breakfast', 'breakfast', 'Breakfast', 18.00),

-- === SIDES (8) ===
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Rice and Peas', 'sides', 'Sides', 5.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Steamed Vegetables', 'veggies', 'Sides', 5.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Fried Plantain', 'sides', 'Sides', 5.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Festival (Fried Dumpling)', 'sides', 'Sides', 5.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Coleslaw', 'sides', 'Sides', 4.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Mac and Cheese', 'sides', 'Sides', 6.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Cornbread', 'sides', 'Sides', 3.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Bammy', 'sides', 'Sides', 5.00),

-- === PATTIES & SNACKS (6) ===
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Beef Patty', 'apps', 'Patties & Snacks', 7.50),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Curry Chicken Patty', 'apps', 'Patties & Snacks', 7.50),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Veggie Patty', 'apps', 'Patties & Snacks', 7.50),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Jerk Chicken Wings', 'wings', 'Patties & Snacks', 15.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Fried Chicken', 'fried chicken', 'Patties & Snacks', 15.00),
((SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine'), 'Coconut Shrimp', 'shrimp', 'Patties & Snacks', 16.00);

-- Update menu section order
UPDATE restaurants
SET menu_section_order = ARRAY['Platters', 'Seafood', 'Breakfast', 'Sides', 'Patties & Snacks']
WHERE name = 'Vineyard Caribbean Cuisine';

-- Verify
SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Vineyard Caribbean Cuisine');
