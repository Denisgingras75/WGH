-- Toast POS online ordering slugs for MV restaurants
-- URL pattern: https://order.toasttab.com/online/{slug}
-- Confirmed 2026-03-08
-- Matched against exact restaurant names in DB

-- Oak Bluffs
UPDATE restaurants SET toast_slug = 'lookout-tavern' WHERE name = 'Lookout Tavern';
UPDATE restaurants SET toast_slug = 'sharkob' WHERE name = 'Sharky''s Cantina' AND town = 'Oak Bluffs';
UPDATE restaurants SET toast_slug = 'nancys' WHERE name = 'Nancy''s Restaurant';
UPDATE restaurants SET toast_slug = 'offshore-ale-co-30-kennebec-ave' WHERE name = 'Offshore Ale Company';
UPDATE restaurants SET toast_slug = 'thebarn' WHERE name = 'The Barn Bowl & Bistro';
UPDATE restaurants SET toast_slug = 'chowder' WHERE name = 'Martha''s Vineyard Chowder Company';
UPDATE restaurants SET toast_slug = 'nomans' WHERE name = 'Nomans';
UPDATE restaurants SET toast_slug = 'cozycornercafemv' WHERE name = 'Cozy Corner';
UPDATE restaurants SET toast_slug = 'rockfish-11-n-water-street' WHERE name = 'Rockfish';
UPDATE restaurants SET toast_slug = 'portopizza' WHERE name = 'Porto Pizza';
UPDATE restaurants SET toast_slug = 'town-bar-and-grill-mv' WHERE name = 'Town Bar';

-- Edgartown
UPDATE restaurants SET toast_slug = '19-raw-oyster-bar-19-church-street' WHERE name = '19 Raw Oyster Bar';
UPDATE restaurants SET toast_slug = 'bad-martha-farmers-brewery-edgartown-270-upper-main-street' WHERE name = 'Bad Martha Farmers Brewery & Pizzeria';
UPDATE restaurants SET toast_slug = 'atria-137-upper-main-street' WHERE name = 'Atria';
UPDATE restaurants SET toast_slug = 'behind-the-bookstore' WHERE name = 'Behind the Bookstore';
UPDATE restaurants SET toast_slug = 'alchemymv' WHERE name = 'Alchemy Bistro & Bar';
UPDATE restaurants SET toast_slug = 'garde-east-52-beach-road' WHERE name = 'Garde East';

-- Vineyard Haven
UPDATE restaurants SET toast_slug = 'black-dog-tavern' WHERE name = 'Black Dog Tavern';
UPDATE restaurants SET toast_slug = 'beach-road-mv-688-state-road' WHERE name = 'Beach Road';
UPDATE restaurants SET toast_slug = 'artcliff-diner-39-beach-road' WHERE name = 'Art Cliff Diner';
UPDATE restaurants SET toast_slug = 'net-result-79-beach-road' WHERE name = 'Net Result';
UPDATE restaurants SET toast_slug = 'tigerhawk-sandwich-co' WHERE name = 'TigerHawk Sandwich Company';
UPDATE restaurants SET toast_slug = 'black-sheep-mercantile' WHERE name = 'Black Sheep';

-- West Tisbury
UPDATE restaurants SET toast_slug = '7a-foods' WHERE name = '7aFoods';
UPDATE restaurants SET toast_slug = 'black-dog-bakery-cafe-vineyard-haven' WHERE name = 'The Black Dog Bakery Café (State St.)';

-- Chilmark
UPDATE restaurants SET toast_slug = 'mo''s-lunch' WHERE name = 'Mo''s Lunch';

-- Null town
UPDATE restaurants SET toast_slug = 'themakermv' WHERE name = 'Maker Café';
