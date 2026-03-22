-- Migration 030: Performance indexes + schema fixes
-- Generated from Supabase Postgres Best Practices audit
-- Run in Supabase SQL Editor

-- =============================================
-- 1. CRITICAL: Add avatar_url to profiles table
-- (get_local_lists_for_homepage references it but column doesn't exist)
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =============================================
-- 2. CRITICAL: Index on restaurants.town
-- (every homepage query with town filter is doing a seq scan)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_restaurants_town ON restaurants(town);

-- =============================================
-- 3. CRITICAL: Fix dish_search_score to accept global_mean parameter
-- (was recalculating AVG(avg_rating) from dishes table PER ROW)
-- =============================================
CREATE OR REPLACE FUNCTION dish_search_score(
  p_avg_rating DECIMAL,
  p_total_votes BIGINT,
  p_distance_miles DECIMAL,
  p_recent_votes_14d INT,
  p_global_mean DECIMAL DEFAULT 7.0
)
RETURNS DECIMAL AS $$
DECLARE
  v_prior_strength DECIMAL := 3;
  v_base_score DECIMAL;
  v_distance_bonus DECIMAL := 0;
  v_trend_bonus DECIMAL := 0;
  v_votes DECIMAL;
BEGIN
  v_votes := COALESCE(p_total_votes, 0);

  IF v_votes = 0 OR p_avg_rating IS NULL THEN
    v_base_score := p_global_mean;
  ELSE
    v_base_score := (v_votes / (v_votes + v_prior_strength)) * p_avg_rating
                  + (v_prior_strength / (v_votes + v_prior_strength)) * p_global_mean;
  END IF;

  IF p_distance_miles IS NOT NULL THEN
    IF p_distance_miles < 1 THEN
      v_distance_bonus := 0.3;
    ELSIF p_distance_miles < 3 THEN
      v_distance_bonus := 0.15;
    END IF;
  END IF;

  IF COALESCE(p_recent_votes_14d, 0) > 0 THEN
    v_trend_bonus := LEAST(0.05 * LN(1 + p_recent_votes_14d), 0.25);
  END IF;

  RETURN ROUND((v_base_score + v_distance_bonus + v_trend_bonus)::NUMERIC, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- =============================================
-- 4. CRITICAL: Update get_ranked_dishes to precompute global_mean
-- (pass it to dish_search_score instead of recalculating per row)
-- =============================================
-- NOTE: This replaces the dish_search_score call in get_ranked_dishes.
-- The function signature stays the same — only the internal CTE changes.
-- You must re-run the full get_ranked_dishes CREATE OR REPLACE from schema.sql
-- AFTER adding this new CTE at the top:
--
--   global_stats AS (
--     SELECT COALESCE(AVG(avg_rating), 7.0) AS global_mean
--     FROM dishes
--     WHERE total_votes > 0 AND avg_rating IS NOT NULL
--   ),
--
-- And change the dish_search_score call to:
--   dish_search_score(..., (SELECT global_mean FROM global_stats))

-- =============================================
-- 5. HIGH: Missing foreign key indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_dishes_created_by ON dishes(created_by);
CREATE INDEX IF NOT EXISTS idx_favorites_dish_id ON favorites(dish_id);
CREATE INDEX IF NOT EXISTS idx_bias_events_dish_id ON bias_events(dish_id);
CREATE INDEX IF NOT EXISTS idx_local_list_items_dish_id ON local_list_items(dish_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- =============================================
-- 6. HIGH: Composite index for taste compatibility self-joins
-- =============================================
CREATE INDEX IF NOT EXISTS idx_votes_user_dish ON votes(user_id, dish_id);

-- =============================================
-- 7. HIGH: Partial index for top-level dishes (parent_dish_id IS NULL)
-- (nearly every dish query filters on this)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_toplevel
  ON dishes(restaurant_id) WHERE parent_dish_id IS NULL;

-- =============================================
-- 8. MEDIUM: Composite index for badge/identity RPCs
-- =============================================
CREATE INDEX IF NOT EXISTS idx_votes_user_position ON votes(user_id, vote_position);

-- =============================================
-- 9. MEDIUM: Partial index for consensus-eligible dishes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_dishes_consensus_eligible
  ON dishes(id) WHERE total_votes >= 5 AND avg_rating IS NOT NULL;
