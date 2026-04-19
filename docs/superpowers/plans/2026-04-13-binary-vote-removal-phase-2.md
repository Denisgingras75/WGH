# Binary Vote Removal — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every Phase 1 compat shim that was left behind to protect stale PWA bundles — drop `p_would_order_again` from `submit_vote_atomic`, strip `yes_votes` / `percent_worth_it` / `would_order_again` from read RPC returns and the `public_votes` view, drop the `vote_submitted` analytics dual-emit, remove the `buildReviewSnippet` boolean dependency, and wire up the existing photo-prefill UI via `dishPhotosApi.getUserPhotoForDish`.

**Architecture:** Pure subtraction except for one small additive wire-up (photo prefetch in `Dish.jsx`). Two-phase DB cut from Phase 1 completes: schema removes all binary-derived returns and parameters; `votes.would_order_again` column stays for historical integrity but is never written, read, or projected going forward. Frontend stops dual-emitting analytics; analytics funnels key only on `rating_submitted`.

**Tech Stack:** Supabase Postgres (plpgsql), Deno Edge Functions (TypeScript), React 19 / Vite 7, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-13-binary-vote-removal-phase-2-design.md` — read this before starting.

**Base branch:** `feat/binary-vote-removal-phase-2` (already created; Phase 2 design spec committed as `cc78070`).

---

## File Structure

- Create: `supabase/migrations/2026-04-13-binary-vote-removal-phase-2.sql`
- Modify: `supabase/schema.sql`
- Modify: `supabase/README.md`
- Modify: `src/api/votesApi.js`
- Modify: `src/api/votesApi.test.js`
- Modify: `src/api/dishPhotosApi.js`
- Modify: `src/pages/Dish.jsx`
- Modify: `supabase/functions/seed-reviews/index.ts`

Eight files, 7 tasks (+ branch setup and verification tasks). Each task produces a self-contained commit.

---

## Task 0: Baseline verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm branch + clean state**

Run:
```bash
cd /Users/danielwalsh/.local/bin/whats-good-here
git branch --show-current
git status --short | head -20
```
Expected: on `feat/binary-vote-removal-phase-2`, clean working tree (untracked root files unrelated to this plan are fine and expected).

- [ ] **Step 2: Baseline tests + build**

Run:
```bash
npm run test -- --run 2>&1 | tail -3
npm run build 2>&1 | tail -3
```
Expected: tests 312/312 pass, build completes cleanly.

---

## Task 1: Write forward migration

**Files:**
- Create: `supabase/migrations/2026-04-13-binary-vote-removal-phase-2.sql`

- [ ] **Step 1: Create the migration file**

Write this file at `supabase/migrations/2026-04-13-binary-vote-removal-phase-2.sql`:

```sql
-- Binary Vote Removal — Phase 2
-- Design spec: docs/superpowers/specs/2026-04-13-binary-vote-removal-phase-2-design.md
--
-- Drops every Phase 1 compat shim:
--   1. submit_vote_atomic loses p_would_order_again parameter (8 → 7 args).
--   2. Read RPCs stop returning binary-derived fields.
--   3. public_votes view stops projecting would_order_again.
-- The votes.would_order_again column stays in the table for historical
-- integrity. It just stops being read, written, or projected anywhere.

-- ============================================================
-- 1. submit_vote_atomic: drop boolean param, stop writing the column
-- ============================================================

DROP FUNCTION IF EXISTS submit_vote_atomic(
  UUID, UUID, BOOLEAN, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT
);

CREATE OR REPLACE FUNCTION submit_vote_atomic(
  p_dish_id UUID,
  p_user_id UUID,
  p_rating_10 DECIMAL DEFAULT NULL,
  p_review_text TEXT DEFAULT NULL,
  p_purity_score DECIMAL DEFAULT NULL,
  p_war_score DECIMAL DEFAULT NULL,
  p_badge_hash TEXT DEFAULT NULL
)
RETURNS votes AS $$
DECLARE
  submitted_vote votes;
