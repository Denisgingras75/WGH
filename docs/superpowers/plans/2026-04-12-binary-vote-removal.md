# Binary Vote Removal Implementation Plan (Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "Would you order again?" binary thumbs vote from the What's Good Here product. The 1–10 rating becomes the sole user input. Phase 1 is compat-safe: shadow-writes the boolean server-side so stale PWA bundles keep working; UI stops reading/writing/displaying it.

**Architecture:** Two-phase DB cut. Phase 1 (this plan): schema becomes nullable, `submit_vote_atomic` derives `would_order_again` from rating when caller omits it, read RPCs keep their return signatures so stale clients don't render garbage. UI, copy, and internal APIs all drop the concept. Phase 2 (separate follow-up PR, tracked in `TASKS.md`) strips RPC signatures and seed shadow-write.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 3, React Router v7, Supabase (Postgres + Edge Functions), Vitest (unit), Playwright (E2E), PostHog analytics.

**Spec:** `docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md` (read this before starting).

**Base branch:** `main`. Work in a feature branch — `feat/binary-vote-removal`.

---

## File Structure

Files modified (grouped by concern):

**Schema & DB:**
- Create: `supabase/migrations/2026-04-12-binary-vote-removal.sql` (forward migration)
- Modify: `supabase/schema.sql` (canonical source of truth)
- Modify: `supabase/functions/seed-reviews/index.ts` (shadow-write compat)

**API layer:**
- Modify: `src/api/votesApi.js`, `src/api/votesApi.test.js`
- Modify: `src/api/dishesApi.js`, `src/api/dishesApi.test.js`
- Modify: `src/api/followsApi.js`
- Modify: `src/api/authApi.js`, `src/api/authApi.test.js`

**Hooks:**
- Modify: `src/hooks/useVote.js`, `src/hooks/useVote.test.js`

**Core vote flow UI:**
- Modify: `src/components/ReviewFlow.jsx` (collapse 2-step to 1-screen)
- Delete: `src/components/ThumbsUpIcon.jsx`, `src/components/ThumbsDownIcon.jsx` (if nothing else references them post-refactor)
- Modify: `src/components/rate-meal/BatchRatingCard.jsx`
- Modify: `src/pages/RateYourMeal.jsx` (summary screen)
- Modify: `src/pages/Dish.jsx` (Rate CTA entry point)

**Profile:**
- Modify: `src/pages/UserProfile.jsx` (shelf collapse)
- Modify: `src/pages/Profile.jsx` (mock data)
- Modify: `src/components/profile/JournalCard.jsx` (rating color cue)
- Modify: `src/components/profile/JournalCard.test.jsx`
- Modify: `src/components/profile/JournalFeed.jsx`
- Modify: `src/components/profile/JournalFeed.test.jsx`

**Read-side UI (binary-derived display removal):**
- Modify: `src/components/DishListItem.jsx`
- Modify: `src/components/home/ChampionCard.jsx`
- Modify: `src/components/dish/DishHero.jsx`
- Modify: `src/components/dish/DishEvidence.jsx`
- Modify: `src/components/restaurants/RestaurantMap.jsx`
- Modify: `src/components/restaurants/RestaurantMenu.jsx`
- Modify: `src/components/restaurants/RestaurantDishes.jsx`
- Modify: `src/pages/RestaurantReviews.jsx`

**Utility cleanup:**
- Modify: `src/utils/ranking.js` (delete 4 functions)

**OG / share:**
- Modify: `api/share.ts`
- Modify: `api/og-image.ts`

**Copy scrub:**
- Modify: `src/components/Auth/WelcomeModal.jsx`
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/HowReviewsWork.jsx`
- Modify: `src/pages/ForRestaurants.jsx`
- Modify: `src/pages/MyList.jsx`

**Analytics:**
- Modify: `src/components/ReviewFlow.jsx` (covered in Task 7, but analytics dual-emit is called out as Task 25)

**Docs:**
- Modify: `docs/superpowers/specs/2026-04-09-rate-your-meal-design.md` (amendment block)
- Modify: `TASKS.md` (Phase 2 follow-up entry)

**E2E tests:**
- Modify: `e2e/pioneer/voting.spec.ts` (and any thumbs-click siblings)

---

## Task 0: Create feature branch and verify clean baseline

**Files:** (git only)

- [ ] **Step 1: Confirm `main` is up-to-date and clean**

Run:
```bash
cd /Users/danielwalsh/.local/bin/whats-good-here
git status
git checkout main
git pull origin main
```
Expected: clean working tree, `main` at origin HEAD.

- [ ] **Step 2: Create feature branch**

Run:
```bash
git checkout -b feat/binary-vote-removal
```
Expected: switched to new branch.

- [ ] **Step 3: Baseline verification — tests and build pass before we start**

Run:
```bash
npm run test -- --run
npm run lint
npm run build
```
Expected: all pass. This establishes that failures later are ours, not pre-existing.

---

## Task 1: Write forward migration — nullable column + shadow-write RPC

**Files:**
- Create: `supabase/migrations/2026-04-12-binary-vote-removal.sql`

**Context:** This migration does three things:
1. Drops `NOT NULL` on `votes.would_order_again` (Phase 2 will use this; Phase 1 does not write NULL).
2. Replaces `submit_vote_atomic` with a version that makes `p_would_order_again` optional and derives from rating when NULL.
3. Grants stay the same (signature unchanged in terms of param types).

- [ ] **Step 1: Read the existing `submit_vote_atomic` definition**

Run:
```bash
grep -n "CREATE OR REPLACE FUNCTION submit_vote_atomic" supabase/schema.sql
```
Expected: returns line number. Read the function body (typically ~60 lines) — you'll need its signature, return type, and body.

- [ ] **Step 2: Create the migration file**

Create `supabase/migrations/2026-04-12-binary-vote-removal.sql`:

```sql
-- Binary Vote Removal — Phase 1
-- Design spec: docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md
--
-- Changes:
--   1. votes.would_order_again becomes nullable (Phase 2 will exploit this).
--   2. submit_vote_atomic's p_would_order_again param is now optional.
--      When NULL (new clients), server derives from rating_10 >= 7.0.
--      When boolean (stale PWA bundles), server honors caller's value.

ALTER TABLE votes
  ALTER COLUMN would_order_again DROP NOT NULL;

-- Drop and recreate submit_vote_atomic with new default.
-- Postgres does not allow changing defaults on an existing function's param
-- without dropping, so we DROP + CREATE.

DROP FUNCTION IF EXISTS submit_vote_atomic(
  UUID, UUID, BOOLEAN, NUMERIC, TEXT, JSONB, JSONB, JSONB, TEXT
);

