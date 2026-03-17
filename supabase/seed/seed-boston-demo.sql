-- ============================================================
-- Boston Demo Restaurant Seeder
-- ============================================================
-- Seeds a Boston restaurant with menu items to demonstrate
-- the app working outside island regions.
--
-- Restaurant: Neptune Oyster (North End, Boston)
-- A well-known Boston seafood spot with online ordering.
--
-- Safe to re-run: checks for existing restaurant first
-- ============================================================

DO $$
DECLARE
  v_restaurant_id UUID;
  v_dish_id UUID;
  v_existing UUID;
BEGIN
  -- Check if restaurant already exists (by name + town)
  SELECT id INTO v_existing
  FROM restaurants
  WHERE name = 'Neptune Oyster' AND town = 'North End';

  IF v_existing IS NOT NULL THEN
    RAISE NOTICE 'Neptune Oyster already exists (id=%)', v_existing;
    v_restaurant_id := v_existing;
  ELSE
    INSERT INTO restaurants (
      name, address, lat, lng, is_open, town, cuisine,
      phone, website_url, order_url,
      menu_section_order
    ) VALUES (
      'Neptune Oyster',
      '63 Salem St, Boston, MA 02113',
      42.3631, -71.0546,
      true,
      'North End',
      'Seafood',
      '(617) 742-3474',
      'https://www.neptuneoyster.com',
      'https://www.neptuneoyster.com/order',
      ARRAY['Raw Bar', 'Starters', 'Entrees', 'Sides', 'Desserts']
    )
    RETURNING id INTO v_restaurant_id;

    RAISE NOTICE 'Created Neptune Oyster (id=%)', v_restaurant_id;
  END IF;

  -- Seed dishes (skip if dish already exists at this restaurant)

  -- Raw Bar
  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Oysters (Half Dozen)') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Oysters (Half Dozen)', 'seafood', 'Raw Bar', 21.00, ARRAY['fresh', 'local', 'light']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Littleneck Clams') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Littleneck Clams', 'seafood', 'Raw Bar', 18.00, ARRAY['fresh', 'local']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Jonah Crab Claws') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Jonah Crab Claws', 'seafood', 'Raw Bar', 24.00, ARRAY['fresh', 'shareable']);
  END IF;

  -- Starters
  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'New England Clam Chowder') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'New England Clam Chowder', 'chowder', 'Starters', 14.00, ARRAY['comfort', 'classic', 'warm']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Tuna Crudo') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Tuna Crudo', 'seafood', 'Starters', 22.00, ARRAY['fresh', 'light', 'elegant']);
  END IF;

  -- Entrees
  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Lobster Roll') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Lobster Roll', 'lobster roll', 'Entrees', 34.00, ARRAY['classic', 'iconic', 'buttery']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Pan-Roasted Cod') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Pan-Roasted Cod', 'seafood', 'Entrees', 32.00, ARRAY['hearty', 'classic']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Bone-In Ribeye') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Bone-In Ribeye', 'steak', 'Entrees', 58.00, ARRAY['hearty', 'indulgent', 'shareable']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Linguine Alle Vongole') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Linguine Alle Vongole', 'pasta', 'Entrees', 28.00, ARRAY['comfort', 'classic', 'italian']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Fish & Chips') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Fish & Chips', 'seafood', 'Entrees', 24.00, ARRAY['comfort', 'crispy', 'classic']);
  END IF;

  -- Sides
  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Truffle Fries') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Truffle Fries', 'fries', 'Sides', 12.00, ARRAY['crispy', 'indulgent', 'shareable']);
  END IF;

  -- Desserts
  IF NOT EXISTS (SELECT 1 FROM dishes WHERE restaurant_id = v_restaurant_id AND name = 'Key Lime Pie') THEN
    INSERT INTO dishes (restaurant_id, name, category, menu_section, price, tags)
    VALUES (v_restaurant_id, 'Key Lime Pie', 'dessert', 'Desserts', 14.00, ARRAY['sweet', 'tangy', 'classic']);
  END IF;

  RAISE NOTICE 'Done — Neptune Oyster seeded with dishes';
END $$;
