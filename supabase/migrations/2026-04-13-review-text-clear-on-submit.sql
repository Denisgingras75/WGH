-- Fix: clearing review text is a no-op because submit_vote_atomic's
-- ON CONFLICT DO UPDATE uses COALESCE(EXCLUDED.review_text, votes.review_text),
-- which silently preserves the old value when caller sends NULL.
--
-- New semantics:
--   review_text       = EXCLUDED.review_text (whatever caller sends wins)
--   review_created_at = NOW() when the text changed to something new,
--                       NULL when cleared,
--                       preserved when text is unchanged (rating-only edits)
--
-- Also fixes: delete-remove-photo support in ReviewFlow (see src/pages/Dish.jsx
-- + src/components/ReviewFlow.jsx for the client side).

DROP FUNCTION IF EXISTS submit_vote_atomic(
  UUID, UUID, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT
);

CREATE OR REPLACE FUNCTION submit_vote_atomic(
  p_dish_id UUID,
  p_user_id UUID,
  p_rating_10 DECIMAL DEFAULT NULL,
  p_review_text TEXT DEFAULT NULL,
  p_purity_score DECIMAL DEFAULT NULL,
  p_war_score DECIMAL DEFAULT NULL,
  p_badge_hash TEXT DEFAULT NULL
)
RETURNS votes AS $$
DECLARE
  submitted_vote votes;
BEGIN
  IF auth.role() <> 'service_role' AND (select auth.uid()) IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_rating_10 IS NULL THEN
    RAISE EXCEPTION 'rating_10 is required';
  END IF;

  INSERT INTO votes (
    dish_id,
    user_id,
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
    rating_10 = EXCLUDED.rating_10,
    review_text = EXCLUDED.review_text,
    review_created_at = CASE
      WHEN EXCLUDED.review_text IS DISTINCT FROM votes.review_text
        THEN (CASE WHEN EXCLUDED.review_text IS NOT NULL THEN NOW() ELSE NULL END)
      ELSE votes.review_created_at
    END,
    purity_score = COALESCE(EXCLUDED.purity_score, votes.purity_score),
    war_score = COALESCE(EXCLUDED.war_score, votes.war_score),
    badge_hash = COALESCE(EXCLUDED.badge_hash, votes.badge_hash)
  RETURNING * INTO submitted_vote;

  RETURN submitted_vote;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION submit_vote_atomic(
  UUID, UUID, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT
) TO authenticated;