CREATE OR REPLACE FUNCTION submit_vote_atomic(
  p_user_id UUID,
  p_dish_id UUID,
  p_would_order_again BOOLEAN DEFAULT NULL,
  p_rating_10 NUMERIC DEFAULT NULL,
  p_review_text TEXT DEFAULT NULL,
  p_purity_data JSONB DEFAULT NULL,
  p_jitter_data JSONB DEFAULT NULL,
  p_jitter_score JSONB DEFAULT NULL,
  p_badge_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_would_order BOOLEAN;
  v_vote_id UUID;
BEGIN
  -- Server-side compatibility shim: if caller omits the binary, derive
  -- it from the rating. Stale PWA bundles that still pass a boolean
  -- are honored as-is so we don't lose their intent.
  IF p_would_order_again IS NULL THEN
    IF p_rating_10 IS NULL THEN
      RAISE EXCEPTION 'rating_10 is required';
    END IF;
    v_effective_would_order := (p_rating_10 >= 7.0);
  ELSE
    v_effective_would_order := p_would_order_again;
  END IF;

  INSERT INTO votes (
    user_id, dish_id, would_order_again, rating_10, review_text,
    purity_data, jitter_data, jitter_score, badge_hash, source
  )
  VALUES (
    p_user_id, p_dish_id, v_effective_would_order, p_rating_10, p_review_text,
    p_purity_data, p_jitter_data, p_jitter_score, p_badge_hash, 'user'
  )
  ON CONFLICT (user_id, dish_id) DO UPDATE SET
    would_order_again = EXCLUDED.would_order_again,
    rating_10 = EXCLUDED.rating_10,
    review_text = EXCLUDED.review_text,
    purity_data = EXCLUDED.purity_data,
    jitter_data = EXCLUDED.jitter_data,
    jitter_score = EXCLUDED.jitter_score,
    badge_hash = EXCLUDED.badge_hash,
    updated_at = NOW()
  RETURNING id INTO v_vote_id;

  RETURN jsonb_build_object('vote_id', v_vote_id, 'success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_vote_atomic(
  UUID, UUID, BOOLEAN, NUMERIC, TEXT, JSONB, JSONB, JSONB, TEXT
) TO authenticated;
```

**Important caveats:**
- **Check the actual body of `submit_vote_atomic` in `supabase/schema.sql` before committing.** The body above is what the function should logically do post-change; if the existing body has additional concerns (rate-limit checks, jitter storage in a side table, source assignment), preserve those. The SHAPE change is: optional `p_would_order_again` with server-side derivation.
- **Column order matters** for the `DROP FUNCTION` to match the existing function signature. Adjust if the real signature differs.
- **Do not remove `source = 'user'`** — AI-estimated votes have a different code path and are not touched by this RPC.

- [ ] **Step 3: Verify the migration parses — run it against a local or staging Supabase**

If you have a local Supabase stack:
```bash
psql $DATABASE_URL -f supabase/migrations/2026-04-12-binary-vote-removal.sql
```

Otherwise, copy-paste into Supabase SQL Editor on the staging project and run.

Expected: `NOTICE:  function submit_vote_atomic(...) does not exist, skipping` (first run), then `CREATE FUNCTION` and `GRANT` succeed.

- [ ] **Step 4: Test the RPC with both call shapes**

In SQL Editor:

```sql
-- Test 1: old-client shape (passes boolean)
SELECT submit_vote_atomic(
  p_user_id := '00000000-0000-0000-0000-000000000000'::uuid,  -- use a real test user
  p_dish_id := '00000000-0000-0000-0000-000000000000'::uuid,  -- use a real test dish
  p_would_order_again := true,
  p_rating_10 := 9.0
);

-- Test 2: new-client shape (omits boolean, server derives)
SELECT submit_vote_atomic(
  p_user_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_dish_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_rating_10 := 8.5  -- should derive would_order_again := true
);

-- Verify the row was written with a coherent boolean
SELECT would_order_again, rating_10 FROM votes
WHERE user_id = '00000000-0000-0000-0000-000000000000'
  AND dish_id = '00000000-0000-0000-0000-000000000000';
```
Expected: both calls succeed, the second row has `would_order_again = true`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/2026-04-12-binary-vote-removal.sql
git commit -m "feat(db): make would_order_again nullable + shadow-write in submit_vote_atomic

Phase 1 of binary vote removal. Column stays NOT-NULL-free so Phase 2
can write NULL; RPC now derives the boolean from rating when caller
omits it. Stale PWA bundles that still pass the value keep working."
```

---

## Task 2: Update `supabase/schema.sql` to match the migration

**Files:**
- Modify: `supabase/schema.sql`

Per `CLAUDE.md` §1.4: `supabase/schema.sql` is the source of truth and must be updated alongside any migration.

- [ ] **Step 1: Find the `votes` table definition**

Run:
```bash
grep -n "CREATE TABLE.*votes" supabase/schema.sql
```

- [ ] **Step 2: Change `would_order_again BOOLEAN NOT NULL` to `would_order_again BOOLEAN`**

Edit the `votes` table definition. Remove `NOT NULL` from the `would_order_again` line. Other constraints (CHECK, default, etc.) stay.

- [ ] **Step 3: Find and replace the `submit_vote_atomic` definition**

Find the existing `CREATE OR REPLACE FUNCTION submit_vote_atomic` block in `supabase/schema.sql`. Replace it with the exact same body used in the migration (Task 1 Step 2), minus the `DROP FUNCTION` line — `schema.sql` uses `CREATE OR REPLACE`.

- [ ] **Step 4: Verify schema.sql parses locally (optional but smart)**

If you have a scratch Supabase project, re-run `supabase/schema.sql` end-to-end. Otherwise visually diff.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "chore(db): sync schema.sql with binary-vote-removal migration"
```

---

## Task 3: Update `votesApi.submitVote()` — drop `wouldOrderAgain` arg

**Files:**
- Modify: `src/api/votesApi.js`
- Modify: `src/api/votesApi.test.js`

**Context:** Current signature accepts `wouldOrderAgain` as part of the arg object and forwards it to the RPC. We want callers to stop passing it. The RPC will derive it server-side.

- [ ] **Step 1: Find and read the current `submitVote` implementation**

Run:
```bash
grep -n "submitVote" src/api/votesApi.js
```

Read lines ±30 around the match. Look for:
- The function signature (probably destructures `wouldOrderAgain` from an object arg)
- The `typeof wouldOrderAgain !== 'boolean'` validation guard
- The `.rpc('submit_vote_atomic', { ... })` call with `p_would_order_again: wouldOrderAgain`

- [ ] **Step 2: Write the failing test**

In `src/api/votesApi.test.js`, add (or update if one exists):

```javascript
describe('votesApi.submitVote', () => {
  it('calls submit_vote_atomic with p_would_order_again omitted', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: { vote_id: 'v1' }, error: null })

    await votesApi.submitVote({
      dishId: 'd1',
      rating10: 8.5,
      reviewText: 'great',
    })

    expect(rpcSpy).toHaveBeenCalledWith('submit_vote_atomic', expect.objectContaining({
      p_dish_id: 'd1',
      p_rating_10: 8.5,
      p_review_text: 'great',
    }))
    // Verify the binary field is NOT in the payload
    const payload = rpcSpy.mock.calls[0][1]
    expect(payload).not.toHaveProperty('p_would_order_again')
  })
})
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `npm run test -- src/api/votesApi.test.js`
Expected: FAIL — existing code passes `p_would_order_again`.

- [ ] **Step 4: Update `votesApi.submitVote`**

Edit `src/api/votesApi.js`:

1. Remove `wouldOrderAgain` from the destructured params.
2. Remove the `if (typeof wouldOrderAgain !== 'boolean') throw ...` validation.
3. Remove `p_would_order_again: wouldOrderAgain` from the RPC payload.

The function now takes `{ dishId, rating10, reviewText, purityData, jitterData, jitterScore, badgeHash }`.

- [ ] **Step 5: Run the test, verify it passes**

Run: `npm run test -- src/api/votesApi.test.js`
Expected: PASS.

- [ ] **Step 6: Remove any existing test assertions that still rely on `wouldOrderAgain`**

Run: `grep -n "wouldOrderAgain\|would_order_again" src/api/votesApi.test.js`
Delete any lines that assert on these fields being present in the payload. Update mock responses to match the new API shape.

- [ ] **Step 7: Re-run tests**

