-- =============================================
-- Auto-scrape trigger: fire restaurant-scraper on new restaurant insert
-- =============================================
-- When a new restaurant is inserted with a scrapeable URL (website, menu, or facebook),
-- immediately fire the restaurant-scraper edge function via pg_net to extract
-- events and specials. Uses the same vault secrets pattern as the daily cron.
--
-- Prerequisites:
--   1. pg_net extension enabled
--   2. vault secrets: 'supabase_url' and 'service_role_key'
--   3. Edge function deployed: restaurant-scraper
--
-- Run this in Supabase SQL Editor.
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS trg_auto_scrape_on_restaurant_insert ON restaurants;
--   DROP FUNCTION IF EXISTS fn_auto_scrape_on_restaurant_insert();
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION fn_auto_scrape_on_restaurant_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, vault
AS $$
DECLARE
  _supabase_url TEXT;
  _service_role_key TEXT;
BEGIN
  -- Only fire if the restaurant has at least one scrapeable URL
  IF NEW.website_url IS NULL AND NEW.menu_url IS NULL AND NEW.facebook_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Read secrets from vault (same pattern as daily cron)
  SELECT decrypted_secret INTO _supabase_url
    FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO _service_role_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  -- Guard: skip if vault secrets not configured
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN
    RAISE WARNING 'auto_scrape trigger: vault secrets not configured, skipping';
    RETURN NEW;
  END IF;

  -- Fire async HTTP POST to restaurant-scraper edge function
  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/restaurant-scraper',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    ),
    body := jsonb_build_object(
      'restaurant_id', NEW.id,
      'restaurant_name', NEW.name,
      'website_url', NEW.website_url,
      'facebook_url', NEW.facebook_url
    )
  );

  RETURN NEW;
END;
$$;

-- Attach trigger (AFTER INSERT so the row is committed and visible to the edge function)
DROP TRIGGER IF EXISTS trg_auto_scrape_on_restaurant_insert ON restaurants;
CREATE TRIGGER trg_auto_scrape_on_restaurant_insert
  AFTER INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_scrape_on_restaurant_insert();
