-- Reimport local lists from Dan's old Supabase
-- Matches dishes by name + restaurant name (UUIDs differ between databases)

-- Step 1: Create fake curator users (for the 4 demo lists)
-- Skip if they already exist
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
VALUES
  ('aaaaaaaa-1111-4000-8000-000000000001', 'dan.demo@wgh.test', '{"display_name":"PGD"}', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('aaaaaaaa-1111-4000-8000-000000000002', 'sarah.k.demo@wgh.test', '{"display_name":"Sarah K."}', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('aaaaaaaa-1111-4000-8000-000000000003', 'mike.t.demo@wgh.test', '{"display_name":"Mike T."}', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('aaaaaaaa-1111-4000-8000-000000000004', 'jen.r.demo@wgh.test', '{"display_name":"Jen R."}', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('aaaaaaaa-1111-4000-8000-000000000005', 'carlos.m.demo@wgh.test', '{"display_name":"Carlos M."}', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create profiles for demo users
INSERT INTO profiles (id, display_name, is_local_curator, has_onboarded)
VALUES
  ('aaaaaaaa-1111-4000-8000-000000000001', 'Dan W.', true, true),
  ('aaaaaaaa-1111-4000-8000-000000000002', 'Sarah K.', true, true),
  ('aaaaaaaa-1111-4000-8000-000000000003', 'Mike T.', true, true),
  ('aaaaaaaa-1111-4000-8000-000000000004', 'Jen R.', true, true),
  ('aaaaaaaa-1111-4000-8000-000000000005', 'Carlos M.', true, true)
ON CONFLICT (id) DO UPDATE SET is_local_curator = true, display_name = EXCLUDED.display_name;

-- Step 2: Clear existing local lists
DELETE FROM local_list_items;
DELETE FROM local_lists;

-- Step 3: Create the 5 lists
-- Dan's list (need Dan's user_id on Denis's DB — will use a placeholder, update below)
INSERT INTO local_lists (id, user_id, title, description, curator_tagline, is_active) VALUES
  ('08f9023f-cde9-47cb-b3c7-118b318e28db', 'aaaaaaaa-1111-4000-8000-000000000001', 'Dan''s MV Top 10', 'The best dishes on Martha''s Vineyard right now', 'App creator, year-round islander', true),
  ('66a9524f-c21b-4b0c-aab8-f390a175991e', 'aaaaaaaa-1111-4000-8000-000000000002', 'Celiac-Safe on MV', NULL, 'Diagnosed celiac, 8 years on the island. Every dish here I''ve eaten safely.', true),
  ('a3b7a0b9-ab21-4b35-bceb-960d1ee3ac10', 'aaaaaaaa-1111-4000-8000-000000000003', 'Alpha-Gal Friendly', NULL, 'Got the tick bite in ''22. No red meat, no problem — these are my go-tos.', true),
  ('f4819530-dc19-4058-a4bd-36abfd540dd4', 'aaaaaaaa-1111-4000-8000-000000000004', 'Best for Little Kids', NULL, 'Mom of 3 under 7. These are the dishes my kids will actually finish.', true),
  ('7a5bf7a9-3c53-4a57-9dde-65b41e83c22a', 'aaaaaaaa-1111-4000-8000-000000000005', 'Pescatarian Picks', NULL, 'Seafood only since 2019. The island makes it easy — here''s the best of it.', true);

-- Step 4: Insert list items (matched by dish_name + restaurant_name)

-- Dan's MV Top 10
INSERT INTO local_list_items (list_id, dish_id, position, note)
SELECT '08f9023f-cde9-47cb-b3c7-118b318e28db', d.id, v.pos, NULL
FROM (VALUES
  ('Shrimp Nancy''s', 'Nancy''s Restaurant', 1),
  ('Lobster Benedict', 'Waterside Market', 2),
  ('Steak Taco', 'Lookout Tavern', 3),
  ('Bacon Jalapeño Pizza', 'Porto Pizza', 4),
  ('Harissa Roasted Cauliflower', 'The Attic', 5),
  ('Balsamic Bruschetta', 'The Barn Bowl & Bistro', 6),
  ('French Fries', 'Winston''s Kitchen', 7),
  ('Hand-Cut Fries', 'Offshore Ale Company', 8),
  ('Shawarma Spiced Carrots', 'The Maker', 9),
  ('Faroe Island Salmon Tartare', 'Red Cat Kitchen', 10)
) AS v(dish_name, restaurant_name, pos)
JOIN dishes d ON d.name = v.dish_name
JOIN restaurants r ON r.id = d.restaurant_id AND r.name = v.restaurant_name;

-- Celiac-Safe on MV
INSERT INTO local_list_items (list_id, dish_id, position, note)
SELECT '66a9524f-c21b-4b0c-aab8-f390a175991e', d.id, v.pos, NULL
FROM (VALUES
  ('Hoisin Glazed Salmon Rice Bowl', 'The Attic', 1),
  ('Kale Caesar Salad', 'Mo''s Lunch', 2),
  ('Nova Scotia Halibut', 'The Covington', 3),
  ('Oysters Half Dozen', 'Lookout Tavern', 4),
  ('Faroe Island Salmon Tartare', 'Red Cat Kitchen', 5),
  ('Shrimp Cocktail', 'Beach Road', 6),
  ('Campground Smok''n Vegan', 'MV Salads', 7),
  ('Chopped Salad', 'Mo''s Lunch', 8),
  ('Harissa Roasted Cauliflower', 'The Attic', 9),
  ('Ahi Tuna Poke Bowl', 'The Barn Bowl & Bistro', 10)
) AS v(dish_name, restaurant_name, pos)
JOIN dishes d ON d.name = v.dish_name
JOIN restaurants r ON r.id = d.restaurant_id AND r.name = v.restaurant_name;

-- Alpha-Gal Friendly
INSERT INTO local_list_items (list_id, dish_id, position, note)
SELECT 'a3b7a0b9-ab21-4b35-bceb-960d1ee3ac10', d.id, v.pos, NULL
FROM (VALUES
  ('Attic Fried Chicken Sandwich', 'The Attic', 1),
  ('Shrimp Nancy''s', 'Nancy''s Restaurant', 2),
  ('Fish & Chips', 'Lookout Tavern', 3),
  ('Buffalo Chicken Pizza', 'Wolf''s Den Pizzeria', 4),
  ('Popcorn Chicken', 'Martha''s Vineyard Chowder Company', 5),
  ('Fried Shrimp Platter', 'Martha''s Vineyard Chowder Company', 6),
  ('Spicy Baja Fish & Chips', 'Town Bar', 7),
  ('Cold Lobster Roll', 'Nancy''s Restaurant', 8),
  ('Southwest Chicken Egg Rolls', 'The Barn Bowl & Bistro', 9),
  ('Hawaiian Pizza', 'Offshore Ale Company', 10)
) AS v(dish_name, restaurant_name, pos)
JOIN dishes d ON d.name = v.dish_name
JOIN restaurants r ON r.id = d.restaurant_id AND r.name = v.restaurant_name;

-- Best for Little Kids
INSERT INTO local_list_items (list_id, dish_id, position, note)
SELECT 'f4819530-dc19-4058-a4bd-36abfd540dd4', d.id, v.pos, NULL
FROM (VALUES
  ('Pepperoni Pizza', 'Porto Pizza', 1),
  ('Hand-Cut Fries', 'Offshore Ale Company', 2),
  ('Buttermilk Pancakes', 'Biscuits', 3),
  ('Grilled Chicken Sandwich', 'Lookout Tavern', 4),
  ('French Fries', 'Winston''s Kitchen', 5),
  ('White Pizza', 'Porto Pizza', 6),
  ('Fried Cheese Curds', 'Winston''s Kitchen', 7),
  ('Maine Italian Sub', 'Winston''s Kitchen', 8),
  ('Deep Dish Pepperoni', 'Porto Pizza', 9),
  ('Breakfast Sandwich', 'Winston''s Kitchen', 10)
) AS v(dish_name, restaurant_name, pos)
JOIN dishes d ON d.name = v.dish_name
JOIN restaurants r ON r.id = d.restaurant_id AND r.name = v.restaurant_name;

-- Pescatarian Picks
INSERT INTO local_list_items (list_id, dish_id, position, note)
SELECT '7a5bf7a9-3c53-4a57-9dde-65b41e83c22a', d.id, v.pos, NULL
FROM (VALUES
  ('Cold Lobster Roll', 'Nancy''s Restaurant', 1),
  ('Nova Scotia Halibut', 'The Covington', 2),
  ('Clam Chowder', 'Wharf Pub', 3),
  ('Fried Calamari', 'Rockfish', 4),
  ('Oysters Dozen', 'Lookout Tavern', 5),
  ('Lobster Benedict', 'Waterside Market', 6),
  ('Clam Chowder', 'The Seafood Shanty', 7),
  ('Fish N'' Chips', 'Wharf Pub', 8),
  ('Mussels', 'Wharf Pub', 9),
  ('Clam Chowder', 'Bettini Restaurant', 10)
) AS v(dish_name, restaurant_name, pos)
JOIN dishes d ON d.name = v.dish_name
JOIN restaurants r ON r.id = d.restaurant_id AND r.name = v.restaurant_name;

-- Verify
SELECT ll.title, COUNT(li.id) as items
FROM local_lists ll
LEFT JOIN local_list_items li ON li.list_id = ll.id
GROUP BY ll.title
ORDER BY ll.title;
