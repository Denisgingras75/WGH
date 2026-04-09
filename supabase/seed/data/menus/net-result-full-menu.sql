-- Net Result - Full Menu
-- Source: allmenus.com/ma/vineyard-haven/414697-net-result/menu/ + mvseafood.com
-- Note: Prices from published menu; seasonal items and prices may vary
-- Run this in Supabase SQL Editor

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Net Result');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === APPETIZERS (8) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Chicken Tenders', 'tendys', 'Appetizers', 7.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Mozzarella Sticks', 'apps', 'Appetizers', 6.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Steamed Clams', 'clams', 'Appetizers', 9.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Steamed Mussels', 'mussels', 'Appetizers', 7.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Steamed Mussels & Clams', 'mussels', 'Appetizers', 8.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Shrimp Cocktail', 'shrimp', 'Appetizers', 5.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Stuffed Quahog', 'clams', 'Appetizers', 4.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Crabcake', 'crab', 'Appetizers', 3.00),

-- === CHOWDER & BISQUE (2) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Clam Chowder', 'chowder', 'Chowder & Bisque', 4.75),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Lobster Bisque', 'soup', 'Chowder & Bisque', 4.75),

-- === SALADS (4) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tossed Salad', 'salad', 'Salads', 4.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tossed Salad with Shrimp Salad', 'salad', 'Salads', 7.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tossed Salad with Crab Salad', 'salad', 'Salads', 9.95),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tossed Salad with Tuna Salad', 'salad', 'Salads', 6.50),

-- === ROLLS & WRAPS (11) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Shrimp Salad Roll', 'sandwich', 'Rolls & Wraps', 6.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Crab Salad Roll', 'crab', 'Rolls & Wraps', 12.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Fried Clam Roll', 'clams', 'Rolls & Wraps', 11.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tuna Salad Roll', 'sandwich', 'Rolls & Wraps', 3.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Buffalo Chicken Wrap', 'wrap', 'Rolls & Wraps', 6.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Chipotle Shrimp Wrap', 'wrap', 'Rolls & Wraps', 7.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Hummus Wrap', 'wrap', 'Rolls & Wraps', 4.95),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Smoked Salmon Wrap', 'wrap', 'Rolls & Wraps', 7.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Lobster Salad Roll', 'lobster roll', 'Rolls & Wraps', 12.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Lobster Salad Made to Order', 'lobster roll', 'Rolls & Wraps', 15.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Lobster Meat Roll', 'lobster roll', 'Rolls & Wraps', 15.00),

-- === SANDWICHES (8) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Cheeseburger', 'burger', 'Sandwiches', 6.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Hamburger', 'burger', 'Sandwiches', 6.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Grilled Chicken Sandwich', 'sandwich', 'Sandwiches', 6.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Fish Sandwich', 'fish-sandwich', 'Sandwiches', 7.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Veggie Burger', 'burger', 'Sandwiches', 6.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Grilled Swordfish Sandwich', 'fish-sandwich', 'Sandwiches', 8.95),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Crab Cake Sandwich', 'crab', 'Sandwiches', 4.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Fish Wrap', 'wrap', 'Sandwiches', 7.50),

-- === PLATES (7) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Clam Plate', 'clams', 'Plates', 22.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Scallop Plate', 'scallops', 'Plates', 19.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Oyster Plate', 'seafood', 'Plates', 19.75),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Just Fish', 'fish', 'Plates', 10.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Fish & Chips', 'fish-and-chips', 'Plates', 11.50),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Shrimp Plate', 'shrimp', 'Plates', 19.75),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Chicken Tender Plate', 'tendys', 'Plates', 9.50),

-- === SUSHI - NIGIRI & SASHIMI (15) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tuna (Maguro) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'White Tuna Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Pepper Tuna Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Salmon (Sake) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Smoked Salmon Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Yellow Tail (Hamachi) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Eel (Unagi) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Crab Stick (Kanikama) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Mackerel (Saba) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Octopus (Tako) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Scallop (Hotate) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Salmon Roe (Ikura) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Flying Fish Roe (Tobikko) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Inari (Fried Tofu) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Shrimp (Ebi) Nigiri', 'sushi', 'Nigiri & Sashimi', 5.99),

-- === SUSHI - VEGGIE ROLLS (5) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Cucumber Roll', 'sushi', 'Veggie Rolls', 6.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Avocado Roll', 'sushi', 'Veggie Rolls', 6.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Oshinko Roll', 'sushi', 'Veggie Rolls', 6.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Kampyo Roll', 'sushi', 'Veggie Rolls', 6.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Vegetable Roll', 'sushi', 'Veggie Rolls', 7.25),

-- === SUSHI - 8 PIECE ROLLS (20) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tuna Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Pepper Tuna Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tuna Avocado Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Spicy Tuna Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Salmon Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Smoked Salmon Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Alaskan Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Spicy Salmon w/ Crunch Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Boston Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Philadelphia Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Yellow Tail Scallion Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Spicy Yellow Tail Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'California Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Spicy California Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Eel Avocado Roll', 'sushi', '8 Piece Rolls', 7.25),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Shrimp Tempura Roll', 'sushi', '8 Piece Rolls', 8.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Futo Maki', 'sushi', '8 Piece Rolls', 8.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Sweet Potato Roll', 'sushi', '8 Piece Rolls', 8.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Dragon Roll', 'sushi', '8 Piece Rolls', 10.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Caterpillar Roll', 'sushi', '8 Piece Rolls', 10.99),

-- === SUSHI - SPECIALTY ROLLS (8) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Spider Roll', 'sushi', 'Specialty Rolls', 11.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Rainbow Roll', 'sushi', 'Specialty Rolls', 13.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Martha''s Vineyard Roll', 'sushi', 'Specialty Rolls', 13.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Ma Roll', 'sushi', 'Specialty Rolls', 13.99),

-- === SUSHI - CHEF SPECIAL ROLLS (9) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Chef Hesi''s Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Louis''s Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Magic Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Secret Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Volcano Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Red Devil Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Dynamite Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Crazy Tuna Roll', 'sushi', 'Chef Special Rolls', 17.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Beth Roll', 'sushi', 'Chef Special Rolls', 17.99),

-- === SUSHI PLATTERS (8) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Sushi Platter', 'sushi', 'Sushi Platters', 19.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Sashimi Platter', 'sushi', 'Sushi Platters', 19.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Chirashi', 'sushi', 'Sushi Platters', 19.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Tuna Love Platter', 'sushi', 'Sushi Platters', 19.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Salmon Love Platter', 'sushi', 'Sushi Platters', 19.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Sushi Sashimi Combination', 'sushi', 'Sushi Platters', 24.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Sushi for Two', 'sushi', 'Sushi Platters', 44.00),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Sushi & Sashimi for Two', 'sushi', 'Sushi Platters', 49.00),

-- === SUSHI APPETIZERS (3) ===
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Edamame', 'apps', 'Sushi Appetizers', 6.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Sushi Rice', 'sides', 'Sushi Appetizers', 3.99),
((SELECT id FROM restaurants WHERE name = 'Net Result'), 'Miso Soup', 'soup', 'Sushi Appetizers', 3.99);

UPDATE restaurants
SET menu_section_order = ARRAY['Appetizers', 'Chowder & Bisque', 'Salads', 'Rolls & Wraps', 'Sandwiches', 'Plates', 'Sushi Appetizers', 'Nigiri & Sashimi', 'Veggie Rolls', '8 Piece Rolls', 'Specialty Rolls', 'Chef Special Rolls', 'Sushi Platters']
WHERE name = 'Net Result';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Net Result');
