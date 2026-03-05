ALTER TABLE jitter_samples
  ADD COLUMN IF NOT EXISTS war_score DECIMAL(4, 3),
  ADD COLUMN IF NOT EXISTS classification TEXT CHECK (classification IN ('verified', 'suspicious', 'bot'));

CREATE INDEX IF NOT EXISTS idx_jitter_samples_war ON jitter_samples (war_score);

COMMENT ON COLUMN jitter_samples.war_score IS 'WAR v2: 9-signal weighted composite score (0.0=bot, 1.0=human)';
COMMENT ON COLUMN jitter_samples.classification IS 'verified (>=0.80), suspicious (0.50-0.79), bot (<0.50)';
