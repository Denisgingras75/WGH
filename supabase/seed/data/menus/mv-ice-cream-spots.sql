-- Martha's Vineyard Ice Cream Spots
-- Source: madmarthas.com/flavors, Carousel menu board photo, web research, local knowledge
-- Run this in Supabase SQL Editor

-- =============================================
-- ADD NEW RESTAURANTS
-- =============================================

-- Mad Martha's — one record, flagship OB address (3 locations but shared votes)
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Mad Martha''s Ice Cream', '117 Circuit Ave, Oak Bluffs, MA 02557', 41.4583, -70.5594, 'Oak Bluffs', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Mad Martha''s Ice Cream');

-- Ben & Bill's Chocolate Emporium
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Ben & Bill''s Chocolate Emporium', '20A Circuit Ave, Oak Bluffs, MA 02557', 41.4579, -70.5589, 'Oak Bluffs', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Ben & Bill''s Chocolate Emporium');

-- Carousel Ice Cream Factory
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Carousel Ice Cream Factory', '15 Circuit Ave, Oak Bluffs, MA 02557', 41.4581, -70.5591, 'Oak Bluffs', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Carousel Ice Cream Factory');

-- Nauti Cow
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Nauti Cow', '28 Lake Ave, Oak Bluffs, MA 02557', 41.4575, -70.5563, 'Oak Bluffs', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Nauti Cow');

-- Dairy Queen
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Dairy Queen', 'Edgartown-Vineyard Haven Rd, Edgartown, MA 02539', 41.3975, -70.5275, 'Edgartown', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Dairy Queen' AND town = 'Edgartown');

-- Bobby B's (may already exist for other food)
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Bobby B''s Restaurant & Bakery', '22 Main St, Vineyard Haven, MA 02568', 41.4541, -70.6028, 'Vineyard Haven', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Bobby B''s Restaurant & Bakery');

-- Menemsha Galley
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Menemsha Galley', 'Basin Rd, Chilmark, MA 02535', 41.3542, -70.7667, 'Chilmark', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Menemsha Galley');

-- =============================================
-- MAD MARTHA'S ICE CREAM (24 flavors, one location for votes)
-- Also at: 24 Union St, Vineyard Haven & 7 N Water St, Edgartown
-- =============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  ('Vineyard Vanilla', 'ice cream', 'Classics', 5.50),
  ('Chappy Chocolate', 'ice cream', 'Classics', 5.50),
  ('Sinful Chocolate', 'ice cream', 'Classics', 5.50),
  ('Squibby Strawberry', 'ice cream', 'Classics', 5.50),
  ('Chilmark Coffee', 'ice cream', 'Island Favorites', 5.50),
  ('MV Sea Salt Caramel', 'ice cream', 'Island Favorites', 5.50),
  ('Catboat Crunch', 'ice cream', 'Island Favorites', 5.50),
  ('Menemsha Mint Oreo', 'ice cream', 'Island Favorites', 5.50),
  ('Oak Bluffs Oreo', 'ice cream', 'Island Favorites', 5.50),
  ('Black Raspberry', 'ice cream', 'Fruit & Nut', 5.50),
  ('Blueberry', 'ice cream', 'Fruit & Nut', 5.50),
  ('Maple Walnut', 'ice cream', 'Fruit & Nut', 5.50),
  ('Pistachio', 'ice cream', 'Fruit & Nut', 5.50),
  ('Coconut', 'ice cream', 'Fruit & Nut', 5.50),
  ('Mint Chocolate Chip', 'ice cream', 'Mix-Ins', 5.50),
  ('Mocha Chip', 'ice cream', 'Mix-Ins', 5.50),
  ('Chocolate Chip', 'ice cream', 'Mix-Ins', 5.50),
  ('Lotsa Dough', 'ice cream', 'Mix-Ins', 5.50),
  ('M&M Cream', 'ice cream', 'Mix-Ins', 5.50),
  ('Mud Pie', 'ice cream', 'Mix-Ins', 5.50),
  ('Reese''s PB Cup', 'ice cream', 'Mix-Ins', 5.50),
  ('Snickers', 'ice cream', 'Mix-Ins', 5.50),
  ('Butter Crunch', 'ice cream', 'Mix-Ins', 5.50),
  ('Peppermint', 'ice cream', 'Seasonal', 5.50)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Mad Martha''s Ice Cream'
AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

UPDATE restaurants SET menu_section_order = ARRAY['Island Favorites', 'Classics', 'Mix-Ins', 'Fruit & Nut', 'Seasonal']
WHERE name = 'Mad Martha''s Ice Cream';

-- =============================================
-- BEN & BILL'S CHOCOLATE EMPORIUM (signature flavors)
-- =============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  ('Lobster Ice Cream', 'ice cream', 'Signature', 7.00),
  ('Peanut Butter Cup', 'ice cream', 'Ice Cream', 6.50),
  ('Butter Crunch', 'ice cream', 'Ice Cream', 6.50),
  ('Butter Pecan', 'ice cream', 'Ice Cream', 6.50),
  ('Chocolate PB Cookie Dough', 'ice cream', 'Ice Cream', 6.50),
  ('Pistachio', 'ice cream', 'Ice Cream', 6.50),
  ('Black Forest', 'ice cream', 'Ice Cream', 6.50),
  ('Macadamia Coconut', 'ice cream', 'Ice Cream', 6.50),
  ('Almond Joy', 'ice cream', 'Ice Cream', 6.50),
  ('Maple Walnut', 'ice cream', 'Ice Cream', 6.50),
  ('Cake Batter', 'ice cream', 'Ice Cream', 6.50),
  ('Cookie Dough', 'ice cream', 'Ice Cream', 6.50),
  ('Cool Mint Oreo', 'ice cream', 'Ice Cream', 6.50),
  ('Grape Nut', 'ice cream', 'Ice Cream', 6.50),
  ('Ickersnay', 'ice cream', 'Ice Cream', 6.50),
  ('Kahlua Brownie Sundae', 'ice cream', 'Ice Cream', 6.50),
  ('Mud Pie', 'ice cream', 'Ice Cream', 6.50),
  ('Oreo', 'ice cream', 'Ice Cream', 6.50),
  ('Pumpkin Cheesecake', 'ice cream', 'Ice Cream', 6.50),
  ('Strawberry Cheesecake', 'ice cream', 'Ice Cream', 6.50),
  ('Ginger Pineapple', 'ice cream', 'Ice Cream', 6.50),
  ('Coffee Oreo', 'ice cream', 'Ice Cream', 6.50),
  ('Salted Caramel', 'ice cream', 'Ice Cream', 6.50),
  ('Chocolate Fudge Brownie', 'ice cream', 'Ice Cream', 6.50),
  ('Vanilla Bean', 'ice cream', 'Ice Cream', 6.50),
  ('Triple Chocolate', 'ice cream', 'Ice Cream', 6.50),
  ('Sugar-Free Butter Crunch', 'ice cream', 'Sugar Free', 6.50),
  ('Sugar-Free Mudpie', 'ice cream', 'Sugar Free', 6.50),
  ('Dairy-Free Rocky Road', 'ice cream', 'Dairy Free & Vegan', 7.00),
  ('Vegan Peanut Butter Swirl', 'ice cream', 'Dairy Free & Vegan', 7.00),
  ('Vegan Cookie Dough', 'ice cream', 'Dairy Free & Vegan', 7.00),
  ('Hot Fudge Sundae', 'ice cream', 'Sundaes', 8.50),
  ('Banana Split', 'ice cream', 'Sundaes', 9.50)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Ben & Bill''s Chocolate Emporium'
AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

UPDATE restaurants SET menu_section_order = ARRAY['Signature', 'Ice Cream', 'Sugar Free', 'Dairy Free & Vegan', 'Sundaes']
WHERE name = 'Ben & Bill''s Chocolate Emporium';