Run: `npm run test -- src/api/votesApi.test.js`
Expected: all votesApi tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/api/votesApi.js src/api/votesApi.test.js
git commit -m "feat(api): drop wouldOrderAgain arg from votesApi.submitVote"
```

---

## Task 4: Update `useVote` hook — drop `wouldOrderAgain` parameter

**Files:**
- Modify: `src/hooks/useVote.js`
- Modify: `src/hooks/useVote.test.js`

**Context:** Current `submitVote` signature is `submitVote(dishId, wouldOrderAgain, rating10, reviewText, purityData, jitterData, jitterScore, badgeHash)`. Remove the second positional arg.

- [ ] **Step 1: Write the failing test**

Update `src/hooks/useVote.test.js`. Replace the submitVote signature test(s):

```javascript
it('calls votesApi.submitVote with positional args minus wouldOrderAgain', async () => {
  const submitSpy = vi.spyOn(votesApi, 'submitVote').mockResolvedValue({})
  const { result } = renderHook(() => useVote())

  await act(async () => {
    await result.current.submitVote('dish-1', 8.5, 'great review', null, null, null, null)
  })

  expect(submitSpy).toHaveBeenCalledWith({
    dishId: 'dish-1',
    rating10: 8.5,
    reviewText: 'great review',
    purityData: null,
    jitterData: null,
    jitterScore: null,
    badgeHash: null,
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/hooks/useVote.test.js`
Expected: FAIL — existing hook passes 8 positional args.

- [ ] **Step 3: Update the hook**

Edit `src/hooks/useVote.js`. Replace the `submitVote` declaration:

```javascript
const submitVote = useCallback(async (dishId, rating10, reviewText = null, purityData = null, jitterData = null, jitterScore = null, badgeHash = null) => {
  if (inFlightRef.current.has(dishId)) {
    return { success: false, error: 'Vote already in progress' }
  }

  try {
    inFlightRef.current.add(dishId)
    setSubmitting(true)
    setError(null)

    await votesApi.submitVote({
      dishId,
      rating10,
      reviewText,
      purityData,
      jitterData,
      jitterScore,
      badgeHash,
    })

    return { success: true }
  } catch (err) {
    logger.error('Error submitting vote:', err)
    setError(err.message)
    return { success: false, error: err.message }
  } finally {
    inFlightRef.current.delete(dishId)
    setSubmitting(inFlightRef.current.size > 0)
  }
}, [])
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm run test -- src/hooks/useVote.test.js`
Expected: PASS.

- [ ] **Step 5: Remove any remaining binary assertions from the test file**

Run: `grep -n "wouldOrderAgain\|would_order_again" src/hooks/useVote.test.js`
Delete any stale assertions.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useVote.js src/hooks/useVote.test.js
git commit -m "feat(hooks): drop wouldOrderAgain positional arg from useVote"
```

---

## Task 5: Clean up `authApi.getUserVoteForDish` projection

**Files:**
- Modify: `src/api/authApi.js`
- Modify: `src/api/authApi.test.js`

**Context:** `authApi.getUserVoteForDish` currently selects `would_order_again, rating_10, review_text, ...`. Callers (notably `ReviewFlow` pre-refactor) read `vote.would_order_again`. We want this to stop returning the binary field to the client so no UI code can accidentally read it — the column still exists, just isn't projected.

- [ ] **Step 1: Find the select string**

Run:
```bash
grep -n "would_order_again" src/api/authApi.js
```

- [ ] **Step 2: Remove `would_order_again` from the select and mapping**

Edit `src/api/authApi.js`. In `getUserVoteForDish`:
1. Drop `would_order_again` from the `.select(...)` string.
2. If the function maps the result (e.g., returns `{ would_order_again, rating_10, ... }`), remove `would_order_again` from the mapped output.

- [ ] **Step 3: Update `authApi.test.js` mocks**

Any mock that returns `would_order_again: true/false` from this method gets that field removed. Run:
```bash
grep -n "would_order_again" src/api/authApi.test.js
```
Delete or update these lines.

- [ ] **Step 4: Run auth API tests**

Run: `npm run test -- src/api/authApi.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/authApi.js src/api/authApi.test.js
git commit -m "feat(api): drop would_order_again from getUserVoteForDish projection"
```

---

## Task 6: Strip binary fields from `dishesApi.getDishById` + other projections

**Files:**
- Modify: `src/api/dishesApi.js`
- Modify: `src/api/dishesApi.test.js`

**Context:** `dishesApi.getDishById` (around line 472–486) does a `Promise.all` to count `yes_votes` alongside `hasVariants`. That count becomes dead code. Also, the `selectFields` strings and `.map()` transforms elsewhere in this file still project `percent_worth_it`, `yes_votes` from RPC returns — strip them.

- [ ] **Step 1: Read the current `getDishById` Promise.all**

Read `src/api/dishesApi.js:460–500`. Confirm the structure matches the spec (parallel yes-vote count + hasVariants check).

- [ ] **Step 2: Delete the yes-votes query**

Edit `src/api/dishesApi.js`. Replace the `Promise.all` block with a single `hasVariants` call:

```javascript
// Before:
const [yesVotesResult, hasVariantsResult] = await Promise.all([
  supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('dish_id', dishId)
    .eq('would_order_again', true),
  this.hasVariants(dishId),
])

const yesVotes = yesVotesResult.error ? 0 : (yesVotesResult.count || 0)
if (yesVotesResult.error) {
  logger.error('Error counting yes votes for dish:', yesVotesResult.error)
}

// After:
const hasVariantsResult = await this.hasVariants(dishId)
```

Then in the returned object at the end of `getDishById`, remove any `yesVotes` or `percent_worth_it` field. The returned shape should have `avg_rating`, `total_votes`, `has_variants`, and everything else — minus the binary-derived fields.

- [ ] **Step 3: Strip binary fields from other projections in `dishesApi.js`**

Run:
```bash
grep -n "yes_votes\|percent_worth_it\|would_order_again" src/api/dishesApi.js
```

For each match:
- If it's in a `selectFields` string, remove the field.
- If it's in a `.map()` transform that builds the outgoing shape, remove the mapping.
- Keep any internal logic that uses these columns for things like ranking math — `dish_search_score` etc. don't use them, so there shouldn't be any legitimate internal consumers.

- [ ] **Step 4: Update `dishesApi.test.js`**

Run:
```bash
grep -n "yes_votes\|percent_worth_it\|would_order_again" src/api/dishesApi.test.js
```
Delete assertions on those fields in the returned objects. Update mock Supabase responses if they include these fields.

- [ ] **Step 5: Run dishesApi tests**

Run: `npm run test -- src/api/dishesApi.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/api/dishesApi.js src/api/dishesApi.test.js
git commit -m "feat(api): strip binary-derived fields from dishesApi projections

Removes dead yes-vote count query in getDishById. Removes
percent_worth_it / yes_votes / would_order_again from selectFields
and .map() transforms across dishesApi."
```

---

## Task 7: Strip binary fields from `followsApi` and `votesApi` read methods

**Files:**
- Modify: `src/api/followsApi.js`
- Modify: `src/api/votesApi.js` (read methods only — write method was done in Task 3)

**Context:** Friends-votes methods project `would_order_again` from RPC responses. Remove from their mapped outputs.

- [ ] **Step 1: Find all binary references in followsApi and votesApi read paths**

Run:
```bash
grep -n "would_order_again\|percent_worth_it\|yes_votes" src/api/followsApi.js src/api/votesApi.js
```

- [ ] **Step 2: Strip from projections**

For each match in `followsApi.js` (notably `getFriendsVotesForDish`, `getFriendsVotesForRestaurant`) and the read methods in `votesApi.js` (notably `getUserVotes`, `getReviews`):
- Remove from `.select(...)` strings.
- Remove from `.map()` transform outputs.

Note: the RPCs still return these fields during Phase 1. We're just choosing not to forward them to the app layer.

- [ ] **Step 3: Run tests**

```bash
npm run test -- src/api/
```
Expected: PASS. Update any test mocks that still include the stripped fields.

- [ ] **Step 4: Commit**

```bash
git add src/api/followsApi.js src/api/votesApi.js
git commit -m "feat(api): strip binary fields from followsApi + votesApi read projections"
```

---

## Task 8: Delete `ranking.js` binary-derived utilities

**Files:**
- Modify: `src/utils/ranking.js`

**Context:** Four functions are dead post-removal: `calculatePercentWorthIt`, `calculateWorthItScore10`, `getPercentColor`, `getWorthItBadge`. Keep `formatScore10`, `getRatingColor`, `getConfidenceLevel`, `getConfidenceIndicator` — those work off rating + total votes.

- [ ] **Step 1: Find callers before deletion**

Run:
```bash
grep -rn "calculatePercentWorthIt\|calculateWorthItScore10\|getPercentColor\|getWorthItBadge" src/
```

Note every file that calls these. They'll be fixed in later tasks (DishListItem, DishHero, DishEvidence, ChampionCard, RestaurantMap). The display-component tasks (12–19) remove the callers; this task just removes the functions themselves.

- [ ] **Step 2: Delete the four functions**

Edit `src/utils/ranking.js`. Delete:
- `calculatePercentWorthIt` (lines 7–10)
- `calculateWorthItScore10` (lines 17–19)
- `getPercentColor` (lines 50–78)
- `getWorthItBadge` (lines 86–119)

Keep everything else.

- [ ] **Step 3: Verify no callers remain after display-component tasks finish**

This task temporarily leaves broken imports. That's expected — the display tasks (Tasks 14–20) will fix them. Run a build to confirm nothing EXTERNAL to that task set still imports these:

```bash
npm run build 2>&1 | grep -E "calculatePercentWorthIt|calculateWorthItScore10|getPercentColor|getWorthItBadge"
```

Expected: only the files listed in Tasks 14–20 (DishListItem, ChampionCard, DishHero, DishEvidence, RestaurantMap, RestaurantMenu, RestaurantDishes) show as broken. If other files show, expand Task 14–20 scope to include them.

**Ordering note:** commit this task's deletions AFTER Tasks 14–20 have removed the callers, so the branch never has a broken-build commit. Alternatively, sequence 14 → 15 → 16 → 17 → 18 → 19 → 20 → 8, updating callers first. The task numbering here reflects logical dependency, not required commit order.

- [ ] **Step 4: Commit**

```bash
git add src/utils/ranking.js
git commit -m "refactor(ranking): delete binary-derived helpers

calculatePercentWorthIt, calculateWorthItScore10, getPercentColor,
getWorthItBadge deleted. Display callers updated in subsequent tasks."
```

---

## Task 9: Rewrite `ReviewFlow.jsx` — single-screen rate, no thumbs

**Files:**
- Modify: `src/components/ReviewFlow.jsx`

**Context:** This is the largest single file change. Current behavior: two-step flow with thumbs (step 1) → rating + review + photo (step 2). New behavior: single screen with rating slider (null-default, submit disabled until touched), collapsed optional review, collapsed optional photo, submit button. No thumbs anywhere.

The existing file is ~550 lines. Read `src/components/ReviewFlow.jsx` in full before editing.

- [ ] **Step 1: Read the current file end-to-end**

```bash
wc -l src/components/ReviewFlow.jsx
```

Read all of it. Pay attention to:
- The `step` state (1 = thumbs, 2 = rating) and its `useEffect`s for localStorage/pending-vote
- The `pendingVote` state that carries the boolean
- The `userVote` state that represents the user's prior answer
- The post-login continuation logic (lines 95–116)
- The "already voted - show summary" block (lines 304–405)
- The analytics `capture('vote_cast', { ... would_order_again: voteToSubmit ... })` call (line 245–257)

- [ ] **Step 2: Replace the file contents**

Overwrite `src/components/ReviewFlow.jsx` with:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { capture } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'
import { useVote } from '../hooks/useVote'
import { usePurityTracker } from '../hooks/usePurityTracker'
import JitterBox from '../utils/jitter-box'
import { jitterApi } from '../api/jitterApi'
import { authApi } from '../api/authApi'
import { FoodRatingSlider } from './FoodRatingSlider'
import { MAX_REVIEW_LENGTH } from '../constants/app'
import {
  getPendingVoteFromStorage,
  clearPendingVoteStorage,
} from '../lib/storage'
import { logger } from '../utils/logger'
import { hapticLight, hapticSuccess } from '../utils/haptics'
import { PhotoUploadButton } from './PhotoUploadButton'
import { setBackButtonInterceptor, clearBackButtonInterceptor } from '../utils/backButtonInterceptor'
import { validateUserContent } from '../lib/reviewBlocklist'

// Single-screen rating flow.
// - Slider defaults to null; submit stays disabled until the user touches it.
// - Review + photo are optional and collapsed by default.
// - No "would you order again?" step. Rating alone is the signal.
export function ReviewFlow({
  dishId,
  dishName,
  restaurantId,
  restaurantName,
  category,
  price,
  totalVotes = 0,
  isRanked = false,
  hasPhotos = false,
  existingPhotoUrl = null,
  onVote,
  onLoginRequired,
  onPhotoUploaded,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { submitVote, submitting } = useVote()
  const { getPurity, getJitterProfile, attachToTextarea, reset: resetPurity } = usePurityTracker()
  const jitterBoxRef = useRef(null)

  // Prior-vote state: used to prefill and to decide "Update" vs "Submit" label.
  const [priorRating, setPriorRating] = useState(null)
  const [priorReviewText, setPriorReviewText] = useState(null)

  // Form state.
  // sliderValue = null means "unrated" — submit button stays disabled.
  const [sliderValue, setSliderValue] = useState(null)
  const [reviewExpanded, setReviewExpanded] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewError, setReviewError] = useState(null)

  const [photoExpanded, setPhotoExpanded] = useState(false)
  const [photoAdded, setPhotoAdded] = useState(false)
  const [existingPhotoAction, setExistingPhotoAction] = useState('keep') // keep | replace | remove

  const [announcement, setAnnouncement] = useState('')
  const reviewTextareaRef = useRef(null)

  const combinedTextareaRef = (el) => {
    reviewTextareaRef.current = el
    attachToTextarea(el)
  }

  const isUpdate = priorRating !== null
  const hasDraft =
    (sliderValue !== null && sliderValue !== priorRating) ||
    (reviewText.trim() && reviewText.trim() !== (priorReviewText || '')) ||
    photoAdded ||
    existingPhotoAction !== 'keep'

  // Load prior vote (if any) to prefill.
  useEffect(() => {
    async function fetchUserVote() {
      if (!user) {
        setPriorRating(null)
        setPriorReviewText(null)
        return
      }
      try {
        const vote = await authApi.getUserVoteForDish(dishId, user.id)
        if (vote) {
          setPriorRating(vote.rating_10)
          setPriorReviewText(vote.review_text || null)
          if (vote.rating_10 != null) setSliderValue(vote.rating_10)
          if (vote.review_text) {
            setReviewText(vote.review_text)
            setReviewExpanded(true)
          }
        }
      } catch (error) {
        logger.error('Error fetching user vote:', error)
      }
    }
    fetchUserVote()
  }, [dishId, user])

  // Clear any stale pending-vote localStorage from the old thumbs-first flow.
  useEffect(() => {
    const stored = getPendingVoteFromStorage()
    if (stored && stored.dishId === dishId) {
      clearPendingVoteStorage()
    }
  }, [dishId])

  // Attach JitterBox to textarea when expanded.
  useEffect(() => {
    if (reviewExpanded && reviewTextareaRef.current && !jitterBoxRef.current) {
      jitterBoxRef.current = JitterBox.attach(reviewTextareaRef.current)
    }
    return () => {
      if (jitterBoxRef.current) {
        jitterBoxRef.current.detach()
        jitterBoxRef.current = null
      }
    }
  }, [reviewExpanded])

  // Intercept browser back during unsaved drafts: prompt before leaving.
  useEffect(() => {
    if (!hasDraft) {
      clearBackButtonInterceptor()
      return
    }
    setBackButtonInterceptor(() => {
      if (window.confirm('Discard draft?')) {
        clearBackButtonInterceptor()
        window.history.back()
      }
    })
    return () => clearBackButtonInterceptor()
  }, [hasDraft])

  const handleSubmit = async () => {
    if (sliderValue === null) return // safety guard — button should already be disabled
    if (!user) {
      onLoginRequired?.()
      return
    }

    // Review validation
    if (reviewText.length > MAX_REVIEW_LENGTH) {
      setReviewError(`${reviewText.length - MAX_REVIEW_LENGTH} characters over limit`)
      return
    }
    if (reviewText.trim()) {
      const contentError = validateUserContent(reviewText, 'Review')
      if (contentError) {
        setReviewError(contentError)
        return
      }
    }
    setReviewError(null)

    if (sliderValue < 0 || sliderValue > 10) {
      logger.error('Invalid rating value:', sliderValue)
      return
    }

    const reviewTextToSubmit = reviewText.trim() || null

    const badge = reviewTextToSubmit && jitterBoxRef.current ? jitterBoxRef.current.score() : null
    const purityData = badge ? { purity: badge.purity } : (reviewTextToSubmit ? getPurity() : null)
    const jitterData = badge ? badge.profile : (reviewTextToSubmit ? getJitterProfile() : null)
    const jitterScore = badge
      ? { score: badge.war, flags: badge.flags, classification: badge.classification }
      : null

    const attestResult = jitterScore && user
      ? await jitterApi.attestReview({
          userId: user.id,
          warScore: jitterScore.score,
          classification: jitterScore.classification,
          flags: jitterScore.flags,
          meta: {
            keys: badge?.session?.keystrokes || 0,
            paste_chars: badge?.session?.pasteChars || 0,
            focus_ms: badge?.session?.duration ? badge.session.duration * 1000 : 0,
          },
        })
      : null
    const badgeHash = attestResult?.badge_hash || null

    const result = await submitVote(dishId, sliderValue, reviewTextToSubmit, purityData, jitterData, jitterScore, badgeHash)

    if (!result.success) {
      logger.error('Vote submission failed:', result.error)
      setReviewError(result.error || 'Unable to submit your rating. Please try again.')
      return
    }

    // Analytics: dual-emit during the transition window so PostHog funnels
    // that key on the old event properties keep reporting.
    // Old event (deprecated next release): includes would_order_again
    capture('vote_cast', {
      dish_id: dishId,
      dish_name: dishName,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      category,
      price: price != null ? Number(price) : null,
      would_order_again: sliderValue >= 7.0, // derived for compat
      rating: sliderValue,
      has_review: !!reviewTextToSubmit,
      has_photo: photoAdded,
      is_update: isUpdate,
      binary_removed: true,
    })
    // New event (canonical going forward)
    capture('rating_submitted', {
      dish_id: dishId,
      dish_name: dishName,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      category,
      price: price != null ? Number(price) : null,
      rating: sliderValue,
      has_review: !!reviewTextToSubmit,
      has_photo: photoAdded,
      is_update: isUpdate,
      binary_removed: true,
    })

    setPriorRating(sliderValue)
    if (reviewTextToSubmit) setPriorReviewText(reviewTextToSubmit)
    setPhotoAdded(false)
    setReviewError(null)
    resetPurity()
    if (jitterBoxRef.current) jitterBoxRef.current.reset()

    hapticSuccess()
    setAnnouncement('Rating saved')
    setTimeout(() => setAnnouncement(''), 1000)

    onVote?.()
  }

  const canSubmit = sliderValue !== null && !submitting && reviewText.length <= MAX_REVIEW_LENGTH
  const submitLabel = submitting ? 'Saving…' : isUpdate ? 'Update rating' : 'Submit rating'

  return (
    <div className="space-y-4">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Rating slider — the single required input. */}
      <FoodRatingSlider
        value={sliderValue ?? 0}
        unrated={sliderValue === null}
        onChange={(v) => {
          setSliderValue(v)
          hapticLight()
        }}
        min={0}
        max={10}
        step={0.1}
        category={category}
      />

      {!isRanked && sliderValue === null && (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          {totalVotes === 0
            ? 'Be the first to rate this dish.'
            : `${totalVotes} rating${totalVotes === 1 ? '' : 's'} so far · ${Math.max(0, 5 - totalVotes)} more to rank`}
        </p>
      )}

      {/* Review — collapsed by default */}
      {!reviewExpanded ? (
        <button
          type="button"
          onClick={() => setReviewExpanded(true)}
          className="w-full py-3 text-sm rounded-xl transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px dashed var(--color-divider)' }}
        >
          + Add a review (optional)
        </button>
      ) : (
        <div className="relative">
          <label htmlFor="review-text" className="sr-only">Your review</label>
          <textarea
            ref={combinedTextareaRef}
            id="review-text"
            value={reviewText}
            onChange={(e) => {
              setReviewText(e.target.value)
              if (reviewError) setReviewError(null)
            }}
            placeholder="What stood out?"
            aria-label="Write your review"
            aria-describedby={reviewError ? 'review-error' : 'review-char-count'}
            aria-invalid={!!reviewError}
            maxLength={MAX_REVIEW_LENGTH + 50}
            rows={3}
            className="w-full p-4 rounded-xl text-sm resize-none focus:outline-none focus-ring"
            style={{
              background: 'var(--color-surface-elevated)',
              border: reviewError ? '2px solid var(--color-primary)' : '1px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
            }}
          />
          {reviewText.length > 0 && (
            <div id="review-char-count" className="absolute bottom-2 right-3 text-xs"
              style={{ color: reviewText.length > MAX_REVIEW_LENGTH ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
              {reviewText.length}/{MAX_REVIEW_LENGTH}
            </div>
          )}
          {reviewError && (
            <p id="review-error" role="alert" className="text-sm text-center mt-1" style={{ color: 'var(--color-primary)' }}>
              {reviewError}
            </p>
          )}
        </div>
      )}

      {/* Photo — collapsed by default; if user had a prior photo, show thumbnail + keep/replace/remove. */}
      {existingPhotoUrl && !photoAdded ? (
        <div className="p-3 rounded-xl space-y-2" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-divider)' }}>
          <div className="flex items-center gap-3">
            <img src={existingPhotoUrl} alt="Your existing photo" className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Your photo</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setExistingPhotoAction('keep')}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{
                    background: existingPhotoAction === 'keep' ? 'var(--color-primary)' : 'transparent',
                    color: existingPhotoAction === 'keep' ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-divider)',
                  }}>Keep</button>
                <button type="button" onClick={() => { setExistingPhotoAction('replace'); setPhotoExpanded(true) }}
                  className="text-xs px-2 py-1 rounded-md" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-divider)' }}>
                  Replace
                </button>
                <button type="button" onClick={() => setExistingPhotoAction('remove')}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{
                    background: existingPhotoAction === 'remove' ? 'var(--color-danger)' : 'transparent',
                    color: existingPhotoAction === 'remove' ? 'var(--color-text-on-primary)' : 'var(--color-danger)',
                    border: '1px solid var(--color-divider)',
                  }}>Remove</button>
              </div>
            </div>
          </div>
          {existingPhotoAction === 'replace' && photoExpanded && (
            <PhotoUploadButton
              dishId={dishId}
              onPhotoUploaded={(photo) => {
                setPhotoAdded(true)
                onPhotoUploaded?.(photo)
              }}
              onLoginRequired={onLoginRequired}
            />
          )}
        </div>
      ) : !photoExpanded && !photoAdded ? (
        <button
          type="button"
          onClick={() => setPhotoExpanded(true)}
          className="w-full py-3 text-sm rounded-xl transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px dashed var(--color-divider)' }}
        >
          + Add a photo (optional)
        </button>
      ) : photoAdded ? (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-success-muted)', border: '1px solid var(--color-success-border)' }}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-success)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>Photo added</span>
        </div>
      ) : (
        <PhotoUploadButton
          dishId={dishId}
          onPhotoUploaded={(photo) => {
            setPhotoAdded(true)
            onPhotoUploaded?.(photo)
          }}
          onLoginRequired={onLoginRequired}
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-4 px-6 rounded-xl font-semibold shadow-lg transition-all duration-200 ease-out focus-ring ${canSubmit ? 'active:scale-98 hover:shadow-xl' : 'opacity-50 cursor-not-allowed'}`}
        style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
      >
        {submitLabel}
      </button>

      {restaurantId && !hasDraft && isUpdate && (
        <button
          onClick={() => navigate('/restaurants/' + restaurantId + '/rate')}
          className="w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98]"
          style={{ background: 'var(--color-primary-muted)', border: '1px solid var(--color-primary)' }}
        >
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
              Had more at {restaurantName || 'this restaurant'}?
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Rate your whole meal in one go
            </p>
          </div>
        </button>
      )}
    </div>
  )
}
```

**Important notes when editing:**
- The existing `FoodRatingSlider` may not accept an `unrated` prop. Check `src/components/FoodRatingSlider.jsx`. If it doesn't, add one that renders a muted track with no value indicator when `unrated===true`. That's a small additive change.
- Props `yesVotes`, `percentWorthIt`, `hasPhotos` may be passed in by callers — audit parents (Task 10 covers `Dish.jsx`). `yesVotes` and `percentWorthIt` are dropped here. `hasPhotos` is kept (used for "add a photo" prompt logic, though post-refactor we no longer use it — if it ends up fully unused after callers are fixed, remove it too).
- `ThumbsUpIcon` and `ThumbsDownIcon` imports are gone. If no other file imports these components, delete the component files in Task 26 cleanup.

- [ ] **Step 3: Check `FoodRatingSlider` for unrated support**

Run:
```bash
grep -n "unrated" src/components/FoodRatingSlider.jsx
```
If no match, add an `unrated` prop that, when true, styles the track as muted (e.g., `var(--color-text-tertiary)` background, no filled segment) and hides the value label. Example additive change:

```jsx
// In FoodRatingSlider, near the filled-track styling:
const trackFill = unrated ? 'var(--color-divider)' : `linear-gradient(...existing...)`
```

- [ ] **Step 4: Run the app in dev mode and manually verify**

Run: `npm run dev`

Navigate to a dish page. Confirm:
1. Submit button is disabled on first load (slider unrated).
2. Touching slider enables submit.
3. "Add a review" button expands textarea; text counts correctly.
4. "Add a photo" button expands upload; upload shows "Photo added."
5. If you already voted this dish (log in as a user with a vote), the flow prefills with prior rating/review and the button says "Update rating."

- [ ] **Step 5: Commit**

```bash
git add src/components/ReviewFlow.jsx src/components/FoodRatingSlider.jsx
git commit -m "feat(vote-flow): single-screen ReviewFlow, remove thumbs step

Slider defaults unrated; submit disabled until touched. Review + photo
collapsed behind optional expand buttons. Prior votes prefill with
Keep/Replace/Remove photo options. No more step 1 binary."
```

---

## Task 10: Add "Rate this dish" CTA to `Dish.jsx`, remove inline voting

**Files:**
- Modify: `src/pages/Dish.jsx`

**Context:** Currently `Dish.jsx` renders `ReviewFlow` inline on the detail page. New behavior: dish detail is read-only by default; a primary "Rate this dish" (or "Update your rating" if the user has a vote) CTA button opens `ReviewFlow` in a modal or full-screen overlay.

- [ ] **Step 1: Read current Dish.jsx structure**

Read `src/pages/Dish.jsx` in full. Identify:
- Where `ReviewFlow` is rendered (grep: `<ReviewFlow`)
- Which props it currently receives, especially `yesVotes` and `percentWorthIt` which we've already removed from dishesApi
- The `useAuth` usage and `LoginModal` pattern (cross-check with `Browse.jsx` for the canonical auth-gate pattern per CLAUDE.md §1.6)

- [ ] **Step 2: Replace inline ReviewFlow with CTA + overlay**

High-level change:
1. Remove the inline `<ReviewFlow ... />` render.
2. Add a `showRateFlow` state, initially `false`.
3. Add a primary CTA button that says `priorRating !== null ? 'Update your rating' : 'Rate this dish'`.
4. Tapping the CTA:
   - If `!user`, open `LoginModal` and remember "next action = open rate flow." After successful login, set `showRateFlow = true`.
   - If `user`, set `showRateFlow = true`.
5. Render `<ReviewFlow ... />` inside a full-screen modal/sheet when `showRateFlow === true`. Close it when `onVote` fires or user taps close.

Example addition (adapt to the real Dish.jsx structure):

```jsx
// Inside Dish component
const { user } = useAuth()
const [showRateFlow, setShowRateFlow] = useState(false)
const [pendingAction, setPendingAction] = useState(null) // 'rate' | null

// Fetch prior vote to decide CTA label + prefill photo
const [priorVote, setPriorVote] = useState(null)
useEffect(() => {
  if (!user) { setPriorVote(null); return }
  authApi.getUserVoteForDish(dishId, user.id).then(setPriorVote).catch(() => {})
}, [dishId, user])

const handleRateClick = () => {
  if (!user) {
    setPendingAction('rate')
    setShowLoginModal(true)
    return
  }
  setShowRateFlow(true)
}

useEffect(() => {
  if (user && pendingAction === 'rate') {
    setPendingAction(null)
    setShowRateFlow(true)
  }
}, [user, pendingAction])

// In JSX — replace the inline ReviewFlow render:
<button
  type="button"
  onClick={handleRateClick}
  className="w-full py-4 px-6 rounded-xl font-semibold shadow-lg focus-ring active:scale-98"
  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
>
  {priorVote ? 'Update your rating' : 'Rate this dish'}
</button>

{showRateFlow && (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-50 overflow-y-auto p-4"
    style={{ background: 'var(--color-bg)' }}
  >
    <button
      type="button"
      onClick={() => setShowRateFlow(false)}
      aria-label="Close"
      className="absolute top-4 right-4 p-2"
      style={{ color: 'var(--color-text-secondary)' }}
    >×</button>
    <div className="max-w-md mx-auto pt-12">
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        {priorVote ? 'Update your rating' : dishName}
      </h2>
      <ReviewFlow
        dishId={dishId}
        dishName={dishName}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        category={category}
        price={price}
        totalVotes={totalVotes}
        isRanked={isRanked}
        existingPhotoUrl={priorVote?.photo_url || null}
        onVote={() => {
          setShowRateFlow(false)
          refetch?.() // whatever the existing data refresh is
        }}
        onLoginRequired={() => setShowLoginModal(true)}
        onPhotoUploaded={(photo) => refetch?.()}
      />
    </div>
  </div>
)}
```

**Adapt to reality:**
- If `Dish.jsx` uses a different modal component (e.g., a project-local `BottomSheet` or `Modal`), use that instead of a custom div.
- Preserve any existing structure like breadcrumbs, hero, stats, evidence. We're *only* changing the inline `<ReviewFlow>` site to a CTA + overlay.

- [ ] **Step 3: Delete props that were binary-derived**

Remove `yesVotes`, `percentWorthIt` from ReviewFlow's prop list (already handled in Task 9's signature).

- [ ] **Step 4: Build + dev test**

```bash
npm run build
npm run dev
```

Navigate to a dish page logged out. Confirm:
1. No inline voting UI.
2. "Rate this dish" CTA shows.
3. Tap → LoginModal opens.
4. After login → rate flow opens.
5. Logged-in user with prior vote sees "Update your rating" CTA.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dish.jsx
git commit -m "feat(dish): read-only dish detail + Rate this dish CTA

Inline ReviewFlow replaced with a primary CTA that opens the rate flow
in an overlay. CTA label reflects prior-vote state. Auth gate
preserves intent so login returns directly into the rate flow."
```

---

## Task 11: Strip thumbs from `BatchRatingCard` (Rate Your Meal)

**Files:**
- Modify: `src/components/rate-meal/BatchRatingCard.jsx`

**Context:** Batch card currently has "Worth ordering again?" Yes/No buttons + 1–10 slider. Remove the Yes/No buttons and `wouldOrderAgain` state/prop.

- [ ] **Step 1: Read the file**

```bash
wc -l src/components/rate-meal/BatchRatingCard.jsx
cat src/components/rate-meal/BatchRatingCard.jsx | head -150
```

- [ ] **Step 2: Delete thumbs UI and state**

Edit `BatchRatingCard.jsx`:
1. Remove `wouldOrderAgain` state (`useState`) and its setter.
2. Remove the "Worth ordering again?" label and the Yes/No button grid (roughly lines 102–128 per the inventory, but verify against current code).
3. Remove `wouldOrderAgain` from the component's props AND from any `onChange` callback shape it emits. The emitted card data should be `{ dishId, rating, reviewText, photo }` only.

- [ ] **Step 3: Update the parent (`RateYourMeal.jsx`) to drop the field**

Run:
```bash
grep -n "wouldOrderAgain" src/pages/RateYourMeal.jsx
```
For each match:
- If it's part of per-card state, delete it.
- If it's passed to `votesApi.submitVote`, confirm the submitVote call now uses only `{ dishId, rating10, reviewText, ... }` (Task 3 already updated submitVote).

- [ ] **Step 4: Delete summary-screen thumbs column**

In `RateYourMeal.jsx` summary screen (Screen 3 per spec), find any rendering of thumbs/yes-no summary per dish. Replace with just the rating number.

- [ ] **Step 5: Build + dev test**

```bash
npm run build
npm run dev
```
Navigate to `/restaurants/<id>/rate`. Select 2 dishes. Rate each (slider only, no thumbs). Confirm summary shows rating numbers only. Submit.

- [ ] **Step 6: Commit**

```bash
git add src/components/rate-meal/BatchRatingCard.jsx src/pages/RateYourMeal.jsx
git commit -m "feat(rate-meal): drop thumbs from BatchRatingCard and summary"
```

---

## Task 12: Profile shelf collapse — one "My Ratings" shelf

**Files:**
- Modify: `src/pages/UserProfile.jsx`
- Modify: `src/pages/Profile.jsx` (if it has similar split)

**Context:** `UserProfile.jsx` (lines 342–406 per inventory) splits votes into `worthItVotes` (where `would_order_again === true`) and `avoidVotes` (false). New behavior: single `myRatings` array, sorted by most recent first.

- [ ] **Step 1: Read current shelf code**

```bash
grep -n "worthItVotes\|avoidVotes\|would_order_again" src/pages/UserProfile.jsx
```

Read the relevant block.

- [ ] **Step 2: Replace the split with a single sorted list**

Edit `src/pages/UserProfile.jsx`. Replace:

```jsx
// Before (conceptual):
const worthItVotes = votes.filter(v => v.would_order_again === true)
const avoidVotes = votes.filter(v => v.would_order_again === false)
// ... shelf UI renders two tabs: "Worth It" / "Avoid"
```

With:

```jsx
const myRatings = votes.slice().sort((a, b) => {
  const aDate = new Date(a.created_at || a.updated_at || 0).getTime()
  const bDate = new Date(b.created_at || b.updated_at || 0).getTime()
  return bDate - aDate
})
// Shelf UI renders a single "My Ratings" list.
```

(Per CLAUDE.md §1.1: `slice().sort()`, never `toSorted()`.)

- [ ] **Step 3: Update shelf UI**

Replace the tab-switcher UI with a single shelf title. If `ShelfFilter` component exists and is used, either drop it entirely for this page or trim its options down to what's meaningful without the binary split.

- [ ] **Step 4: Grep for dangling references**

```bash
grep -rn "worthItVotes\|avoidVotes" src/
```
Delete or rename any remaining references.

- [ ] **Step 5: Clean up `Profile.jsx` mock data**

```bash
grep -n "yes_votes\|would_order_again" src/pages/Profile.jsx
```
Remove these from mock objects.

- [ ] **Step 6: Build + dev test**

```bash
npm run build
npm run dev
```
Navigate to your profile. Confirm single "My Ratings" shelf, most recent first.

- [ ] **Step 7: Commit**

```bash
git add src/pages/UserProfile.jsx src/pages/Profile.jsx
git commit -m "feat(profile): collapse Worth It / Avoid shelves into My Ratings"
```

---

## Task 13: Update `JournalCard` — rating color cue, drop opacity mute

**Files:**
- Modify: `src/components/profile/JournalCard.jsx`
- Modify: `src/components/profile/JournalCard.test.jsx`
- Modify: `src/components/profile/JournalFeed.jsx`
- Modify: `src/components/profile/JournalFeed.test.jsx`

**Context:** JournalCard dims the whole card when `would_order_again === false`. Replace with rating-number color: green for 8+, neutral for 5–7, muted red for <5.

- [ ] **Step 1: Read the card**

```bash
grep -n "would_order_again\|opacity" src/components/profile/JournalCard.jsx
```

- [ ] **Step 2: Write the failing test**

Update `src/components/profile/JournalCard.test.jsx`. Replace opacity-based assertions with color-based ones:

```jsx
import { render } from '@testing-library/react'
import { JournalCard } from './JournalCard'

describe('JournalCard', () => {
  it('renders rating number in green when rating >= 8', () => {
    const vote = { id: 'v1', rating_10: 8.5, created_at: '2026-04-01', dish: { name: 'Test', restaurant: { name: 'R' } } }
    const { getByTestId } = render(<JournalCard vote={vote} />)
    const rating = getByTestId('journal-card-rating')
    // Green threshold
    expect(rating.style.color).toContain('rgb')  // or match against var(--color-green-deep) if style is inline
  })

  it('does not apply opacity muting regardless of rating', () => {
    const vote = { id: 'v1', rating_10: 4.0, created_at: '2026-04-01', dish: { name: 'Test', restaurant: { name: 'R' } } }
    const { container } = render(<JournalCard vote={vote} />)
    const card = container.firstChild
    expect(card.style.opacity).not.toBe('0.5')
  })
})
```

- [ ] **Step 3: Run the test to verify failure**

```bash
npm run test -- src/components/profile/JournalCard.test.jsx
```
Expected: FAIL.

- [ ] **Step 4: Update the component**

Edit `src/components/profile/JournalCard.jsx`:
1. Remove any prop destructuring of `wouldOrderAgain` or `would_order_again`.
2. Remove the opacity muting on the card wrapper.
3. Add `color` on the rating number element, using `getRatingColor(rating_10)` from `src/utils/ranking.js`.
4. Add `data-testid="journal-card-rating"` to the rating element.

Example:

```jsx
import { getRatingColor, formatScore10 } from '../../utils/ranking'

// In JSX:
<span
  data-testid="journal-card-rating"
  style={{ color: getRatingColor(vote.rating_10), fontWeight: 700 }}
>
  {formatScore10(vote.rating_10)}
</span>
```

- [ ] **Step 5: Run the test, verify passing**

```bash
npm run test -- src/components/profile/JournalCard.test.jsx
```
Expected: PASS.

- [ ] **Step 6: Update `JournalFeed` + its test**

```bash
grep -n "would_order_again\|wouldOrderAgain" src/components/profile/JournalFeed.jsx src/components/profile/JournalFeed.test.jsx
```
Remove references. JournalFeed likely just iterates and renders cards — if it has its own binary filtering, remove.

- [ ] **Step 7: Commit**

```bash
git add src/components/profile/
git commit -m "feat(journal): rating color cue replaces opacity mute"
```

---

## Task 14: Clean up `DishListItem` — no binary display

**Files:**
- Modify: `src/components/DishListItem.jsx`

**Context:** The canonical dish-row component. All three variants (ranked, voted, compact) should no longer reference `wouldOrderAgain`, `percent_worth_it`, or `yes_votes`.

- [ ] **Step 1: Find references**

```bash
grep -n "wouldOrderAgain\|would_order_again\|percent_worth_it\|yes_votes" src/components/DishListItem.jsx
```

- [ ] **Step 2: Remove props + display**

For each reference:
- Prop: delete from destructuring at function signature and from any `.propTypes` / TS declaration.
- Display: delete the JSX that renders the binary-derived field.
- Pass-through: update parent callers (grep for `<DishListItem` usage) to stop passing these props.

- [ ] **Step 3: Build + visual check**

```bash
npm run build
npm run dev
```
Open home (list mode), browse, restaurant detail. Each should render dish rows with rating + vote count only.

- [ ] **Step 4: Commit**

```bash
git add src/components/DishListItem.jsx
git commit -m "feat(list-item): drop binary-derived display from DishListItem variants"
```

---

## Task 15: Update `ChampionCard` — vote count replaces % reorder

**Files:**
- Modify: `src/components/home/ChampionCard.jsx`

**Context:** Lines 15 + 113 per inventory derive and display "X% would reorder." Replace with vote count.

- [ ] **Step 1: Read the current card**

```bash
cat src/components/home/ChampionCard.jsx
```

- [ ] **Step 2: Replace the % reorder line with vote count**

Delete:
- The `yes_votes` / `total_votes` → `percent` computation.
- The "would reorder" text + its surrounding element.

Add (where the line was):

```jsx
<span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
  {totalVotes} rating{totalVotes === 1 ? '' : 's'}
</span>
```

- [ ] **Step 3: Build + visual check**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/home/ChampionCard.jsx
git commit -m "feat(home): ChampionCard shows vote count instead of % reorder"
```

---

## Task 16: Strip reorder % bar from `DishHero`

**Files:**
- Modify: `src/components/dish/DishHero.jsx`

**Context:** Lines 130–146 per inventory — colored progress bar showing reorder %.

- [ ] **Step 1: Find and delete**

```bash
grep -n "percent_worth_it\|percentWorthIt\|getPercentColor\|would order\|reorder" src/components/dish/DishHero.jsx
```

Delete the entire "reorder % bar" block. Keep the rest of the hero (name, photo, rating, vote count).

- [ ] **Step 2: Commit**

```bash
git add src/components/dish/DishHero.jsx
git commit -m "feat(dish-hero): remove reorder % bar"
```

---

## Task 17: Strip thumbs chips from `DishEvidence`

**Files:**
- Modify: `src/components/dish/DishEvidence.jsx`

**Context:** Line 268 per inventory — "Would order again / Would skip" chips. Also, review snippets currently show thumbs next to them; drop that too.

- [ ] **Step 1: Find and delete**

```bash
grep -n "Would order\|Would skip\|wouldOrderAgain\|ThumbsUp\|ThumbsDown\|would_order_again" src/components/dish/DishEvidence.jsx
```

Delete:
- The "Would order / Would skip" chip UI.
- The `ThumbsUpIcon` / `ThumbsDownIcon` inline rendering next to review snippets.

- [ ] **Step 2: Commit**

```bash
git add src/components/dish/DishEvidence.jsx
git commit -m "feat(dish-evidence): remove thumbs chips and inline snippet thumbs"
```

---

## Task 18: Strip percent from `RestaurantMap` pin popups

**Files:**
- Modify: `src/components/restaurants/RestaurantMap.jsx`

**Context:** Line 894 per inventory — popup shows `percent_worth_it`.

- [ ] **Step 1: Find and delete**

```bash
grep -n "percent_worth_it\|percentWorthIt\|would_order_again" src/components/restaurants/RestaurantMap.jsx
```

Remove the binary-derived popup content. Popup should show dish name, rating, vote count.

- [ ] **Step 2: Commit**

```bash
git add src/components/restaurants/RestaurantMap.jsx
git commit -m "feat(map): strip percent_worth_it from pin popups"
```

---

## Task 19: Fix sort order in `RestaurantMenu` and `RestaurantDishes`

**Files:**
- Modify: `src/components/restaurants/RestaurantMenu.jsx`
- Modify: `src/components/restaurants/RestaurantDishes.jsx`

**Context:** Both components sort by `avg_rating DESC` primary + `percent_worth_it DESC` tiebreaker. Spec says: tiebreaker becomes `total_votes DESC`.

- [ ] **Step 1: Find the sort**

```bash
grep -n "percent_worth_it" src/components/restaurants/RestaurantMenu.jsx src/components/restaurants/RestaurantDishes.jsx
```

- [ ] **Step 2: Replace tiebreaker**

In both files, find the sort comparator (probably something like):

```javascript
.slice().sort((a, b) => {
  if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating
  return b.percent_worth_it - a.percent_worth_it
})
```

Replace with:

```javascript
.slice().sort((a, b) => {
  if (b.avg_rating !== a.avg_rating) return (b.avg_rating || 0) - (a.avg_rating || 0)
  return (b.total_votes || 0) - (a.total_votes || 0)
})
```

- [ ] **Step 3: Also remove inline "% reorder" display if any**

```bash
grep -n "% reorder\|percent_worth_it" src/components/restaurants/RestaurantMenu.jsx src/components/restaurants/RestaurantDishes.jsx
```
Delete any display usages (e.g., `RestaurantMenu.jsx:377` inline `% reorder`).

- [ ] **Step 4: Build + visual check**

```bash
npm run build
npm run dev
```
Open a restaurant page. Confirm dishes sort sensibly; no "% reorder" text.

- [ ] **Step 5: Commit**

```bash
git add src/components/restaurants/RestaurantMenu.jsx src/components/restaurants/RestaurantDishes.jsx
git commit -m "feat(restaurant): sort tiebreaker by total_votes, drop % reorder"
```

---

## Task 20: Update `RestaurantReviews.jsx` — no thumbs next to reviews

**Files:**
- Modify: `src/pages/RestaurantReviews.jsx`

**Context:** Lines 219–221 per inventory — thumbs emoji next to each review.

- [ ] **Step 1: Find and delete**

```bash
grep -n "ThumbsUp\|ThumbsDown\|would_order_again\|wouldOrderAgain" src/pages/RestaurantReviews.jsx
```

Delete the thumbs rendering. Review row should show: dish name, rating, review text, date/user.

- [ ] **Step 2: Commit**

```bash
git add src/pages/RestaurantReviews.jsx
git commit -m "feat(reviews): drop thumbs column from restaurant reviews list"
```

---

## Task 21: Update OG share handler — rating-first description

**Files:**
- Modify: `api/share.ts`

**Context:** Lines 97–109 per current file read yes-vote count, compute percent, build "X% would order again" description. Replace with rating-first.

- [ ] **Step 1: Replace the vote-stats block**

Edit `api/share.ts` lines 91–115. Replace with:

```typescript
// Vote stats
const { count: totalVotes } = await supabase
  .from('votes')
  .select('*', { count: 'exact', head: true })
  .eq('dish_id', id)

// Fetch avg_rating from the dish row (pre-computed)
const { data: dishStats } = await supabase
  .from('dishes')
  .select('avg_rating, total_votes')
  .eq('id', id)
  .maybeSingle()

const effectiveVotes = dishStats?.total_votes ?? totalVotes ?? 0
const rating = dishStats?.avg_rating ? Number(dishStats.avg_rating).toFixed(1) : null

if (rating && effectiveVotes >= 5) {
  description = `${rating}/10 · ${effectiveVotes} ratings · ${town}`.replace(/\s·\s$/, '')
} else {
  description = `Rated on What's Good Here · ${town}`.replace(/\s·\s$/, '')
}

