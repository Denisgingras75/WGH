-- Migration: dish inclusion signal (Phase 1 of inclusion-aware value rankings)
-- Adds columns describing what a dish comes with (sides), inferred from the
-- menu description we already store. Used to compare like-with-like in value
-- scoring (Phase 2): an entrée that comes with two sides shouldn't be judged
-- against an à-la-carte plate.
--
-- Additive only (ADD COLUMN IF NOT EXISTS) — safe to run repeatedly.
-- `description` is included because it already exists in production but was
-- missing from schema.sql (drift reconciliation); IF NOT EXISTS makes it a
-- no-op there.

ALTER TABLE dishes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS includes_sides BOOLEAN;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS included_sides TEXT[] DEFAULT '{}';
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS meal_completeness TEXT;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS inclusion_inferred_at TIMESTAMPTZ;

-- Constrain meal_completeness to known values (guarded so re-runs don't error).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dishes_meal_completeness_check'
  ) THEN
    ALTER TABLE dishes ADD CONSTRAINT dishes_meal_completeness_check
      CHECK (meal_completeness IN ('a_la_carte', 'comes_with_sides', 'full_platter'));
  END IF;
END $$;

-- Partial index: Phase 2 value scoring will group by (category, meal_completeness)
-- over rated, classified dishes.
CREATE INDEX IF NOT EXISTS idx_dishes_category_completeness
  ON dishes (category, meal_completeness)
  WHERE meal_completeness IS NOT NULL;

-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_dishes_category_completeness;
-- ALTER TABLE dishes DROP CONSTRAINT IF EXISTS dishes_meal_completeness_check;
-- ALTER TABLE dishes DROP COLUMN IF EXISTS inclusion_inferred_at;
-- ALTER TABLE dishes DROP COLUMN IF EXISTS meal_completeness;
-- ALTER TABLE dishes DROP COLUMN IF EXISTS included_sides;
-- ALTER TABLE dishes DROP COLUMN IF EXISTS includes_sides;
-- (Leave `description` — it pre-existed this migration.)