BEGIN
  IF auth.role() <> 'service_role' AND (select auth.uid()) IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_rating_10 IS NULL THEN
    RAISE EXCEPTION 'rating_10 is required';
  END IF;

  INSERT INTO votes (
    dish_id,
    user_id,
    rating_10,
    review_text,
    review_created_at,
    purity_score,
    war_score,
    badge_hash,
    source
  )
  VALUES (
    p_dish_id,
    p_user_id,
    p_rating_10,
    p_review_text,
    CASE WHEN p_review_text IS NOT NULL THEN NOW() ELSE NULL END,
    p_purity_score,
    p_war_score,
    p_badge_hash,
    'user'
  )
  ON CONFLICT (dish_id, user_id) WHERE source = 'user'
  DO UPDATE SET
    rating_10 = EXCLUDED.rating_10,
    review_text = COALESCE(EXCLUDED.review_text, votes.review_text),
    review_created_at = COALESCE(EXCLUDED.review_created_at, votes.review_created_at),
    purity_score = COALESCE(EXCLUDED.purity_score, votes.purity_score),
    war_score = COALESCE(EXCLUDED.war_score, votes.war_score),
    badge_hash = COALESCE(EXCLUDED.badge_hash, votes.badge_hash)
  RETURNING * INTO submitted_vote;

  RETURN submitted_vote;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION submit_vote_atomic(
  UUID, UUID, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT
) TO authenticated;

-- ============================================================
-- 2. public_votes view: drop would_order_again column
-- ============================================================

-- Open the file supabase/schema.sql and locate the full CREATE OR REPLACE VIEW
-- public_votes block starting at line 342 (pre-change line number). Copy its
-- SELECT list into the CREATE OR REPLACE VIEW statement below, OMITTING the
-- `would_order_again` column. Keep every other column and every other clause
-- (filters, ordering, SECURITY INVOKER if present) identical.

-- NOTE TO IMPLEMENTER: because public_votes' full definition is in schema.sql,
-- grep for its current body (grep -A 40 "CREATE OR REPLACE VIEW public_votes"
-- supabase/schema.sql) and reconstruct the CREATE OR REPLACE VIEW here with
-- would_order_again removed from the SELECT.

CREATE OR REPLACE VIEW public_votes AS
-- <PASTE the current definition here, minus the would_order_again column>
;

-- ============================================================
-- 3. Read RPCs: drop yes_votes, percent_worth_it, would_order_again
-- ============================================================

-- NOTE TO IMPLEMENTER: the five RPCs below live in supabase/schema.sql at
-- approximately:
--   get_ranked_dishes — line 737
--   get_restaurant_dishes — line 954
--   get_dish_variants — line 1059
--   get_friends_votes_for_dish — line 1141
--   get_friends_votes_for_restaurant — line 1171
--
-- For each: copy the full current definition from schema.sql into this
-- migration file, then remove:
--   - yes_votes and percent_worth_it from the RETURNS TABLE clause
--   - any SUM(CASE WHEN v.would_order_again ...) aggregation
--   - any ROUND((yes_votes * 100.0) / total_votes) percent computation
--   - any would_order_again reference in SELECT or WHERE bodies
-- Keep everything else untouched: avg_rating, total_votes, distance, ranking
-- math, variant logic, friend-filter logic.
--
-- For get_friends_votes_for_dish and get_friends_votes_for_restaurant:
-- remove would_order_again from RETURNS TABLE and from the inner SELECT.

CREATE OR REPLACE FUNCTION get_ranked_dishes(...)
-- <PASTE current definition with binary-derived fields removed>
;

CREATE OR REPLACE FUNCTION get_restaurant_dishes(...)
-- <PASTE current definition with binary-derived fields removed>
;

CREATE OR REPLACE FUNCTION get_dish_variants(...)
-- <PASTE current definition with binary-derived fields removed>
;

