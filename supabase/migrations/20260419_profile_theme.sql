-- 20260419 · Add theme column to profiles (Claude Design redesign)
--
-- The redesign gives every user one of six preset themes:
--   paper (default) · dusk · zine · diner · chalk · neon
--
-- Theme is shown on the user's own profile AND propagates to viewers:
-- when user A views user B's profile or lists, the app re-skins in B's theme.
-- That social propagation requires the preference be persisted server-side.
--
-- Additive, safe to apply live. No backfill needed (DEFAULT handles existing rows).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'paper';

-- Constrain to known theme IDs (keeps bad values out of the profiles table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_theme_valid'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_theme_valid
      CHECK (theme IN ('paper', 'dusk', 'zine', 'diner', 'chalk', 'neon'));
  END IF;
END$$;

-- ROLLBACK:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_theme_valid;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS theme;
