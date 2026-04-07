-- =============================================
-- 13. GRANTS
-- =============================================

GRANT EXECUTE ON FUNCTION get_smart_snippet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_snippet(UUID) TO anon;
GRANT EXECUTE ON FUNCTION check_and_record_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_vote_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_photo_upload_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_restaurant_create_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_dish_create_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_restaurants TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_restaurants TO anon;
GRANT EXECUTE ON FUNCTION get_restaurants_within_radius(DECIMAL, DECIMAL, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurants_within_radius(DECIMAL, DECIMAL, INT) TO anon;


