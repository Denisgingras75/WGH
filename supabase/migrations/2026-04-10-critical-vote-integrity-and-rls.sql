-- Critical vote integrity and RLS fixes
-- Safe to re-run in Supabase SQL Editor.

BEGIN;

ALTER TABLE dishes ADD COLUMN IF NOT EXISTS weighted_vote_count NUMERIC DEFAULT 0;

CREATE OR REPLACE VIEW public_votes AS
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

ALTER VIEW public_votes SET (security_invoker = false);
GRANT SELECT ON public_votes TO anon, authenticated;

DROP POLICY IF EXISTS "Public read access" ON votes;
DROP POLICY IF EXISTS "Own users, admins, and service role can read votes" ON votes;
CREATE POLICY "Own users, admins, and service role can read votes" ON votes FOR SELECT USING (
  auth.role() = 'service_role'
  OR (select auth.uid()) = user_id
  OR is_admin()
);

DROP FUNCTION IF EXISTS dish_search_score(DECIMAL, BIGINT, DECIMAL, INT, DECIMAL);
-- Bayesian confidence-adjusted ranking score
-- Used by get_ranked_dishes and search results. One brain everywhere.
-- Prior strength (m): start at 3 for early data. See NOTES.md for schedule.
CREATE OR REPLACE FUNCTION dish_search_score(
  p_avg_rating DECIMAL,
  p_total_votes NUMERIC,
  p_distance_miles DECIMAL DEFAULT NULL,
  p_recent_votes_14d INT DEFAULT 0,
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

-- Get ranked dishes with bounding box optimization, town filter, variant aggregation.
-- SECURITY DEFINER is required because votes RLS restricts direct table reads;
-- this function returns only public aggregate fields.
CREATE OR REPLACE FUNCTION get_ranked_dishes(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_miles INT DEFAULT 50,
  filter_category TEXT DEFAULT NULL,
  filter_town TEXT DEFAULT NULL
)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  restaurant_id UUID,
  restaurant_name TEXT,
  restaurant_town TEXT,
  category TEXT,
  tags TEXT[],
  cuisine TEXT,
  price DECIMAL,
  photo_url TEXT,
  total_votes BIGINT,
  yes_votes BIGINT,
  percent_worth_it INT,
  avg_rating DECIMAL,
  distance_miles DECIMAL,
  has_variants BOOLEAN,
  variant_count INT,
  best_variant_name TEXT,
  best_variant_rating DECIMAL,
  value_score DECIMAL,
  value_percentile DECIMAL,
  search_score DECIMAL,
  featured_photo_url TEXT,
  restaurant_lat DECIMAL,
  restaurant_lng DECIMAL,
  restaurant_address TEXT,
  restaurant_phone TEXT,
  restaurant_website_url TEXT,
  toast_slug TEXT,
  order_url TEXT
) AS $$
DECLARE
  lat_delta DECIMAL := radius_miles / 69.0;
  lng_delta DECIMAL := radius_miles / (69.0 * COS(RADIANS(user_lat)));
