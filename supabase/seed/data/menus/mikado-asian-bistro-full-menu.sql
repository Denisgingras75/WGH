-- Mikado Asian Bistro - Full Menu
-- Source: mikadomv.com (Entree POS system)
-- Run this in Supabase SQL Editor

-- Create restaurant if it doesn't exist
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Mikado Asian Bistro', '76 Main Street, Vineyard Haven, MA 02568', 41.4538, -70.6018, 'Vineyard Haven', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Mikado Asian Bistro');

-- Delete old dishes
DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro');

-- Insert complete menu (213 items)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === SOUP (7) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Wonton Soup', 'soup', 'Soup', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Egg Drop Soup', 'soup', 'Soup', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hot & Sour Soup', 'soup', 'Soup', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Miso Soup', 'soup', 'Soup', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Seafood Soup', 'soup', 'Soup', 13.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tom Yum Soup', 'soup', 'Soup', 13.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'House Special Wonton Soup', 'soup', 'Soup', 16.00),

-- === SALAD (6) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'House Green Salad', 'salad', 'Salad', 6.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Seaweed Salad', 'salad', 'Salad', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Kani Salad', 'salad', 'Salad', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Avocado Salad', 'salad', 'Salad', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chop Fish Salad', 'salad', 'Salad', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Seared Tuna Salad', 'salad', 'Salad', 18.00),

-- === JAPANESE APPETIZERS (13) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Age Tofu', 'apps', 'Japanese Appetizers', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chili Edamame', 'apps', 'Japanese Appetizers', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Edamame', 'apps', 'Japanese Appetizers', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Pork Gyoza', 'apps', 'Japanese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp Shumai', 'apps', 'Japanese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Veg Gyoza', 'apps', 'Japanese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Veg Tempura', 'apps', 'Japanese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hamachi Kama', 'apps', 'Japanese Appetizers', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sushi Appetizer', 'sushi', 'Japanese Appetizers', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp Tempura', 'shrimp', 'Japanese Appetizers', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Salmon Tataki', 'sushi', 'Japanese Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sashimi Appetizer', 'sushi', 'Japanese Appetizers', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tuna Tataki', 'sushi', 'Japanese Appetizers', 18.00),

-- === CHINESE APPETIZERS (15) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Egg Roll', 'apps', 'Chinese Appetizers', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Scallion Pancake', 'apps', 'Chinese Appetizers', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spring Roll', 'apps', 'Chinese Appetizers', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Fingers', 'tendys', 'Chinese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Lettuce Wrap', 'apps', 'Chinese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Crab Rangoon', 'apps', 'Chinese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Fried Pork Dumpling', 'apps', 'Chinese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Satay Chicken', 'apps', 'Chinese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp Lettuce Wrap', 'apps', 'Chinese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Steam Pork Dumpling', 'apps', 'Chinese Appetizers', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'BBQ Spare Ribs', 'ribs', 'Chinese Appetizers', 13.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Wings', 'wings', 'Chinese Appetizers', 14.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Boneless Spare Ribs', 'ribs', 'Chinese Appetizers', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Rock Shrimp', 'shrimp', 'Chinese Appetizers', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Satay Beef', 'apps', 'Chinese Appetizers', 15.00),

-- === FUSION APPETIZER (6) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Fresh Roll', 'sushi', 'Fusion Appetizer', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Asian Tuna Tartar', 'sushi', 'Fusion Appetizer', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Peppered Tuna', 'sushi', 'Fusion Appetizer', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tuna Pizza', 'sushi', 'Fusion Appetizer', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Yellowtail Jalapeno', 'sushi', 'Fusion Appetizer', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Volcano Ball', 'sushi', 'Fusion Appetizer', 22.00),

-- === VEGETARIAN ROLL (8) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Avocado Roll', 'sushi', 'Vegetarian Roll', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Avocado & Cucumber Roll', 'sushi', 'Vegetarian Roll', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Avocado & Mango Roll', 'sushi', 'Vegetarian Roll', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Avocado & Peanut Roll', 'sushi', 'Vegetarian Roll', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Cucumber Roll', 'sushi', 'Vegetarian Roll', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sweet Potato Roll', 'sushi', 'Vegetarian Roll', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Veg California Roll', 'sushi', 'Vegetarian Roll', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Veggie Futo Roll', 'sushi', 'Vegetarian Roll', 8.00),

-- === ROLL & HAND ROLL (23) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Philly Roll', 'sushi', 'Roll & Hand Roll', 9.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Salmon Scallion Roll', 'sushi', 'Roll & Hand Roll', 9.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Alaska Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Boston Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'California Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Eel Avocado Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Eel Cucumber Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Kani Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Salmon Avocado Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Salmon Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Salmon Skin Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp Tempura Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Crab Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Salmon Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Shrimp Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Tuna Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Yellowtail Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tuna Avocado Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tuna Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Yellowtail Scallion Roll', 'sushi', 'Roll & Hand Roll', 10.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp Avocado Roll', 'sushi', 'Roll & Hand Roll', 11.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Scallop Roll', 'sushi', 'Roll & Hand Roll', 12.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spider Roll', 'sushi', 'Roll & Hand Roll', 13.00),