-- =============================================
-- CAROUSEL ICE CREAM FACTORY (34 flavors from menu board photo)
-- Prices: Kiddie $5.25, Small $6.00, Large $6.75
-- =============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  ('Pistachio', 'ice cream', 'Ice Cream', 6.00),
  ('Choc Chip', 'ice cream', 'Ice Cream', 6.00),
  ('Cotton Candy', 'ice cream', 'Ice Cream', 6.00),
  ('M&M', 'ice cream', 'Ice Cream', 6.00),
  ('Sinful Chocolate', 'ice cream', 'Ice Cream', 6.00),
  ('Oreo', 'ice cream', 'Ice Cream', 6.00),
  ('Peppermint Stick', 'ice cream', 'Ice Cream', 6.00),
  ('Black Raspberry', 'ice cream', 'Ice Cream', 6.00),
  ('Chocolate', 'ice cream', 'Ice Cream', 6.00),
  ('Vanilla', 'ice cream', 'Ice Cream', 6.00),
  ('Snickers', 'ice cream', 'Ice Cream', 6.00),
  ('Brownie Batter', 'ice cream', 'Ice Cream', 6.00),
  ('Strawberry', 'ice cream', 'Ice Cream', 6.00),
  ('Rum Raisin', 'ice cream', 'Ice Cream', 6.00),
  ('Coconut', 'ice cream', 'Ice Cream', 6.00),
  ('Coffee Oreo', 'ice cream', 'Ice Cream', 6.00),
  ('Mint Oreo', 'ice cream', 'Ice Cream', 6.00),
  ('Coffee Caramel Chip', 'ice cream', 'Ice Cream', 6.00),
  ('Butter Pecan', 'ice cream', 'Ice Cream', 6.00),
  ('Mint Choc Chip', 'ice cream', 'Ice Cream', 6.00),
  ('Mocha Chip', 'ice cream', 'Ice Cream', 6.00),
  ('Coffee', 'ice cream', 'Ice Cream', 6.00),
  ('Maple Walnut', 'ice cream', 'Ice Cream', 6.00),
  ('Chocolate Peanut Butter Swirl', 'ice cream', 'Ice Cream', 6.00),
  ('Cookie Dough', 'ice cream', 'Ice Cream', 6.00),
  ('Salted Caramel', 'ice cream', 'Ice Cream', 6.00),
  ('Almond Joy', 'ice cream', 'Ice Cream', 6.00),
  ('Rainbow Sherbet', 'ice cream', 'Ice Cream', 6.00),
  ('Black Cherry', 'ice cream', 'Ice Cream', 6.00),
  ('Coffee Heath Bar Crunch', 'ice cream', 'Ice Cream', 6.00),
  ('Wildberry Sorbet', 'ice cream', 'Ice Cream', 6.00),
  ('Orange Pineapple', 'ice cream', 'Ice Cream', 6.00),
  ('Black Raspberry Choc Chip Yogurt', 'ice cream', 'Frozen Yogurt', 6.00),
  ('Sugar Free Coffee', 'ice cream', 'Sugar Free', 6.00),
  ('Soft Serve Cone', 'ice cream', 'Soft Serve', 4.50),
  ('Classic Sundae', 'ice cream', 'Sundaes', 7.75),
  ('Reese''s PB Cup Sundae', 'ice cream', 'Sundaes', 8.50)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Carousel Ice Cream Factory'
AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

UPDATE restaurants SET menu_section_order = ARRAY['Ice Cream', 'Soft Serve', 'Sundaes', 'Frozen Yogurt', 'Sugar Free']
WHERE name = 'Carousel Ice Cream Factory';

