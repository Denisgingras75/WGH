-- =============================================
-- 9. CORE RPC FUNCTIONS (CREATE OR REPLACE)
-- =============================================

-- ---- dish_search_score (Bayesian ranking) ----
CREATE OR REPLACE FUNCTION dish_search_score(
  p_avg_rating DECIMAL,
  p_total_votes BIGINT,
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


-- ---- get_ranked_dishes ----
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
      SUM(COALESCE(ds.vote_count, 0))::BIGINT AS total_child_votes,
      SUM(COALESCE(ds.yes_count, 0))::BIGINT AS total_child_yes
    FROM dishes d
    LEFT JOIN (
      SELECT v.dish_id,
        SUM(CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END)::BIGINT AS vote_count,
        SUM(CASE WHEN v.would_order_again THEN (CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END) ELSE 0 END)::BIGINT AS yes_count
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
        SUM(CASE WHEN v.source = 'user' THEN 1.0 WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END))::BIGINT,
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
$$ LANGUAGE plpgsql STABLE SET search_path = public;


-- ---- get_restaurant_dishes ----
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
      SUM(COALESCE(ds.vote_count, 0))::BIGINT AS total_child_votes,
      SUM(COALESCE(ds.yes_count, 0))::BIGINT AS total_child_yes,
      CASE
        WHEN SUM(COALESCE(ds.vote_count, 0)) > 0
        THEN ROUND((SUM(COALESCE(ds.rating_sum, 0)) / NULLIF(SUM(COALESCE(ds.vote_count, 0)), 0))::NUMERIC, 1)
        ELSE NULL
      END AS combined_avg_rating
    FROM dishes d
    LEFT JOIN (
      SELECT v.dish_id,
        SUM(CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END)::BIGINT AS vote_count,
        SUM(CASE WHEN v.would_order_again THEN (CASE WHEN v.source = 'ai_estimated' THEN 0.5 ELSE 1.0 END) ELSE 0 END)::BIGINT AS yes_count,
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
$$ LANGUAGE plpgsql SET search_path = public;


-- ---- get_dish_variants ----
CREATE OR REPLACE FUNCTION get_dish_variants(
  p_parent_dish_id UUID
)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  price DECIMAL,
  photo_url TEXT,
  display_order INT,
  total_votes BIGINT,
  yes_votes BIGINT,
  percent_worth_it INT,
  avg_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS dish_id, d.name AS dish_name, d.price, d.photo_url, d.display_order,
    COUNT(v.id)::BIGINT AS total_votes,
    SUM(CASE WHEN v.would_order_again THEN 1 ELSE 0 END)::BIGINT AS yes_votes,
    CASE
      WHEN COUNT(v.id) > 0
      THEN ROUND(100.0 * SUM(CASE WHEN v.would_order_again THEN 1 ELSE 0 END) / COUNT(v.id))::INT
      ELSE 0
    END AS percent_worth_it,
    ROUND(AVG(v.rating_10)::NUMERIC, 1) AS avg_rating
  FROM dishes d
  LEFT JOIN votes v ON d.id = v.dish_id
  WHERE d.parent_dish_id = p_parent_dish_id
  GROUP BY d.id, d.name, d.price, d.photo_url, d.display_order
  ORDER BY d.display_order, d.name;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- ---- get_smart_snippet ----
CREATE OR REPLACE FUNCTION get_smart_snippet(p_dish_id UUID)
RETURNS TABLE (
  review_text TEXT,
  rating_10 DECIMAL,
  display_name TEXT,
  user_id UUID,
  review_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT v.review_text, v.rating_10, p.display_name, v.user_id, v.review_created_at
  FROM votes v
  INNER JOIN profiles p ON v.user_id = p.id
  WHERE v.dish_id = p_dish_id
    AND v.review_text IS NOT NULL AND v.review_text != ''
  ORDER BY
    CASE WHEN v.rating_10 >= 9 THEN 0 ELSE 1 END,
    v.rating_10 DESC NULLS LAST,
    v.review_created_at DESC NULLS LAST
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- ---- Social functions ----

CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE followed_id = user_id;
$$;

CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = user_id;
$$;

CREATE OR REPLACE FUNCTION is_following(follower UUID, followed UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = follower AND followed_id = followed);
$$;

CREATE OR REPLACE FUNCTION get_friends_votes_for_dish(
  p_user_id UUID,
  p_dish_id UUID
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  rating_10 DECIMAL(3, 1),
  would_order_again BOOLEAN,
  voted_at TIMESTAMPTZ,
  category_expertise TEXT
)
LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT
    p.id AS user_id, p.display_name, v.rating_10, v.would_order_again,
    v.created_at AS voted_at,
    CASE
      WHEN EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = p.id AND ub.badge_key = 'authority_' || REPLACE(d.category, ' ', '_')) THEN 'authority'
      WHEN EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = p.id AND ub.badge_key = 'specialist_' || REPLACE(d.category, ' ', '_')) THEN 'specialist'
      ELSE NULL
    END AS category_expertise
  FROM follows f
  JOIN profiles p ON p.id = f.followed_id
  JOIN votes v ON v.user_id = f.followed_id AND v.dish_id = p_dish_id
  JOIN dishes d ON d.id = p_dish_id
  WHERE f.follower_id = p_user_id
  ORDER BY v.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_friends_votes_for_restaurant(
  p_user_id UUID,
  p_restaurant_id UUID
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  dish_id UUID,
  dish_name TEXT,
  rating_10 DECIMAL(3, 1),
  would_order_again BOOLEAN,
  voted_at TIMESTAMPTZ,
  category_expertise TEXT
)
LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT
    p.id AS user_id, p.display_name, d.id AS dish_id, d.name AS dish_name,
    v.rating_10, v.would_order_again, v.created_at AS voted_at,
    CASE
      WHEN EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = p.id AND ub.badge_key = 'authority_' || REPLACE(d.category, ' ', '_')) THEN 'authority'
      WHEN EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = p.id AND ub.badge_key = 'specialist_' || REPLACE(d.category, ' ', '_')) THEN 'specialist'
      ELSE NULL
    END AS category_expertise
  FROM follows f
  JOIN profiles p ON p.id = f.followed_id
  JOIN votes v ON v.user_id = f.followed_id
  JOIN dishes d ON d.id = v.dish_id AND d.restaurant_id = p_restaurant_id
  WHERE f.follower_id = p_user_id
  ORDER BY d.name, v.created_at DESC;
