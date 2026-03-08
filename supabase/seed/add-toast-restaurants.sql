-- Add 7 MV restaurants that are on Toast but missing from WGH DB
-- Then set their toast_slug for Order Now buttons
-- NOTE: Sharky's Cantina Edgartown location CLOSED (end of 2022) — excluded

INSERT INTO restaurants (name, address, lat, lng, town, cuisine, is_open) VALUES
  ('Dos Mas', '50 Circuit Ave, Oak Bluffs, MA 02557', 41.4552, -70.5585, 'Oak Bluffs', 'mexican', true),
  ('The Loud Kitchen Experience', '4 Circuit Ave, Oak Bluffs, MA 02557', 41.4572, -70.5576, 'Oak Bluffs', 'soul food', true),
  ('Wicked Burger', '258 Upper Main St, Edgartown, MA 02539', 41.3938, -70.5262, 'Edgartown', 'burger', true),
  ('Great Harbor Market', '199 Upper Main St, Edgartown, MA 02539', 41.3920, -70.5224, 'Edgartown', 'deli', true),
  ('Wharf Pub', '3 Main St, Edgartown, MA 02539', 41.3895, -70.5131, 'Edgartown', 'pub', true),
  ('Nina''s on Beach Road', '61 Beach Rd, Vineyard Haven, MA 02568', 41.4538, -70.6011, 'Vineyard Haven', 'brazilian', true),
  ('La Strada', '65 Main St, Vineyard Haven, MA 02568', 41.4552, -70.6028, 'Vineyard Haven', 'italian', true);

-- Set Toast slugs for the new restaurants
UPDATE restaurants SET toast_slug = 'backyard-taco' WHERE name = 'Dos Mas';
UPDATE restaurants SET toast_slug = 'loudkitchenexp' WHERE name = 'The Loud Kitchen Experience';
UPDATE restaurants SET toast_slug = 'wicked-burger-258-upper-main-street' WHERE name = 'Wicked Burger';
UPDATE restaurants SET toast_slug = 'great-harbor-market-199-upper-main-street' WHERE name = 'Great Harbor Market';
UPDATE restaurants SET toast_slug = 'wharf-pub' WHERE name = 'Wharf Pub';
UPDATE restaurants SET toast_slug = 'ninasonbeachroad' WHERE name = 'Nina''s on Beach Road';
UPDATE restaurants SET toast_slug = 'la-strada-65-main-street' WHERE name = 'La Strada';
