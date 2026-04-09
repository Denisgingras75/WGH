-- Add avg_rating and total_votes to get_restaurants_within_radius RPC
-- Run this in Supabase SQL Editor
-- Must DROP first because return type changed (Postgres requirement)

DROP FUNCTION IF EXISTS get_restaurants_within_radius(DECIMAL, DECIMAL, INT);

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
  dish_count BIGINT,
  avg_rating DECIMAL,
  total_votes BIGINT
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
    COUNT(d.id)::BIGINT AS dish_count,
    ROUND(AVG(d.avg_rating) FILTER (WHERE d.avg_rating IS NOT NULL AND d.total_votes > 0)::NUMERIC, 1) AS avg_rating,
    COALESCE(SUM(d.total_votes), 0)::BIGINT AS total_votes
  FROM nearby n
  LEFT JOIN dishes d ON d.restaurant_id = n.id AND d.parent_dish_id IS NULL
  WHERE n.distance_miles <= p_radius_miles
  GROUP BY n.id, n.name, n.address, n.lat, n.lng, n.is_open, n.cuisine, n.town,
           n.google_place_id, n.website_url, n.phone, n.distance_miles
  ORDER BY n.distance_miles ASC;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
