-- Oak Bluffs menu-URL patch — sourced via web search 2026-04-27.
-- Run in SQL Editor. After this, run scripts/refresh-oak-bluffs-menus.sh
-- (or add these 3 to the script's TARGETS array) to populate dishes.

-- 1. Linda Jean's Restaurant — operating since 1976, currently owned by
--    Winston/Lisa Christie (also own Winston's Kitchen). Menu page is live.
UPDATE restaurants
   SET menu_url = 'https://lindajeansrestaurantmv.com/menus/'
 WHERE name = 'Linda Jean''s Restaurant'
   AND town = 'Oak Bluffs';

-- 2. The Loud Kitchen Experience — Chef Canieka Fleming, operates inside
--    The Ritz at 4 Circuit Ave. Toast online ordering is the canonical menu.
UPDATE restaurants
   SET menu_url   = 'https://order.toasttab.com/online/loudkitchenexp',
       toast_slug = COALESCE(toast_slug, 'loudkitchenexp')
 WHERE name = 'The Loud Kitchen Experience'
   AND town = 'Oak Bluffs';

-- 3. Dos Mas → ESH — rebrand 2026-03-31 per Vineyard Gazette.
--    Same physical location on Circuit Ave; same Toast tenant (slug stays
--    'backyard-taco' since the Shai family group hadn't changed it).
--    Concept change: Mexican tacos → upscale "progressive American".
--    Co-owners Evan/Zared/Megan Shai (also own Taco MV in Edgartown).
UPDATE restaurants
   SET name      = 'ESH',
       cuisine   = 'American',
       menu_url  = 'https://order.toasttab.com/online/backyard-taco'
 WHERE name = 'Dos Mas'
   AND town = 'Oak Bluffs';

-- Verify
SELECT name, menu_url, toast_slug, cuisine
  FROM restaurants
 WHERE town = 'Oak Bluffs'
   AND name IN ('Linda Jean''s Restaurant', 'The Loud Kitchen Experience', 'ESH');
