-- =============================================
-- 1. TABLES (in dependency order)
-- =============================================

-- 1a. restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  is_open BOOLEAN DEFAULT true,
  cuisine TEXT,
  town TEXT,
  region TEXT NOT NULL DEFAULT 'mv',
  created_by UUID REFERENCES auth.users(id),
  google_place_id TEXT,
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  phone TEXT,
  menu_url TEXT,
  menu_last_checked TIMESTAMPTZ,
  menu_content_hash TEXT,
  menu_section_order TEXT[] DEFAULT '{}',
  toast_slug TEXT,
  order_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1b. dishes
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  menu_section TEXT,
  price DECIMAL(6, 2),
  photo_url TEXT,
  parent_dish_id UUID REFERENCES dishes(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  cuisine TEXT,
  avg_rating DECIMAL(3, 1),
  total_votes INT DEFAULT 0,
  consensus_rating NUMERIC(3, 1),
  consensus_ready BOOLEAN DEFAULT FALSE,
  consensus_votes INT DEFAULT 0,
  consensus_calculated_at TIMESTAMPTZ,
  value_score DECIMAL(6, 2),
  value_percentile DECIMAL(5, 2),
  category_median_price DECIMAL(6, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1c. votes
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  would_order_again BOOLEAN NOT NULL,
  rating_10 DECIMAL(3, 1),
  review_text TEXT,
  review_created_at TIMESTAMP WITH TIME ZONE,
  vote_position INT,
  scored_at TIMESTAMPTZ,
  category_snapshot TEXT,
  purity_score DECIMAL(5, 2),
  war_score DECIMAL(4, 3),
  badge_hash TEXT,
  source TEXT NOT NULL DEFAULT 'user',
  source_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1d. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  has_onboarded BOOLEAN DEFAULT false,
  preferred_categories TEXT[] DEFAULT '{}',
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_local_curator BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1e. favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dish_id)
);

-- 1f. admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 1g. dish_photos
CREATE TABLE IF NOT EXISTS dish_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  width INT,
  height INT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  avg_brightness REAL,
  bright_pixel_pct REAL,
  dark_pixel_pct REAL,
  quality_score INT,
  status TEXT DEFAULT 'community',
  reject_reason TEXT,
  source_type TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dish_id, user_id)
);

-- 1h. follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- 1i. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1j. user_rating_stats
CREATE TABLE IF NOT EXISTS user_rating_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_bias NUMERIC(3, 1) DEFAULT 0.0,
  bias_label TEXT DEFAULT 'New Voter',
  votes_with_consensus INT DEFAULT 0,
  votes_pending INT DEFAULT 0,
  dishes_helped_establish INT DEFAULT 0,
  category_biases JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1k. bias_events
CREATE TABLE IF NOT EXISTS bias_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  dish_name TEXT NOT NULL,
  user_rating NUMERIC(3, 1) NOT NULL,
  consensus_rating NUMERIC(3, 1) NOT NULL,
  deviation NUMERIC(3, 1) NOT NULL,
  was_early_voter BOOLEAN DEFAULT FALSE,
  bias_before NUMERIC(3, 1),
  bias_after NUMERIC(3, 1),
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1l. badges
CREATE TABLE IF NOT EXISTS badges (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_public_eligible BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  rarity TEXT NOT NULL DEFAULT 'common',
  family TEXT NOT NULL DEFAULT 'discovery',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1n. user_badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL REFERENCES badges(key) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata_json JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_key)
);

-- 1o. specials
CREATE TABLE IF NOT EXISTS specials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_promoted BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- 1p. restaurant_managers
CREATE TABLE IF NOT EXISTS restaurant_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'manager',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, restaurant_id)
);

-- 1q. restaurant_invites
CREATE TABLE IF NOT EXISTS restaurant_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ
);

-- 1r. curator_invites
CREATE TABLE IF NOT EXISTS curator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1s. rate_limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1t. jitter_profiles
CREATE TABLE IF NOT EXISTS jitter_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}',
  review_count INTEGER NOT NULL DEFAULT 0,
  confidence_level TEXT NOT NULL DEFAULT 'low',
  consistency_score DECIMAL(4, 3) DEFAULT 0,
  flagged BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1u. jitter_samples
CREATE TABLE IF NOT EXISTS jitter_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sample_data JSONB NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1v. events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_type TEXT NOT NULL,
  recurring_pattern TEXT,
  recurring_day_of_week INT,
  is_active BOOLEAN DEFAULT true,
  is_promoted BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 1w. local_lists
CREATE TABLE IF NOT EXISTS local_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  curator_tagline TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT local_lists_one_per_user UNIQUE (user_id)
);

-- 1x. local_list_items
CREATE TABLE IF NOT EXISTS local_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES local_lists(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  position INT NOT NULL,
  note TEXT,
  CONSTRAINT local_list_items_unique_dish UNIQUE (list_id, dish_id),
  CONSTRAINT local_list_items_unique_position UNIQUE (list_id, position),
  CONSTRAINT local_list_items_position_range CHECK (position >= 1 AND position <= 10)
);