BEGIN
  RETURN QUERY
  WITH global_stats AS (
    SELECT COALESCE(AVG(dishes.avg_rating), 7.0) AS global_mean
    FROM dishes
    WHERE dishes.total_votes > 0 AND dishes.avg_rating IS NOT NULL
  ),
  nearby_restaurants AS (
    SELECT r.id, r.name, r.town, r.lat, r.lng, r.cuisine,
           r.address, r.phone, r.website_url, r.toast_slug, r.order_url
    FROM restaurants r
    WHERE r.is_open = true
      AND r.lat BETWEEN (user_lat - lat_delta) AND (user_lat + lat_delta)
      AND r.lng BETWEEN (user_lng - lng_delta) AND (user_lng + lng_delta)
      AND (filter_town IS NULL OR r.town = filter_town)
  ),
  restaurants_with_distance AS (
    SELECT
      nr.id, nr.name, nr.town, nr.lat, nr.lng, nr.cuisine,
      nr.address, nr.phone, nr.website_url, nr.toast_slug, nr.order_url,
      ROUND((
        3959 * ACOS(
          LEAST(1.0, GREATEST(-1.0,
            COS(RADIANS(user_lat)) * COS(RADIANS(nr.lat)) *
            COS(RADIANS(nr.lng) - RADIANS(user_lng)) +
            SIN(RADIANS(user_lat)) * SIN(RADIANS(nr.lat))
          ))
        )
      )::NUMERIC, 2) AS distance
    FROM nearby_restaurants nr
  ),
  filtered_restaurants AS (
    SELECT * FROM restaurants_with_distance WHERE distance <= radius_miles
  ),
  variant_stats AS (
    SELECT
      d.parent_dish_id,
      COUNT(DISTINCT d.id)::INT AS child_count,
      SUM(COALESCE(ds.vote_count, 0))::NUMERIC AS total_child_votes,
      SUM(COALESCE(ds.yes_count, 0))::NUMERIC AS total_child_yes
    FROM dishes d
    LEFT JOIN (
      SELECT v.dish_id,
        SUM(CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END)::NUMERIC AS vote_count,
        SUM(CASE WHEN v.would_order_again THEN (CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END) ELSE 0 END)::NUMERIC AS yes_count
      FROM votes v GROUP BY v.dish_id
    ) ds ON ds.dish_id = d.id
    WHERE d.parent_dish_id IS NOT NULL
    GROUP BY d.parent_dish_id
  ),
  best_variants AS (
    SELECT DISTINCT ON (d.parent_dish_id)
      d.parent_dish_id,
      d.name AS best_name,
      ROUND(AVG(v.rating_10)::NUMERIC, 1) AS best_rating
    FROM dishes d
    LEFT JOIN votes v ON v.dish_id = d.id
    WHERE d.parent_dish_id IS NOT NULL
    GROUP BY d.parent_dish_id, d.id, d.name
    HAVING COUNT(v.id) >= 1
    ORDER BY d.parent_dish_id, AVG(v.rating_10) DESC NULLS LAST, COUNT(v.id) DESC
  ),
  recent_vote_counts AS (
    SELECT votes.dish_id, COUNT(*)::INT AS recent_votes
    FROM votes
    WHERE votes.created_at > NOW() - INTERVAL '14 days'
    GROUP BY votes.dish_id
  ),
  best_photos AS (
    SELECT DISTINCT ON (dp.dish_id)
      dp.dish_id,
      dp.photo_url
    FROM dish_photos dp
    INNER JOIN dishes d2 ON dp.dish_id = d2.id
    INNER JOIN filtered_restaurants fr2 ON d2.restaurant_id = fr2.id
    WHERE dp.status IN ('featured', 'community')
      AND d2.parent_dish_id IS NULL
    ORDER BY dp.dish_id,
      CASE dp.source_type WHEN 'restaurant' THEN 0 ELSE 1 END,
      CASE dp.status WHEN 'featured' THEN 0 ELSE 1 END,
      dp.quality_score DESC NULLS LAST,
      dp.created_at DESC
  )
  SELECT
    d.id AS dish_id,
    d.name AS dish_name,
    fr.id AS restaurant_id,
    fr.name AS restaurant_name,
    fr.town AS restaurant_town,
    d.category,
    d.tags,
    fr.cuisine,
    d.price,
    d.photo_url,
    COALESCE(vs.total_child_votes,
      SUM(CASE WHEN v.source = 'user' THEN 1.0 WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END)
    )::BIGINT AS total_votes,
    COALESCE(vs.total_child_yes,
      SUM(CASE WHEN v.would_order_again AND v.source = 'user' THEN 1.0
               WHEN v.would_order_again AND v.source = 'ai_estimated' THEN 0.5
               ELSE 0 END)
    )::BIGINT AS yes_votes,
    CASE
      WHEN COALESCE(vs.total_child_votes,
        SUM(CASE WHEN v.source = 'user' THEN 1.0 WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END)) > 0
      THEN ROUND(100.0 *
        COALESCE(vs.total_child_yes,
          SUM(CASE WHEN v.would_order_again AND v.source = 'user' THEN 1.0
                   WHEN v.would_order_again AND v.source = 'ai_estimated' THEN 0.5
                   ELSE 0 END)) /
        COALESCE(vs.total_child_votes,
          SUM(CASE WHEN v.source = 'user' THEN 1.0 WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END))
      )::INT
      ELSE 0
    END AS percent_worth_it,
    COALESCE(ROUND(
      (SUM(CASE WHEN v.source = 'user' THEN v.rating_10
                WHEN v.source = 'ai_estimated' THEN v.rating_10 * 0.5
                ELSE 0 END) /
       NULLIF(SUM(CASE WHEN v.source = 'user' THEN 1.0
                       WHEN v.source = 'ai_estimated' THEN 0.5
                       ELSE 0 END), 0)
      )::NUMERIC, 1), 0) AS avg_rating,
    fr.distance AS distance_miles,
    (vs.child_count IS NOT NULL AND vs.child_count > 0) AS has_variants,
    COALESCE(vs.child_count, 0)::INT AS variant_count,
    bv.best_name AS best_variant_name,
    bv.best_rating AS best_variant_rating,
    d.value_score,
    d.value_percentile,
    dish_search_score(
      COALESCE(ROUND(
        (SUM(CASE WHEN v.source = 'user' THEN v.rating_10
                  WHEN v.source = 'ai_estimated' THEN v.rating_10 * 0.5
                  ELSE 0 END) /
         NULLIF(SUM(CASE WHEN v.source = 'user' THEN 1.0
                         WHEN v.source = 'ai_estimated' THEN 0.5
                         ELSE 0 END), 0)
        )::NUMERIC, 1), 0),
      COALESCE(vs.total_child_votes,
        SUM(CASE WHEN v.source = 'user' THEN 1.0 WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END))::NUMERIC,
      fr.distance,
      COALESCE(rvc.recent_votes, 0),
      (SELECT global_mean FROM global_stats)
    ) AS search_score,
    bp.photo_url AS featured_photo_url,
    fr.lat AS restaurant_lat,
    fr.lng AS restaurant_lng,
    fr.address AS restaurant_address,
    fr.phone AS restaurant_phone,
    fr.website_url AS restaurant_website_url,
    fr.toast_slug,
    fr.order_url
  FROM dishes d
  INNER JOIN filtered_restaurants fr ON d.restaurant_id = fr.id
  LEFT JOIN votes v ON d.id = v.dish_id
  LEFT JOIN variant_stats vs ON vs.parent_dish_id = d.id
  LEFT JOIN best_variants bv ON bv.parent_dish_id = d.id
  LEFT JOIN recent_vote_counts rvc ON rvc.dish_id = d.id
  LEFT JOIN best_photos bp ON bp.dish_id = d.id
  WHERE (filter_category IS NULL OR d.category = filter_category)
    AND d.parent_dish_id IS NULL
  GROUP BY d.id, d.name, fr.id, fr.name, fr.town, d.category, d.tags, fr.cuisine,
           d.price, d.photo_url, fr.distance, fr.lat, fr.lng,
           fr.address, fr.phone, fr.website_url, fr.toast_slug, fr.order_url,
           vs.total_child_votes, vs.total_child_yes, vs.child_count,
           bv.best_name, bv.best_rating,
           d.value_score, d.value_percentile,
           rvc.recent_votes,
           bp.photo_url
  ORDER BY search_score DESC NULLS LAST, total_votes DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Get dishes for a specific restaurant with variant aggregation
