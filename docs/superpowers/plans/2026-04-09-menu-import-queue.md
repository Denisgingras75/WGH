# Menu Import Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fire-and-forget menu import pipeline with a job queue that tracks status, retries failures, classifies errors, and gives users warm feedback.

**Architecture:** A `menu_import_jobs` Supabase table acts as a durable job queue. The existing `menu-refresh` Edge Function gains a queue-processing mode that atomically claims and processes jobs. Two RPCs provide client access (enqueue + status). A new React hook polls status, and a component shows warm messaging on the restaurant page.

**Tech Stack:** Supabase (Postgres, Edge Functions, pg_cron), React 19, React Query, Vitest

**Spec:** `docs/superpowers/specs/2026-04-08-menu-import-queue-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/add-menu-import-queue.sql` | Create | Migration: table, indexes, RLS, RPCs, cron |
| `supabase/schema.sql` | Modify (append) | Source of truth: add table + RPCs |
| `supabase/functions/menu-refresh/index.ts` | Modify | Add queue mode, error classification, Sonnet model, atomic dequeue |
| `src/api/menuImportApi.js` | Create | Client API: enqueue + status RPCs |
| `src/api/index.js` | Modify | Barrel export: add menuImportApi |
| `src/hooks/useMenuImportStatus.js` | Create | React Query hook with conditional polling |
| `src/components/restaurants/MenuImportStatus.jsx` | Create | Warm status messaging component |
| `src/components/restaurants/index.js` | Modify | Barrel export: add MenuImportStatus |
| `src/components/AddRestaurantModal.jsx` | Modify | Switch from refreshMenu to createJob |
| `src/pages/RestaurantDetail.jsx` | Modify | Show MenuImportStatus when no dishes |
| `src/api/menuImportApi.test.js` | Create | Unit tests for API module |
| `src/hooks/useMenuImportStatus.test.js` | Create | Unit tests for hook |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/add-menu-import-queue.sql`
- Modify: `supabase/schema.sql` (append after line ~2074, after existing cron jobs)

- [ ] **Step 1: Write the migration file**

```sql
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
  -- Try insert first — ON CONFLICT handles the race condition
  INSERT INTO menu_import_jobs (restaurant_id, job_type, priority)
  VALUES (p_restaurant_id, p_job_type, p_priority)
  ON CONFLICT ON CONSTRAINT menu_import_jobs_one_active_per_restaurant DO NOTHING
  RETURNING menu_import_jobs.id INTO v_new_id;

  IF v_new_id IS NOT NULL THEN
    RETURN QUERY SELECT v_new_id, 'pending'::TEXT, true;
    RETURN;
  END IF;

  -- Insert was a no-op — return the existing active job
  RETURN QUERY
  SELECT mij.id, mij.status, false
  FROM menu_import_jobs mij
  WHERE mij.restaurant_id = p_restaurant_id
    AND mij.status IN ('pending', 'processing')
  LIMIT 1;
END;
$$;

-- Note: ON CONFLICT with partial unique indexes requires naming the constraint.
-- The unique index is named menu_import_jobs_one_active_per_restaurant.
-- If ON CONFLICT ON CONSTRAINT doesn't work with a partial unique index,
-- use this alternative approach instead:
--
--   BEGIN
--     INSERT INTO menu_import_jobs (...) VALUES (...) RETURNING id INTO v_new_id;
--     RETURN QUERY SELECT v_new_id, 'pending'::TEXT, true;
--   EXCEPTION WHEN unique_violation THEN
--     RETURN QUERY SELECT mij.id, mij.status, false
--     FROM menu_import_jobs mij WHERE ...;
--   END;

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
  -- Return active job if exists, otherwise latest terminal job
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
-- Uses vault.decrypted_secrets to match existing cron pattern (see 20260216120000_enable_scraper_cron.sql)
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
    -- No active job
    AND NOT EXISTS (
      SELECT 1 FROM menu_import_jobs mij
      WHERE mij.restaurant_id = r.id
        AND mij.status IN ('pending', 'processing')
    )
    -- No recent dead job (30-day cooldown)
    AND NOT EXISTS (
      SELECT 1 FROM menu_import_jobs mij
      WHERE mij.restaurant_id = r.id
        AND mij.status = 'dead'
        AND mij.created_at > NOW() - INTERVAL '30 days'
    )
  $$
);
```

- [ ] **Step 2: Append table and RPCs to schema.sql**

Add the table definition, indexes, RLS, both RPCs, and both cron jobs to `supabase/schema.sql` after the existing cron jobs section (after line ~2074). This keeps `schema.sql` as the single source of truth.

- [ ] **Step 3: Run migration in Supabase SQL Editor**

Run `supabase/migrations/add-menu-import-queue.sql` in the Supabase SQL Editor. Verify:

```sql
-- Table exists
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'menu_import_jobs' ORDER BY ordinal_position;

-- Indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'menu_import_jobs';

-- RPCs exist
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('enqueue_menu_import', 'get_menu_import_status', 'claim_menu_import_jobs');

-- Cron jobs exist
SELECT jobname, schedule FROM cron.job
WHERE jobname IN ('process-menu-import-queue', 'create-menu-refresh-jobs');
```

- [ ] **Step 4: Test RPCs manually**

Pick any existing restaurant ID and test:

```sql
-- Test enqueue (should return is_new = true)
SELECT * FROM enqueue_menu_import('RESTAURANT_UUID_HERE');

-- Test enqueue again (should return is_new = false, same job_id)
SELECT * FROM enqueue_menu_import('RESTAURANT_UUID_HERE');

-- Test status
SELECT * FROM get_menu_import_status('RESTAURANT_UUID_HERE');

-- Cleanup test data
DELETE FROM menu_import_jobs WHERE restaurant_id = 'RESTAURANT_UUID_HERE';
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/add-menu-import-queue.sql supabase/schema.sql
git commit -m "feat: add menu_import_jobs table, RPCs, and cron jobs

Job queue for menu imports with retry, error classification,
and crash recovery. Replaces fire-and-forget pipeline."
```

---

### Task 2: Client API Module

**Files:**
- Create: `src/api/menuImportApi.js`
- Create: `src/api/menuImportApi.test.js`
- Modify: `src/api/index.js` (add export)

- [ ] **Step 1: Write the failing test**

Create `src/api/menuImportApi.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { menuImportApi } from './menuImportApi'

