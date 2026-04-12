-- locals-aggregate.sql
-- Returns the dish and restaurant that appear on the most local lists
-- Used by the "Locals Agree" and "Island Favorite" chalkboard cards

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