if (dish.photo_url) {
  imageUrl = dish.photo_url
} else {
  imageUrl = `${BASE_URL}/api/og-image?type=dish&id=${id}`
}
```

- [ ] **Step 2: Restaurant-variant copy scrub**

Find the "worth ordering" phrase at line 126:

```typescript
description = `See what's worth ordering at ${restaurant.name} in ${restaurant.town || ''}`
```

Replace with:

```typescript
description = `See what's good at ${restaurant.name}${restaurant.town ? ' in ' + restaurant.town : ''}`
```

- [ ] **Step 3: Local verification**

If `vercel dev` is available: `vercel dev` and curl `http://localhost:3000/api/share?type=dish&id=<real-uuid>` with a bot UA header. Confirm description reads `X.X/10 · N ratings · Town`.

- [ ] **Step 4: Commit**

```bash
git add api/share.ts
git commit -m "feat(og): rating-first social description, no binary query"
```

---

## Task 22: Update OG image generator — rating-first text

**Files:**
- Modify: `api/og-image.ts`

**Context:** Lines 58–70 per current file compute yes-vote count and render "X% Would Order Again." Replace with rating-first.

- [ ] **Step 1: Replace the vote-stats block**

Edit `api/og-image.ts` lines 52–76. Replace with:

```typescript
// Get vote stats
const { count: totalVotes } = await supabase
  .from('votes')
  .select('*', { count: 'exact', head: true })
  .eq('dish_id', id)

const { data: dishStats } = await supabase
  .from('dishes')
  .select('avg_rating, total_votes')
  .eq('id', id)
  .maybeSingle()

const effectiveVotes = dishStats?.total_votes ?? totalVotes ?? 0
const avgRating = dishStats?.avg_rating ? Number(dishStats.avg_rating).toFixed(1) : null

if (avgRating && effectiveVotes >= 5) {
  rating = `${avgRating}/10 · ${effectiveVotes} ratings`
  if (Number(avgRating) >= 9.0) badge = 'GREAT'
  else if (Number(avgRating) >= 8.0) badge = 'Great Here'
} else if (effectiveVotes > 0) {
  rating = `${effectiveVotes} rating${effectiveVotes === 1 ? '' : 's'}`
}

if (dish.price) {
  subtitle += ` · $${dish.price}`
}
```

