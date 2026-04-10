-- Explicit NUMERIC casts in ROUND() expressions
-- Idempotent — safe to re-run.
-- Fixes: implicit type conversion in taste compatibility / similarity math
-- could break silently if any source column type ever changes to float.

CREATE OR REPLACE FUNCTION get_taste_compatibility(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS TABLE (
  shared_dishes INT,
  avg_difference DECIMAL(3, 1),
  compatibility_pct INT
)
LANGUAGE SQL STABLE SET search_path = public AS $$
  WITH shared AS (
    SELECT a.rating_10 AS rating_a, b.rating_10 AS rating_b
    FROM votes a
    JOIN votes b ON a.dish_id = b.dish_id
    WHERE a.user_id = p_user_id AND b.user_id = p_other_user_id
      AND a.rating_10 IS NOT NULL AND b.rating_10 IS NOT NULL
  )
  SELECT
    COUNT(*)::INT AS shared_dishes,
    ROUND(AVG(ABS(rating_a - rating_b))::NUMERIC, 1) AS avg_difference,
    CASE
      WHEN COUNT(*) >= 3 THEN ROUND((100 - (AVG(ABS(rating_a - rating_b))::NUMERIC / 9.0 * 100)))::INT
      ELSE NULL
    END AS compatibility_pct
  FROM shared;
$$;


CREATE OR REPLACE FUNCTION get_similar_taste_users(
  p_user_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  shared_dishes INT,
  compatibility_pct INT
)
LANGUAGE SQL STABLE SET search_path = public AS $$
  WITH candidates AS (
    SELECT b.user_id AS other_id, COUNT(*)::INT AS shared,
      ROUND((100 - (AVG(ABS(a.rating_10 - b.rating_10))::NUMERIC / 9.0 * 100)))::INT AS compat
    FROM votes a
    JOIN votes b ON a.dish_id = b.dish_id AND b.user_id != p_user_id AND b.rating_10 IS NOT NULL
    WHERE a.user_id = p_user_id AND a.rating_10 IS NOT NULL
    GROUP BY b.user_id HAVING COUNT(*) >= 3
  )
  SELECT c.other_id AS user_id, p.display_name, c.shared AS shared_dishes, c.compat AS compatibility_pct
  FROM candidates c
  JOIN profiles p ON p.id = c.other_id
  WHERE NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = p_user_id AND f.followed_id = c.other_id)
  ORDER BY c.compat DESC, c.shared DESC
  LIMIT p_limit;
$$;


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
          WHEN COUNT(*) >= 3 THEN ROUND((100 - (AVG(ABS(a.rating_10 - b.rating_10))::NUMERIC / 9.0 * 100)))::INT
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
