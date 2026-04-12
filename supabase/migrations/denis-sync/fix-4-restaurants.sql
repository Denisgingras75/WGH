-- Fix menus for 4 restaurants: Offshore Ale Company, Porto Pizza, Rockfish, The Barn Bowl & Bistro
-- DELETE existing dishes, INSERT fresh menu data, UPDATE menu_section_order

BEGIN;

-- ============================================================================
-- OFFSHORE ALE COMPANY (52 dishes)
-- ============================================================================

DELETE FROM dishes WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Offshore Ale Company');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Starters
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Bavarian Pretzel Sticks', 'apps', 'Starters', 10.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Buffalo Cauliflower', 'veggies', 'Starters', 16.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Chicken Tenders', 'tendys', 'Starters', 20.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'French Onion Soup', 'soup', 'Starters', 14.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Grilled Brie', 'apps', 'Starters', 19.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Guacamole and Chips', 'apps', 'Starters', 14.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Hand-Cut Fries', 'fries', 'Starters', 13.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'New England Clam Chowder', 'chowder', 'Starters', 12.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Offshore Chili', 'soup', 'Starters', 15.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Steamed PEI Mussels', 'seafood', 'Starters', 25.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Tomato Soup', 'soup', 'Starters', 9.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Truffle Fries', 'fries', 'Starters', 17.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Wings', 'wings', 'Starters', 20.00),
-- Soups & Apps (wing flavors, no price)
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'BBQ Wings', 'wings', 'Soups & Apps', NULL),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Buffalo Wings', 'wings', 'Soups & Apps', NULL),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Garlic Parmesan Wings', 'wings', 'Soups & Apps', NULL),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Honey Buffalo Wings', 'wings', 'Soups & Apps', NULL),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Honey Habanero Wings (Dry)', 'wings', 'Soups & Apps', NULL),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Jamaican Jerk Wings (Dry)', 'wings', 'Soups & Apps', NULL),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Korean BBQ Wings', 'wings', 'Soups & Apps', NULL),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Sweet Chili Wings', 'wings', 'Soups & Apps', NULL),
-- Salads
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Arugula and Goat Cheese Salad', 'salad', 'Salads', 18.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Caesar Salad', 'salad', 'Salads', 17.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Kale Salad', 'salad', 'Salads', 17.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Power Bowl', 'salad', 'Salads', 20.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Pub Salad', 'salad', 'Salads', 17.00),
-- Brick Oven Pizzas
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'BBQ Chicken Pizza', 'pizza', 'Brick Oven Pizzas', 26.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Chicken Pesto Pizza', 'pizza', 'Brick Oven Pizzas', 25.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Classic Cheese Pizza', 'pizza', 'Brick Oven Pizzas', 21.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Hawaiian Pizza', 'pizza', 'Brick Oven Pizzas', 25.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Margherita Pizza', 'pizza', 'Brick Oven Pizzas', 23.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Meat Lovers Pizza', 'pizza', 'Brick Oven Pizzas', 26.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Potato Pizza', 'pizza', 'Brick Oven Pizzas', 26.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Veggie Pizza', 'pizza', 'Brick Oven Pizzas', 24.00),
-- Mains
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Baby Back Ribs', 'ribs', 'Mains', 30.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Brewers Mac & Cheese', 'pasta', 'Mains', 28.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Chicken Quesadilla', 'quesadilla', 'Mains', 23.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Fish and Chips', 'fish-and-chips', 'Mains', 30.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Fish Sandwich', 'fish-sandwich', 'Mains', 24.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Fried Chicken', 'fried chicken', 'Mains', 29.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Grilled Cheese and Tomato Soup', 'sandwich', 'Mains', 18.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Knife and Fork Fried Chicken Sandwich', 'fried chicken', 'Mains', 24.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Portuguese Fisherman''s Stew', 'seafood', 'Mains', 38.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Roast Chicken', 'chicken', 'Mains', 30.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Salmon BLT', 'seafood', 'Mains', 25.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Steak Frites', 'steak', 'Mains', 39.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Steak Quesadilla', 'quesadilla', 'Mains', 25.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Stuffed Salmon', 'fish', 'Mains', 39.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Tavern Burger', 'burger', 'Mains', 20.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Tuna Poke', 'seafood', 'Mains', 34.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Turkey Burger', 'burger', 'Mains', 23.00),
((SELECT id FROM restaurants WHERE name = 'Offshore Ale Company'), 'Veggie Quesadilla', 'quesadilla', 'Mains', 22.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Starters', 'Soups & Apps', 'Salads', 'Brick Oven Pizzas', 'Mains']
WHERE name = 'Offshore Ale Company';

-- ============================================================================
-- PORTO PIZZA (12 dishes)
-- ============================================================================

DELETE FROM dishes WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Porto Pizza');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Pizzas
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Bacon Jalapeño Pizza', 'pizza', 'Pizzas', 19.00),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Cheese Pizza', 'pizza', 'Pizzas', 19.00),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Deep Dish BBQ Pizza', 'pizza', 'Pizzas', 22.00),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Deep Dish Pepperoni', 'pizza', 'Pizzas', 22.00),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Linguica Peppers Pizza', 'pizza', 'Pizzas', 19.00),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Pepperoni Pizza', 'pizza', 'Pizzas', 19.00),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Veggie Pizza', 'pizza', 'Pizzas', 19.00),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'White Pizza', 'pizza', 'Pizzas', 19.00),
-- Slices
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Cheese Slice', 'pizza', 'Slices', NULL),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Deep Dish Slice', 'pizza', 'Slices', NULL),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'Pepperoni Slice', 'pizza', 'Slices', NULL),
((SELECT id FROM restaurants WHERE name = 'Porto Pizza'), 'White Slice', 'pizza', 'Slices', NULL);

