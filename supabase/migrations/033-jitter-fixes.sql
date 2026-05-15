-- 033-jitter-fixes.sql
-- Three Jitter UX fixes:
--   1. Add jitter_waitlist table (anon insert; service-role read) so /jitter
--      sign-ups actually persist instead of throwing "table not found".
--   2. Expose war_score in the public_votes view so the dish-review "?"
--      explainer can render this reviewer's Trust Score.
--   3. Add created_at to get_jitter_badges so the TrustBadge popover can
--      render "Member since".
--
-- Run in Supabase SQL Editor. Idempotent. Migrations 027 + 028 must already be
-- applied (schema.sql now reflects their deployed state).

-- =============================================
-- 1. jitter_waitlist
-- =============================================
CREATE TABLE IF NOT EXISTS jitter_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'general' CHECK (source IN ('general', 'developer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS jitter_waitlist_email_source_unique
  ON jitter_waitlist (lower(email), source);

ALTER TABLE jitter_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join jitter waitlist" ON jitter_waitlist;
CREATE POLICY "Anyone can join jitter waitlist" ON jitter_waitlist
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role reads jitter waitlist" ON jitter_waitlist;
CREATE POLICY "Service role reads jitter waitlist" ON jitter_waitlist
  FOR SELECT USING (auth.role() = 'service_role');

-- =============================================
-- 2. public_votes view: include war_score
-- =============================================
-- DROP + CREATE because adding a column changes the view's output shape.
DROP VIEW IF EXISTS public_votes;
CREATE VIEW public_votes AS
SELECT
  id,
  dish_id,
  rating_10,
  review_text,
  review_created_at,
  user_id,
  source,
  war_score
FROM votes;

-- =============================================
-- 3. get_jitter_badges: include created_at
-- =============================================
-- DROP because RETURNS TABLE columns are part of the function signature.
DROP FUNCTION IF EXISTS get_jitter_badges(UUID[]);
CREATE OR REPLACE FUNCTION get_jitter_badges(p_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  confidence_level TEXT,
  consistency_score DECIMAL,
  review_count INT,
  flagged BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
  SELECT jp.user_id, jp.confidence_level, jp.consistency_score, jp.review_count, jp.flagged, jp.created_at
  FROM jitter_profiles jp
  WHERE jp.user_id = ANY(p_user_ids);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- =============================================
-- 4. VERIFY
-- =============================================
SELECT 'jitter_waitlist' AS check, EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'jitter_waitlist'
) AS ok
UNION ALL
SELECT 'public_votes.war_score', EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'public_votes' AND column_name = 'war_score'
)
UNION ALL
SELECT 'get_jitter_badges.created_at', EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'get_jitter_badges'
    AND pg_get_function_result(p.oid) LIKE '%created_at%'
);

-- ROLLBACK:
-- DROP TABLE IF EXISTS jitter_waitlist;
--
-- DROP VIEW IF EXISTS public_votes;
-- CREATE VIEW public_votes AS
-- SELECT id, dish_id, rating_10, review_text, review_created_at, user_id, source
-- FROM votes;
--
-- DROP FUNCTION IF EXISTS get_jitter_badges(UUID[]);
-- CREATE OR REPLACE FUNCTION get_jitter_badges(p_user_ids UUID[])
-- RETURNS TABLE (user_id UUID, confidence_level TEXT, consistency_score DECIMAL, review_count INT, flagged BOOLEAN) AS $$
--   SELECT jp.user_id, jp.confidence_level, jp.consistency_score, jp.review_count, jp.flagged
--   FROM jitter_profiles jp
--   WHERE jp.user_id = ANY(p_user_ids);
-- $$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
