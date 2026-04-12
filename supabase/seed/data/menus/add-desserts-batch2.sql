-- Batch 2 Desserts — Edgartown (casual) + Aquinnah
-- Source: restaurant websites (April 2026)
-- Run this in Supabase SQL Editor

-- ============================================================
-- BACK DOOR DONUTS — full menu refresh (see back-door-donuts-full-menu.sql)
-- Run that file separately — it does DELETE + INSERT for all 48 items
-- ============================================================

-- ============================================================
-- COZY CORNER — add 8 desserts to existing menu
-- Source: cozycornermv.com/menu (April 2026)
-- ============================================================

-- Add desserts (guard against duplicates)
INSERT INTO dishes (restaurant_id, name, category, menu_section, price)
SELECT r.id, v.name, v.category, v.menu_section, v.price
FROM restaurants r
CROSS JOIN (VALUES
  ('Salted Caramel Tart', 'dessert', 'Desserts', 16.00),
  ('Basque Cheesecake', 'dessert', 'Desserts', 17.00),
  ('Red Cheese Mousse', 'dessert', 'Desserts', 18.00),
  ('Warm Apple Cake', 'dessert', 'Desserts', 18.00),
  ('Affogato Frangelico', 'dessert', 'Desserts', 15.00),
  ('Lemon Pie with Basil and Lime Sorbet', 'dessert', 'Desserts', 12.00),
  ('Classic Tiramisu', 'dessert', 'Desserts', 15.00)
) AS v(name, category, menu_section, price)
WHERE r.name = 'Cozy Corner'
  AND NOT EXISTS (
    SELECT 1 FROM dishes d WHERE d.restaurant_id = r.id AND d.name = v.name
  );

-- Note: Cheese Platter ($29) skipped — not a dessert

-- Add Desserts to menu_section_order
UPDATE restaurants
SET menu_section_order = array_append(menu_section_order, 'Desserts')
WHERE name = 'Cozy Corner'
  AND NOT ('Desserts' = ANY(COALESCE(menu_section_order, ARRAY[]::text[])));

-- ============================================================
-- EDGARTOWN PIZZA — no desserts on menu (confirmed April 2026)
-- ============================================================

-- ============================================================
-- WHARF PUB — no desserts on menu (confirmed April 2026)
-- ============================================================

-- ============================================================
-- AQUILA (Aquinnah) — coffee/retail shop at Aquinnah Cliffs
-- Not a restaurant with a formal dessert menu
-- Serves coffee, smoothies, acai bowls, grab-and-go pastries
-- DB has "Aquila at the Y Cafe - Smoothies & Acai" (YMCA location)
-- Aquinnah Cliffs location is NOT in the database yet
-- ============================================================

-- Verify Cozy Corner desserts
SELECT d.name, d.category, d.menu_section, d.price
FROM dishes d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE r.name = 'Cozy Corner' AND d.category = 'dessert'
ORDER BY d.name;