CREATE OR REPLACE FUNCTION get_friends_votes_for_dish(...)
-- <PASTE current definition with binary-derived fields removed>
;

CREATE OR REPLACE FUNCTION get_friends_votes_for_restaurant(...)
-- <PASTE current definition with binary-derived fields removed>
;
```

The `<PASTE>` placeholders exist because each RPC body is 30–100 lines and the canonical version lives in `schema.sql`. Copy them verbatim, then subtract the binary fields. This avoids drift between the migration and the source of truth.

- [ ] **Step 2: Fill in each placeholder from `schema.sql`**

For `public_votes`:
```bash
grep -n -A 40 "CREATE OR REPLACE VIEW public_votes" supabase/schema.sql
```
Copy the view body (lines around 342). Paste into the migration. Remove the `would_order_again` column from the SELECT. Drop any trailing comma issues.

For each of the five RPCs (approximate line numbers given above), run `grep -n -A 120 "CREATE OR REPLACE FUNCTION <name>" supabase/schema.sql`, copy, paste, then subtract:
- From `RETURNS TABLE`: delete `yes_votes BIGINT,` and `percent_worth_it INT,` (and `would_order_again BOOLEAN,` in the two `get_friends_votes_*` RPCs).
- From the SELECT / CTE / INSERT column lists: delete the aggregation that produces those fields.
- From WHERE / GROUP BY / ORDER BY: nothing to change — these RPCs don't filter on the binary.

Key line numbers in current `schema.sql` for subtraction guidance:
- `get_ranked_dishes`: returns at lines 756-757 (`yes_votes BIGINT`, `percent_worth_it INT`); aggregations at lines 823, 877-880, 886-893.
- `get_restaurant_dishes`: returns at lines 967-968; aggregations at lines 994, 1014, 1024, 1029.
- `get_dish_variants`: returns at lines 1069-1070; aggregations at lines 1078, 1081-1083.
- `get_friends_votes_for_dish`: returns at line 1149 (`would_order_again BOOLEAN`); SELECT at line 1155.
- `get_friends_votes_for_restaurant`: returns at line 1181; SELECT at line 1188.

- [ ] **Step 3: Verify the migration file is syntactically complete**

No `<PASTE>` placeholders should remain. Each RPC should have a full body. Run:
```bash
grep -c "PASTE" supabase/migrations/2026-04-13-binary-vote-removal-phase-2.sql
```
Expected: `0`.

- [ ] **Step 4: Commit the migration**

```bash
git add supabase/migrations/2026-04-13-binary-vote-removal-phase-2.sql
git commit -m "feat(db): phase 2 migration — drop binary-vote compat shims

Drops p_would_order_again from submit_vote_atomic. Drops yes_votes,
percent_worth_it from get_ranked_dishes, get_restaurant_dishes,
get_dish_variants. Drops would_order_again from friends-votes RPCs
and public_votes view. Column stays for historical integrity."
```

---

## Task 2: Sync `schema.sql`

**Files:**
- Modify: `supabase/schema.sql`

Apply the exact same changes to the canonical schema file so future `schema.sql` replays don't revert Phase 2.

- [ ] **Step 1: Update `submit_vote_atomic`**

Open `supabase/schema.sql` around line 1715. Replace the entire `CREATE OR REPLACE FUNCTION submit_vote_atomic(...)` block (lines 1715–1785, roughly) with the post-Phase-2 body from Task 1's migration (minus the `DROP FUNCTION` — `schema.sql` uses `CREATE OR REPLACE`, so no drop needed; but note that simply CREATE OR REPLACEing over a function with a different parameter list fails in Postgres, which is why the migration does DROP+CREATE; `schema.sql` can still use CREATE OR REPLACE because it's replaying from scratch against an empty DB).

Actually, for safety when replaying `schema.sql` against an existing dev/staging DB that may have the old signature, add an explicit `DROP FUNCTION IF EXISTS` above the CREATE:

```sql
DROP FUNCTION IF EXISTS submit_vote_atomic(
  UUID, UUID, BOOLEAN, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT
);

