# Menu Import Queue — Design Spec

**Date:** 2026-04-08
**Status:** Approved
**Author:** Dan + Claude

## Problem

The menu import pipeline is fire-and-forget with zero observability. When a user adds a restaurant (from anywhere in the world via Google Places), the `menu-refresh` Edge Function runs once. If it fails — timeout, no menu URL, Claude error — the restaurant sits empty with no retry, no status tracking, and no user feedback. The cron re-checks every 14 days, but doesn't distinguish "never succeeded" from "successfully refreshed."

At MV scale (34 curated restaurants), this was acceptable. At global scale (anyone can add any Google Places restaurant), it's a liability.

## Solution

**Layer 1 (this spec):** A Supabase job queue (`menu_import_jobs` table) that tracks every menu import, retries failures with exponential backoff, classifies errors, and provides status to the UI.

**Layer 2 (future):** A Managed Agent that handles the 5% of cases the queue can't solve (no menu URL, image-only menus, restaurant only on Instagram). Ships later, informed by real failure data from Layer 1.

## Architecture: Thin Queue Layer

Wrap the existing `menu-refresh` Edge Function with job lifecycle management. The core extraction logic (fetch website -> parse with Claude -> upsert dishes) stays unchanged. We add status tracking, retry logic, error classification, and a cron-based job processor around it.

### What stays the same

All proven functions in `menu-refresh/index.ts`:
- `findMenuUrl()` — probe website for menu paths
- `findWebsiteViaGoogle()` — Google Places text search for website
- `fetchMenuContent()` — HTML fetch + structured data extraction
- `extractMenuWithClaude()` — Claude Sonnet dish extraction
- `upsertDishes()` — safe upsert preserving votes/photos
- `detectClosed()` — closure signal detection
- `hashContent()` — content change detection

### What changes

- `extractMenuWithClaude()` upgraded from `claude-haiku-4-5-20251001` to Claude Sonnet (better parsing of complex/edge-case menus)
- `AddRestaurantModal` calls `enqueue_menu_import()` RPC instead of calling the Edge Function directly
- Edge Function reads from the job table instead of receiving `restaurant_id` in the POST body
- Error handling goes from "swallow and log" to "classify, store, and schedule retry"
- Batch cron (every 14 days) replaced by a job creator that scans for stale restaurants and creates `refresh` jobs

## Data Model

### `menu_import_jobs` table

```sql
CREATE TABLE menu_import_jobs (
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

-- Prevent duplicate active jobs per restaurant
CREATE UNIQUE INDEX menu_import_jobs_one_active_per_restaurant
  ON menu_import_jobs (restaurant_id)
  WHERE status IN ('pending', 'processing');

-- Dequeue: pick highest-priority ready jobs
CREATE INDEX menu_import_jobs_dequeue_idx
  ON menu_import_jobs (priority DESC, run_after, created_at)
  WHERE status = 'pending';

-- Crash recovery: find stalled processing jobs
CREATE INDEX menu_import_jobs_stalled_idx
  ON menu_import_jobs (lock_expires_at)
  WHERE status = 'processing';

-- Restaurant job history
CREATE INDEX menu_import_jobs_restaurant_history_idx
  ON menu_import_jobs (restaurant_id, created_at DESC);

-- RLS: service-role only (backend queue, not user-facing)
ALTER TABLE menu_import_jobs ENABLE ROW LEVEL SECURITY;
```

### Column reference

| Column | Purpose |
|--------|---------|
| `job_type` | `initial` (user added restaurant), `refresh` (periodic re-check), `manual` (admin trigger) |
| `status` | `pending` (waiting or retrying), `processing` (locked by worker), `completed` (success), `dead` (exhausted retries, future agent escalation point) |
| `priority` | `10` for user-triggered initial imports, `0` for background refreshes. Higher = processed first. |
| `run_after` | When job is eligible for processing. Handles both initial scheduling and retry backoff. |
| `lock_expires_at` | Set when job enters `processing`. If worker crashes, recovery pass resets expired locks to `pending`. |
| `error_code` | Classified failure reason (see Error Classification below). Informs future agent strategy. |
| `error_context` | JSONB with additional failure details (HTTP status, URL tried, Claude response snippet). |

