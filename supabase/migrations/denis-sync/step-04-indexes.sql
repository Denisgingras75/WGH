-- =============================================
-- 4. INDEXES
-- =============================================

-- restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(lat, lng);
CREATE INDEX IF NOT EXISTS idx_restaurants_open_lat_lng ON restaurants(is_open, lat, lng) WHERE is_open = true;
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine);
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_google_place_id ON restaurants(google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_created_by ON restaurants(created_by);
CREATE INDEX IF NOT EXISTS idx_restaurants_town ON restaurants(town);

-- dishes
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant ON dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);
CREATE INDEX IF NOT EXISTS idx_dishes_parent ON dishes(parent_dish_id);
CREATE INDEX IF NOT EXISTS idx_dishes_tags ON dishes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_dishes_consensus ON dishes(consensus_ready) WHERE consensus_ready = TRUE;
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_category ON dishes(restaurant_id, category);
CREATE INDEX IF NOT EXISTS idx_dishes_created_by ON dishes(created_by);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_toplevel ON dishes(restaurant_id) WHERE parent_dish_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_dishes_consensus_eligible ON dishes(id) WHERE total_votes >= 5 AND avg_rating IS NOT NULL;

-- votes
CREATE INDEX IF NOT EXISTS idx_votes_dish ON votes(dish_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_review_text ON votes(dish_id) WHERE review_text IS NOT NULL AND review_text != '';
CREATE INDEX IF NOT EXISTS idx_votes_unscored ON votes(dish_id) WHERE scored_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_votes_user_dish ON votes(user_id, dish_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_position ON votes(user_id, vote_position);

-- profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_unique ON profiles(LOWER(display_name)) WHERE display_name IS NOT NULL;

-- dish_photos
CREATE INDEX IF NOT EXISTS idx_dish_photos_dish ON dish_photos(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_photos_user ON dish_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_dish_photos_status ON dish_photos(dish_id, status, quality_score DESC);

-- follows
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- user_rating_stats
CREATE INDEX IF NOT EXISTS idx_user_rating_stats_bias ON user_rating_stats(rating_bias);

-- bias_events
CREATE INDEX IF NOT EXISTS idx_bias_events_user ON bias_events(user_id);
CREATE INDEX IF NOT EXISTS idx_bias_events_dish ON bias_events(dish_id);
CREATE INDEX IF NOT EXISTS idx_bias_events_unseen ON bias_events(user_id, seen) WHERE seen = FALSE;

-- user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_key);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked ON user_badges(unlocked_at DESC);

-- specials
CREATE INDEX IF NOT EXISTS idx_specials_active ON specials(is_active, restaurant_id);
CREATE INDEX IF NOT EXISTS idx_specials_created_by ON specials(created_by);

-- restaurant_managers
CREATE INDEX IF NOT EXISTS idx_restaurant_managers_user ON restaurant_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_managers_restaurant ON restaurant_managers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_managers_created_by ON restaurant_managers(created_by);

-- restaurant_invites
CREATE INDEX IF NOT EXISTS idx_restaurant_invites_restaurant ON restaurant_invites(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_invites_created_by ON restaurant_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_restaurant_invites_used_by ON restaurant_invites(used_by);

-- curator_invites
CREATE INDEX IF NOT EXISTS idx_curator_invites_token ON curator_invites(token);
CREATE INDEX IF NOT EXISTS idx_curator_invites_created_by ON curator_invites(created_by);

-- rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(created_at);

-- events
CREATE INDEX IF NOT EXISTS idx_events_restaurant ON events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_events_active_upcoming ON events(event_date, is_promoted DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type) WHERE is_active = true;

-- jitter_samples
CREATE INDEX IF NOT EXISTS idx_jitter_samples_user ON jitter_samples (user_id, collected_at DESC);

-- local_lists
CREATE INDEX IF NOT EXISTS idx_local_lists_user_id ON local_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_local_lists_is_active ON local_lists(is_active);
CREATE INDEX IF NOT EXISTS idx_local_list_items_list_position ON local_list_items(list_id, position);
CREATE INDEX IF NOT EXISTS idx_local_list_items_dish_id ON local_list_items(dish_id);

-- favorites (additional)
CREATE INDEX IF NOT EXISTS idx_favorites_dish_id ON favorites(dish_id);


