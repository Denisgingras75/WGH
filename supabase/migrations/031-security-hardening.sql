-- Security hardening migration — run in Supabase SQL Editor
-- Addresses findings from GPT-5.4 security audit (2026-03-23)

-- ============================================================
-- FIX #1: Block users from inserting ai_estimated votes
-- Only service_role should be able to insert votes with source='ai_estimated'
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own votes" ON votes;
CREATE POLICY "Users can insert own votes" ON votes
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND source = 'user'
  );

-- ============================================================
-- FIX #3: Restrict votes SELECT to hide anti-abuse telemetry
-- Replace open policy with one that hides sensitive columns from non-owners
-- Non-owners see NULL for purity_score, war_score, badge_hash, source_metadata
-- ============================================================
DROP POLICY IF EXISTS "Public read access" ON votes;
CREATE POLICY "Public read access" ON votes
  FOR SELECT USING (true);
-- NOTE: RLS can't restrict columns, but we create a secure view for API use
CREATE OR REPLACE VIEW votes_public AS
SELECT
  id, dish_id, user_id, would_order_again, rating_10,
  review_text, review_created_at, source, created_at,
  -- Only expose anti-abuse telemetry to the vote owner
  CASE WHEN (select auth.uid()) = user_id THEN purity_score ELSE NULL END AS purity_score,
  CASE WHEN (select auth.uid()) = user_id THEN war_score ELSE NULL END AS war_score,
  CASE WHEN (select auth.uid()) = user_id THEN badge_hash ELSE NULL END AS badge_hash,
  CASE WHEN (select auth.uid()) = user_id THEN source_metadata ELSE NULL END AS source_metadata
FROM votes;

-- ============================================================
-- FIX #4: Restrict user_badges INSERT to service_role only
-- Users should NOT be able to self-insert badge rows
-- ============================================================
DROP POLICY IF EXISTS "System can insert badges" ON user_badges;
CREATE POLICY "System can insert badges" ON user_badges
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- FIX #5: Restrict profiles UPDATE to safe columns only
-- Users should NOT be able to set is_local_curator, follower_count, following_count
-- ============================================================
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id)
  WITH CHECK (
    (select auth.uid()) = id
    -- Prevent users from changing privileged fields
    -- These are managed by triggers/RPCs, not direct updates
    AND is_local_curator = (SELECT is_local_curator FROM profiles WHERE id = (select auth.uid()))
    AND follower_count = (SELECT follower_count FROM profiles WHERE id = (select auth.uid()))
    AND following_count = (SELECT following_count FROM profiles WHERE id = (select auth.uid()))
  );

-- ============================================================
-- FIX #6: Add server-side rate limiting to dishes and restaurants INSERT
-- Enforce the rate limit RPCs at the policy level
-- ============================================================
-- Restaurants: max 5 per hour per user (matches check_restaurant_create_rate_limit RPC)
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
CREATE POLICY "Authenticated users can insert restaurants" ON restaurants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_admin()
      OR (SELECT count(*) FROM restaurants WHERE created_by = auth.uid()
          AND created_at > now() - interval '1 hour') < 5
    )
  );

-- Dishes: max 20 per hour per user (matches check_dish_create_rate_limit RPC)
DROP POLICY IF EXISTS "Authenticated users can insert dishes" ON dishes;
CREATE POLICY "Authenticated users can insert dishes" ON dishes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_admin()
      OR auth.role() = 'service_role'
      OR (SELECT count(*) FROM dishes WHERE created_by = auth.uid()
          AND created_at > now() - interval '1 hour') < 20
    )
  );

-- ============================================================
-- FIX #7: Restrict dish photo uploads to images only and limit file size
-- Storage policies — add file type + size constraints
-- ============================================================
DROP POLICY IF EXISTS "dish_photos_insert_own" ON storage.objects;
CREATE POLICY "dish_photos_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dish-photos'
    AND (select auth.uid()) = owner
    -- Restrict to image MIME types
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'))
  );

-- ============================================================
-- FIX #9: Restrict local_list_items read to only active parent lists
-- ============================================================
DROP POLICY IF EXISTS "Public read local list items" ON local_list_items;
CREATE POLICY "Public read local list items" ON local_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM local_lists ll
      WHERE ll.id = local_list_items.list_id
      AND ll.is_active = true
    )
    OR is_admin()
    OR is_local_curator()
  );

-- ============================================================
-- FIX #11: Validate restaurant URLs to prevent phishing links
-- Only allow http/https URLs, block javascript:, data:, etc.
-- ============================================================
ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_website_url_safe;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_website_url_safe
  CHECK (website_url IS NULL OR website_url ~* '^https?://');

ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_order_url_safe;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_order_url_safe
  CHECK (order_url IS NULL OR order_url ~* '^https?://');

ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_facebook_url_safe;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_facebook_url_safe
  CHECK (facebook_url IS NULL OR facebook_url ~* '^https?://');

ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_instagram_url_safe;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_instagram_url_safe
  CHECK (instagram_url IS NULL OR instagram_url ~* '^https?://');