CREATE OR REPLACE FUNCTION submit_vote_atomic(
  p_dish_id UUID,
  p_user_id UUID,
  p_rating_10 DECIMAL DEFAULT NULL,
  ...
```

Paste the new 7-arg body (same as the migration). Keep the existing trailing `GRANT EXECUTE` statement but update its signature to match (look for it in schema.sql, typically near line 2851 or colocated with other grants).

- [ ] **Step 2: Update `public_votes` view**

Around line 342 in `schema.sql`, find the `CREATE OR REPLACE VIEW public_votes AS` block. Remove the `would_order_again` column from its SELECT list.

- [ ] **Step 3: Update each read RPC**

For each of `get_ranked_dishes` (line 737), `get_restaurant_dishes` (line 954), `get_dish_variants` (line 1059), `get_friends_votes_for_dish` (line 1141), `get_friends_votes_for_restaurant` (line 1171): edit the CREATE OR REPLACE FUNCTION body in `schema.sql` to match what's in the migration file (Task 1 Step 2). The simplest operator is to copy-paste from the migration into schema.sql.

- [ ] **Step 4: Verify no stale references remain**

Run:
```bash
grep -n "p_would_order_again\|would_order_again\|yes_votes\|percent_worth_it" supabase/schema.sql
```
Expected output: only the `votes` table's column definition at line 82 (`would_order_again BOOLEAN,`) should remain. Every RPC reference and the view's projection should be gone.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "chore(db): sync schema.sql with phase 2 migration"
```

---

## Task 3: Drop `p_would_order_again` from `votesApi.submitVote` + kill `vote_submitted` dual-emit

**Files:**
- Modify: `src/api/votesApi.js`
- Modify: `src/api/votesApi.test.js`

- [ ] **Step 1: Write failing tests**

Edit `src/api/votesApi.test.js`. Find the existing analytics-related tests in the `submitVote` suite. Replace the Phase 1 dual-emit assertions with:

```javascript
it('emits rating_submitted with clean payload (no binary fields)', async () => {
  supabase.rpc
    .mockResolvedValueOnce({ data: { allowed: true }, error: null })
    .mockResolvedValueOnce({ data: { id: 'vote-1' }, error: null })

  await votesApi.submitVote({
    dishId: 'dish-1',
    rating10: 8,
    reviewText: 'Great!',
  })

  expect(capture).toHaveBeenCalledWith('rating_submitted', {
    dish_id: 'dish-1',
    rating: 8,
    has_review: true,
  })
  // Phase 2: vote_submitted is gone, binary_removed property is gone
  const allCalls = capture.mock.calls.map(c => c[0])
  expect(allCalls).not.toContain('vote_submitted')
})

it('does not send p_would_order_again to submit_vote_atomic', async () => {
  supabase.rpc
    .mockResolvedValueOnce({ data: { allowed: true }, error: null })
    .mockResolvedValueOnce({ data: { id: 'vote-1' }, error: null })

  await votesApi.submitVote({
    dishId: 'dish-1',
    rating10: 8,
  })

  const submitCall = supabase.rpc.mock.calls.find(c => c[0] === 'submit_vote_atomic')
  expect(submitCall).toBeTruthy()
  expect(submitCall[1]).not.toHaveProperty('p_would_order_again')
})
```

Delete any existing tests that assert on `vote_submitted` or on `would_order_again` being present in the RPC payload or capture call.

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm run test -- src/api/votesApi.test.js`
Expected: FAIL — current code still emits `vote_submitted` and still sends `p_would_order_again`.

- [ ] **Step 3: Update `votesApi.js`**

In `src/api/votesApi.js`, find `upsertVoteRecord` (around line 78). Update the RPC call to drop `p_would_order_again`:

Before:
```javascript
var { data: vote, error } = await supabase.rpc('submit_vote_atomic', {
  p_dish_id: dishId,
  p_user_id: userId,
  p_would_order_again: /* whatever */,  // some derivation from rating10
  p_rating_10: rating10,
  p_review_text: reviewText,
  p_purity_score: purityData && purityData.purity != null ? purityData.purity : null,
  p_war_score: jitterScore && jitterScore.score != null ? jitterScore.score : null,
  p_badge_hash: badgeHash || null,
})
```

After:
```javascript
var { data: vote, error } = await supabase.rpc('submit_vote_atomic', {
  p_dish_id: dishId,
  p_user_id: userId,
  p_rating_10: rating10,
  p_review_text: reviewText,
  p_purity_score: purityData && purityData.purity != null ? purityData.purity : null,
  p_war_score: jitterScore && jitterScore.score != null ? jitterScore.score : null,
  p_badge_hash: badgeHash || null,
})
```

Still in `upsertVoteRecord`, find the analytics block (the Phase 1 dual-emit of `vote_submitted` + `rating_submitted`). Replace it with a single emit:

Before:
```javascript
const derivedWouldOrderAgain = rating10 != null ? rating10 >= 7.0 : null

capture('vote_submitted', {
  dish_id: dishId,
  would_order_again: derivedWouldOrderAgain,
  rating: rating10,
  has_review: !!reviewText,
  binary_removed: true,
})

capture('rating_submitted', {
  dish_id: dishId,
  rating: rating10,
  has_review: !!reviewText,
  binary_removed: true,
})
```

After:
```javascript
capture('rating_submitted', {
  dish_id: dishId,
  rating: rating10,
  has_review: !!reviewText,
})
```

Also remove any `normalizeVotePayload` destructured field that referenced `wouldOrderAgain` (there shouldn't be any left from Phase 1 — confirm with a grep inside the file).

- [ ] **Step 4: Run tests, verify passing**

Run: `npm run test -- src/api/votesApi.test.js`
Expected: PASS.

- [ ] **Step 5: Run full suite to catch unintended fallout**

Run: `npm run test -- --run 2>&1 | tail -3`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/api/votesApi.js src/api/votesApi.test.js
git commit -m "feat(api): phase 2 — drop p_would_order_again RPC arg and vote_submitted dual-emit"
```

---

## Task 4: Add multi-photo safety to `dishPhotosApi.getUserPhotoForDish`

**Files:**
- Modify: `src/api/dishPhotosApi.js`

- [ ] **Step 1: Read the current implementation**

```bash
grep -n -A 25 "getUserPhotoForDish" src/api/dishPhotosApi.js
```

Current (around line 233):
```javascript
async getUserPhotoForDish(dishId) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('dish_photos')
      .select('*')
      .eq('dish_id', dishId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw createClassifiedError(error)
    return data
  } catch (error) {
    logger.error('Error fetching user photo:', error)
    throw error.type ? error : createClassifiedError(error)
  }
}
```

- [ ] **Step 2: Add ordering + limit before maybeSingle**

Edit `src/api/dishPhotosApi.js` to replace the query chain with:

```javascript
const { data, error } = await supabase
  .from('dish_photos')
  .select('*')
  .eq('dish_id', dishId)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

This guards against the case where a user has uploaded multiple photos for the same dish (which `.maybeSingle()` alone would reject by throwing).

- [ ] **Step 3: Build to confirm no typos**

Run: `npm run build 2>&1 | tail -3`
Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add src/api/dishPhotosApi.js
git commit -m "feat(api): multi-photo safety on getUserPhotoForDish"
```

---

## Task 5: Rewrite `seed-reviews` buildReviewSnippet + insert NULL for boolean

**Files:**
- Modify: `supabase/functions/seed-reviews/index.ts`

- [ ] **Step 1: Read the function around the INSERT**

```bash
grep -n -B 2 -A 30 "buildReviewSnippet\|would_order_again" supabase/functions/seed-reviews/index.ts
```

Two sites to change:
1. `buildReviewSnippet` signature (~line 57)
2. The caller site + the INSERT (~line 360)

- [ ] **Step 2: Rewrite `buildReviewSnippet` signature**

Edit `supabase/functions/seed-reviews/index.ts` around line 57. Change the function signature and its closer-selection logic:

Before:
```typescript
function buildReviewSnippet(phrases: string[], wouldOrderAgain: boolean): string | null {
  if (!phrases || phrases.length === 0) return null
  // ... existing phrase-joining logic unchanged ...
  const closers = wouldOrderAgain
    ? [' Would definitely order again.', ' A must-try.', ' Highly recommend.']
    : [' Probably wouldn\'t order again.', ' Not my favorite.']
  // ... rest unchanged ...
}
```

After:
```typescript
function buildReviewSnippet(phrases: string[], rating: number | null): string | null {
  if (!phrases || phrases.length === 0) return null
  // ... existing phrase-joining logic unchanged ...
  const positive = rating != null && rating >= 7.0
  const closers = positive
    ? [' Would definitely order again.', ' A must-try.', ' Highly recommend.']
    : [' Probably wouldn\'t order again.', ' Not my favorite.']
  // ... rest unchanged ...
}
```

Only the signature and the closer-selection line change. Every other line in the function stays.

- [ ] **Step 3: Update the caller site + INSERT**

Around line 360, replace the Phase 1 compat shim block. Before:

```typescript
// Phase 1 compat: mirror submit_vote_atomic's rating>=7.0 derivation. Phase 2 will pass NULL and drop snippet dependence.
const wghRating = rating10
const wouldOrderAgain = wghRating != null ? wghRating >= 7.0 : null

// ... existing duplicate-avoidance check unchanged ...

const reviewSnippet = buildReviewSnippet(mention.descriptive_phrases, wouldOrderAgain ?? false)

const { error: insertErr } = await supabase.from('votes').insert({
  dish_id: matched.id,
  user_id: AI_SYSTEM_USER_ID,
  would_order_again: wouldOrderAgain,
  rating_10: rating10,
  // ... rest unchanged ...
})
```

After:
```typescript
// Phase 2: the votes.would_order_again column is nullable and no longer
// surfaced anywhere. Insert NULL; the snippet builder derives its own
// positive/negative closer from the rating.
const wghRating = rating10

// ... existing duplicate-avoidance check unchanged ...

const reviewSnippet = buildReviewSnippet(mention.descriptive_phrases, wghRating)

const { error: insertErr } = await supabase.from('votes').insert({
  dish_id: matched.id,
  user_id: AI_SYSTEM_USER_ID,
  would_order_again: null,
  rating_10: rating10,
  // ... rest unchanged ...
})
```

Delete the `const wouldOrderAgain = ...` line entirely. The `would_order_again: null` entry in the INSERT keeps explicit intent.

- [ ] **Step 4: Verify no stale references**

Run:
```bash
grep -n "wouldOrderAgain" supabase/functions/seed-reviews/index.ts
```
Expected: zero output. The variable is fully removed.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/seed-reviews/index.ts
git commit -m "feat(seed): phase 2 — pass rating to buildReviewSnippet, insert NULL boolean

Removes compat dependency on would_order_again. Snippet closer logic
derives positive/negative directly from the rating. Votes insert writes
NULL for the column (now stripped from all read paths)."
```

---

## Task 6: Wire `existingPhotoUrl` in `Dish.jsx`

**Files:**
- Modify: `src/pages/Dish.jsx`

- [ ] **Step 1: Read current prior-vote fetch**

```bash
grep -n -A 15 "getUserVoteForDish" src/pages/Dish.jsx
```

Current prior-vote fetch (approximately lines 47-57):
```javascript
useEffect(() => {
  if (!user || !dishId) {
    setPriorVote(null)
    return
  }
  let cancelled = false
  authApi.getUserVoteForDish(dishId, user.id)
    .then((vote) => { if (!cancelled) setPriorVote(vote) })
    .catch((err) => { logger.error('Failed to fetch prior vote:', err) })
  return () => { cancelled = true }
}, [dishId, user])
```

Also confirm where `<ReviewFlow />` is rendered with `existingPhotoUrl={null}` hardcoded (search the file for `existingPhotoUrl`):
```bash
grep -n "existingPhotoUrl" src/pages/Dish.jsx
```
Expected: one hardcoded `null` site inside the inline ReviewFlow render.

- [ ] **Step 2: Add photo state + import dishPhotosApi**

Near the other `useState` declarations in `Dish()` (around lines 37-39), add:
```javascript
const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
```

At the imports (top of file, near line 19 where `authApi` is imported), add:
```javascript
import { dishPhotosApi } from '../api/dishPhotosApi'
```

- [ ] **Step 3: Rewrite the prior-state fetch as parallel**

Replace the `useEffect` from Step 1 with:

```javascript
useEffect(() => {
  if (!user || !dishId) {
    setPriorVote(null)
    setExistingPhotoUrl(null)
    return
  }
  let cancelled = false
  Promise.all([
    authApi.getUserVoteForDish(dishId, user.id),
    dishPhotosApi.getUserPhotoForDish(dishId),
  ])
    .then(([vote, photo]) => {
      if (cancelled) return
      setPriorVote(vote)
      setExistingPhotoUrl(photo?.photo_url ?? null)
    })
    .catch((err) => { logger.error('Failed to fetch prior state:', err) })
  return () => { cancelled = true }
}, [dishId, user])
```

- [ ] **Step 4: Also refresh the photo on successful vote submission**

Find `handleVoteSubmitted` (around lines 93-102). After the submit closes the flow and re-fetches prior vote, also re-fetch the photo. Replace the existing `handleVoteSubmitted` body with:

```javascript
const handleVoteSubmitted = () => {
  setShowRateFlow(false)
  if (user && dishId) {
    Promise.all([
      authApi.getUserVoteForDish(dishId, user.id),
      dishPhotosApi.getUserPhotoForDish(dishId),
    ])
      .then(([vote, photo]) => {
        setPriorVote(vote)
        setExistingPhotoUrl(photo?.photo_url ?? null)
      })
      .catch((err) => { logger.error('Failed to refresh prior state:', err) })
  }
  handleVote?.()
}
```

- [ ] **Step 5: Pass `existingPhotoUrl` to `<ReviewFlow />`**

Find the `<ReviewFlow ... />` render inside the Dish component. Change:
```jsx
existingPhotoUrl={null}
```
to:
```jsx
existingPhotoUrl={existingPhotoUrl}
```

- [ ] **Step 6: Build + sanity test**

Run:
```bash
npm run build 2>&1 | tail -3
npm run test -- --run 2>&1 | tail -3
```
Expected: build + test pass.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Dish.jsx
git commit -m "feat(dish): wire existingPhotoUrl from dishPhotosApi into ReviewFlow

Lights up the Keep/Replace/Remove thumbnail UI that was wired but dark
in Phase 1. Fetches prior vote and prior photo in parallel, refreshes
both on successful submit."
```

---

## Task 7: Update `supabase/README.md`

**Files:**
- Modify: `supabase/README.md`

- [ ] **Step 1: Find references to the binary**

```bash
grep -n -B 1 -A 3 "would_order_again\|worth.?it\|yes_votes\|percent_worth_it" supabase/README.md
```

- [ ] **Step 2: Remove or rewrite each reference**

For each hit, edit the surrounding sentence. Typical patterns:
- `votes (would_order_again boolean, rating_10 numeric, ...)` → `votes (rating_10 numeric, ...)`
- `The vote is a (would_order_again, rating_10) pair.` → `The vote is a rating_10 value (1–10).`
- `Percent worth it is derived from would_order_again.` → remove the sentence entirely.

Keep the README's overall structure and tone. Don't refactor the document — only scrub binary references.

- [ ] **Step 3: Verify clean**

```bash
grep -n "would_order_again\|percent_worth_it\|yes_votes" supabase/README.md
```
Expected: zero output.

- [ ] **Step 4: Commit**

```bash
git add supabase/README.md
git commit -m "docs(supabase): remove binary-vote references from README"
```

---

## Task 8: Final verification, deploy instructions, and PR

**Files:** none (verification + PR only)

- [ ] **Step 1: Full grep audit**

Run each of these. Each should return zero output or only pre-existing expected references.

```bash
grep -rn "p_would_order_again" src/ supabase/migrations/ supabase/schema.sql 2>/dev/null
```
Expected: only in the FROZEN migration `supabase/migrations/2026-04-12-binary-vote-removal.sql` (Phase 1's artifact, never edited). New Phase 2 migration and current `schema.sql` must be clean.

```bash
grep -rn "vote_submitted\|binary_removed" src/ 2>/dev/null
```
Expected: zero output (these were Phase 1 analytics compat fields).

```bash
grep -rn "yes_votes\|percent_worth_it" src/ supabase/schema.sql 2>/dev/null
```
Expected: zero output (the Phase 2 migration explicitly drops these from all return signatures).

```bash
grep -n "would_order_again" supabase/schema.sql
```
Expected: exactly one hit — line 82, the column definition itself. No RPC, no view should reference it.

- [ ] **Step 2: Build + test + lint**

```bash
npm run build 2>&1 | tail -3
npm run test -- --run 2>&1 | tail -3
npm run lint 2>&1 | grep -E "^/Users" | grep -v "whats-good-here-soul" | head -20
```

Expected: build passes, 312+ tests pass (or whatever the Phase 1 baseline is — no regression), no NEW lint errors introduced in touched files (pre-existing baseline is fine).

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feat/binary-vote-removal-phase-2
```

- [ ] **Step 4: Open the PR**

Use `gh pr create` with this body:

```bash
gh pr create --title "Binary vote removal — Phase 2 (cleanup)" --body "$(cat <<'EOF'
## Summary

Removes every Phase 1 compat shim. The binary vote concept is now
fully gone from the write path, read paths, analytics, and docs. The
votes.would_order_again column stays (historical integrity).

Spec: \`docs/superpowers/specs/2026-04-13-binary-vote-removal-phase-2-design.md\`
Plan: \`docs/superpowers/plans/2026-04-13-binary-vote-removal-phase-2.md\`

## Manual deploy steps before / after merging

- [ ] Run \`supabase/migrations/2026-04-13-binary-vote-removal-phase-2.sql\` in Supabase SQL Editor against project \`vpioftosgdkyiwvhxewy\`.
- [ ] After merge, deploy seed-reviews Edge Function: \`supabase functions deploy seed-reviews --project-ref vpioftosgdkyiwvhxewy\`.

## Test plan

- [x] \`npm run build\` passes
- [x] \`npm run test -- --run\` passes
- [ ] Grep audit: no residual \`vote_submitted\` / \`binary_removed\` / \`yes_votes\` / \`percent_worth_it\` / \`p_would_order_again\` in src or schema.sql
- [ ] Manual: submit a rating on prod, verify only \`rating_submitted\` fires in PostHog (no \`vote_submitted\` sibling)
- [ ] Manual: dish detail for a dish you've rated and photographed shows the Keep/Replace/Remove photo UI
- [ ] Manual: no 500s or function-signature errors on voting

## Known risk

Stale PWA bundles still passing the 8-arg \`submit_vote_atomic\` signature will error. User base is effectively you + Denis + early testers; recovery is a single hard refresh. Capacitor launch makes this a one-time cost.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Report the PR URL and outstanding manual steps**

Final output to the caller:
- PR URL.
- Manual step: run the migration in Supabase SQL Editor.
- Manual step: deploy the Edge Function after merge.
- Manual step: verify PostHog 24h after deploy.
