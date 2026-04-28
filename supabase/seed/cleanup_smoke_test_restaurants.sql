-- Delete smoke-test restaurant stubs polluting Oak Bluffs.
-- Run in Supabase SQL Editor (admin context bypasses RLS).
-- Idempotent — safe to re-run.

DELETE FROM restaurants
 WHERE name LIKE 'SmokeTestCafe-%'
    OR name LIKE 'TestRestaurant-%';

-- Verify Oak Bluffs is clean afterward:
SELECT count(*) AS oak_bluffs_total,
       count(*) FILTER (WHERE menu_url IS NULL) AS missing_menu_url
  FROM restaurants
 WHERE town = 'Oak Bluffs';
