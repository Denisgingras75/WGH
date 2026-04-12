-- =============================================
-- 3. CONSTRAINTS (idempotent, wrapped in DO blocks)
-- =============================================

-- votes: source CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'votes_source_check'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_source_check CHECK (source IN ('user', 'ai_estimated'));
  END IF;
END $$;

-- votes: review_text_max_length
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'review_text_max_length'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT review_text_max_length CHECK (review_text IS NULL OR length(review_text) <= 200);
  END IF;
END $$;

-- dish_photos: status CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'dish_photos_status_check'
  ) THEN
    ALTER TABLE dish_photos ADD CONSTRAINT dish_photos_status_check CHECK (status IN ('featured', 'community', 'hidden', 'rejected'));
  END IF;
END $$;

-- dish_photos: source_type CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'dish_photos_source_type_check'
  ) THEN
    ALTER TABLE dish_photos ADD CONSTRAINT dish_photos_source_type_check CHECK (source_type IN ('user', 'restaurant'));
  END IF;
END $$;

-- specials: source CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'specials_source_check'
  ) THEN
    ALTER TABLE specials ADD CONSTRAINT specials_source_check CHECK (source IN ('manual', 'auto_scrape'));
  END IF;
END $$;

-- jitter_profiles: confidence_level CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'jitter_profiles_confidence_level_check'
  ) THEN
    ALTER TABLE jitter_profiles ADD CONSTRAINT jitter_profiles_confidence_level_check CHECK (confidence_level IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- events: event_type CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'events_event_type_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_event_type_check CHECK (event_type IN ('live_music', 'trivia', 'comedy', 'karaoke', 'open_mic', 'other'));
  END IF;
END $$;

-- events: recurring_pattern CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'events_recurring_pattern_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_recurring_pattern_check CHECK (recurring_pattern IN ('weekly', 'monthly') OR recurring_pattern IS NULL);
  END IF;
END $$;

-- events: recurring_day_of_week CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'events_recurring_day_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_recurring_day_check CHECK (recurring_day_of_week BETWEEN 0 AND 6 OR recurring_day_of_week IS NULL);
  END IF;
END $$;

-- events: source CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'events_source_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_source_check CHECK (source IN ('manual', 'auto_scrape'));
  END IF;
END $$;

-- Partial unique index on votes: only user votes are unique per dish/user
CREATE UNIQUE INDEX IF NOT EXISTS votes_user_unique ON votes (dish_id, user_id) WHERE source = 'user';


