-- =============================================
-- 7. VIEWS
-- =============================================

-- category_median_prices
CREATE OR REPLACE VIEW category_median_prices
WITH (security_invoker = true) AS
SELECT category,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median_price,
  COUNT(*) AS dish_count
FROM dishes
WHERE price IS NOT NULL AND price > 0 AND total_votes >= 8
GROUP BY category;

-- public_votes
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