describe('menuImportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createJob', () => {
    it('calls enqueue_menu_import RPC with correct params', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_id: 'job-123', job_status: 'pending', is_new: true }],
        error: null,
      })

      const result = await menuImportApi.createJob('rest-456', 'initial')

      expect(supabase.rpc).toHaveBeenCalledWith('enqueue_menu_import', {
        p_restaurant_id: 'rest-456',
        p_job_type: 'initial',
        p_priority: 10,
      })
      expect(result).toEqual({ job_id: 'job-123', job_status: 'pending', is_new: true })
    })

    it('uses priority 0 for refresh jobs', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_id: 'job-789', job_status: 'pending', is_new: true }],
        error: null,
      })

      await menuImportApi.createJob('rest-456', 'refresh')

      expect(supabase.rpc).toHaveBeenCalledWith('enqueue_menu_import', {
        p_restaurant_id: 'rest-456',
        p_job_type: 'refresh',
        p_priority: 0,
      })
    })

    it('returns existing job when duplicate', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_id: 'existing-job', job_status: 'processing', is_new: false }],
        error: null,
      })

      const result = await menuImportApi.createJob('rest-456')
      expect(result.is_new).toBe(false)
      expect(result.job_status).toBe('processing')
    })

    it('throws classified error on RPC failure', async () => {
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'connection refused' },
      })

      await expect(menuImportApi.createJob('rest-456')).rejects.toThrow()
    })
  })

  describe('getJobStatus', () => {
    it('calls get_menu_import_status RPC', async () => {
      supabase.rpc.mockResolvedValue({
        data: [{ job_status: 'completed', job_dishes_found: 12, job_created_at: '2026-04-09T00:00:00Z' }],
        error: null,
      })

      const result = await menuImportApi.getJobStatus('rest-456')

      expect(supabase.rpc).toHaveBeenCalledWith('get_menu_import_status', {
        p_restaurant_id: 'rest-456',
      })
      expect(result).toEqual({
        status: 'completed',
        dishesFound: 12,
        createdAt: '2026-04-09T00:00:00Z',
      })
    })

    it('returns null when no job exists', async () => {
      supabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await menuImportApi.getJobStatus('rest-456')
      expect(result).toBeNull()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/menuImportApi.test.js`
Expected: FAIL — `menuImportApi` module does not exist

- [ ] **Step 3: Write the implementation**

Create `src/api/menuImportApi.js`:

```js
import { supabase } from '../lib/supabase'
import { createClassifiedError } from '../utils/errorHandler'
import { logger } from '../utils/logger'

const JOB_PRIORITY = {
  initial: 10,
  manual: 10,
  refresh: 0,
}

export const menuImportApi = {
  /**
   * Enqueue a menu import job. Idempotent — returns existing active job if one exists.
   */
  async createJob(restaurantId, jobType = 'initial') {
    try {
      const { data, error } = await supabase.rpc('enqueue_menu_import', {
        p_restaurant_id: restaurantId,
        p_job_type: jobType,
        p_priority: JOB_PRIORITY[jobType] ?? 0,
      })
      if (error) throw createClassifiedError(error)
      const row = data?.[0]
      if (!row) throw new Error('No response from enqueue RPC')
      return {
        job_id: row.job_id,
        job_status: row.job_status,
        is_new: row.is_new,
      }
    } catch (error) {
      logger.error('Menu import enqueue failed:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Get the latest import job status for a restaurant.
   * Returns null if no job exists.
   */
  async getJobStatus(restaurantId) {
    try {
      const { data, error } = await supabase.rpc('get_menu_import_status', {
        p_restaurant_id: restaurantId,
      })
      if (error) throw createClassifiedError(error)
      const row = data?.[0]
      if (!row) return null
      return {
        status: row.job_status,
        dishesFound: row.job_dishes_found,
        createdAt: row.job_created_at,
      }
    } catch (error) {
      logger.error('Menu import status check failed:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/api/menuImportApi.test.js`
Expected: All 6 tests PASS

- [ ] **Step 5: Add to barrel export**

Add to `src/api/index.js`:

```js
export { menuImportApi } from './menuImportApi'
```

- [ ] **Step 6: Commit**

```bash
git add src/api/menuImportApi.js src/api/menuImportApi.test.js src/api/index.js
git commit -m "feat: add menuImportApi — enqueue and status RPCs"
```

---

### Task 3: useMenuImportStatus Hook

**Files:**
- Create: `src/hooks/useMenuImportStatus.js`
- Create: `src/hooks/useMenuImportStatus.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useMenuImportStatus.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('../api/menuImportApi', () => ({
  menuImportApi: {
    getJobStatus: vi.fn(),
  },
}))

import { menuImportApi } from '../api/menuImportApi'
import { useMenuImportStatus } from './useMenuImportStatus'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useMenuImportStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null status when no job exists', async () => {
    menuImportApi.getJobStatus.mockResolvedValue(null)

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBeNull()
    expect(result.current.isImporting).toBe(false)
    expect(result.current.hasFailed).toBe(false)
  })

  it('returns importing state for pending jobs', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'pending',
      dishesFound: null,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('pending')
    expect(result.current.isImporting).toBe(true)
    expect(result.current.hasFailed).toBe(false)
  })

  it('returns importing state for processing jobs', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'processing',
      dishesFound: null,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isImporting).toBe(true)
  })

  it('returns completed state with dish count', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'completed',
      dishesFound: 15,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('completed')
    expect(result.current.dishesFound).toBe(15)
    expect(result.current.isImporting).toBe(false)
  })

  it('returns failed state for dead jobs', async () => {
    menuImportApi.getJobStatus.mockResolvedValue({
      status: 'dead',
      dishesFound: null,
      createdAt: '2026-04-09T00:00:00Z',
    })

    const { result } = renderHook(
      () => useMenuImportStatus('rest-123'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasFailed).toBe(true)
    expect(result.current.isImporting).toBe(false)
  })

  it('does not query when restaurantId is null', () => {
    menuImportApi.getJobStatus.mockResolvedValue(null)

    renderHook(
      () => useMenuImportStatus(null),
      { wrapper: createWrapper() }
    )

    expect(menuImportApi.getJobStatus).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/hooks/useMenuImportStatus.test.js`
Expected: FAIL — module does not exist

- [ ] **Step 3: Write the implementation**

Create `src/hooks/useMenuImportStatus.js`:

```js
import { useQuery } from '@tanstack/react-query'
import { menuImportApi } from '../api/menuImportApi'

const ACTIVE_STATUSES = ['pending', 'processing']
const POLL_INTERVAL = 5000

export function useMenuImportStatus(restaurantId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['menuImportStatus', restaurantId],
    queryFn: () => menuImportApi.getJobStatus(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && ACTIVE_STATUSES.includes(status)) return POLL_INTERVAL
      return false
    },
    staleTime: 2000,
  })

  const status = data?.status ?? null
  const isImporting = status !== null && ACTIVE_STATUSES.includes(status)
  const hasFailed = status === 'dead'

  return {
    status,
    dishesFound: data?.dishesFound ?? null,
    createdAt: data?.createdAt ?? null,
    isImporting,
    hasFailed,
    loading: isLoading,
    error,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/hooks/useMenuImportStatus.test.js`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMenuImportStatus.js src/hooks/useMenuImportStatus.test.js
git commit -m "feat: add useMenuImportStatus hook with conditional polling"
```

---

### Task 4: MenuImportStatus Component

**Files:**
- Create: `src/components/restaurants/MenuImportStatus.jsx`
- Modify: `src/components/restaurants/index.js` (add export)

- [ ] **Step 1: Write the component**

Create `src/components/restaurants/MenuImportStatus.jsx`:

```jsx
import { useMenuImportStatus } from '../../hooks/useMenuImportStatus'

const headingStyle = {
  fontFamily: "'Amatic SC', cursive",
  fontWeight: 700,
  fontSize: '24px',
  color: 'var(--color-text-primary)',
  marginBottom: '8px',
}

export function MenuImportStatus({ restaurantId, dishCount }) {
  const { status, isImporting, hasFailed, loading } = useMenuImportStatus(restaurantId)

  // Only show when there are no dishes to display
  if (loading || dishCount > 0) return null

  // No job exists and no dishes — shouldn't normally happen, but handle gracefully
  if (status === null) return null

  // Completed with dishes — they should be showing, don't render anything
  if (status === 'completed' && dishCount > 0) return null

  return (
    <div
      style={{
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      {isImporting && (
        <>
          <p style={headingStyle}>Thanks for adding this restaurant!</p>
          <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
            We're getting the menu ready — check back in a moment.
          </p>
        </>
      )}
      {status === 'completed' && dishCount === 0 && (
        <>
          <p style={headingStyle}>Menu coming soon</p>
          <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
            We couldn't find the menu yet — our team is working on it.
          </p>
        </>
      )}
      {hasFailed && (
        <>
          <p style={headingStyle}>Menu coming soon</p>
          <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
            We're working on getting this menu — check back soon.
          </p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add to barrel export**

Add to `src/components/restaurants/index.js`:

```js
export { MenuImportStatus } from './MenuImportStatus'
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/restaurants/MenuImportStatus.jsx src/components/restaurants/index.js
git commit -m "feat: add MenuImportStatus component — warm messaging for import states"
```

---

### Task 5: Wire Up AddRestaurantModal

**Files:**
- Modify: `src/components/AddRestaurantModal.jsx` (lines ~186 and ~278)

- [ ] **Step 1: Add import**

At the top of `src/components/AddRestaurantModal.jsx`, add:

```js
import { menuImportApi } from '../api'
```

- [ ] **Step 2: Replace refreshMenu call at line ~186**

Find the first `restaurantsApi.refreshMenu(restaurant.id)` call (in the Google Places autocomplete success handler, around line 186).

Replace:

```js
restaurantsApi.refreshMenu(restaurant.id)
```

With:

```js
menuImportApi.createJob(restaurant.id, 'initial').catch(() => {})
```

- [ ] **Step 3: Replace refreshMenu call at line ~278**

Find the second `restaurantsApi.refreshMenu(restaurant.id)` call (in the manual creation form handler, around line 278).

Replace:

```js
restaurantsApi.refreshMenu(restaurant.id)
```

With:

```js
menuImportApi.createJob(restaurant.id, 'initial').catch(() => {})
```

Both calls remain fire-and-forget (`.catch(() => {})`) because the restaurant is already created — the job queue handles the rest. The user navigates to the restaurant page which shows `MenuImportStatus`.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/AddRestaurantModal.jsx
git commit -m "feat: switch AddRestaurantModal to job queue enqueue"
```

---

### Task 6: Wire Up RestaurantDetail Page

**Files:**
- Modify: `src/pages/RestaurantDetail.jsx`

- [ ] **Step 1: Add imports**

At the top of `src/pages/RestaurantDetail.jsx`, add:

```js
import { MenuImportStatus } from '../components/restaurants'
```

- [ ] **Step 2: Add MenuImportStatus to the render + dish cache invalidation**

Add imports at top of file:

```js
import { MenuImportStatus } from '../components/restaurants'
import { useMenuImportStatus } from '../hooks/useMenuImportStatus'
import { useQueryClient } from '@tanstack/react-query'
```

Inside the component, after the existing hooks, add:

```js
const queryClient = useQueryClient()
const { status: importStatus } = useMenuImportStatus(restaurantId)

// When import completes, refetch dishes so they appear without manual refresh
const prevImportStatus = React.useRef(importStatus)
React.useEffect(() => {
  if (prevImportStatus.current === 'processing' && importStatus === 'completed') {
    refetch()
  }
  prevImportStatus.current = importStatus
}, [importStatus, refetch])
```

Find where dishes are rendered. Add the `MenuImportStatus` component **before** the dishes list/menu, replacing (not duplicating) any existing empty state for zero dishes:

```jsx
{!dishesLoading && (
  <MenuImportStatus restaurantId={restaurantId} dishCount={dishes?.length ?? 0} />
)}
```

When `MenuImportStatus` renders (because `dishCount === 0` and a job exists), hide the existing empty-state messaging from `RestaurantDishes`/`RestaurantMenu` to avoid duplicate messages. The simplest approach: only render the dishes/menu components when `dishes.length > 0` OR when there's no active import job.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Manual test**

1. Open the app locally (`npm run dev`)
2. Navigate to a restaurant with dishes — `MenuImportStatus` should NOT appear
3. Add a new restaurant via `AddRestaurantModal` — navigate to it
4. `MenuImportStatus` should show "Thanks for adding this restaurant!" while no dishes exist
5. Once dishes are imported (or if the Edge Function processes the job), the message disappears

- [ ] **Step 5: Commit**

```bash
git add src/pages/RestaurantDetail.jsx
git commit -m "feat: show warm import status on restaurant page when no dishes"
```

---

### Task 7: Update menu-refresh Edge Function

**Files:**
- Modify: `supabase/functions/menu-refresh/index.ts`

This is the largest task. The Edge Function gets a new `queue` mode alongside the existing modes.

- [ ] **Step 1: Add error classification helper**

Add after the existing helper functions (after `hashContent`, around line 254):

```ts
type ErrorCode = 'no_menu_url' | 'fetch_timeout' | 'fetch_error' | 'claude_error' | 'parse_error' | 'no_dishes' | 'page_too_short'

function classifyError(error: unknown, context?: string): { code: ErrorCode; message: string; context: Record<string, unknown> } {
  const message = error instanceof Error ? error.message : String(error)

  if (context === 'no_menu_url') {
    return { code: 'no_menu_url', message: 'No menu URL found', context: {} }
  }
  if (context === 'no_dishes') {
    return { code: 'no_dishes', message: 'No dishes extracted from content', context: {} }
  }
  if (context === 'page_too_short') {
    return { code: 'page_too_short', message: 'Page content too short (<50 chars)', context: {} }
  }
  if (message.includes('abort') || message.includes('timeout')) {
    return { code: 'fetch_timeout', message, context: {} }
  }
  if (message.includes('HTTP ')) {
    const statusMatch = message.match(/HTTP (\d+)/)
    return { code: 'fetch_error', message, context: { http_status: statusMatch?.[1] } }
  }
  if (message.includes('Claude API error')) {
    return { code: 'claude_error', message, context: {} }
  }
  if (message.includes('JSON') || message.includes('parse')) {
    return { code: 'parse_error', message, context: {} }
  }
  return { code: 'claude_error', message, context: {} }
}

function calculateBackoff(attemptCount: number): Date {
  // 5 min, 30 min (5 * 6^(n-1) minutes)
  const minutes = 5 * Math.pow(6, attemptCount - 1)
  const backoff = new Date()
  backoff.setMinutes(backoff.getMinutes() + minutes)
  return backoff
}
```

- [ ] **Step 2: Upgrade Claude model to Sonnet**

In the `extractMenuWithClaude` function (around line 336), change:

```ts
model: 'claude-haiku-4-5-20251001',
```

To:

```ts
model: 'claude-sonnet-4-6-20260409',
```

Note: Use whatever the current Sonnet model ID is when implementing. Check the Anthropic API docs for the latest `claude-sonnet-*` model string.

- [ ] **Step 3: Add queue processing mode**

Inside the `serve()` handler, after the body is parsed (around line 480), add the queue mode handler before the existing `if (body.restaurant_id)` block:

```ts
if (body.mode === 'queue') {
  // --- Recovery pass: reset stalled jobs ---
  const { data: stalledJobs } = await supabase
    .from('menu_import_jobs')
    .select('id, attempt_count, max_attempts')
    .eq('status', 'processing')
    .lt('lock_expires_at', new Date().toISOString())

  for (const stalled of (stalledJobs || [])) {
    const newAttemptCount = stalled.attempt_count + 1
    if (newAttemptCount >= stalled.max_attempts) {
      await supabase
        .from('menu_import_jobs')
        .update({
          status: 'dead',
          attempt_count: newAttemptCount,
          error_message: 'Worker crashed or timed out',
          error_code: 'fetch_timeout',
          updated_at: new Date().toISOString(),
        })
        .eq('id', stalled.id)
    } else {
      await supabase
        .from('menu_import_jobs')
        .update({
          status: 'pending',
          attempt_count: newAttemptCount,
          run_after: new Date().toISOString(),
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stalled.id)
    }
  }

  // --- Atomic dequeue ---
  const { data: jobs, error: dequeueErr } = await supabase.rpc('claim_menu_import_jobs', { p_limit: 5 })

  if (dequeueErr || !jobs || jobs.length === 0) {
    return new Response(JSON.stringify({
      message: jobs?.length === 0 ? 'No jobs to process' : 'Dequeue error',
      recovered: stalledJobs?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results = []

  for (const job of jobs) {
    try {
      // Fetch restaurant data
      const { data: restaurant, error: restErr } = await supabase
        .from('restaurants')
        .select('id, name, address, menu_url, website_url, google_place_id, menu_content_hash')
        .eq('id', job.restaurant_id)
        .single()

      if (restErr || !restaurant) {
        await supabase.from('menu_import_jobs').update({
          status: 'dead',
          error_code: 'fetch_error',
          error_message: 'Restaurant not found',
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'error', reason: 'restaurant not found' })
        continue
      }

      let menuUrl = restaurant.menu_url
      let websiteUrl = restaurant.website_url
      const dbUpdates: Record<string, unknown> = {}

      // Auto-discover URL if missing
      if (!websiteUrl && !menuUrl) {
        const googleResult = await findWebsiteViaGoogle(restaurant.name, restaurant.address || '')
        if (googleResult.websiteUrl) {
          websiteUrl = googleResult.websiteUrl
          dbUpdates.website_url = websiteUrl
        }
        if (googleResult.googlePlaceId && !restaurant.google_place_id) {
          dbUpdates.google_place_id = googleResult.googlePlaceId
        }
      }

      if (!menuUrl && websiteUrl) {
        const found = await findMenuUrl(websiteUrl)
        if (found) {
          menuUrl = found
          dbUpdates.menu_url = menuUrl
        }
      }

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('restaurants').update(dbUpdates).eq('id', restaurant.id)
      }

      if (!menuUrl) {
        const classified = classifyError(null, 'no_menu_url')
        const newAttemptCount = job.attempt_count + 1
        await supabase.from('menu_import_jobs').update({
          status: newAttemptCount >= job.max_attempts ? 'dead' : 'pending',
          attempt_count: newAttemptCount,
          run_after: newAttemptCount >= job.max_attempts ? undefined : calculateBackoff(newAttemptCount).toISOString(),
          error_code: classified.code,
          error_message: classified.message,
          error_context: { website_discovered: websiteUrl },
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'no_menu_url', restaurant: restaurant.name })
        continue
      }

      // Fetch content
      const content = await fetchMenuContent(menuUrl)

      if (content.length < 50) {
        const classified = classifyError(null, 'page_too_short')
        const newAttemptCount = job.attempt_count + 1
        await supabase.from('menu_import_jobs').update({
          status: newAttemptCount >= job.max_attempts ? 'dead' : 'pending',
          attempt_count: newAttemptCount,
          run_after: newAttemptCount >= job.max_attempts ? undefined : calculateBackoff(newAttemptCount).toISOString(),
          error_code: classified.code,
          error_message: classified.message,
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'page_too_short', restaurant: restaurant.name })
        continue
      }

      // Content hash — skip if unchanged
      const contentHash = await hashContent(content)
      if (restaurant.menu_content_hash && restaurant.menu_content_hash === contentHash) {
        await supabase.from('restaurants').update({ menu_last_checked: new Date().toISOString() }).eq('id', restaurant.id)
        await supabase.from('menu_import_jobs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          dishes_found: 0,
          dishes_inserted: 0,
          dishes_updated: 0,
          dishes_unchanged: 0,
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'unchanged', restaurant: restaurant.name })
        continue
      }

      // Closed detection
      const closedSignal = detectClosed(content)
      if (closedSignal) {
        await supabase.from('restaurants').update({
          is_open: false,
          menu_last_checked: new Date().toISOString(),
        }).eq('id', restaurant.id)

        // refresh jobs skip closed restaurants; initial/manual still extract
        if (job.job_type === 'refresh') {
          await supabase.from('menu_import_jobs').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_message: `Closed: ${closedSignal}`,
            lock_expires_at: null,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id)
          results.push({ job_id: job.id, status: 'closed', restaurant: restaurant.name })
          continue
        }
      }

      // Extract with Claude Sonnet
      const extracted = await extractMenuWithClaude(content, restaurant.name)

      if (extracted.dishes.length === 0) {
        const classified = classifyError(null, 'no_dishes')
        const newAttemptCount = job.attempt_count + 1
        await supabase.from('menu_import_jobs').update({
          status: newAttemptCount >= job.max_attempts ? 'dead' : 'pending',
          attempt_count: newAttemptCount,
          run_after: newAttemptCount >= job.max_attempts ? undefined : calculateBackoff(newAttemptCount).toISOString(),
          error_code: classified.code,
          error_message: classified.message,
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'no_dishes', restaurant: restaurant.name })
        continue
      }

      // Upsert dishes
      const stats = await upsertDishes(supabase, restaurant.id, extracted)

      // Mark success
      await supabase.from('restaurants').update({
        menu_last_checked: new Date().toISOString(),
        menu_content_hash: contentHash,
      }).eq('id', restaurant.id)

      await supabase.from('menu_import_jobs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        dishes_found: extracted.dishes.length,
        dishes_inserted: stats.inserted,
        dishes_updated: stats.updated,
        dishes_unchanged: stats.unchanged,
        lock_expires_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id)

      results.push({
        job_id: job.id,
        status: 'success',
        restaurant: restaurant.name,
        dishes: extracted.dishes.length,
        inserted: stats.inserted,
        updated: stats.updated,
      })

    } catch (err) {
      console.error(`Job ${job.id} failed:`, err)
      const classified = classifyError(err)
      const newAttemptCount = job.attempt_count + 1

      await supabase.from('menu_import_jobs').update({
        status: newAttemptCount >= job.max_attempts ? 'dead' : 'pending',
        attempt_count: newAttemptCount,
        run_after: newAttemptCount >= job.max_attempts ? undefined : calculateBackoff(newAttemptCount).toISOString(),
        error_code: classified.code,
        error_message: classified.message,
        error_context: classified.context,
        lock_expires_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id)

      results.push({ job_id: job.id, status: 'error', error: classified.code })
    }

    // Rate limit between jobs
    if (jobs.length > 1) await sleep(2000)
  }

  return new Response(JSON.stringify({
    processed: jobs.length,
    recovered: stalledJobs?.length || 0,
    results,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 4: Add backward compatibility bridge**

Note: `claim_menu_import_jobs` RPC is already deployed as part of Task 1's migration.

In the existing `if (body.restaurant_id)` block, replace the direct processing with job creation:

```ts
if (body.restaurant_id) {
  // Backward compatibility: create a job and return immediately
  const { data, error } = await supabase.rpc('enqueue_menu_import', {
    p_restaurant_id: body.restaurant_id as string,
    p_job_type: 'initial',
    p_priority: 10,
  })
  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to enqueue job', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({
    message: 'Job enqueued',
    job: data?.[0],
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 5: Deploy Edge Function**

```bash
supabase functions deploy menu-refresh --project-ref vpioftosgdkyiwvhxewy
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/menu-refresh/index.ts supabase/migrations/add-menu-import-queue.sql supabase/schema.sql
git commit -m "feat: add queue processing mode to menu-refresh Edge Function

Atomic dequeue with FOR UPDATE SKIP LOCKED, error classification,
exponential backoff, crash recovery, Sonnet model upgrade."
```

---

### Task 8: End-to-End Verification

- [ ] **Step 1: Run full test suite**

```bash
npm run build && npm run test
```

Expected: Build succeeds, all tests pass (existing + new)

- [ ] **Step 2: Test the full flow locally**

1. Start dev server: `npm run dev`
2. Open app, go to Restaurants page
3. Add a new restaurant via Google Places search
4. Navigate to the restaurant page
5. Verify "Thanks for adding this restaurant!" message appears
6. Wait for cron to process (or manually invoke Edge Function)
7. Refresh — dishes should appear, status message gone

- [ ] **Step 3: Test error recovery**

In Supabase SQL Editor, simulate a stalled job:

```sql
-- Insert a fake stalled job
INSERT INTO menu_import_jobs (restaurant_id, status, lock_expires_at, run_after)
VALUES ('EXISTING_RESTAURANT_UUID', 'processing', now() - interval '10 minutes', now());

-- Wait for next cron cycle (60s), then check:
SELECT id, status, attempt_count FROM menu_import_jobs
WHERE restaurant_id = 'EXISTING_RESTAURANT_UUID';
-- Should show status = 'pending', attempt_count = 1

-- Cleanup
DELETE FROM menu_import_jobs WHERE restaurant_id = 'EXISTING_RESTAURANT_UUID';
```

- [ ] **Step 4: Test idempotent enqueue**

In browser console or via Supabase:

```sql
-- First enqueue
SELECT * FROM enqueue_menu_import('EXISTING_RESTAURANT_UUID');
-- is_new = true

-- Second enqueue (should return existing)
SELECT * FROM enqueue_menu_import('EXISTING_RESTAURANT_UUID');
-- is_new = false, same job_id

-- Cleanup
DELETE FROM menu_import_jobs WHERE restaurant_id = 'EXISTING_RESTAURANT_UUID';
```

- [ ] **Step 5: Verify cron jobs are running**

```sql
-- Check cron job status
SELECT jobname, schedule, active FROM cron.job
WHERE jobname IN ('process-menu-import-queue', 'create-menu-refresh-jobs');

-- Check recent cron executions
SELECT jobname, status, return_message, start_time
FROM cron.job_run_details
WHERE jobname = 'process-menu-import-queue'
ORDER BY start_time DESC
LIMIT 5;
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: verify menu import queue end-to-end"
```

---

## Summary

| Task | What | Files | Est. |
|------|------|-------|------|
| 1 | Database migration | schema.sql, migration SQL | 15 min |
| 2 | Client API module | menuImportApi.js + tests | 10 min |
| 3 | React hook | useMenuImportStatus.js + tests | 10 min |
| 4 | Status component | MenuImportStatus.jsx | 5 min |
| 5 | Wire AddRestaurantModal | AddRestaurantModal.jsx | 5 min |
| 6 | Wire RestaurantDetail | RestaurantDetail.jsx | 5 min |
| 7 | Edge Function queue mode | menu-refresh/index.ts | 30 min |
| 8 | End-to-end verification | Manual testing | 15 min |

**Total: ~8 tasks, ~95 minutes of implementation**
