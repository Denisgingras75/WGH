-- Migration: Add missing columns, tables, views, functions to Denis's Supabase
-- Run this in Denis's Supabase SQL Editor (project vpioftosgdkyiwvhxewy)
-- BEFORE switching Dan's app over

-- ============================================================
-- STEP 1: Missing columns
-- ============================================================

ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'mv';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_local_curator BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- STEP 2: Missing table — curator_invites
-- ============================================================

CREATE TABLE IF NOT EXISTS curator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curator_invites_token ON curator_invites(token);
CREATE INDEX IF NOT EXISTS idx_curator_invites_created_by ON curator_invites(created_by);

-- RLS already exists on Denis's DB, skipping:
-- ALTER TABLE curator_invites ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admins manage curator invites" ON curator_invites FOR ALL USING (is_admin());

-- ============================================================
-- STEP 3: Missing view — public_votes
-- ============================================================

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

-- ============================================================
-- STEP 4: Missing helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION is_local_curator()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT is_local_curator FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION get_bias_label(bias NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN bias IS NULL THEN 'New Voter'
    WHEN bias < 0.5 THEN 'Consensus Voter'
    WHEN bias < 1.0 THEN 'Has Opinions'
    WHEN bias < 2.0 THEN 'Strong Opinions'
    ELSE 'Wild Card'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- ============================================================
-- STEP 5: Missing RPCs
-- ============================================================

-- 5a. get_user_rating_identity
CREATE OR REPLACE FUNCTION get_user_rating_identity(target_user_id UUID)
RETURNS TABLE (
  rating_bias NUMERIC(3, 1),
  bias_label TEXT,
  votes_with_consensus INT,
  votes_pending INT,
  dishes_helped_establish INT,
  category_biases JSONB
) AS $$
DECLARE
  calculated_bias NUMERIC(3, 1);
  calculated_votes_with_consensus INT;
  calculated_votes_pending INT;
  calculated_dishes_helped INT;
  calculated_category_biases JSONB;
BEGIN
  SELECT ROUND(AVG(ABS(v.rating_10 - d.avg_rating)), 1), COUNT(*)::INT
  INTO calculated_bias, calculated_votes_with_consensus
  FROM votes v JOIN dishes d ON v.dish_id = d.id
  WHERE v.user_id = target_user_id AND v.rating_10 IS NOT NULL
    AND d.avg_rating IS NOT NULL AND d.total_votes >= 5;

  SELECT COUNT(*)::INT INTO calculated_votes_pending
  FROM votes v JOIN dishes d ON v.dish_id = d.id
  WHERE v.user_id = target_user_id AND v.rating_10 IS NOT NULL
    AND (d.total_votes < 5 OR d.avg_rating IS NULL);

  SELECT COUNT(*)::INT INTO calculated_dishes_helped
  FROM votes v JOIN dishes d ON v.dish_id = d.id
  WHERE v.user_id = target_user_id AND v.vote_position <= 3
    AND v.rating_10 IS NOT NULL AND d.total_votes >= 5;

  SELECT COALESCE(jsonb_object_agg(category, bias), '{}'::jsonb)
  INTO calculated_category_biases
  FROM (
    SELECT COALESCE(v.category_snapshot, d.category) AS category,
      ROUND(AVG(v.rating_10 - d.avg_rating), 1) AS bias
    FROM votes v JOIN dishes d ON v.dish_id = d.id
    WHERE v.user_id = target_user_id AND v.rating_10 IS NOT NULL
      AND d.avg_rating IS NOT NULL AND d.total_votes >= 5
      AND COALESCE(v.category_snapshot, d.category) IS NOT NULL
    GROUP BY COALESCE(v.category_snapshot, d.category)
  ) cat_biases
  WHERE category IS NOT NULL;

  RETURN QUERY SELECT
    COALESCE(calculated_bias, 0.0)::NUMERIC(3, 1),
    get_bias_label(COALESCE(calculated_bias, 0.0)),
    COALESCE(calculated_votes_with_consensus, 0),
    COALESCE(calculated_votes_pending, 0),
    COALESCE(calculated_dishes_helped, 0),
    COALESCE(calculated_category_biases, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5b. get_unseen_reveals
CREATE OR REPLACE FUNCTION get_unseen_reveals(target_user_id UUID)
RETURNS TABLE (
  id UUID, dish_id UUID, dish_name TEXT,
  user_rating NUMERIC(3, 1), consensus_rating NUMERIC(3, 1), deviation NUMERIC(3, 1),
  was_early_voter BOOLEAN, bias_before NUMERIC(3, 1), bias_after NUMERIC(3, 1),
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF (select auth.uid()) != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT be.id, be.dish_id, be.dish_name, be.user_rating, be.consensus_rating, be.deviation,
    be.was_early_voter, be.bias_before, be.bias_after, be.created_at
  FROM bias_events be
  WHERE be.user_id = target_user_id AND be.seen = FALSE
  ORDER BY be.created_at DESC LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5c. mark_reveals_seen
CREATE OR REPLACE FUNCTION mark_reveals_seen(event_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE bias_events SET seen = TRUE
  WHERE id = ANY(event_ids) AND user_id = (select auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5d. get_local_lists_for_homepage
DROP FUNCTION IF EXISTS get_local_lists_for_homepage();
DROP FUNCTION IF EXISTS get_local_lists_for_homepage(UUID);

CREATE OR REPLACE FUNCTION get_local_lists_for_homepage(p_viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
  list_id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  display_name TEXT,
  avatar_url TEXT,
  curator_tagline TEXT,
  item_count INT,
  preview_dishes TEXT[],
  compatibility_pct INT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    ll.id AS list_id,
    ll.user_id,
    ll.title,
    ll.description,
    p.display_name,
    p.avatar_url,
    ll.curator_tagline,
    (SELECT COUNT(*)::INT FROM local_list_items WHERE list_id = ll.id) AS item_count,
    (SELECT ARRAY_AGG(d.name ORDER BY li."position")
     FROM local_list_items li
     JOIN dishes d ON d.id = li.dish_id
     WHERE li.list_id = ll.id AND li."position" <= 4) AS preview_dishes,
    CASE
      WHEN p_viewer_id IS NOT NULL AND p_viewer_id != ll.user_id THEN (
        SELECT CASE
          WHEN COUNT(*) >= 3 THEN ROUND(100 - (AVG(ABS(a.rating_10 - b.rating_10)) / 9.0 * 100))::INT
          ELSE NULL
        END
        FROM votes a
        JOIN votes b ON a.dish_id = b.dish_id
        WHERE a.user_id = p_viewer_id AND b.user_id = ll.user_id
          AND a.rating_10 IS NOT NULL AND b.rating_10 IS NOT NULL
      )
      ELSE NULL
    END AS compatibility_pct
  FROM local_lists ll
  JOIN profiles p ON p.id = ll.user_id
  WHERE ll.is_active = true
  ORDER BY RANDOM()
  LIMIT 8;
$$;

-- 5e. get_local_list_by_user
CREATE OR REPLACE FUNCTION get_local_list_by_user(target_user_id UUID)
RETURNS TABLE (
  list_id UUID,
  title TEXT,
  description TEXT,
  user_id UUID,
  display_name TEXT,
  "position" INT,
  dish_id UUID,
  dish_name TEXT,
  restaurant_name TEXT,
  restaurant_id UUID,
  avg_rating NUMERIC,
  total_votes INT,
  category TEXT,
  note TEXT,
  restaurant_lat FLOAT,
  restaurant_lng FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    ll.id AS list_id,
    ll.title,
    ll.description,
    ll.user_id,
    p.display_name,
    li."position",
    d.id AS dish_id,
    d.name AS dish_name,
    r.name AS restaurant_name,
    r.id AS restaurant_id,
    d.avg_rating,
    d.total_votes,
    d.category,
    li.note,
    r.lat AS restaurant_lat,
    r.lng AS restaurant_lng
  FROM local_lists ll
  JOIN profiles p ON p.id = ll.user_id
  JOIN local_list_items li ON li.list_id = ll.id
  JOIN dishes d ON d.id = li.dish_id
  JOIN restaurants r ON r.id = d.restaurant_id
  WHERE ll.user_id = target_user_id
    AND ll.is_active = true
  ORDER BY li."position";
$$;

-- 5f. create_curator_invite
CREATE OR REPLACE FUNCTION create_curator_invite()
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Admin only');
  END IF;

  INSERT INTO curator_invites (created_by)
  VALUES (auth.uid())
  RETURNING * INTO v_invite;

  RETURN json_build_object(
    'success', true,
    'token', v_invite.token,
    'expires_at', v_invite.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5g. get_curator_invite_details
CREATE OR REPLACE FUNCTION get_curator_invite_details(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT * INTO v_invite FROM curator_invites WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invite not found');
  END IF;
  IF v_invite.used_by IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invite already used');
  END IF;
  IF v_invite.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'Invite has expired');
  END IF;

  RETURN json_build_object('valid', true, 'expires_at', v_invite.expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5h. accept_curator_invite
CREATE OR REPLACE FUNCTION accept_curator_invite(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_display_name TEXT;
  v_list_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_invite FROM curator_invites WHERE token = p_token FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invite not found');
  END IF;
  IF v_invite.used_by IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invite already used');
  END IF;
  IF v_invite.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Invite has expired');
  END IF;

  UPDATE profiles SET is_local_curator = true WHERE id = v_user_id;

  SELECT display_name INTO v_display_name FROM profiles WHERE id = v_user_id;

  INSERT INTO local_lists (user_id, title, is_active)
  VALUES (v_user_id, COALESCE(v_display_name, 'My') || '''s Top 10', false)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_list_id;

  IF v_list_id IS NULL THEN
    SELECT id INTO v_list_id FROM local_lists WHERE user_id = v_user_id;
  END IF;

  UPDATE curator_invites SET used_by = v_user_id, used_at = NOW() WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'list_id', v_list_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5i. get_my_local_list
CREATE OR REPLACE FUNCTION get_my_local_list()
RETURNS TABLE (
  list_id UUID,
  title TEXT,
  description TEXT,
  curator_tagline TEXT,
  is_active BOOLEAN,
  "position" INT,
  dish_id UUID,
  dish_name TEXT,
  restaurant_name TEXT,
  restaurant_id UUID,
  avg_rating NUMERIC,
  total_votes INT,
  category TEXT,
  note TEXT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ll.id AS list_id,
    ll.title,
    ll.description,
    ll.curator_tagline,
    ll.is_active,
    li."position",
    d.id AS dish_id,
    d.name AS dish_name,
    r.name AS restaurant_name,
    r.id AS restaurant_id,
    d.avg_rating,
    d.total_votes,
    d.category,
    li.note
  FROM local_lists ll
  LEFT JOIN local_list_items li ON li.list_id = ll.id
  LEFT JOIN dishes d ON d.id = li.dish_id
  LEFT JOIN restaurants r ON r.id = d.restaurant_id
  WHERE ll.user_id = auth.uid()
  ORDER BY li."position";
$$;

-- 5j. save_my_local_list
CREATE OR REPLACE FUNCTION save_my_local_list(
  p_tagline TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_list_id UUID;
  v_item JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT is_local_curator() THEN
    RETURN json_build_object('success', false, 'error', 'Not a local curator');
  END IF;

  IF jsonb_array_length(p_items) > 10 THEN
    RETURN json_build_object('success', false, 'error', 'Maximum 10 dishes allowed');
  END IF;

  SELECT id INTO v_list_id FROM local_lists WHERE user_id = v_user_id;

  IF v_list_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No list found — accept an invite first');
  END IF;

  UPDATE local_lists
  SET curator_tagline = p_tagline,
      is_active = jsonb_array_length(p_items) > 0
  WHERE id = v_list_id;

  DELETE FROM local_list_items WHERE list_id = v_list_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO local_list_items (list_id, dish_id, "position", note)
    VALUES (
      v_list_id,
      (v_item->>'dish_id')::UUID,
      (v_item->>'position')::INT,
      v_item->>'note'
    );
  END LOOP;

  RETURN json_build_object('success', true, 'list_id', v_list_id, 'item_count', jsonb_array_length(p_items));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5k. get_locals_aggregate
DROP FUNCTION IF EXISTS get_locals_aggregate();

CREATE OR REPLACE FUNCTION get_locals_aggregate()
RETURNS TABLE (
  top_dish_id UUID,
  top_dish_name TEXT,
  top_dish_restaurant_name TEXT,
  top_dish_restaurant_id UUID,
  top_dish_list_count INT,
  top_restaurant_id UUID,
  top_restaurant_name TEXT,
  top_restaurant_town TEXT,
  top_restaurant_list_count INT,
  total_lists INT
)
LANGUAGE SQL STABLE
AS $$
  WITH list_count AS (
    SELECT COUNT(DISTINCT ll.id)::INT AS total
    FROM local_lists ll
    JOIN local_list_items li ON li.list_id = ll.id
  ),
  dish_counts AS (
    SELECT
      li.dish_id,
      d.name AS dish_name,
      r.name AS restaurant_name,
      d.restaurant_id,
      COUNT(DISTINCT ll.id)::INT AS list_count,
      MAX(d.avg_rating) AS avg_rating
    FROM local_list_items li
    JOIN local_lists ll ON ll.id = li.list_id
    JOIN dishes d ON d.id = li.dish_id
    JOIN restaurants r ON r.id = d.restaurant_id
    GROUP BY li.dish_id, d.name, r.name, d.restaurant_id
    ORDER BY list_count DESC, avg_rating DESC NULLS LAST
    LIMIT 1
  ),
  restaurant_counts AS (
    SELECT
      d.restaurant_id,
      r.name AS restaurant_name,
      r.town,
      COUNT(DISTINCT ll.id)::INT AS list_count
    FROM local_list_items li
    JOIN local_lists ll ON ll.id = li.list_id
    JOIN dishes d ON d.id = li.dish_id
    JOIN restaurants r ON r.id = d.restaurant_id
    GROUP BY d.restaurant_id, r.name, r.town
    ORDER BY list_count DESC
    LIMIT 1
  )
  SELECT
    dc.dish_id AS top_dish_id,
    dc.dish_name AS top_dish_name,
    dc.restaurant_name AS top_dish_restaurant_name,
    dc.restaurant_id AS top_dish_restaurant_id,
    dc.list_count AS top_dish_list_count,
    rc.restaurant_id AS top_restaurant_id,
    rc.restaurant_name AS top_restaurant_name,
    rc.town AS top_restaurant_town,
    rc.list_count AS top_restaurant_list_count,
    lc.total AS total_lists
  FROM dish_counts dc, restaurant_counts rc, list_count lc;
$$;

-- ============================================================
-- STEP 6: Verify
-- ============================================================

SELECT 'Migration complete' as status;
