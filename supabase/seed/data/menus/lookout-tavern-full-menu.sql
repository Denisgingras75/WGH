-- Lookout Tavern - Full Menu (June 2025)
-- Source: Menu photo from lookoutmv.com/menus/ (LOOKOUT-TAVERN-JUNE-20-2025-FINAL.jpg)
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Lookout Tavern');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Raw Bar
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Jumbo Shrimp Cocktail (4)', 'shrimp', 'Raw Bar', 16.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Jumbo Shrimp Cocktail (Half Dozen)', 'shrimp', 'Raw Bar', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Jumbo Shrimp Cocktail (Dozen)', 'shrimp', 'Raw Bar', 44.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Spearpoint Oysters (4)', 'apps', 'Raw Bar', 16.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Spearpoint Oysters (Half Dozen)', 'apps', 'Raw Bar', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Spearpoint Oysters (Dozen)', 'apps', 'Raw Bar', 44.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Littlenecks (Half Dozen)', 'clams', 'Raw Bar', 19.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Littlenecks (Dozen)', 'clams', 'Raw Bar', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Raw Bar Sampler', 'apps', 'Raw Bar', 20.95),
-- Lobster Specialties
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Jumbo Tavern Lobster Roll', 'lobster roll', 'Lobster Specialties', 36.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Jumbo Sautéed Lobster Roll', 'lobster roll', 'Lobster Specialties', 38.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Lobster BLT', 'lobster roll', 'Lobster Specialties', 39.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Lobster Tacos', 'taco', 'Lobster Specialties', 30.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Lobster Mac & Cheese', 'lobster', 'Lobster Specialties', 38.95),
-- Chowder & Bisque
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'New England Clam Chowder', 'chowder', 'Chowder & Bisque', 12.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Creamy Lobster Bisque', 'soup', 'Chowder & Bisque', 15.95),
-- Appetizers
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'French Fries', 'fries', 'Appetizers', 13.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Sweet Potato Fries Basket', 'fries', 'Appetizers', 14.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'House Made Chips', 'fries', 'Appetizers', 12.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Breaded Chicken Wings', 'wings', 'Appetizers', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Fresh Breaded Chicken Fingers', 'tendys', 'Appetizers', 19.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Steak Skewers', 'steak', 'Appetizers', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Crab Cakes', 'crab', 'Appetizers', 23.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Fried Calamari', 'calamari', 'Appetizers', 19.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Popcorn Shrimp', 'shrimp', 'Appetizers', 19.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Coconut Shrimp', 'shrimp', 'Appetizers', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Fish Bites', 'fish', 'Appetizers', 15.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Sauteed Mussels', 'mussels', 'Appetizers', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Coconut Curry Mussels', 'mussels', 'Appetizers', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Steamers', 'clams', 'Appetizers', 24.95),
-- Salads
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Caesar Salad', 'salad', 'Salads', 16.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Cobb Salad', 'salad', 'Salads', 24.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Club House Salad', 'salad', 'Salads', 21.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Spinach Salad', 'salad', 'Salads', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Garden Salad', 'salad', 'Salads', 15.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Lookout Summer Salad', 'salad', 'Salads', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Lobster Salad', 'salad', 'Salads', 22.95),
-- Battered & Fried
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Beer Battered Fish & Chips', 'fish-and-chips', 'Battered & Fried', 25.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Scallop Plate', 'scallops', 'Battered & Fried', 34.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Shrimp Plate', 'shrimp', 'Battered & Fried', 26.95),
-- Burgers
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Cheeseburger', 'burger', 'Burgers', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Texas Burger', 'burger', 'Burgers', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'B.B. King', 'burger', 'Burgers', 23.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Honey Mustard', 'burger', 'Burgers', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Patty Melt', 'burger', 'Burgers', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Surf N Turf', 'burger', 'Burgers', 30.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Beyond Burger', 'burger', 'Burgers', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Italian Caprese', 'burger', 'Burgers', 23.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Mikes Burger', 'burger', 'Burgers', 26.95),
-- Chef Specialties
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Sirloin Tips', 'steak', 'Chef Specialties', 32.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Jumbo Shrimp (6)', 'shrimp', 'Chef Specialties', 27.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Cajun Mahi Mahi', 'fish', 'Chef Specialties', 26.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Guava BBQ Ribs', 'ribs', 'Chef Specialties', 33.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Salmon', 'fish', 'Chef Specialties', 29.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Mac & Cheese', 'pasta', 'Chef Specialties', 25.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Lobster Mac & Cheese', 'lobster', 'Chef Specialties', 38.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Buffalo Chicken Mac & Cheese', 'pasta', 'Chef Specialties', 30.95),
-- Tacos
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Chicken Tacos', 'taco', 'Tacos', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Mahi Mahi Tacos', 'taco', 'Tacos', 21.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Tuna Tacos', 'taco', 'Tacos', 21.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Steak Tacos', 'taco', 'Tacos', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Lobster Tacos', 'taco', 'Tacos', 30.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Fish Tacos', 'taco', 'Tacos', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Cajun Shrimp Tacos', 'taco', 'Tacos', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Veggie Tacos', 'taco', 'Tacos', 19.95),
-- Sandwiches
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Chicken Club', 'sandwich', 'Sandwiches', 21.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Buttermilk Crispy Fried Chicken Breast', 'fried chicken', 'Sandwiches', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Chicken Breast', 'sandwich', 'Sandwiches', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Chicken in Paradise', 'sandwich', 'Sandwiches', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Portabella Mushroom', 'sandwich', 'Sandwiches', 21.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'California Turkey', 'sandwich', 'Sandwiches', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Fish Sandwich', 'fish-sandwich', 'Sandwiches', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Yellowfin Tuna', 'fish-sandwich', 'Sandwiches', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Salmon BLT', 'fish-sandwich', 'Sandwiches', 23.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Jumbo Hot Dog', 'entree', 'Sandwiches', 17.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Cajun Mahi', 'fish-sandwich', 'Sandwiches', 21.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Grilled Reuben', 'sandwich', 'Sandwiches', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Cranberry-Walnut Chicken Salad', 'sandwich', 'Sandwiches', 18.95),
-- Panini
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Chicken Pesto Panini', 'sandwich', 'Panini', 20.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Turkey Flatbread Panini', 'sandwich', 'Panini', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Caprese Panini', 'sandwich', 'Panini', 22.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Tuna Melt Panini', 'sandwich', 'Panini', 18.95),
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Italian Panini', 'sandwich', 'Panini', 22.95),
-- Dessert
((SELECT id FROM restaurants WHERE name = 'Lookout Tavern'), 'Godiva Chocolate Cheesecake', 'dessert', 'Dessert', 15.00);

-- Update menu_section_order
UPDATE restaurants
SET menu_section_order = ARRAY['Raw Bar', 'Lobster Specialties', 'Chowder & Bisque', 'Appetizers', 'Salads', 'Battered & Fried', 'Burgers', 'Chef Specialties', 'Tacos', 'Sandwiches', 'Panini', 'Dessert']
WHERE name = 'Lookout Tavern';

-- Verify
SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Lookout Tavern');