-- =============================================
-- NAUTI COW (liquid nitrogen custom ice cream)
-- =============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  ('Vanilla Ice Cream', 'ice cream', 'Ice Cream', 8.00),
  ('Chocolate Ice Cream', 'ice cream', 'Ice Cream', 8.00),
  ('Strawberry Ice Cream', 'ice cream', 'Ice Cream', 8.00),
  ('Coffee Ice Cream', 'ice cream', 'Ice Cream', 8.00),
  ('Cookies & Cream', 'ice cream', 'Ice Cream', 8.00),
  ('Mint Chocolate Chip', 'ice cream', 'Ice Cream', 8.00),
  ('Peanut Butter Cup', 'ice cream', 'Ice Cream', 8.00),
  ('Cookie Dough', 'ice cream', 'Ice Cream', 8.00),
  ('Salted Caramel', 'ice cream', 'Ice Cream', 8.00),
  ('Vegan Vanilla', 'ice cream', 'Vegan', 8.00),
  ('Vegan Chocolate', 'ice cream', 'Vegan', 8.00),
  ('Vegan Strawberry', 'ice cream', 'Vegan', 8.00),
  ('Frozen Yogurt', 'ice cream', 'Frozen Yogurt', 8.00),
  ('Sugar-Free Ice Cream', 'ice cream', 'Sugar Free', 8.00),
  ('Smoothie', 'ice cream', 'Smoothies', 7.50)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Nauti Cow'
AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

UPDATE restaurants SET menu_section_order = ARRAY['Ice Cream', 'Vegan', 'Frozen Yogurt', 'Sugar Free', 'Smoothies']
WHERE name = 'Nauti Cow';

-- =============================================
-- DAIRY QUEEN — EDGARTOWN
-- =============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  ('Blizzard', 'ice cream', 'Blizzards', 6.00),
  ('Oreo Blizzard', 'ice cream', 'Blizzards', 6.00),
  ('Reese''s Blizzard', 'ice cream', 'Blizzards', 6.00),
  ('Cookie Dough Blizzard', 'ice cream', 'Blizzards', 6.00),
  ('Soft Serve Cone', 'ice cream', 'Soft Serve', 4.00),
  ('Hot Fudge Sundae', 'ice cream', 'Sundaes', 5.50),
  ('Banana Split', 'ice cream', 'Sundaes', 6.50),
  ('Dilly Bar', 'ice cream', 'Novelties', 3.50)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Dairy Queen' AND r.town = 'Edgartown'
AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

UPDATE restaurants SET menu_section_order = ARRAY['Blizzards', 'Soft Serve', 'Sundaes', 'Novelties']
WHERE name = 'Dairy Queen' AND town = 'Edgartown';

-- =============================================
-- BOBBY B'S — ice cream dishes only
-- =============================================
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Bobby B''s Restaurant & Bakery', '22 Main St, Vineyard Haven, MA 02568', 41.4541, -70.6028, 'Vineyard Haven', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Bobby B''s Restaurant & Bakery');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  ('Coffee Oreo Ice Cream', 'ice cream', 'Ice Cream', 5.50),
  ('Homemade Vanilla', 'ice cream', 'Ice Cream', 5.50),
  ('Chocolate Ice Cream', 'ice cream', 'Ice Cream', 5.50)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Bobby B''s Restaurant & Bakery'
AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

-- =============================================
-- MENEMSHA GALLEY — ice cream dishes only
-- =============================================
INSERT INTO restaurants (name, address, lat, lng, town, is_open)
SELECT 'Menemsha Galley', 'Basin Rd, Chilmark, MA 02535', 41.3542, -70.7667, 'Chilmark', true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Menemsha Galley');

INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r,
(VALUES
  ('Soft Serve Cone', 'ice cream', 'Ice Cream', 5.00),
  ('Ice Cream Sundae', 'ice cream', 'Ice Cream', 7.00)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Menemsha Galley'
AND NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name);

-- =============================================
-- VERIFY
-- =============================================
SELECT r.name, r.town, COUNT(d.id) as dish_count
FROM restaurants r
LEFT JOIN dishes d ON d.restaurant_id = r.id
WHERE r.name IN (
  'Mad Martha''s Ice Cream',
  'Ben & Bill''s Chocolate Emporium',
  'Carousel Ice Cream Factory',
  'Nauti Cow',
  'Dairy Queen',
  'Bobby B''s Restaurant & Bakery',
  'Menemsha Galley'
)
GROUP BY r.name, r.town
ORDER BY r.name;