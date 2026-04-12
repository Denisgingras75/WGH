-- Extend menu_import_jobs lock from 5 to 10 minutes, reduce batch from 5 to 3
-- Rendering with Browserless adds 10-30s per job; safer to overshoot the lock
-- than have a worker crash mid-render and stall jobs for 5 more minutes.

CREATE OR REPLACE FUNCTION claim_menu_import_jobs(p_limit INT DEFAULT 3)
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
    lock_expires_at = now() + interval '10 minutes',
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
