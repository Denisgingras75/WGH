-- Binary Vote Removal — Phase 1
-- Design spec: docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md
-- Plan:        docs/superpowers/plans/2026-04-12-binary-vote-removal.md
--
-- Changes:
--   1. votes.would_order_again becomes nullable (Phase 2 will exploit this).
--      Phase 1 does NOT write NULL; the RPC still derives a boolean from rating.
--   2. submit_vote_atomic's p_would_order_again param is now optional.
--      When NULL (new clients), server derives from rating_10 >= 7.0.
--      When boolean (stale PWA bundles), server honors caller's value.
--   3. The full existing body (access control, ON CONFLICT shape, COALESCE
--      preservation of prior values, `source = 'user'`, return type votes%ROWTYPE)
--      is preserved. The only shape change is p_would_order_again becoming
--      DEFAULT NULL plus server-side derivation when the caller omits it.

-- 1. Drop NOT NULL on would_order_again so Phase 2 can write NULL.
ALTER TABLE votes
  ALTER COLUMN would_order_again DROP NOT NULL;

-- 2. Drop the existing submit_vote_atomic so we can change its parameter defaults.
-- Postgres doesn't allow changing a param's default via CREATE OR REPLACE when
-- the default is being added to a previously-required positional param.
DROP FUNCTION IF EXISTS submit_vote_atomic(
  UUID, UUID, BOOLEAN, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT
);

-- 3. Recreate with p_would_order_again optional + server-side derivation.
CREATE OR REPLACE FUNCTION submit_vote_atomic(
  p_dish_id UUID,
  p_user_id UUID,
  p_would_order_again BOOLEAN DEFAULT NULL,
  p_rating_10 DECIMAL DEFAULT NULL,
  p_review_text TEXT DEFAULT NULL,
  p_purity_score DECIMAL DEFAULT NULL,
  p_war_score DECIMAL DEFAULT NULL,
  p_badge_hash TEXT DEFAULT NULL
)
RETURNS votes AS $$
DECLARE
  submitted_vote votes;
  v_effective_would_order BOOLEAN;
BEGIN
  -- Preserve existing access control: caller must either be service_role
  -- or be operating on their own row.
  IF auth.role() <> 'service_role' AND (select auth.uid()) IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Shadow-write compatibility: if caller omits the binary (new clients),
  -- derive it from the rating. Stale PWA bundles that still pass a boolean
  -- are honored as-is so we don't lose their intent.
  -- Column is nullable now, but Phase 1 still writes a concrete boolean so
  -- downstream aggregations (ranking, percent-worth-it) keep working.
  IF p_would_order_again IS NULL THEN
    IF p_rating_10 IS NULL THEN
      RAISE EXCEPTION 'rating_10 is required when would_order_again is omitted';
    END IF;
    v_effective_would_order := (p_rating_10 >= 7.0);
  ELSE
    v_effective_would_order := p_would_order_again;
  END IF;

  INSERT INTO votes (
    dish_id,
    user_id,
    would_order_again,
    rating_10,
    review_text,
    review_created_at,
    purity_score,
    war_score,
    badge_hash,
    source
  )
  VALUES (
    p_dish_id,
    p_user_id,
    v_effective_would_order,
    p_rating_10,
    p_review_text,
    CASE WHEN p_review_text IS NOT NULL THEN NOW() ELSE NULL END,
    p_purity_score,
    p_war_score,
    p_badge_hash,
    'user'
  )
  ON CONFLICT (dish_id, user_id) WHERE source = 'user'
  DO UPDATE SET
    would_order_again = EXCLUDED.would_order_again,
    rating_10 = EXCLUDED.rating_10,
    review_text = COALESCE(EXCLUDED.review_text, votes.review_text),
    review_created_at = COALESCE(EXCLUDED.review_created_at, votes.review_created_at),
    purity_score = COALESCE(EXCLUDED.purity_score, votes.purity_score),
    war_score = COALESCE(EXCLUDED.war_score, votes.war_score),
    badge_hash = COALESCE(EXCLUDED.badge_hash, votes.badge_hash)
  RETURNING * INTO submitted_vote;

  RETURN submitted_vote;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION submit_vote_atomic(
  UUID, UUID, BOOLEAN, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT
) TO authenticated;
