-- Menu Import Queue Migration
-- Run in Supabase SQL Editor
-- Date: 2026-04-09

-- 1. Create table
CREATE TABLE IF NOT EXISTS menu_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'initial',
  status TEXT NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 0,
  attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INT NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  lock_expires_at TIMESTAMPTZ,
  dishes_found INT,
  dishes_inserted INT,
  dishes_updated INT,
  dishes_unchanged INT,
  error_message TEXT,
  error_code TEXT,
  error_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT menu_import_jobs_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'dead')),
  CONSTRAINT menu_import_jobs_job_type_check
    CHECK (job_type IN ('initial', 'refresh', 'manual'))
);

-- 2. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS menu_import_jobs_one_active_per_restaurant
  ON menu_import_jobs (restaurant_id)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS menu_import_jobs_dequeue_idx
  ON menu_import_jobs (priority DESC, run_after, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS menu_import_jobs_stalled_idx
  ON menu_import_jobs (lock_expires_at)
  WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS menu_import_jobs_restaurant_history_idx
  ON menu_import_jobs (restaurant_id, created_at DESC);

-- 3. RLS: service-role only
ALTER TABLE menu_import_jobs ENABLE ROW LEVEL SECURITY;

-- 4. RPC: enqueue_menu_import (truly idempotent under concurrency)
CREATE OR REPLACE FUNCTION enqueue_menu_import(
  p_restaurant_id UUID,
  p_job_type TEXT DEFAULT 'initial',
  p_priority INT DEFAULT 10
)
RETURNS TABLE (
  job_id UUID,
  job_status TEXT,
  is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  INSERT INTO menu_import_jobs (restaurant_id, job_type, priority)
  VALUES (p_restaurant_id, p_job_type, p_priority)
  ON CONFLICT ON CONSTRAINT menu_import_jobs_one_active_per_restaurant DO NOTHING
  RETURNING menu_import_jobs.id INTO v_new_id;

  IF v_new_id IS NOT NULL THEN
    RETURN QUERY SELECT v_new_id, 'pending'::TEXT, true;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT mij.id, mij.status, false
  FROM menu_import_jobs mij
  WHERE mij.restaurant_id = p_restaurant_id
    AND mij.status IN ('pending', 'processing')
  LIMIT 1;
END;
$$;

-- 5. RPC: get_menu_import_status
CREATE OR REPLACE FUNCTION get_menu_import_status(
  p_restaurant_id UUID
)
RETURNS TABLE (
  job_status TEXT,
  job_dishes_found INT,
  job_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT mij.status, mij.dishes_found, mij.created_at
  FROM menu_import_jobs mij
  WHERE mij.restaurant_id = p_restaurant_id
  ORDER BY
    CASE WHEN mij.status IN ('pending', 'processing') THEN 0 ELSE 1 END,
    mij.created_at DESC
  LIMIT 1;
END;
$$;

-- 6. RPC: atomic dequeue with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION claim_menu_import_jobs(p_limit INT DEFAULT 5)
RETURNS SETOF menu_import_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE menu_import_jobs
  SET
    status = 'processing',
    started_at = now(),
    lock_expires_at = now() + interval '5 minutes',
    updated_at = now()
  WHERE id IN (
    SELECT mij.id FROM menu_import_jobs mij
    WHERE mij.status = 'pending' AND mij.run_after <= now()
    ORDER BY mij.priority DESC, mij.run_after, mij.created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- 7. Enable pg_net for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 8. Cron: process queue every 60 seconds
SELECT cron.schedule(
  'process-menu-import-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/menu-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{"mode": "queue"}'::jsonb
  );
  $$
);

-- 9. Remove old biweekly menu refresh cron (replaced by job queue)
SELECT cron.unschedule('biweekly-menu-refresh');

-- 10. Cron: create refresh jobs for stale menus (daily at 3 AM)
SELECT cron.schedule(
  'create-menu-refresh-jobs',
  '0 3 * * *',
  $$
  INSERT INTO menu_import_jobs (restaurant_id, job_type, priority)
  SELECT r.id, 'refresh', 0
  FROM restaurants r
  WHERE r.is_open = true
    AND r.menu_url IS NOT NULL
    AND (r.menu_last_checked IS NULL OR r.menu_last_checked < NOW() - INTERVAL '14 days')
    AND NOT EXISTS (
      SELECT 1 FROM menu_import_jobs mij
      WHERE mij.restaurant_id = r.id
        AND mij.status IN ('pending', 'processing')
    )
    AND NOT EXISTS (
      SELECT 1 FROM menu_import_jobs mij
      WHERE mij.restaurant_id = r.id
        AND mij.status = 'dead'
        AND mij.created_at > NOW() - INTERVAL '30 days'
    )
  $$
);