-- === SPECIAL ROLL (30) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Krazy Roll', 'sushi', 'Special Roll', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Dragon Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Fire House Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Golden Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Rainbow Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Girl Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sweet Heart Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Volcano Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Yummy Roll', 'sushi', 'Special Roll', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hawaii Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Giant Spider Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Monkey Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'New England Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Red Sox Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sexy Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Soybean Paper Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tiger Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tropical Roll', 'sushi', 'Special Roll', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Martha''s Vineyard Roll', 'sushi', 'Special Roll', 23.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shogun Roll', 'sushi', 'Special Roll', 23.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Incredible Roll', 'sushi', 'Special Roll', 24.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mountain Top Roll', 'sushi', 'Special Roll', 24.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Out of Control Roll', 'sushi', 'Special Roll', 24.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Vineyard Haven Roll', 'sushi', 'Special Roll', 24.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Crispy Shark Roll', 'sushi', 'Special Roll', 25.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Singidunum Roll', 'sushi', 'Special Roll', 25.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Central Park Roll', 'sushi', 'Special Roll', 26.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'King Crab Rainbow Roll', 'sushi', 'Special Roll', 26.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'O.M.G Roll', 'sushi', 'Special Roll', 26.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Phoenix Roll', 'sushi', 'Special Roll', 28.00),

-- === SUSHI & SASHIMI COMBOS (10) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hand Roll Combo', 'sushi', 'Sushi & Sashimi Combos', 25.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Maki Combo Trio', 'sushi', 'Sushi & Sashimi Combos', 25.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Spicy Trio', 'sushi', 'Sushi & Sashimi Combos', 25.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chirashi', 'sushi', 'Sushi & Sashimi Combos', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sake Don', 'sushi', 'Sushi & Sashimi Combos', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sushi Dinner', 'sushi', 'Sushi & Sashimi Combos', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tekka Don', 'sushi', 'Sushi & Sashimi Combos', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Unagi Don', 'sushi', 'Sushi & Sashimi Combos', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sashimi Dinner', 'sushi', 'Sushi & Sashimi Combos', 30.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sushi Sashimi Combo', 'sushi', 'Sushi & Sashimi Combos', 35.00),

-- === HIBACHI (6) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hibachi Chicken', 'chicken', 'Hibachi', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hibachi Beef', 'steak', 'Hibachi', 30.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hibachi Salmon', 'fish', 'Hibachi', 32.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hibachi Scallop', 'scallops', 'Hibachi', 32.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hibachi Shrimp', 'shrimp', 'Hibachi', 32.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Hibachi Combo', 'entree', 'Hibachi', 38.00),

-- === TERIYAKI (6) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Teriyaki Tofu', 'veggies', 'Teriyaki', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Teriyaki Chicken', 'chicken', 'Teriyaki', 23.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Teriyaki Salmon', 'fish', 'Teriyaki', 26.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Teriyaki Shrimp', 'shrimp', 'Teriyaki', 26.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Teriyaki Steak', 'steak', 'Teriyaki', 26.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Teriyaki Tuna', 'fish', 'Teriyaki', 30.00),

-- === FUSION ENTREE (15) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Moo Shu Chicken', 'asian', 'Fusion Entree', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Moo Shu Pork', 'asian', 'Fusion Entree', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Kung Pao Chicken', 'asian', 'Fusion Entree', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Curry Chicken', 'curry', 'Fusion Entree', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Thai Basil Chicken', 'asian', 'Fusion Entree', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sesame Chicken', 'asian', 'Fusion Entree', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Orange Chicken', 'asian', 'Fusion Entree', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'General Tso''s Chicken', 'asian', 'Fusion Entree', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Salt & Pepper Shrimp', 'shrimp', 'Fusion Entree', 25.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Salt & Pepper Tofu', 'veggies', 'Fusion Entree', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Happy Family', 'asian', 'Fusion Entree', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Black Pepper Steak', 'steak', 'Fusion Entree', 35.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'X.O Seafood Delight', 'seafood', 'Fusion Entree', 36.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Curry Shrimp', 'curry', 'Fusion Entree', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Thai Basil Beef', 'asian', 'Fusion Entree', 20.00),

-- === CHICKEN (9) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken w. Broccoli', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken w. Eggplant', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken w. Garlic Sauce', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken w. Mix Veg', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken w. Snow Peas', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'String Bean Chicken', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sweet Sour Chicken', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Szechuan Chicken', 'asian', 'Chicken', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Lemon Chicken', 'asian', 'Chicken', 20.00),

