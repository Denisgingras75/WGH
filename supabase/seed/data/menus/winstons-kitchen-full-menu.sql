-- Winston's Kitchen - Full Menu (Oak Bluffs comfort food + Jamaican)
-- Source: https://www.winstonskitchen-mv.com/ + Uber Eats + RestaurantGuru + reviews
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Breakfast
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Bacon, Egg & Cheese Sandwich', 'breakfast sandwich', 'Breakfast', 10.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Sausage, Egg & Cheese Sandwich', 'breakfast sandwich', 'Breakfast', 10.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Ham, Egg & Cheese Sandwich', 'breakfast sandwich', 'Breakfast', 10.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Breakfast Burrito', 'burrito', 'Breakfast', 14.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Western Omelette', 'breakfast', 'Breakfast', 14.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Veggie Omelette', 'breakfast', 'Breakfast', 13.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Pancakes', 'pancakes', 'Breakfast', 12.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'French Toast', 'breakfast', 'Breakfast', 12.00),
-- Subs (12")
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Italian Sub', 'sandwich', 'Subs', 16.25),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Steak and Cheese Sub', 'sandwich', 'Subs', 16.25),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Chicken Parm Sub', 'sandwich', 'Subs', 18.75),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Eggplant Parm Sub', 'sandwich', 'Subs', 16.25),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Meatball Sub', 'sandwich', 'Subs', 16.25),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Roast Beef & Cheese Sub', 'sandwich', 'Subs', 16.25),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Turkey & Cheese Sub', 'sandwich', 'Subs', 15.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Ham & Cheese Sub', 'sandwich', 'Subs', 15.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Tuna Sub', 'sandwich', 'Subs', 15.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'BLT Sub', 'sandwich', 'Subs', 14.00),
-- Sandwiches & Wraps
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Sriracha Honey Fried Chicken Sandwich', 'fried chicken', 'Sandwiches & Wraps', 17.50),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Fried Chicken Club Sandwich', 'fried chicken', 'Sandwiches & Wraps', 17.50),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'BBQ Mushroom Sandwich', 'sandwich', 'Sandwiches & Wraps', 15.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Pulled Pork Sandwich', 'pork', 'Sandwiches & Wraps', 16.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Crab Cake Sandwich', 'crab', 'Sandwiches & Wraps', 22.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Jerk Chicken Wrap', 'wrap', 'Sandwiches & Wraps', 16.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Caesar Chicken Wrap', 'wrap', 'Sandwiches & Wraps', 15.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Fish Taco Wrap', 'wrap', 'Sandwiches & Wraps', 16.00),
-- Burgers
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Cheeseburger', 'burger', 'Burgers', 16.25),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Bacon Cheeseburger', 'burger', 'Burgers', 18.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'BBQ Burger', 'burger', 'Burgers', 18.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Turkey Burger', 'burger', 'Burgers', 16.25),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Veggie Burger', 'burger', 'Burgers', 16.25),
-- Jamaican Plates
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Jerk Chicken Dinner', 'chicken', 'Jamaican Plates', 25.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Curry Chicken Dinner', 'curry', 'Jamaican Plates', 25.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Jerk Pork Dinner', 'pork', 'Jamaican Plates', 25.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Stew Beef Dinner', 'entree', 'Jamaican Plates', 25.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Oxtail Dinner', 'entree', 'Jamaican Plates', 28.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Curry Goat Dinner', 'curry', 'Jamaican Plates', 28.00),
-- Comfort Plates
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), '3 Pc Fried Chicken', 'fried chicken', 'Comfort Plates', 23.75),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Chicken Tenders with Fries', 'tendys', 'Comfort Plates', 16.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Mac and Cheese', 'pasta', 'Comfort Plates', 14.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Meatloaf Dinner', 'entree', 'Comfort Plates', 22.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Sweet Sausage with Peppers and Onions', 'pork', 'Comfort Plates', 20.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Roast Turkey Dinner', 'chicken', 'Comfort Plates', 22.00),
-- Seafood
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Fish and Chips', 'fish-and-chips', 'Seafood', 25.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Lobster Roll', 'lobster roll', 'Seafood', 34.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Fish Tacos', 'taco', 'Seafood', 18.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Thai Chili Salmon', 'fish', 'Seafood', 28.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Blackened Shrimp Plate', 'shrimp', 'Seafood', 26.00),
-- Soups
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Lobster Bisque', 'soup', 'Soups', 12.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'New England Clam Chowder', 'chowder', 'Soups', 10.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Soup of the Day', 'soup', 'Soups', 8.00),
-- Sides
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'French Fries', 'fries', 'Sides', 7.00),
((SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen'), 'Onion Rings', 'onion rings', 'Sides', 9.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Breakfast', 'Subs', 'Sandwiches & Wraps', 'Burgers', 'Jamaican Plates', 'Comfort Plates', 'Seafood', 'Soups', 'Sides']
WHERE name = 'Winston''s Kitchen';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Winston''s Kitchen');

-- Should show 48 dishes
