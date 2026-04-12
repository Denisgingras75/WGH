-- Migration: Security views and policy tightening
-- Date: 2026-03-29
-- Issues: #7 (votes table exposes anti-abuse internals), #8 (local_list_items readable by anyone)

-- =============================================
-- Issue #7: public_votes view
-- =============================================
-- Exposes only the fields the app needs for display. Excludes anti-abuse internals:
-- purity_score, war_score, badge_hash, source_metadata.
--
-- The existing "Public read access" RLS policy on the underlying votes table is NOT
-- changed here to avoid breaking existing callers. Migrate callers to use this view
-- first, then tighten the RLS policy in a follow-up migration.
--
-- To migrate a caller:
--   1. Change table reference from `votes` to `public_votes`
--   2. Remove any references to excluded columns (purity_score, war_score, badge_hash, source_metadata)
--   3. Once all callers are migrated, drop or restrict the RLS SELECT policy on votes

CREATE OR REPLACE VIEW public_votes
WITH (security_invoker = true) AS
SELECT
  id,
  dish_id,
  would_order_again,
  rating_10,
  review_text,
  review_created_at,
  user_id,
  source
FROM votes;

-- =============================================
-- Issue #8: local_list_items — restrict to active lists only
-- =============================================
-- Previously USING (true) leaked unpublished curator drafts to any caller.
-- Now only items belonging to an active parent list are readable publicly.

DROP POLICY IF EXISTS "local_list_items_public_read" ON local_list_items;

CREATE POLICY "local_list_items_public_read"
  ON local_list_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM local_lists ll WHERE ll.id = list_id AND ll.is_active = true));