-- === BEEF (9) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Beef w. Broccoli', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Beef w. Eggplant', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Beef w. Garlic Sauce', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Beef w. Mix Veg', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Beef w. Snow Peas', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mongolian Beef', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Pepper Steak', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'String Bean Beef', 'asian', 'Beef', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Szechuan Beef', 'asian', 'Beef', 20.00),

-- === PORK (4) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Pork w. Garlic Sauce', 'pork', 'Pork', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Pork w. String Bean', 'pork', 'Pork', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Szechuan Pork', 'pork', 'Pork', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Double Saute Pork', 'pork', 'Pork', 20.00),

-- === SHRIMP (9) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp w. Broccoli', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp w. Eggplant', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp w. Garlic Sauce', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp w. Lobster Sauce', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp w. Mix Veg', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp w. Snow Peas', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp w. String Bean', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sweet Sour Shrimp', 'shrimp', 'Shrimp', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Szechuan Shrimp', 'shrimp', 'Shrimp', 22.00),

-- === VEGETABLE (7) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Broccoli w. Brown Sauce', 'veggies', 'Vegetable', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Broccoli w. Garlic Sauce', 'veggies', 'Vegetable', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mix Vegetable w. Brown Sauce', 'veggies', 'Vegetable', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mix Vegetable w. Garlic Sauce', 'veggies', 'Vegetable', 15.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Eggplant w. Brown Sauce', 'veggies', 'Vegetable', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Eggplant w. Garlic Sauce', 'veggies', 'Vegetable', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sauteed String Bean', 'veggies', 'Vegetable', 20.00),

-- === TOFU (6) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mapo Tofu', 'veggies', 'Tofu', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sesame Tofu', 'veggies', 'Tofu', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Szechuan Style Tofu', 'veggies', 'Tofu', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tofu w. Garlic Sauce', 'veggies', 'Tofu', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tofu w. Mix Veg', 'veggies', 'Tofu', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'General Tso''s Tofu', 'veggies', 'Tofu', 18.00),

-- === RICE & NOODLE (11) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Lo Mein', 'asian', 'Rice & Noodle', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Pad Thai', 'asian', 'Rice & Noodle', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Yaki Soba', 'asian', 'Rice & Noodle', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Yaki Udon', 'asian', 'Rice & Noodle', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Chicken Fried Rice', 'asian', 'Rice & Noodle', 16.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Shrimp Pad Thai', 'asian', 'Rice & Noodle', 18.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Taiwanese Chow Mei Fun', 'asian', 'Rice & Noodle', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Singapore Chow Mei Fun', 'asian', 'Rice & Noodle', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Thai Pineapple Fried Rice', 'asian', 'Rice & Noodle', 20.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Nabeyaki Udon', 'asian', 'Rice & Noodle', 22.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'House Fried Rice', 'asian', 'Rice & Noodle', 20.00),

-- === SPECIALS (13) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mango Mango Chicken', 'asian', 'Specials', 19.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Poke Bowl', 'pokebowl', 'Specials', 25.99),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Dry Wok', 'asian', 'Specials', 25.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Braised Fish', 'fish', 'Specials', 28.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Garlic Soft Shell Crab', 'crab', 'Specials', 30.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sizzling Beef', 'steak', 'Specials', 30.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sizzling Fish', 'fish', 'Specials', 30.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Sichuan Boiled', 'asian', 'Specials', 30.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tanita Soup', 'soup', 'Specials', 30.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Lamb Chops', 'lamb', 'Specials', 38.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Bay Scallops', 'scallops', 'Specials', 40.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Peking Duck', 'duck', 'Specials', 45.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mandarin Lobster', 'lobster', 'Specials', 48.00),

-- === DESSERT (6) ===
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Fried Banana', 'dessert', 'Dessert', 6.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Cheese Cake', 'dessert', 'Dessert', 6.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Mochi Ice Cream', 'ice cream', 'Dessert', 6.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Choco Cake', 'dessert', 'Dessert', 7.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Tiramisu', 'dessert', 'Dessert', 8.00),
((SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro'), 'Fried Ice Cream', 'ice cream', 'Dessert', 12.00);

-- Update menu_section_order
UPDATE restaurants
SET menu_section_order = ARRAY[
  'Soup', 'Salad', 'Japanese Appetizers', 'Chinese Appetizers', 'Fusion Appetizer',
  'Vegetarian Roll', 'Roll & Hand Roll', 'Special Roll', 'Sushi & Sashimi Combos',
  'Hibachi', 'Teriyaki', 'Fusion Entree', 'Chicken', 'Beef', 'Pork', 'Shrimp',
  'Vegetable', 'Tofu', 'Rice & Noodle', 'Specials', 'Dessert'
]
WHERE name = 'Mikado Asian Bistro';

-- Verify import
SELECT menu_section, COUNT(*) as dish_count
FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Mikado Asian Bistro')
GROUP BY menu_section
ORDER BY menu_section;
