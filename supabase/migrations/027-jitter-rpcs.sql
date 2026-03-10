-- 027-jitter-rpcs.sql
-- Deploy missing Jitter RPCs + add created_at column + fix seeded data
-- Run in Supabase SQL Editor

-- =============================================
-- 1. ADD MISSING COLUMN (idempotent)
-- =============================================
ALTER TABLE jitter_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =============================================
-- 2. DEPLOY RPCs
-- =============================================

-- Public badge data for other users' reviews (no biometric details)
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

-- Authenticated user's full jitter profile (for profile page + post-submission card)
CREATE OR REPLACE FUNCTION get_my_jitter_profile()
RETURNS TABLE (
  confidence_level TEXT,
  consistency_score DECIMAL,
  review_count INT,
  profile_data JSONB,
  created_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ
) AS $$
  SELECT jp.confidence_level, jp.consistency_score, jp.review_count,
         jp.profile_data, jp.created_at, jp.last_updated
  FROM jitter_profiles jp
  WHERE jp.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- =============================================
-- 3. FIX SEEDED DATA (update to actual user)
-- =============================================

-- Update any existing seeded jitter_profiles to belong to the actual logged-in user
-- This grabs the first user from profiles and assigns the jitter data to them
DO $$
DECLARE
  real_user_id UUID;
  existing_jitter_user UUID;
BEGIN
  -- Get the first real user (Denis)
  SELECT id INTO real_user_id FROM auth.users LIMIT 1;

  -- Get the seeded jitter profile's user_id
  SELECT user_id INTO existing_jitter_user FROM jitter_profiles LIMIT 1;

  -- If there's a jitter profile but it doesn't belong to the real user, fix it
  IF existing_jitter_user IS NOT NULL AND existing_jitter_user != real_user_id THEN
    -- Delete the mismatched one and insert for the correct user
    UPDATE jitter_profiles SET user_id = real_user_id WHERE user_id = existing_jitter_user;
  END IF;

  -- If no jitter profile exists at all, seed one
  IF NOT EXISTS (SELECT 1 FROM jitter_profiles WHERE user_id = real_user_id) THEN
    INSERT INTO jitter_profiles (user_id, profile_data, review_count, confidence_level, consistency_score, created_at, last_updated)
    VALUES (
      real_user_id,
      '{"mean_inter_key": 145.2, "std_inter_key": 42.8, "mean_dwell": 89.3, "std_dwell": 24.1, "mean_dd_time": 165.4, "std_dd_time": 38.2, "total_keystrokes": 3847, "edit_ratio": 0.12, "pause_freq": 0.08}'::JSONB,
      12,
      'medium',
      0.720,
      NOW() - INTERVAL '14 days',
      NOW()
    );
  END IF;
END $$;

-- =============================================
-- 4. VERIFY
-- =============================================
SELECT
  user_id,
  confidence_level,
  consistency_score,
  review_count,
  created_at,
  profile_data
FROM jitter_profiles;
