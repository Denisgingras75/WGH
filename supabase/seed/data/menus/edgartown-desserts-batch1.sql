-- Edgartown Desserts Batch 1
-- Restaurants: Alchemy Bistro & Bar, Rockfish, Espresso Love
-- Source: alchemyedgartown.com, Toast ordering (Rockfish), SinglePlatform (Espresso Love)
-- Run this in Supabase SQL Editor

-- ============================================
-- Alchemy Bistro & Bar — Desserts (3 items)
-- ============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT rid, v.name, v.category, v.menu_section, v.price
FROM (SELECT id AS rid FROM restaurants WHERE name = 'Alchemy Bistro & Bar') r,
(VALUES
  ('German Chocolate Cake', 'dessert', 'Desserts', 18.00),
  ('Green Tea Matcha Crème Brûlée', 'dessert', 'Desserts', 18.00),
  ('House Made Seasonal Scoops', 'ice cream', 'Desserts', 10.00)
) AS v(name, category, menu_section, price)
WHERE NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = rid AND d.name = v.name);

-- Add Desserts to menu_section_order
UPDATE restaurants
SET menu_section_order = array_append(menu_section_order, 'Desserts')
WHERE name = 'Alchemy Bistro & Bar'
  AND NOT ('Desserts' = ANY(menu_section_order));

-- ============================================
-- Rockfish — Desserts (5 items)
-- ============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT rid, v.name, v.category, v.menu_section, v.price
FROM (SELECT id AS rid FROM restaurants WHERE name = 'Rockfish') r,
(VALUES
  ('7 Layer Chocolate', 'dessert', 'Desserts', 14.00),
  ('Turtle Cheesecake', 'dessert', 'Desserts', 14.00),
  ('Tiramisu', 'dessert', 'Desserts', 14.00),
  ('Churro Donut', 'donuts', 'Desserts', 14.00),
  ('GF Strawberry Shortcake', 'dessert', 'Desserts', 14.00)
) AS v(name, category, menu_section, price)
WHERE NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = rid AND d.name = v.name);

-- Add Desserts to menu_section_order
UPDATE restaurants
SET menu_section_order = array_append(menu_section_order, 'Desserts')
WHERE name = 'Rockfish'
  AND NOT ('Desserts' = ANY(menu_section_order));

-- ============================================
-- Espresso Love — Pastries (2 items)
-- ============================================
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT rid, v.name, v.category, v.menu_section, v.price
FROM (SELECT id AS rid FROM restaurants WHERE name = 'Espresso Love') r,
(VALUES
  ('Blueberry Scone', 'pastry', 'Pastries', 3.25),
  ('Blueberry Muffin', 'pastry', 'Pastries', 3.25)
) AS v(name, category, menu_section, price)
WHERE NOT EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = rid AND d.name = v.name);

-- Add Pastries to menu_section_order
UPDATE restaurants
SET menu_section_order = array_append(menu_section_order, 'Pastries')
WHERE name = 'Espresso Love'
  AND NOT ('Pastries' = ANY(menu_section_order));

-- ============================================
-- Verify counts
-- ============================================
SELECT r.name, COUNT(*) as dessert_count
FROM dishes d
JOIN restaurants r ON r.id = d.restaurant_id
WHERE r.name IN ('Alchemy Bistro & Bar', 'Rockfish', 'Espresso Love')
  AND d.category IN ('dessert', 'ice cream', 'donuts')
GROUP BY r.name
ORDER BY r.name;