UPDATE restaurants
SET menu_section_order = ARRAY['Pizzas', 'Slices']
WHERE name = 'Porto Pizza';

-- ============================================================================
-- ROCKFISH (60 dishes)
-- ============================================================================

DELETE FROM dishes WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Rockfish');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Starters
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Buffalo Fried Cauliflower', 'veggies', 'Starters', 20.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Burrata', 'apps', 'Starters', 23.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Clam Chowder', 'chowder', 'Starters', 15.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Crab Cakes', 'seafood', 'Starters', 25.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Fried Calamari', 'seafood', 'Starters', 21.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Hand Cut Fries', 'fries', 'Starters', 15.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'PEI Mussels', 'seafood', 'Starters', 23.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Tomato Soup', 'soup', 'Starters', 11.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Truffle Fries w/ Shaved Cheese', 'fries', 'Starters', 19.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Truffle Risotto Balls', 'apps', 'Starters', 21.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Tuna Poke Nachos', 'pokebowl', 'Starters', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Tuscan Style Jumbo Wings', 'wings', 'Starters', 26.00),
-- Salads
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Caesar Salad', 'salad', 'Salads', 20.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Cobb Salad', 'salad', 'Salads', 23.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Greens', 'salad', 'Salads', 16.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Roasted Golden Beet', 'salad', 'Salads', 22.00),
-- Tacos
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Blackened Shrimp Taco', 'taco', 'Tacos', 20.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Sautéed Lobster Taco', 'taco', 'Tacos', 33.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Seared Cod Taco', 'taco', 'Tacos', 23.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Short Rib Taco', 'taco', 'Tacos', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Veggie Taco', 'taco', 'Tacos', 21.00),
-- Burgers & Sandwiches
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Cheeseburger & Fries', 'burger', 'Burgers & Sandwiches', 25.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Chef''s Special Burger', 'burger', 'Burgers & Sandwiches', 25.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Chicken Bahn Mi', 'sandwich', 'Burgers & Sandwiches', 22.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Crab Cake Sandwich', 'sandwich', 'Burgers & Sandwiches', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Crispy Chicken Pesto Cutlet', 'sandwich', 'Burgers & Sandwiches', 23.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Fish Sandwich', 'fish-sandwich', 'Burgers & Sandwiches', 20.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Hot Dog', 'entree', 'Burgers & Sandwiches', 19.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Plain Cheese', 'sandwich', 'Burgers & Sandwiches', 20.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Short Rib Grilled Cheese', 'sandwich', 'Burgers & Sandwiches', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Surf-n-Turf Burger', 'burger', 'Burgers & Sandwiches', 40.00),
-- Pizza
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'BBQ Chicken Pizza', 'pizza', 'Pizza', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Chicken Bacon Ranch', 'pizza', 'Pizza', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Classic Pizza', 'pizza', 'Pizza', 23.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Italian Pizza', 'pizza', 'Pizza', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Margherita Pizza', 'pizza', 'Pizza', 23.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Prosciutto & Arugula', 'pizza', 'Pizza', 26.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Veggie Pizza', 'pizza', 'Pizza', 25.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'White Pizza', 'pizza', 'Pizza', 26.00),
-- Chef's Specials
((SELECT id FROM restaurants WHERE name = 'Rockfish'), '12 oz Kobe Style Flat Iron', 'steak', 'Chef''s Specials', 66.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Asparagus Risotto', 'pasta', 'Chef''s Specials', 33.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Bolognese', 'pasta', 'Chef''s Specials', 38.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Chicken Pesto', 'pasta', 'Chef''s Specials', 39.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Chicken Pot Pie', 'chicken', 'Chef''s Specials', 32.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Fish & Chips', 'fish-and-chips', 'Chef''s Specials', 32.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Guinness Braised Short Rib', 'entree', 'Chef''s Specials', 40.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Halibut', 'seafood', 'Chef''s Specials', 49.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Jumbo Lobster Roll', 'lobster roll', 'Chef''s Specials', 39.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Lobster Grilled Cheese', 'sandwich', 'Chef''s Specials', 35.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Lobster Pot Pie', 'lobster', 'Chef''s Specials', 48.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Mac-n-Cheese', 'pasta', 'Chef''s Specials', 31.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Oven Roasted Cod', 'seafood', 'Chef''s Specials', 40.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Pan Seared Filet Mignon', 'steak', 'Chef''s Specials', 58.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Sautéed Lobster Roll', 'lobster roll', 'Chef''s Specials', 40.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Whole Belly Clam Plate', 'clams', 'Chef''s Specials', 35.00),
-- Desserts
((SELECT id FROM restaurants WHERE name = 'Rockfish'), '7 Layer Chocolate', 'dessert', 'Desserts', 14.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Churro Donut', 'donuts', 'Desserts', 14.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'GF Strawberry Shortcake', 'dessert', 'Desserts', 14.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Tiramisu', 'dessert', 'Desserts', 14.00),
((SELECT id FROM restaurants WHERE name = 'Rockfish'), 'Turtle Cheesecake', 'dessert', 'Desserts', 14.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Starters', 'Salads', 'Tacos', 'Burgers & Sandwiches', 'Pizza', 'Chef''s Specials', 'Desserts']
WHERE name = 'Rockfish';

-- ============================================================================
-- THE BARN BOWL & BISTRO (71 dishes)
-- ============================================================================

DELETE FROM dishes WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES
-- Appetizers
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Artichoke & Spinach Dip', 'apps', 'Appetizers', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Bacon Brussels Sprouts', 'veggies', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Bacon Cheeseburger Sliders', 'burger', 'Appetizers', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Bang Bang Cauliflower', 'veggies', 'Appetizers', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Brazilian Steak Skewers', 'steak', 'Appetizers', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Chicken Nuggets', 'tendys', 'Appetizers', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Crab Cakes', 'crab', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Crispy Calamari', 'calamari', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'House-Cut Onion Rings', 'onion rings', 'Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Lemon Pepper Chicken Wings', 'wings', 'Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Pork Ribs', 'ribs', 'Appetizers', 17.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Queso Fundido', 'apps', 'Appetizers', 16.00),
-- House-Made Soups
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Chicken Vegetable Soup', 'soup', 'House-Made Soups', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Clam Chowder', 'chowder', 'House-Made Soups', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'French Onion Soup', 'soup', 'House-Made Soups', 12.00),
-- Salads
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Apple Cranberry Salad', 'salad', 'Salads', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Brussels & Kale', 'salad', 'Salads', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Classic Caesar', 'salad', 'Salads', 15.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Taco Salad', 'salad', 'Salads', 26.00),
-- Sandwiches
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Barn Classic Hamburger', 'burger', 'Sandwiches', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Beyond Burger', 'burger', 'Sandwiches', 23.00),
-- Pizza
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Artichoke & Spinach Pizza', 'pizza', 'Pizza', 22.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'BBQ Chicken Pizza', 'pizza', 'Pizza', 20.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Brazilian Catupiry Pizza', 'pizza', 'Pizza', 22.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Chicken Bacon Ranch Pizza', 'pizza', 'Pizza', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Chicken Parmesan Pizza', 'pizza', 'Pizza', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Hawaiian Pizza', 'pizza', 'Pizza', 21.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Meat Supreme Pizza', 'pizza', 'Pizza', 22.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Shortrib & Mushroom Pizza', 'pizza', 'Pizza', 23.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Wild Mushroom & Truffle Pizza', 'pizza', 'Pizza', 22.00),
-- Gourmet 10" Pizzas
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Plain Cheese Pizza', 'pizza', 'Gourmet 10" Pizzas', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Prosciutto & Fig Pizza', 'pizza', 'Gourmet 10" Pizzas', 23.00),
-- Entrees
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Ahi Tuna Poke Bowl', 'pokebowl', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Baked Tilapia', 'seafood', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Barn Burrito Bowl', 'burrito', 'Entrees', 27.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Barn Mussels', 'seafood', 'Entrees', 24.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'BBQ Baby Back Ribs', 'ribs', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Beef Lasagna', 'pasta', 'Entrees', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Bourbon Street Pasta', 'pasta', 'Entrees', 24.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Braised Beef Short Rib', 'ribs', 'Entrees', 41.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Braised Beef Stew', 'steak', 'Entrees', 27.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Brazilian Picanha Feast', 'steak', 'Entrees', 62.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Brown Sugar Steak Tips', 'steak', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Chicken & Broccoli Alfredo', 'pasta', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Chicken Parmesan', 'chicken', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Crispy Fish Bites', 'seafood', 'Entrees', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Fig & BBQ Meatloaf', 'entree', 'Entrees', 29.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Fried Chicken Dinner', 'fried chicken', 'Entrees', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Fried Cod Filet & Chips', 'fish', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Garlic Naan w/ Curry Sauce', 'asian', 'Entrees', 12.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Grilled Sirloin Alfredo', 'steak', 'Entrees', 42.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Jamaican Jerk Rice Bowl', 'chicken', 'Entrees', 27.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Mussels & Shrimp Fra Diavolo', 'seafood', 'Entrees', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Porterhouse Pork Chop', 'pork', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Red Pesto Gnocchi', 'pasta', 'Entrees', 23.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Shrimp & Lobster Pasta', 'pasta', 'Entrees', 42.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Shrimp Tempura', 'seafood', 'Entrees', 19.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Teriyaki Glazed Salmon', 'seafood', 'Entrees', 32.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Teriyaki Steak Tips', 'steak', 'Entrees', 28.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'The Barn''s Famous Curry', 'curry', 'Entrees', 26.00),
-- Soups & Apps
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Balsamic Bruschetta', 'bruschetta', 'Soups & Apps', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Chicken Lemongrass Potstickers', 'chicken', 'Soups & Apps', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'General Tso Chicken', 'fried chicken', 'Soups & Apps', 26.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Southwest Chicken Egg Rolls', 'chicken', 'Soups & Apps', 13.00),
-- Desserts
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), '3 Layer Chocolate Cake', 'dessert', 'Desserts', 13.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Acai Bowl', 'dessert', 'Desserts', 18.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Creme Brule Cheesecake', 'dessert', 'Desserts', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Oreo Cookies & Cream Pie', 'dessert', 'Desserts', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Pudim (Brazilian Flan)', 'dessert', 'Desserts', 10.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Strawberry Shortcake Cake', 'dessert', 'Desserts', 14.00),
((SELECT id FROM restaurants WHERE name = 'The Barn Bowl & Bistro'), 'Warm Apple Crisp', 'dessert', 'Desserts', 13.00);

UPDATE restaurants
SET menu_section_order = ARRAY['Appetizers', 'House-Made Soups', 'Salads', 'Sandwiches', 'Pizza', 'Gourmet 10" Pizzas', 'Entrees', 'Soups & Apps', 'Desserts']
WHERE name = 'The Barn Bowl & Bistro';

COMMIT;