$$;

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
    ROUND(AVG(ABS(rating_a - rating_b)), 1) AS avg_difference,
    CASE
      WHEN COUNT(*) >= 3 THEN ROUND(100 - (AVG(ABS(rating_a - rating_b)) / 9.0 * 100))::INT
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
      ROUND(100 - (AVG(ABS(a.rating_10 - b.rating_10)) / 9.0 * 100))::INT AS compat
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


-- ---- Rating identity functions ----

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

CREATE OR REPLACE FUNCTION mark_reveals_seen(event_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE bias_events SET seen = TRUE
  WHERE id = ANY(event_ids) AND user_id = (select auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ---- Badge functions ----

CREATE OR REPLACE FUNCTION get_badge_evaluation_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_dishes BIGINT;
  v_total_restaurants BIGINT;
  v_global_bias NUMERIC(3, 1);
  v_votes_with_consensus INT;
  v_follower_count BIGINT;
  v_dishes_helped_establish INT;
  v_category_stats JSON;
  v_hidden_gems INT;
  v_called_it INT;
  v_top_dish_votes INT;
  v_first_voter_count INT;
BEGIN
  SELECT COUNT(DISTINCT v.dish_id), COUNT(DISTINCT d.restaurant_id)
  INTO v_total_dishes, v_total_restaurants
  FROM votes v JOIN dishes d ON v.dish_id = d.id WHERE v.user_id = p_user_id;

  SELECT COALESCE(urs.rating_bias, 0.0), COALESCE(urs.votes_with_consensus, 0), COALESCE(urs.dishes_helped_establish, 0)
  INTO v_global_bias, v_votes_with_consensus, v_dishes_helped_establish
  FROM user_rating_stats urs WHERE urs.user_id = p_user_id;

  IF v_global_bias IS NULL THEN v_global_bias := 0.0; END IF;
  IF v_votes_with_consensus IS NULL THEN v_votes_with_consensus := 0; END IF;
  IF v_dishes_helped_establish IS NULL THEN v_dishes_helped_establish := 0; END IF;

  SELECT COUNT(*) INTO v_follower_count FROM follows WHERE followed_id = p_user_id;

  SELECT COALESCE(json_agg(cat_row), '[]'::json) INTO v_category_stats
  FROM (
    SELECT v.category_snapshot AS category, COUNT(*) AS total_ratings,
      COUNT(*) FILTER (WHERE d.consensus_ready = TRUE) AS consensus_ratings,
      ROUND(AVG(v.rating_10 - d.avg_rating) FILTER (WHERE d.consensus_ready = TRUE AND v.rating_10 IS NOT NULL), 1) AS bias
    FROM votes v JOIN dishes d ON v.dish_id = d.id
    WHERE v.user_id = p_user_id AND v.category_snapshot IS NOT NULL
    GROUP BY v.category_snapshot
  ) cat_row;

  SELECT COUNT(DISTINCT v.dish_id) INTO v_hidden_gems
  FROM votes v JOIN dishes d ON v.dish_id = d.id
  WHERE v.user_id = p_user_id AND v.vote_position <= 3 AND d.avg_rating >= 8.0 AND d.total_votes >= 10;
  IF v_hidden_gems IS NULL THEN v_hidden_gems := 0; END IF;

  SELECT COUNT(DISTINCT v.dish_id) INTO v_called_it
  FROM votes v JOIN dishes d ON v.dish_id = d.id
  WHERE v.user_id = p_user_id AND v.vote_position <= 5 AND v.rating_10 >= 8
    AND d.consensus_ready = TRUE AND d.avg_rating >= 8.0;
  IF v_called_it IS NULL THEN v_called_it := 0; END IF;

  SELECT COUNT(DISTINCT v.dish_id) INTO v_top_dish_votes
  FROM votes v JOIN dishes d ON v.dish_id = d.id
  WHERE v.user_id = p_user_id AND d.total_votes >= 5
    AND d.avg_rating = (SELECT MAX(d2.avg_rating) FROM dishes d2 WHERE d2.restaurant_id = d.restaurant_id AND d2.total_votes >= 5);
  IF v_top_dish_votes IS NULL THEN v_top_dish_votes := 0; END IF;

  SELECT COUNT(*) INTO v_first_voter_count
  FROM votes v WHERE v.user_id = p_user_id AND v.vote_position = 1;
  IF v_first_voter_count IS NULL THEN v_first_voter_count := 0; END IF;

  RETURN json_build_object(
    'totalDishes', v_total_dishes, 'totalRestaurants', v_total_restaurants,
    'globalBias', v_global_bias, 'votesWithConsensus', v_votes_with_consensus,
    'followerCount', v_follower_count, 'dishesHelpedEstablish', v_dishes_helped_establish,
    'categoryStats', v_category_stats,
    'hiddenGemsFound', v_hidden_gems, 'calledItCount', v_called_it,
    'topDishVotes', v_top_dish_votes, 'firstVoterCount', v_first_voter_count
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION evaluate_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_key TEXT,
  newly_unlocked BOOLEAN
) AS $$
DECLARE
  v_stats JSON;
  v_global_bias NUMERIC;
  v_votes_with_consensus INT;
  v_follower_count BIGINT;
  v_hidden_gems INT;
  v_called_it INT;
  v_badge RECORD;
  v_already_has BOOLEAN;
  v_threshold INT;
  v_cat_stat RECORD;
  v_cat_consensus INT;
  v_cat_bias NUMERIC;
  v_parsed_tier TEXT;
BEGIN
  v_stats := get_badge_evaluation_stats(p_user_id);

  v_global_bias := (v_stats->>'globalBias')::NUMERIC;
  v_votes_with_consensus := (v_stats->>'votesWithConsensus')::INT;
  v_follower_count := (v_stats->>'followerCount')::BIGINT;
  v_hidden_gems := (v_stats->>'hiddenGemsFound')::INT;
  v_called_it := (v_stats->>'calledItCount')::INT;

  FOR v_badge IN SELECT b.key, b.family, b.category FROM badges b ORDER BY b.sort_order DESC
  LOOP
    SELECT EXISTS(SELECT 1 FROM user_badges ub WHERE ub.user_id = p_user_id AND ub.badge_key = v_badge.key)
    INTO v_already_has;
    IF v_already_has THEN CONTINUE; END IF;

    CASE v_badge.family
      WHEN 'category' THEN
        IF v_badge.category IS NULL THEN CONTINUE; END IF;
        IF v_badge.key LIKE 'specialist_%' THEN v_parsed_tier := 'specialist';
        ELSIF v_badge.key LIKE 'authority_%' THEN v_parsed_tier := 'authority';
        ELSE CONTINUE; END IF;

        v_cat_consensus := 0; v_cat_bias := NULL;
        FOR v_cat_stat IN SELECT * FROM json_to_recordset(v_stats->'categoryStats') AS x(category TEXT, total_ratings INT, consensus_ratings INT, bias NUMERIC)
        LOOP
          IF v_cat_stat.category = v_badge.category THEN
            v_cat_consensus := COALESCE(v_cat_stat.consensus_ratings, 0);
            v_cat_bias := v_cat_stat.bias; EXIT;
          END IF;
        END LOOP;

        IF v_parsed_tier = 'specialist' THEN
          IF v_cat_consensus >= 10 AND v_cat_bias IS NOT NULL AND ABS(v_cat_bias) <= 1.5 THEN
            INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
            badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
          END IF;
        ELSIF v_parsed_tier = 'authority' THEN
          IF v_cat_consensus >= 20 AND v_cat_bias IS NOT NULL AND ABS(v_cat_bias) <= 1.0 THEN
            INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
            badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
          END IF;
        END IF;

      WHEN 'discovery' THEN
        IF v_badge.key IN ('hidden_gem_finder', 'gem_hunter', 'gem_collector') THEN
          CASE v_badge.key
            WHEN 'hidden_gem_finder' THEN v_threshold := 1;
            WHEN 'gem_hunter' THEN v_threshold := 5;
            WHEN 'gem_collector' THEN v_threshold := 10;
            ELSE NULL;
          END CASE;
          IF v_hidden_gems >= v_threshold THEN
            INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
            badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
          END IF;
          CONTINUE;
        END IF;

        IF v_badge.key IN ('good_call', 'taste_prophet', 'oracle') THEN
          CASE v_badge.key
            WHEN 'good_call' THEN v_threshold := 1;
            WHEN 'taste_prophet' THEN v_threshold := 3;
            WHEN 'oracle' THEN v_threshold := 5;
            ELSE NULL;
          END CASE;
          IF v_called_it >= v_threshold THEN
            INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
            badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
          END IF;
        END IF;

      WHEN 'consistency' THEN
        IF v_votes_with_consensus < 20 THEN CONTINUE; END IF;
        CASE v_badge.key
          WHEN 'steady_hand' THEN
            IF ABS(v_global_bias) <= 0.5 THEN
              INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
              badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
            END IF;
          WHEN 'tough_critic' THEN
            IF v_global_bias <= -1.5 THEN
              INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
              badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
            END IF;
          WHEN 'generous_spirit' THEN
            IF v_global_bias >= 1.5 THEN
              INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
              badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
            END IF;
          ELSE NULL;
        END CASE;

      WHEN 'influence' THEN
        CASE v_badge.key
          WHEN 'taste_maker' THEN v_threshold := 10;
          WHEN 'trusted_voice' THEN v_threshold := 25;
          ELSE CONTINUE;
        END CASE;
        IF v_follower_count >= v_threshold THEN
          INSERT INTO user_badges (user_id, badge_key) VALUES (p_user_id, v_badge.key);
          badge_key := v_badge.key; newly_unlocked := true; RETURN NEXT;
        END IF;

      ELSE NULL;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID, p_public_only BOOLEAN DEFAULT false)
RETURNS TABLE (
  badge_key TEXT, name TEXT, subtitle TEXT, description TEXT, icon TEXT,
  is_public_eligible BOOLEAN, sort_order INTEGER, unlocked_at TIMESTAMP WITH TIME ZONE,
  rarity TEXT, family TEXT, category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.key AS badge_key, b.name, b.subtitle, b.description, b.icon,
    b.is_public_eligible, b.sort_order, ub.unlocked_at, b.rarity, b.family, b.category
  FROM user_badges ub JOIN badges b ON ub.badge_key = b.key
  WHERE ub.user_id = p_user_id AND (NOT p_public_only OR b.is_public_eligible = true)
  ORDER BY b.sort_order ASC, ub.unlocked_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_public_badges(p_user_id UUID)
RETURNS TABLE (
  badge_key TEXT, name TEXT, subtitle TEXT, description TEXT, icon TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE, rarity TEXT, family TEXT, category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.key AS badge_key, b.name, b.subtitle, b.description, b.icon,
    ub.unlocked_at, b.rarity, b.family, b.category
  FROM user_badges ub JOIN badges b ON ub.badge_key = b.key
  WHERE ub.user_id = p_user_id AND b.is_public_eligible = true
  ORDER BY b.sort_order ASC, ub.unlocked_at DESC LIMIT 6;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_category_experts(
  p_category TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  badge_tier TEXT,
  follower_count BIGINT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ON (ub.user_id)
    ub.user_id, p.display_name,
    CASE WHEN b.key LIKE 'authority_%' THEN 'authority' ELSE 'specialist' END AS badge_tier,
    COALESCE(fc.cnt, 0) AS follower_count
  FROM user_badges ub
  JOIN badges b ON ub.badge_key = b.key
  JOIN profiles p ON ub.user_id = p.id
  LEFT JOIN (SELECT followed_id, COUNT(*) AS cnt FROM follows GROUP BY followed_id) fc ON fc.followed_id = ub.user_id
  WHERE b.category = p_category AND b.family = 'category'
  ORDER BY ub.user_id,
    CASE WHEN b.key LIKE 'authority_%' THEN 0 ELSE 1 END,
    COALESCE(fc.cnt, 0) DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION get_expert_votes_for_restaurant(p_restaurant_id UUID)
RETURNS TABLE (dish_id UUID, specialist_count INT, authority_count INT)
LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT v.dish_id,
    COUNT(*) FILTER (WHERE ub.badge_key LIKE 'specialist_%')::INT AS specialist_count,
    COUNT(*) FILTER (WHERE ub.badge_key LIKE 'authority_%')::INT AS authority_count
  FROM votes v
  JOIN dishes d ON d.id = v.dish_id AND d.restaurant_id = p_restaurant_id
  JOIN user_badges ub ON ub.user_id = v.user_id
    AND ub.badge_key IN ('specialist_' || REPLACE(d.category, ' ', '_'), 'authority_' || REPLACE(d.category, ' ', '_'))
  GROUP BY v.dish_id;
$$;


-- ---- Notification functions ----

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' OR (select auth.uid()) = p_user_id THEN
      (SELECT COUNT(*)::INTEGER FROM notifications WHERE user_id = p_user_id AND read = FALSE)
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  UPDATE notifications SET read = TRUE
  WHERE user_id = p_user_id AND read = FALSE
    AND (auth.role() = 'service_role' OR (select auth.uid()) = p_user_id);
$$;


-- ---- Rate limiting functions ----

CREATE OR REPLACE FUNCTION check_and_record_rate_limit(
  p_action TEXT, p_max_attempts INT DEFAULT 10, p_window_seconds INT DEFAULT 60
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID; v_count INT; v_oldest TIMESTAMPTZ; v_cutoff TIMESTAMPTZ; v_retry_after INT;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Not authenticated');
  END IF;
  v_cutoff := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  SELECT COUNT(*), MIN(created_at) INTO v_count, v_oldest
  FROM rate_limits WHERE user_id = v_user_id AND action = p_action AND created_at > v_cutoff;
  IF v_count >= p_max_attempts THEN
    v_retry_after := EXTRACT(EPOCH FROM (v_oldest + (p_window_seconds || ' seconds')::INTERVAL - NOW()))::INT;
    IF v_retry_after < 0 THEN v_retry_after := 0; END IF;
    RETURN jsonb_build_object('allowed', false, 'retry_after_seconds', v_retry_after,
      'message', 'Too many attempts. Please wait ' || v_retry_after || ' seconds.');
  END IF;
  INSERT INTO rate_limits (user_id, action) VALUES (v_user_id, p_action);
  RETURN jsonb_build_object('allowed', true);
END;
$$;

CREATE OR REPLACE FUNCTION check_vote_rate_limit()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT check_and_record_rate_limit('vote', 10, 60);
$$;

CREATE OR REPLACE FUNCTION check_photo_upload_rate_limit()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT check_and_record_rate_limit('photo_upload', 5, 60);
$$;

CREATE OR REPLACE FUNCTION check_restaurant_create_rate_limit()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT check_and_record_rate_limit('restaurant_create', 5, 3600);
$$;

CREATE OR REPLACE FUNCTION check_dish_create_rate_limit()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT check_and_record_rate_limit('dish_create', 20, 3600);
$$;


-- ---- Restaurant manager functions ----

CREATE OR REPLACE FUNCTION get_invite_details(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT ri.*, r.name AS restaurant_name INTO v_invite
  FROM restaurant_invites ri JOIN restaurants r ON r.id = ri.restaurant_id
  WHERE ri.token = p_token;

  IF NOT FOUND THEN RETURN json_build_object('valid', false, 'error', 'Invite not found'); END IF;
  IF v_invite.used_by IS NOT NULL THEN RETURN json_build_object('valid', false, 'error', 'Invite already used'); END IF;
  IF v_invite.expires_at < NOW() THEN RETURN json_build_object('valid', false, 'error', 'Invite has expired'); END IF;

  RETURN json_build_object('valid', true, 'restaurant_name', v_invite.restaurant_name,
    'restaurant_id', v_invite.restaurant_id, 'expires_at', v_invite.expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION accept_restaurant_invite(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD; v_user_id UUID;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT ri.*, r.name AS restaurant_name INTO v_invite
  FROM restaurant_invites ri JOIN restaurants r ON r.id = ri.restaurant_id
  WHERE ri.token = p_token FOR UPDATE OF ri;

  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Invite not found'); END IF;
  IF v_invite.used_by IS NOT NULL THEN RETURN json_build_object('success', false, 'error', 'Invite already used'); END IF;
  IF v_invite.expires_at < NOW() THEN RETURN json_build_object('success', false, 'error', 'Invite has expired'); END IF;

  INSERT INTO restaurant_managers (user_id, restaurant_id, role, accepted_at, created_by)
  VALUES (v_user_id, v_invite.restaurant_id, 'manager', NOW(), v_invite.created_by)
  ON CONFLICT (user_id, restaurant_id) DO UPDATE SET accepted_at = NOW();

  UPDATE restaurant_invites SET used_by = v_user_id, used_at = NOW() WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'restaurant_id', v_invite.restaurant_id,
    'restaurant_name', v_invite.restaurant_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ---- Geo functions ----

CREATE OR REPLACE FUNCTION find_nearby_restaurants(
  p_name TEXT DEFAULT NULL,
  p_lat DECIMAL DEFAULT NULL,
  p_lng DECIMAL DEFAULT NULL,
  p_radius_meters INT DEFAULT 150
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  lat DECIMAL,
  lng DECIMAL,
  google_place_id TEXT,
  distance_meters DECIMAL
) AS $$
DECLARE
  lat_delta DECIMAL := p_radius_meters / 111320.0;
  lng_delta DECIMAL := p_radius_meters / (111320.0 * COS(RADIANS(COALESCE(p_lat, 0))));
BEGIN
  RETURN QUERY
  SELECT
    r.id, r.name, r.address, r.lat, r.lng, r.google_place_id,
    ROUND((
      6371000 * ACOS(
        LEAST(1.0, GREATEST(-1.0,
          COS(RADIANS(p_lat)) * COS(RADIANS(r.lat)) *
          COS(RADIANS(r.lng) - RADIANS(p_lng)) +
          SIN(RADIANS(p_lat)) * SIN(RADIANS(r.lat))
        ))
      )
    )::NUMERIC, 1) AS distance_meters
  FROM restaurants r
  WHERE
    (p_lat IS NULL OR (
      r.lat BETWEEN (p_lat - lat_delta) AND (p_lat + lat_delta)
      AND r.lng BETWEEN (p_lng - lng_delta) AND (p_lng + lng_delta)
    ))
    AND (p_name IS NULL OR r.name ILIKE '%' || p_name || '%')
  ORDER BY
    CASE WHEN p_lat IS NOT NULL THEN
      6371000 * ACOS(
        LEAST(1.0, GREATEST(-1.0,
          COS(RADIANS(p_lat)) * COS(RADIANS(r.lat)) *
          COS(RADIANS(r.lng) - RADIANS(p_lng)) +
          SIN(RADIANS(p_lat)) * SIN(RADIANS(r.lat))
        ))
      )
    ELSE 0 END ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_restaurants_within_radius(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_radius_miles INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  lat DECIMAL,
  lng DECIMAL,
  is_open BOOLEAN,
  cuisine TEXT,
  town TEXT,
  google_place_id TEXT,
  website_url TEXT,
  phone TEXT,
  distance_miles DECIMAL,
  dish_count BIGINT
) AS $$
DECLARE
  lat_delta DECIMAL := p_radius_miles / 69.0;
  lng_delta DECIMAL := p_radius_miles / (69.0 * COS(RADIANS(p_lat)));
BEGIN
  RETURN QUERY
  WITH nearby AS (
    SELECT r.id, r.name, r.address, r.lat, r.lng, r.is_open, r.cuisine, r.town,
           r.google_place_id, r.website_url, r.phone,
           ROUND((
             3959 * ACOS(
               LEAST(1.0, GREATEST(-1.0,
                 COS(RADIANS(p_lat)) * COS(RADIANS(r.lat)) *
                 COS(RADIANS(r.lng) - RADIANS(p_lng)) +
                 SIN(RADIANS(p_lat)) * SIN(RADIANS(r.lat))
               ))
             )
           )::NUMERIC, 2) AS distance_miles
    FROM restaurants r
    WHERE r.lat BETWEEN (p_lat - lat_delta) AND (p_lat + lat_delta)
      AND r.lng BETWEEN (p_lng - lng_delta) AND (p_lng + lng_delta)
  )
  SELECT
    n.id, n.name, n.address, n.lat, n.lng, n.is_open, n.cuisine, n.town,
    n.google_place_id, n.website_url, n.phone,
    n.distance_miles,
    COUNT(d.id)::BIGINT AS dish_count
  FROM nearby n
  LEFT JOIN dishes d ON d.restaurant_id = n.id AND d.parent_dish_id IS NULL
  WHERE n.distance_miles <= p_radius_miles
  GROUP BY n.id, n.name, n.address, n.lat, n.lng, n.is_open, n.cuisine, n.town,
           n.google_place_id, n.website_url, n.phone, n.distance_miles
  ORDER BY n.distance_miles ASC;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;


-- ---- Jitter Protocol functions ----

CREATE OR REPLACE FUNCTION get_my_jitter_profile()
RETURNS TABLE (
  confidence_level TEXT,
  consistency_score NUMERIC,
  review_count INTEGER,
  profile_data JSONB,
  created_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jp.confidence_level, jp.consistency_score, jp.review_count,
         jp.profile_data, jp.created_at, jp.last_updated
  FROM jitter_profiles jp
  WHERE jp.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_jitter_badges(p_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  confidence_level TEXT,
  consistency_score DECIMAL,
  review_count INT,
  flagged BOOLEAN
) AS $$
  SELECT jp.user_id, jp.confidence_level, jp.consistency_score, jp.review_count, jp.flagged
  FROM jitter_profiles jp
  WHERE jp.user_id = ANY(p_user_ids);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ---- Local Lists functions ----

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


-- ---- Locals aggregate (chalkboard cards) ----

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