- [ ] **Step 2: Commit**

```bash
git add api/og-image.ts
git commit -m "feat(og): rating-first text in OG image, no binary query"
```

---

## Task 23: Update `seed-reviews` Edge Function — shadow-write boolean

**Files:**
- Modify: `supabase/functions/seed-reviews/index.ts`

**Context:** Seed function inserts directly into `votes` (not via `submit_vote_atomic`), so the shadow-write in the RPC doesn't cover it. Phase 1 behavior: seed writes a boolean derived from its rating computation.

- [ ] **Step 1: Find the vote insertion**

```bash
grep -n "would_order_again\|votes" supabase/functions/seed-reviews/index.ts
```

Locate the insert block around line 378.

- [ ] **Step 2: Compute and write the derived boolean**

The existing insert likely looks like:

```typescript
// Before (conceptual)
const wouldOrderAgain = sentimentScore >= 0.7  // some existing derivation
const { error } = await supabase
  .from('votes')
  .insert({
    user_id: botUserId,
    dish_id: dishId,
    would_order_again: wouldOrderAgain,
    rating_10: wghRating,
    // ...
  })
```

Change the derivation to explicitly use `rating_10 >= 7.0`:

```typescript
// Phase 1 compat: derive the boolean from the same rating we're writing.
// Phase 2 will change this to NULL and update snippet-generation to no longer depend on it.
const wouldOrderAgain = wghRating != null ? wghRating >= 7.0 : null
const { error } = await supabase
  .from('votes')
  .insert({
    user_id: botUserId,
    dish_id: dishId,
    would_order_again: wouldOrderAgain,
    rating_10: wghRating,
    // ... rest unchanged
  })
```

