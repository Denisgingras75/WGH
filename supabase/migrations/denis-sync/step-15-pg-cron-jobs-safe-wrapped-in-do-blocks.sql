-- =============================================
-- 15. PG_CRON JOBS (safe — wrapped in DO blocks)
-- =============================================
-- These will only work if pg_cron extension is enabled.
-- If it fails, these jobs can be set up manually via Supabase dashboard.

DO $$
BEGIN
  -- Try to schedule value percentile recalculation
  PERFORM cron.schedule('recalculate-value-percentiles', '0 */2 * * *', 'SELECT recalculate_value_percentiles()');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available or job already exists: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Try to schedule rate limit cleanup
  PERFORM cron.schedule('cleanup-old-rate-limits', '15 * * * *', 'DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL ''1 hour''');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available or job already exists: %', SQLERRM;
END $$;


-- =============================================
-- DONE. Migration complete.
-- =============================================
