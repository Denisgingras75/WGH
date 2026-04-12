-- SANDBAR - Full Menu
-- Source: order.toasttab.com/online/sand-bar-grille-6-circuit-ave-ext-on-the-harbor
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'SANDBAR');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === APPETIZERS (24) ===
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Tuna Poke Bowl', 'pokebowl', 'Appetizers', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fried Calamari', 'calamari', 'Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chicken Wings', 'wings', 'Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chicken Tenders', 'tendys', 'Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fried Pickles', 'apps', 'Appetizers', 13.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Sandbar''s Famous Loaded Tots', 'apps', 'Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Classic Nachos', 'apps', 'Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chicken Nachos', 'apps', 'Appetizers', 19.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Steak Nachos', 'apps', 'Appetizers', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Quesadilla', 'quesadilla', 'Appetizers', 17.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chicken Quesadilla', 'quesadilla', 'Appetizers', 19.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Steak Quesadilla', 'quesadilla', 'Appetizers', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Mexican Street Corn', 'apps', 'Appetizers', 11.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Drunken Fish Fingers', 'fish', 'Appetizers', 19.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Grilled Oyster', 'apps', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Portuguise Stuffed Quahog', 'clams', 'Appetizers', 14.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'XL Coconut Shrimp', 'shrimp', 'Appetizers', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Crab Cake Sliders', 'crab', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Seared Salmon Sliders', 'fish', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Caprese Sliders', 'apps', 'Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chips Trio', 'apps', 'Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chips & Salsa', 'apps', 'Appetizers', 11.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chips & Queso', 'apps', 'Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chips & Guacamole', 'apps', 'Appetizers', 14.00),

-- === SOUPS & SALADS (6) ===
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Sandbar New England Clam Chowder', 'chowder', 'Soups & Salads', 13.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Lobster Bisque', 'soup', 'Soups & Salads', 18.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Caesar Salad', 'salad', 'Soups & Salads', 17.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Greek Salad', 'salad', 'Soups & Salads', 20.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Caprese Salad', 'salad', 'Soups & Salads', 17.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Wedge Salad', 'salad', 'Soups & Salads', 20.00),

-- === SANDWICHES - ROLLS - WRAPS (10) ===
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Lobster Roll HOT', 'lobster roll', 'Sandwiches - Rolls - Wraps', 36.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Lobster Roll COLD', 'lobster roll', 'Sandwiches - Rolls - Wraps', 36.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fish Sandwich', 'fish-sandwich', 'Sandwiches - Rolls - Wraps', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chicken BLT Caesar Wrap', 'wrap', 'Sandwiches - Rolls - Wraps', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Drunken Mermaid Fish Sandwich', 'fish-sandwich', 'Sandwiches - Rolls - Wraps', 23.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Grilled Chicken Sandwich', 'sandwich', 'Sandwiches - Rolls - Wraps', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fried Chicken Sandwich', 'fried chicken', 'Sandwiches - Rolls - Wraps', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Buffalo Blue Chicken Sandwich', 'fried chicken', 'Sandwiches - Rolls - Wraps', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Veggie Wrap', 'wrap', 'Sandwiches - Rolls - Wraps', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Hot Dog', 'sandwich', 'Sandwiches - Rolls - Wraps', 17.00),

-- === FLAME GRILLED BURGERS (3) ===
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'All American Burger', 'burger', 'Flame Grilled Burgers', 21.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Bacon Burger', 'burger', 'Flame Grilled Burgers', 23.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Dude Burger', 'burger', 'Flame Grilled Burgers', 23.00),

-- === TACOS (4) ===
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fish Baja Tacos', 'taco', 'Tacos', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Chicken Tacos', 'taco', 'Tacos', 20.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Steak Tacos', 'taco', 'Tacos', 22.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Shrimp Tacos', 'taco', 'Tacos', 22.00),

-- === ENTREES (10) ===
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fish & Chips Basket', 'fish-and-chips', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fried Chicken Basket', 'fried chicken', 'Entrees', 25.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fried Shrimp Basket', 'shrimp', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fried Scallop Basket', 'scallops', 'Entrees', 30.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Fried Seafood Platter', 'seafood', 'Entrees', 35.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Lobster Mac & Cheese', 'lobster', 'Entrees', 36.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Seafood Gumbo', 'seafood', 'Entrees', 34.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Grilled Salmon', 'fish', 'Entrees', 32.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Grilled Mahi-Mahi', 'fish', 'Entrees', 32.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Steak Tips Poutine', 'steak', 'Entrees', 35.00),

-- === SIDES (3) ===
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'French Fries', 'fries', 'Sides', 8.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Tater Tots', 'fries', 'Sides', 8.00),
((SELECT id FROM restaurants WHERE name = 'SANDBAR'), 'Truffle Fries', 'fries', 'Sides', 9.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Appetizers', 'Soups & Salads', 'Sandwiches - Rolls - Wraps', 'Flame Grilled Burgers', 'Tacos', 'Entrees', 'Sides']
WHERE name = 'SANDBAR';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'SANDBAR');