If the existing snippet-generation (`buildReviewSnippet`, lines 57–88) depends on `wouldOrderAgain`, keep that working by continuing to pass the derived value.

- [ ] **Step 3: Deploy the function (manual)**

Per `CLAUDE.md` memory: seed function deploys go via Supabase CLI with Dan's access token, since MCP doesn't see Denis's project. The implementer should surface this for manual deploy:

```bash
# Implementer: flag for Dan to deploy manually. Do NOT auto-run.
# supabase functions deploy seed-reviews --project-ref <denis-project-ref>
```

Add a line to `TASKS.md` under a "Phase 1 deploy checklist" if one exists, else document in the PR description.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/seed-reviews/index.ts
git commit -m "feat(seed): derive would_order_again from rating_10 in direct inserts"
```

---

## Task 24: Copy scrub — onboarding, marketing, in-app strings

**Files:**
- Modify: `src/components/Auth/WelcomeModal.jsx`
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/HowReviewsWork.jsx`
- Modify: `src/pages/ForRestaurants.jsx`
- Modify: `src/pages/RateYourMeal.jsx` (already touched in Task 11, but re-grep)
- Modify: `src/pages/UserProfile.jsx` (already touched, re-grep)
- Modify: `src/pages/MyList.jsx`

**Context:** Every user-facing "would order again", "worth it", "worth ordering", "reorder" string removed. Onboarding CTA becomes: `Rate dishes you've actually tried, 1–10. Find the best food faster.`

