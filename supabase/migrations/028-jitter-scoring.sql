-- Add liveness scoring columns to jitter_samples
ALTER TABLE jitter_samples
  ADD COLUMN IF NOT EXISTS liveness_score DECIMAL(3, 2),
  ADD COLUMN IF NOT EXISTS flags TEXT[];

-- Update merge trigger: flag profile when liveness_score is low
CREATE OR REPLACE FUNCTION merge_jitter_sample()
RETURNS TRIGGER AS $$
DECLARE
  existing_profile JSONB;
  existing_count INTEGER;
  new_data JSONB;
  merged JSONB;
  weight DECIMAL;
  old_weight DECIMAL;
  sim DECIMAL;
  key TEXT;
  old_val DECIMAL;
  new_val DECIMAL;
BEGIN
  -- Get existing profile
  SELECT profile_data, review_count INTO existing_profile, existing_count
  FROM jitter_profiles WHERE user_id = NEW.user_id;

  new_data := NEW.sample_data;

  IF existing_profile IS NULL THEN
    -- First sample: create profile directly
    INSERT INTO jitter_profiles (user_id, profile_data, review_count, confidence_level, consistency_score, created_at, last_updated)
    VALUES (
      NEW.user_id,
      new_data,
      1,
      'low',
      0,
      NOW(),
      NOW()
    );
  ELSE
    -- Weighted merge: new sample gets less weight as profile matures
    weight := GREATEST(0.15, 1.0 / (existing_count + 1));
    old_weight := 1.0 - weight;

    -- Merge numeric fields with weighted average
    merged := '{}'::JSONB;
    FOR key IN SELECT jsonb_object_keys(new_data) LOOP
      IF jsonb_typeof(new_data -> key) = 'number' AND existing_profile ? key AND jsonb_typeof(existing_profile -> key) = 'number' THEN
        old_val := (existing_profile ->> key)::DECIMAL;
        new_val := (new_data ->> key)::DECIMAL;
        merged := jsonb_set(merged, ARRAY[key], to_jsonb(ROUND((old_weight * old_val + weight * new_val)::NUMERIC, 2)));
      ELSE
        -- Non-numeric or new field: take the new value
        merged := jsonb_set(merged, ARRAY[key], new_data -> key);
      END IF;
    END LOOP;

    -- Preserve existing fields not in new sample
    FOR key IN SELECT jsonb_object_keys(existing_profile) LOOP
      IF NOT (merged ? key) THEN
        merged := jsonb_set(merged, ARRAY[key], existing_profile -> key);
      END IF;
    END LOOP;

    -- Calculate consistency (similarity between old and new profile)
    sim := 0;
    IF existing_profile ? 'mean_inter_key' AND new_data ? 'mean_inter_key' THEN
      old_val := (existing_profile ->> 'mean_inter_key')::DECIMAL;
      new_val := (new_data ->> 'mean_inter_key')::DECIMAL;
      IF old_val > 0 THEN
        sim := 1.0 - LEAST(ABS(old_val - new_val) / old_val, 1.0);
      END IF;
    END IF;

    -- Smooth consistency score
    IF (SELECT consistency_score FROM jitter_profiles WHERE user_id = NEW.user_id) > 0 THEN
      sim :=
        (SELECT consistency_score FROM jitter_profiles WHERE user_id = NEW.user_id) *
        old_weight + sim * weight;
    END IF;

    UPDATE jitter_profiles SET
      profile_data = merged,
      review_count = existing_count + 1,
      confidence_level = CASE
        WHEN existing_count + 1 >= 10 THEN 'high'
        WHEN existing_count + 1 >= 3 THEN 'medium'
        ELSE 'low'
      END,
      consistency_score = ROUND(sim::NUMERIC, 3),
      -- Flag profile if this sample scored below 0.3
      flagged = CASE
        WHEN NEW.liveness_score IS NOT NULL AND NEW.liveness_score < 0.3 THEN true
        ELSE flagged
      END,
      last_updated = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Cleanup: keep only last 30 samples per user
  DELETE FROM jitter_samples
  WHERE id IN (
      SELECT id FROM jitter_samples
      WHERE user_id = NEW.user_id
      ORDER BY collected_at DESC
      OFFSET 30
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
