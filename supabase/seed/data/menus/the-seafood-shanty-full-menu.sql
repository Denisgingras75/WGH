-- The Seafood Shanty - Full Menu
-- Source: order.toasttab.com/online/the-seafood-shanty-31-dock-street-3450
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Seafood Shanty');

-- Insert complete menu (86 items)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === APPETIZERS (14) ===
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Lobster Dip', 'lobster', 'Appetizers', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Lobster Quesadilla', 'lobster', 'Appetizers', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Mussels Shanty Style', 'mussels', 'Appetizers', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Hummus Platter', 'apps', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fried Calamari', 'calamari', 'Appetizers', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Cheese Quesadilla', 'quesadilla', 'Appetizers', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Shanty Wings', 'wings', 'Appetizers', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Chicken Fingers', 'tendys', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Burrito Bowl', 'entree', 'Appetizers', 24.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Stuffed Quahogs', 'clams', 'Appetizers', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Buffalo Fingers', 'tendys', 'Appetizers', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Onion Rings', 'onion rings', 'Appetizers', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Basket of Fries', 'fries', 'Appetizers', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Shrimp Cocktail', 'shrimp', 'Appetizers', 17.00),

-- === SALAD (14) ===
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Garden Salad', 'salad', 'Salad', 16.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Garden Salad w/ Chicken', 'salad', 'Salad', 30.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Caesar Salad', 'salad', 'Salad', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Caesar Salad w/ Chicken', 'salad', 'Salad', 32.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Caesar Salad w/ Salmon', 'salad', 'Salad', 32.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Caesar Salad w/ Lobster', 'salad', 'Salad', 42.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Mediterranean Salad', 'salad', 'Salad', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Mediterranean Salad w/ Chicken', 'salad', 'Salad', 32.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Mediterranean Salad w/ Salmon', 'salad', 'Salad', 32.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Mediterranean Salad w/ Lobster', 'salad', 'Salad', 42.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Summer Salad', 'salad', 'Salad', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Summer Salad w/ Chicken', 'salad', 'Salad', 32.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Summer Salad w/ Salmon', 'salad', 'Salad', 32.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Summer Salad w/ Lobster', 'salad', 'Salad', 42.00),

-- === SANDWICHES (11) ===
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Lobster Roll', 'lobster roll', 'Sandwiches', 34.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Warm Buttered Lobster Roll', 'lobster roll', 'Sandwiches', 36.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Shanty Burger', 'burger', 'Sandwiches', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fish Sandwich', 'fish-sandwich', 'Sandwiches', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Grilled Chicken Sandwich', 'sandwich', 'Sandwiches', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Cajun Mahi Sandwich', 'fish-sandwich', 'Sandwiches', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Pan Seared Tuna Sandwich', 'fish-sandwich', 'Sandwiches', 22.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Salmon Burger', 'burger', 'Sandwiches', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Beyond Burger', 'burger', 'Sandwiches', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fried Shrimp Tacos', 'taco', 'Sandwiches', 22.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Island Chicken Wrap', 'wrap', 'Sandwiches', 20.00),

-- === ENTREES (6) ===
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fried Clams', 'clams', 'Entrees', 39.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fish & Chips', 'fish-and-chips', 'Entrees', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Steamed Lobster', 'lobster', 'Entrees', 25.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fried Shrimp', 'shrimp', 'Entrees', 29.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fried Scallops', 'scallops', 'Entrees', 36.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Fisherman''s Platter', 'seafood', 'Entrees', 46.00),

-- === SUSHI ROLLS (19) ===
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Salmon Roll', 'sushi', 'Sushi Rolls', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Tuna Roll', 'sushi', 'Sushi Rolls', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Yellowtail Scallion Roll', 'sushi', 'Sushi Rolls', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Eel Avocado Roll', 'sushi', 'Sushi Rolls', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Spicy Tuna Roll', 'sushi', 'Sushi Rolls', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Spicy Salmon Roll', 'sushi', 'Sushi Rolls', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'California Roll', 'sushi', 'Sushi Rolls', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Shrimp Tempura Roll', 'sushi', 'Sushi Rolls', 16.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Cucumber Roll', 'sushi', 'Sushi Rolls', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Avocado Roll', 'sushi', 'Sushi Rolls', 11.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Philadelphia Roll', 'sushi', 'Sushi Rolls', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Crazy Tuna Roll', 'sushi', 'Sushi Rolls', 25.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Martha''s Vineyard Roll', 'sushi', 'Sushi Rolls', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Red Dragon Roll', 'sushi', 'Sushi Rolls', 25.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Spicy Yap Roll', 'sushi', 'Sushi Rolls', 29.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Pink Panther Roll', 'sushi', 'Sushi Rolls', 27.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Crunchy Salmon Roll', 'sushi', 'Sushi Rolls', 24.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Volcano Roll', 'sushi', 'Sushi Rolls', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Rainbow Roll', 'sushi', 'Sushi Rolls', 24.00),

-- === SUSHI (19) ===
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Tuna Poke Bowl', 'pokebowl', 'Sushi', 24.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Edamame', 'apps', 'Sushi', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Steamed Pork Potstickers', 'apps', 'Sushi', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Steamed Shrimp Purses', 'shrimp', 'Sushi', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Seaweed Salad', 'salad', 'Sushi', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Sashimi Salad', 'sushi', 'Sushi', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Tuna & Avocado Salad', 'sushi', 'Sushi', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Sushi Deluxe', 'sushi', 'Sushi', 38.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Sashimi Deluxe', 'sushi', 'Sushi', 41.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Tuna Nigiri', 'sushi', 'Sushi', 11.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Salmon Nigiri', 'sushi', 'Sushi', 11.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Yellowtail Nigiri', 'sushi', 'Sushi', 11.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Smoked Salmon Nigiri', 'sushi', 'Sushi', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Eel Nigiri', 'sushi', 'Sushi', 11.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Shrimp Nigiri', 'sushi', 'Sushi', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Tilapia Nigiri', 'sushi', 'Sushi', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Crab Stick Nigiri', 'sushi', 'Sushi', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Flying Fish Roe Nigiri', 'sushi', 'Sushi', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Salmon Roe Nigiri', 'sushi', 'Sushi', 13.00),

-- === DESSERT (3) ===
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Chocolate Cake for Two', 'dessert', 'Dessert', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Key Lime Pie', 'dessert', 'Dessert', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Seafood Shanty'), 'Flourless Chocolate Torte', 'dessert', 'Dessert', 12.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Appetizers', 'Salad', 'Sandwiches', 'Entrees', 'Sushi Rolls', 'Sushi', 'Dessert']
WHERE name = 'The Seafood Shanty';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Seafood Shanty');