- [ ] **Step 1: Audit all copy surfaces**

```bash
grep -rni "would.?order\|worth.?it\|worth.?ordering\|% reorder\|would reorder\|thumbs" src/pages src/components
```

Walk each match:
- **`src/components/Auth/WelcomeModal.jsx`** — delete the thumbs-based step entirely (the whole binary visual, not just copy). Replace with a single rating-first panel:

  ```jsx
  <p className="text-base" style={{ color: 'var(--color-text-primary)' }}>
    Rate dishes you've actually tried, 1–10.
    <br />
    Find the best food faster.
  </p>
  ```

- **`src/pages/Login.jsx`** — rewrite the "How We Rate" block. Delete any thumbs icon or yes/no illustration; keep the rating scale illustration only. Replace the explanatory text:

  > "Rate the dishes you try from 1 to 10. Your ratings help locals and visitors find the best food."

- **`src/pages/HowReviewsWork.jsx`** — replace any "We ask if you'd order it again" language with "We ask you to rate it from 1 to 10." Preserve the surrounding educational content (honesty, small-batch, locality).

- **`src/pages/ForRestaurants.jsx`** — find any "worth ordering" pitch, rewrite in rating terms.

- **`src/pages/MyList.jsx`** and **`src/pages/UserProfile.jsx`** — remove residual inline strings.