CREATE OR REPLACE FUNCTION get_restaurant_dishes(
  p_restaurant_id UUID
)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  restaurant_id UUID,
  restaurant_name TEXT,
  category TEXT,
  menu_section TEXT,
  price DECIMAL,
  photo_url TEXT,
  total_votes BIGINT,
  yes_votes BIGINT,
  percent_worth_it INT,
  avg_rating DECIMAL,
  has_variants BOOLEAN,
  variant_count INT,
  best_variant_id UUID,
  best_variant_name TEXT,
  best_variant_rating DECIMAL,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH variant_stats AS (
    SELECT
      d.parent_dish_id,
      COUNT(DISTINCT d.id)::INT AS child_count,
      SUM(COALESCE(ds.vote_count, 0))::NUMERIC AS total_child_votes,
      SUM(COALESCE(ds.yes_count, 0))::NUMERIC AS total_child_yes,
      CASE
        WHEN SUM(COALESCE(ds.vote_count, 0)) > 0
        THEN ROUND((SUM(COALESCE(ds.rating_sum, 0)) / NULLIF(SUM(COALESCE(ds.vote_count, 0)), 0))::NUMERIC, 1)
        ELSE NULL
      END AS combined_avg_rating
    FROM dishes d
    LEFT JOIN (
      SELECT v.dish_id,
        SUM(CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END)::NUMERIC AS vote_count,
        SUM(CASE WHEN v.would_order_again THEN (CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END) ELSE 0 END)::NUMERIC AS yes_count,
        SUM(COALESCE(v.rating_10, 0) * (CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END))::DECIMAL AS rating_sum
      FROM votes v GROUP BY v.dish_id
    ) ds ON ds.dish_id = d.id
    WHERE d.parent_dish_id IS NOT NULL
    GROUP BY d.parent_dish_id
  ),
  best_variants AS (
    SELECT DISTINCT ON (d.parent_dish_id)
      d.parent_dish_id, d.id AS best_id, d.name AS best_name,
      ROUND(AVG(v.rating_10)::NUMERIC, 1) AS best_rating
    FROM dishes d
    LEFT JOIN votes v ON v.dish_id = d.id
    WHERE d.parent_dish_id IS NOT NULL
    GROUP BY d.parent_dish_id, d.id, d.name
    HAVING COUNT(v.id) >= 1
    ORDER BY d.parent_dish_id, AVG(v.rating_10) DESC NULLS LAST, COUNT(v.id) DESC
  ),
  dish_vote_stats AS (
    SELECT d.id AS dish_id, COUNT(v.id)::BIGINT AS direct_votes,
      SUM(CASE WHEN v.would_order_again THEN 1 ELSE 0 END)::BIGINT AS direct_yes,
      ROUND(AVG(v.rating_10)::NUMERIC, 1) AS direct_avg
    FROM dishes d LEFT JOIN votes v ON v.dish_id = d.id
    WHERE d.parent_dish_id IS NULL
    GROUP BY d.id
  )
  SELECT
    d.id AS dish_id, d.name AS dish_name, r.id AS restaurant_id, r.name AS restaurant_name,
    d.category, d.menu_section, d.price, d.photo_url,
    COALESCE(vs.total_child_votes, dvs.direct_votes, 0)::BIGINT AS total_votes,
    COALESCE(vs.total_child_yes, dvs.direct_yes, 0)::BIGINT AS yes_votes,
    CASE
      WHEN COALESCE(vs.total_child_votes, dvs.direct_votes, 0) > 0
      THEN ROUND(100.0 * COALESCE(vs.total_child_yes, dvs.direct_yes, 0) / COALESCE(vs.total_child_votes, dvs.direct_votes, 1))::INT
      ELSE 0
    END AS percent_worth_it,
    COALESCE(vs.combined_avg_rating, dvs.direct_avg) AS avg_rating,
    (vs.child_count IS NOT NULL AND vs.child_count > 0) AS has_variants,
    COALESCE(vs.child_count, 0)::INT AS variant_count,
    bv.best_id AS best_variant_id, bv.best_name AS best_variant_name, bv.best_rating AS best_variant_rating,
    d.tags
  FROM dishes d
  INNER JOIN restaurants r ON d.restaurant_id = r.id
  LEFT JOIN variant_stats vs ON vs.parent_dish_id = d.id
  LEFT JOIN best_variants bv ON bv.parent_dish_id = d.id
  LEFT JOIN dish_vote_stats dvs ON dvs.dish_id = d.id
  WHERE d.restaurant_id = p_restaurant_id
    AND r.is_open = true
    AND d.parent_dish_id IS NULL
  GROUP BY d.id, d.name, r.id, r.name, d.category, d.menu_section, d.price, d.photo_url, d.tags,
           vs.total_child_votes, vs.total_child_yes, vs.combined_avg_rating, vs.child_count,
           dvs.direct_votes, dvs.direct_yes, dvs.direct_avg,
           bv.best_id, bv.best_name, bv.best_rating
  ORDER BY
    CASE WHEN COALESCE(vs.total_child_votes, dvs.direct_votes, 0) >= 5 THEN 0 ELSE 1 END,
    CASE
      WHEN COALESCE(vs.total_child_votes, dvs.direct_votes, 0) > 0
      THEN ROUND(100.0 * COALESCE(vs.total_child_yes, dvs.direct_yes, 0) / COALESCE(vs.total_child_votes, dvs.direct_votes, 1))
      ELSE 0
    END DESC,
    COALESCE(vs.total_child_votes, dvs.direct_votes, 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_dish_variants') THEN
    EXECUTE 'ALTER FUNCTION get_dish_variants(UUID) SECURITY DEFINER';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_smart_snippet') THEN
    EXECUTE 'ALTER FUNCTION get_smart_snippet(UUID) SECURITY DEFINER';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION submit_vote_atomic(
  p_dish_id UUID,
  p_user_id UUID,
  p_would_order_again BOOLEAN,
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
    p_would_order_again,
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

GRANT EXECUTE ON FUNCTION submit_vote_atomic(UUID, UUID, BOOLEAN, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT) TO authenticated;
-- 13e. Update dish avg_rating on vote changes
-- Source weighting: ai_estimated votes count 0.5x (matches get_ranked_dishes RPC)
CREATE OR REPLACE FUNCTION update_dish_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dishes
  SET avg_rating = sub.avg_r,
      total_votes = sub.raw_count,
      weighted_vote_count = sub.weighted_count
  FROM (
    SELECT
      ROUND(
        (SUM(rating_10 * CASE WHEN source = 'ai_estimated' THEN 0.5 ELSE 1.0 END) /
         NULLIF(SUM(CASE WHEN source = 'ai_estimated' THEN 0.5 ELSE 1.0 END), 0)
        )::NUMERIC, 1
      ) AS avg_r,
      COUNT(*)::INT AS raw_count,
      COALESCE(SUM(CASE WHEN source = 'ai_estimated' THEN 0.5 ELSE 1.0 END), 0)::NUMERIC AS weighted_count
    FROM votes WHERE dish_id = COALESCE(NEW.dish_id, OLD.dish_id) AND rating_10 IS NOT NULL
  ) sub
  WHERE dishes.id = COALESCE(NEW.dish_id, OLD.dish_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

WITH vote_stats AS (
  SELECT
    votes.dish_id,
    ROUND(
      (SUM(votes.rating_10 * CASE WHEN votes.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END) /
       NULLIF(SUM(CASE WHEN votes.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END), 0)
      )::NUMERIC, 1
    ) AS avg_r,
    COUNT(*)::INT AS raw_count,
    COALESCE(SUM(CASE WHEN votes.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END), 0)::NUMERIC AS weighted_count
  FROM votes
  WHERE votes.rating_10 IS NOT NULL
  GROUP BY votes.dish_id
)
UPDATE dishes d
SET avg_rating = vote_stats.avg_r,
    total_votes = vote_stats.raw_count,
    weighted_vote_count = vote_stats.weighted_count
FROM vote_stats
WHERE d.id = vote_stats.dish_id;

UPDATE dishes d
SET avg_rating = NULL,
    total_votes = 0,
    weighted_vote_count = 0
WHERE NOT EXISTS (
  SELECT 1 FROM votes v WHERE v.dish_id = d.id AND v.rating_10 IS NOT NULL
);

COMMIT;