### Status transitions

```
pending -> processing   (worker claims job atomically, sets lock_expires_at)
processing -> completed (success)
processing -> pending   (error, attempt_count < max_attempts — back to queue with backoff)
processing -> dead      (error, attempt_count >= max_attempts — exhausted)
processing -> pending   (lock expired — crash recovery, increments attempt_count)
```

Note: `failed` was removed. A retrying job is just `pending` with `attempt_count > 0`. This avoids a status that the client hook would need to handle but that never persists long enough to matter.

### Error classification

| Code | Meaning | Retry worthwhile? | Future agent strategy |
|------|---------|-------------------|----------------------|
| `no_menu_url` | No website or menu URL found | Maybe (Google may update) | Try Google reviews, delivery apps |
| `fetch_timeout` | Website didn't respond in 20s | Yes (transient) | Try at different time, cached version |
| `fetch_error` | HTTP error (403, 404, 500) | Depends on status code | Different user agent, alternate URLs |
| `claude_error` | Anthropic API failed | Yes (transient) | Just retry |
| `parse_error` | Claude returned unparseable output | Yes (non-deterministic) | Retry with different prompt framing |
| `no_dishes` | Claude found zero dishes in content | Maybe (could be image menu) | OCR, try different pages |
| `page_too_short` | Less than 50 chars of content | Maybe (SPA needing JS) | Headless browser rendering |

### Backoff schedule

| Attempt | Retry delay |
|---------|-------------|
| 1 fails | 5 minutes |
| 2 fails | 30 minutes |
| 3 fails | Marked `dead` |

Formula: `run_after = now() + (5 * 6^(attempt_count - 1)) minutes`

## Edge Function Changes

### New mode: queue processing

The `menu-refresh` Edge Function adds a `{ mode: "queue" }` entry point:

```
POST /menu-refresh { mode: "queue" }
  1. Recovery pass: reset stalled jobs
     - WHERE status = 'processing' AND lock_expires_at < now()
     - INCREMENT attempt_count (crash counts as an attempt)
     - If attempt_count >= max_attempts: SET status = 'dead'
     - Else: SET status = 'pending', run_after = now()
  2. Atomic dequeue: claim jobs in one query
     - UPDATE menu_import_jobs
       SET status = 'processing', started_at = now(),
           lock_expires_at = now() + interval '5 minutes'
       WHERE id IN (
         SELECT id FROM menu_import_jobs
         WHERE status = 'pending' AND run_after <= now()
         ORDER BY priority DESC, run_after, created_at
         LIMIT 5
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *
  3. For each claimed job:
     a. Run existing pipeline (discover URL -> fetch -> Claude Sonnet -> upsert)
     b. Closed restaurant handling:
        - initial/manual jobs: extract menu even if closed (seasonal restaurants)
        - refresh jobs: mark closed and skip extraction (save API cost)
     c. On success:
        - SET status = 'completed', completed_at, dishes_found/inserted/updated/unchanged
        - Update restaurant.menu_last_checked + menu_content_hash
     d. On failure:
        - Classify error -> error_code, error_message, error_context
        - Increment attempt_count
        - If attempt_count >= max_attempts: SET status = 'dead'
        - Else: SET status = 'pending', run_after = backoff(attempt_count)
```

### Backward compatibility

The existing `{ restaurant_id: "uuid" }` mode stays for backward compatibility during migration. It creates a job and returns immediately. The cron picks it up.

## Client-Side Changes

### New API module: `src/api/menuImportApi.js`

```js
menuImportApi = {
  createJob(restaurantId, jobType = 'initial')     // Calls enqueue_menu_import() RPC
  getJobStatus(restaurantId)                        // Calls get_menu_import_status() RPC
}
```

Both methods use `SECURITY DEFINER` RPCs since the table is service-role only.

### RPC: `enqueue_menu_import(p_restaurant_id UUID, p_job_type TEXT, p_priority INT)`

Idempotent: if an active job (`pending`/`processing`) already exists for this restaurant, returns the existing job's status instead of inserting a duplicate. Uses `ON CONFLICT DO NOTHING` against the partial unique index.

