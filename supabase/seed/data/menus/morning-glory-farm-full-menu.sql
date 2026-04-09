-- Morning Glory Farm - Full Menu
-- Source: morninggloryfarm.com/farmstand, morninggloryfarm.com/food-truck-2, reviews
-- Run this in Supabase SQL Editor
-- NOTE: Morning Glory has a rotating seasonal menu. These are their staple/recurring items
-- from the farmstand kitchen, bakery, and MoGlo Food Truck.

DELETE FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Morning Glory Farm');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price) VALUES

-- === MOGLO FOOD TRUCK - BREAKFAST (4) ===
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Farm Egg Breakfast Sandwich', 'breakfast sandwich', 'MoGlo Food Truck - Breakfast', 12.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Farmhouse Avocado Toast', 'breakfast', 'MoGlo Food Truck - Breakfast', 14.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Farmer''s Daughter Sandwich', 'breakfast sandwich', 'MoGlo Food Truck - Breakfast', 14.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Farm Breakfast Biscuit', 'breakfast', 'MoGlo Food Truck - Breakfast', 10.00),

-- === MOGLO FOOD TRUCK - LUNCH (5) ===
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Eggplant Banh Mi', 'sandwich', 'MoGlo Food Truck - Lunch', 15.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Farm BLT', 'sandwich', 'MoGlo Food Truck - Lunch', 14.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Pasture-Raised Beef Sliders', 'burger', 'MoGlo Food Truck - Lunch', 16.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Crispy Fish Sandwich', 'fish-sandwich', 'MoGlo Food Truck - Lunch', 18.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Shrimp & Grits', 'shrimp', 'MoGlo Food Truck - Lunch', 18.00),

-- === SOUPS OF THE DAY (7) ===
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Split Pea Soup with Smoked Bacon', 'soup', 'Soups of the Day', 10.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Cream of Potato Leek Soup', 'soup', 'Soups of the Day', 10.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Chicken Wild Rice Soup', 'soup', 'Soups of the Day', 10.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Curried Red Lentil Soup', 'soup', 'Soups of the Day', 10.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Sausage with Tomatoes, White Beans & Kale', 'soup', 'Soups of the Day', 10.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Mushroom Bisque', 'soup', 'Soups of the Day', 10.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Italian Chicken Marsala with Mushrooms', 'soup', 'Soups of the Day', 10.00),

-- === BAKERY (9) ===
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Chocolate Chip Cookie', 'dessert', 'Bakery', 4.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Oatmeal Raisin Cookie', 'dessert', 'Bakery', 4.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Double Chocolate Chip Cookie', 'dessert', 'Bakery', 4.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Peanut Butter Cookie', 'dessert', 'Bakery', 4.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Scone of the Day', 'breakfast', 'Bakery', 5.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Morning Glory Muffin', 'breakfast', 'Bakery', 5.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Blueberry Muffin', 'breakfast', 'Bakery', 5.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Monkey Bars', 'dessert', 'Bakery', 5.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Brownies', 'dessert', 'Bakery', 5.00),

-- === PIES & DESSERTS (3) ===
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Fruit Pie (Seasonal)', 'dessert', 'Pies & Desserts', 28.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Organic Ice Cream Sandwich', 'ice cream', 'Pies & Desserts', 7.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Farm Doughnut', 'donuts', 'Pies & Desserts', 4.00),

-- === PREPARED FOODS (3) ===
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Chicken Salad', 'salad', 'Prepared Foods', 12.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Farm Fresh Salad', 'salad', 'Prepared Foods', 12.00),
((SELECT id FROM restaurants WHERE name = 'Morning Glory Farm'), 'Seasonal Entree (Heat & Eat)', 'entree', 'Prepared Foods', 16.00);

UPDATE restaurants
SET menu_section_order = ARRAY['MoGlo Food Truck - Breakfast', 'MoGlo Food Truck - Lunch', 'Soups of the Day', 'Bakery', 'Pies & Desserts', 'Prepared Foods']
WHERE name = 'Morning Glory Farm';

SELECT COUNT(*) as dish_count FROM dishes
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Morning Glory Farm');
