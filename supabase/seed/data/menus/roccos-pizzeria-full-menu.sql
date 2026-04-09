-- Rocco's Pizzeria - Full Menu
-- Source: marthasvineyardpizza.com
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Pizza
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Cheese Pizza', 'pizza', 'Pizza', 19.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Pesto Pizza', 'pizza', 'Pizza', 24.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'White Italian Pizza', 'pizza', 'Pizza', 24.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Chicken Pizza', 'pizza', 'Pizza', 24.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Meatball Pizza', 'pizza', 'Pizza', 24.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Margherita Pizza', 'pizza', 'Pizza', 24.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Vegetable Pizza', 'pizza', 'Pizza', 29.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Meat Lovers Pizza', 'pizza', 'Pizza', 30.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Gluten Free Pizza', 'pizza', 'Pizza', 14.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Calzone', 'pizza', 'Pizza', 10.95),

-- Sandwiches
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Rocco''s Italian', 'sandwich', 'Sandwiches', 13.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Ham & Cheese', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Roast Beef', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Turkey', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Hot Pastrami', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Burger Half Pounder', 'burger', 'Sandwiches', 13.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Sausage Sandwich', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Meatball Sandwich', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Mozzarella Sandwich', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Tuna Salad Sandwich', 'sandwich', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Chicken Cutlet Parmigiana', 'chicken', 'Sandwiches', 12.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Steak and Cheese', 'sandwich', 'Sandwiches', 13.95),

-- Salads
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Greek Salad', 'salad', 'Salads & Sides', 11.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Caesar Salad', 'salad', 'Salads & Sides', 11.25),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'House Salad', 'salad', 'Salads & Sides', 11.95),

-- Sides
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'French Fries', 'fries', 'Salads & Sides', 7.99),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Mozzarella Sticks', 'apps', 'Salads & Sides', 7.99),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Onion Rings', 'onion rings', 'Salads & Sides', 7.99),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Jalapeno Poppers', 'apps', 'Salads & Sides', 7.99),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Chicken Tenders', 'tendys', 'Salads & Sides', 8.99),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Chicken Wings', 'wings', 'Salads & Sides', 11.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Pasta Fagioli', 'soup', 'Salads & Sides', 8.99),

-- Pasta
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Penne Pasta with Meatballs', 'pasta', 'Pasta', 13.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Baked Lasagna', 'pasta', 'Pasta', 13.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Eggplant Parmigiana', 'pasta', 'Pasta', 13.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Chicken Parm over Penne Pasta', 'pasta', 'Pasta', 13.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Three Cheese Ravioli', 'pasta', 'Pasta', 13.95),
((SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria'), 'Spaghetti with Meatballs', 'pasta', 'Pasta', 13.95);

UPDATE restaurants
SET menu_section_order = ARRAY['Pizza', 'Sandwiches', 'Salads & Sides', 'Pasta']
WHERE name = 'Rocco''s Pizzeria';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Rocco''s Pizzeria');