### New hook: `useMenuImportStatus(restaurantId)`

- Uses React Query with 5-second `refetchInterval` while status is `pending` or `processing`
- Stops polling once `completed` or `dead`
- Returns `{ status, dishesFound, isImporting, hasFailed }`

### AddRestaurantModal change

```diff
- restaurantsApi.refreshMenu(restaurant.id)
+ menuImportApi.createJob(restaurant.id, 'initial')  // calls enqueue_menu_import() RPC
```

### Restaurant page UX

| State | What user sees |
|-------|---------------|
| Job pending/processing, no dishes | "Thanks for adding this restaurant! We're getting the menu ready." |
| Job completed, 0 dishes | "We couldn't find the menu yet — our team is working on it." |
| Job dead | "We're working on getting this menu — check back soon." |
| Dishes loaded | Normal restaurant page. No pipeline mention. |

Messaging is warm and human. No technical language — no "importing," "processing," or "pipeline."

## Cron Jobs

### 1. Job processor (every 60 seconds)

```
POST /menu-refresh { mode: "queue" }
```

Picks up pending jobs, processes up to 5 per invocation. Includes recovery pass for stalled jobs.

### 2. Refresh job creator (daily at 3 AM)

Scans restaurants where `menu_last_checked` is older than 14 days, no active job exists (`pending`/`processing`), AND no `dead` job exists within the last 30 days for that restaurant. Creates `refresh` type jobs with `priority = 0`.

This prevents dead-letter restaurants from being re-enqueued daily. A restaurant that exhausted retries stays quiet for 30 days before trying again (menu URL may have been added/fixed by then).

Replaces the current batch mode in `menu-refresh` that directly selects stale restaurants.

## RLS Policy

`menu_import_jobs` is service-role only. No user-facing access. The `useMenuImportStatus` hook reads via an RPC function with `SECURITY DEFINER` that returns only the status fields for a given restaurant — no internal error details exposed to clients.

### RPC: `enqueue_menu_import(p_restaurant_id UUID, p_job_type TEXT DEFAULT 'initial', p_priority INT DEFAULT 10)`

`SECURITY DEFINER`. Inserts a new job if no active job exists for this restaurant. Idempotent — returns existing active job if one exists. Called from client via `menuImportApi.createJob()`.

### RPC: `get_menu_import_status(p_restaurant_id UUID)`

`SECURITY DEFINER`. Returns `{ status, dishes_found, created_at }`. Selection logic: returns the active job (`pending`/`processing`) if one exists, otherwise the most recent terminal job (`completed`/`dead`). Returns NULL if no job exists.

## Future: Agent Escalation (Layer 2)

Not built in this phase. The hook point is the `dead` status + `error_code` + `error_context`.

When added later:
- A cron scans for `dead` jobs with specific error codes
- Creates a Managed Agent task with failure context
- Agent tries harder approaches: different website pages, Google reviews for dish names, PDF/image OCR
- Agent scope: website + Google only (not Yelp/TripAdvisor/Instagram)
- Results flow back through the same `upsertDishes()` function
- Job status transitions from `dead` -> `completed`

## Files to create/modify

| File | Change |
|------|--------|
| `supabase/schema.sql` | Add `menu_import_jobs` table, indexes, RLS, RPC |
| `supabase/migrations/add-menu-import-queue.sql` | Migration to run in SQL Editor |
| `supabase/functions/menu-refresh/index.ts` | Add queue mode, error classification, lock management, Sonnet upgrade |
| `src/api/menuImportApi.js` | New API module |
| `src/api/index.js` | Export menuImportApi |
| `src/hooks/useMenuImportStatus.js` | New hook |
| `src/components/AddRestaurantModal.jsx` | Use menuImportApi.createJob instead of refreshMenu |
| `src/pages/RestaurantDetail.jsx` | Show import status when no dishes |
| `src/components/restaurants/MenuImportStatus.jsx` | New component for warm status messaging |

## Out of scope

- Agent layer (Layer 2) — ships later with real failure data
- Admin dashboard for job monitoring — use Supabase dashboard directly for now
- WebSocket/Realtime for live status — polling every 5s is sufficient
- Retry individual stages — the whole pipeline retries as a unit