- [ ] **Step 2: Grep for stragglers**

```bash
grep -rni "would.?order\|worth.?it\|worth.?ordering\|reorder" src/
```

Every remaining hit should be: a file you didn't touch yet (add it), or a CSS variable name / internal comment you're explicitly preserving (leave it).

- [ ] **Step 3: Check `public/` for static assets**

```bash
grep -rni "would.?order\|worth.?it" public/ 2>/dev/null || echo "(no matches or no public/ text files)"
```
If there are static HTML files (unlikely for a Vite SPA), update.

- [ ] **Step 4: Build + manual walk-through**

```bash
npm run build
npm run dev
```

Walk:
1. Sign out. Visit `/login` — confirm no thumbs language.
2. Sign up as new user → WelcomeModal — confirm rating-first copy.
3. `/how-reviews-work` — confirm rewritten content.
4. `/for-restaurants` — confirm no binary pitch.

- [ ] **Step 5: Commit**

```bash
git add src/components/Auth/WelcomeModal.jsx src/pages/
git commit -m "feat(copy): scrub thumbs/reorder language, rating-first onboarding"
```

---

## Task 25: Delete unused `ThumbsUpIcon` / `ThumbsDownIcon` components

**Files:**
- Delete: `src/components/ThumbsUpIcon.jsx`
- Delete: `src/components/ThumbsDownIcon.jsx`

**Context:** Only used by the old `ReviewFlow` and some display surfaces we've now cleaned. Verify nothing still imports, then delete.

- [ ] **Step 1: Verify no callers**

```bash
grep -rn "ThumbsUpIcon\|ThumbsDownIcon" src/
```

Expected: zero results. If any remain, fix them (those are leftover display sites we missed) BEFORE deleting the files.

- [ ] **Step 2: Delete**

```bash
rm src/components/ThumbsUpIcon.jsx src/components/ThumbsDownIcon.jsx
```

- [ ] **Step 3: Build to confirm no broken imports**

```bash
npm run build
```
Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add -u src/components/
git commit -m "chore: delete unused ThumbsUpIcon / ThumbsDownIcon components"
```

---

## Task 26: Amend the Rate Your Meal spec

**Files:**
- Modify: `docs/superpowers/specs/2026-04-09-rate-your-meal-design.md`

**Context:** Add an amendment block at the top and edit the thumbs references (lines 34, 43) in place.

- [ ] **Step 1: Add amendment block**

Prepend to the file, right under the H1 title:

```markdown
> **Amendment 2026-04-12:** Binary vote ("Would you order again?") removed from
> the product. This flow no longer includes thumbs up/down — each card is
> rating + review + photo only. Supersedes the earlier thumbs-based flow
> described below. See
> `docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md` for context.
```

- [ ] **Step 2: Edit the thumbs references in place**

- Line 34 (Screen 2, Card Flow bullet): delete `- Thumbs up / thumbs down toggle`.
- Line 43 (Screen 3, Summary): replace `All rated dishes listed with their thumbs + rating number` with `All rated dishes listed with their rating number and optional review snippet`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-09-rate-your-meal-design.md
git commit -m "docs: amend Rate Your Meal spec for binary-vote removal"
```

---

## Task 27: Add Phase 2 entry to `TASKS.md`

**Files:**
- Modify: `TASKS.md`

**Context:** Phase 2 (drop shadow-write, drop RPC signatures, drop old analytics events) is deferred. Track it.

- [ ] **Step 1: Read TASKS.md**

```bash
head -50 TASKS.md
```

- [ ] **Step 2: Add an entry**

Add under the appropriate section (or create a "Post-launch cleanup" section if none exists):

```markdown
### Binary vote removal — Phase 2 (follow-up PR, ~1 release after Phase 1 deploys)

- [ ] Drop server-side shadow-write in `submit_vote_atomic` (derive step becomes NULL passthrough).
- [ ] Drop `p_would_order_again` parameter from `submit_vote_atomic`.
- [ ] Drop `yes_votes`, `percent_worth_it` from `get_ranked_dishes`, `get_restaurant_dishes`, `get_dish_variants` return signatures.
- [ ] Drop `would_order_again` from `get_friends_votes_for_dish`, `get_friends_votes_for_restaurant`.
- [ ] Drop `would_order_again` from the `public_votes` view.
- [ ] Update `seed-reviews` Edge Function: insert `NULL` instead of deriving; update snippet-generation to not depend on it.
- [ ] Drop legacy PostHog event name `vote_cast` (keep `rating_submitted`).
- [ ] Verify via PostHog that all funnels now reference the new event names.

Do NOT start Phase 2 until Phase 1 has been live for at least one release window (≥7 days) and Sentry shows no regressions from stale bundles.

Spec: `docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md`.
```

- [ ] **Step 3: Commit**

```bash
git add TASKS.md
git commit -m "chore: add Phase 2 binary-vote-removal follow-up to TASKS.md"
```

---

## Task 28: Update E2E voting test

**Files:**
- Modify: `e2e/pioneer/voting.spec.ts` (or the existing vote-flow E2E file)

**Context:** Existing Playwright flow clicks "Yes" or "No" before rating. New flow has no thumbs.

- [ ] **Step 1: Find the voting E2E file(s)**

```bash
ls e2e/pioneer/
grep -rln "would_order\|Yes.*rating\|ThumbsUp\|Worth order" e2e/
```

- [ ] **Step 2: Update the flow**

The new flow:
1. Navigate to dish page.
2. Click "Rate this dish" CTA.
3. In the opened overlay, interact with slider (set rating).
4. Optionally expand review, type text.
5. Click "Submit rating."
6. Expect success state (overlay closes, dish refreshes).

Replace the old flow's thumbs-click step with slider interaction. Example (adjust selectors to your actual data-testids or aria-labels):

```typescript
test('user rates a dish from dish detail', async ({ page }) => {
  await page.goto(`/dish/${TEST_DISH_ID}`)
  await page.getByRole('button', { name: /Rate this dish/i }).click()
  // Expect the rate overlay
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  // Set slider to 8.5
  const slider = page.getByRole('slider')
  await slider.focus()
  // Increment keyboard to set a value (or drag — depends on your slider impl)
  for (let i = 0; i < 85; i++) await page.keyboard.press('ArrowRight')
  // Submit
  await page.getByRole('button', { name: /Submit rating/i }).click()
  // Expect overlay gone
  await expect(page.getByRole('dialog')).not.toBeVisible()
})
```

- [ ] **Step 3: Run the test**

```bash
npm run test:e2e:pioneer
```
Expected: PASS. Update selectors iteratively until the test reflects real DOM structure.

- [ ] **Step 4: Commit**

```bash
git add e2e/pioneer/
git commit -m "test(e2e): update voting flow to single-screen rate (no thumbs)"
```

---

## Task 29: Final verification

**Files:** (none modified — verification only)

- [ ] **Step 1: Full grep audit**

```bash
# User-facing strings in code (should be zero or only schema.sql / migrations)
grep -rn "would order again\|worth ordering\|Worth It\|would_order_again" src/ api/ public/ 2>/dev/null | grep -vE "supabase/(schema|migrations)" | grep -vE "\.test\."
```
Expected output: either empty, or only CSS class names / comments you've intentionally left.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: clean build, no warnings about missing imports or ES2023+ syntax.

- [ ] **Step 3: Unit tests**

```bash
npm run test -- --run
```
Expected: all pass.

- [ ] **Step 4: Lint**

```bash
npm run lint
```
Expected: clean.

- [ ] **Step 5: E2E**

```bash
npm run test:e2e
```
Expected: all 3 persona suites pass.

- [ ] **Step 6: Manual stale-bundle compat check**

In a second browser profile:
1. Load the production site BEFORE phase 1 deploys. Let it cache the old JS bundle.
2. Deploy phase 1 to preview.
3. Without reloading, submit a vote from the cached bundle. Expect success (the old bundle still sends `wouldOrderAgain`; server honors it).
4. Reload the preview. Expect the new flow.

If you can't stage this before deploy, note it as a post-deploy verification step in the PR description.

- [ ] **Step 7: Open PR**

```bash
git push -u origin feat/binary-vote-removal
gh pr create --title "Binary vote removal — Phase 1" --body "$(cat <<'EOF'
## Summary

Removes the "Would you order again?" binary thumbs vote from the product.
The 1–10 rating is now the sole user input.

Spec: `docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md`
Plan: `docs/superpowers/plans/2026-04-12-binary-vote-removal.md`

Phase 2 (drop shadow-write + RPC signatures) is tracked in `TASKS.md`
and will land as a separate PR after this one is live for ≥1 release window.

## Test plan

- [ ] `npm run build` passes
- [ ] `npm run test -- --run` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:e2e` passes
- [ ] Grep audit: no user-facing thumbs/would-order/worth-it strings outside schema.sql
- [ ] Manual: new user onboarding shows rating-first copy
- [ ] Manual: dish detail has "Rate this dish" CTA; existing rater sees "Update your rating"
- [ ] Manual: rate flow requires slider interaction before submit enables
- [ ] Manual: Rate Your Meal batch flow has no thumbs
- [ ] Manual: profile shows single "My Ratings" shelf
- [ ] Manual: stale PWA bundle (cached before deploy) successfully submits a vote against the new server
- [ ] Deploy `seed-reviews` Edge Function via CLI (manual, per `CLAUDE.md` memory)
- [ ] PostHog check 24h after deploy: both `vote_cast` and `rating_submitted` events show non-zero counts

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 8: Final commit (only if any fixes from steps 1–6)**

If verification surfaced anything:
```bash
git add -u
git commit -m "fix: address final verification findings"
git push
```
