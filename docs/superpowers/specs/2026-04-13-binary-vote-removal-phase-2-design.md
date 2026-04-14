# Binary Vote Removal — Phase 2 Design Spec

**Date:** 2026-04-13
**Status:** Approved design, ready for implementation plan
**Owner:** Dan
**Builds on:** `docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md` (Phase 1, shipped)

---

## Problem

Phase 1 shipped compat shims so stale PWA bundles wouldn't hard-break: `submit_vote_atomic` kept `p_would_order_again` as an optional param and derived the boolean from rating when omitted; read RPCs kept returning `yes_votes` / `percent_worth_it` / `would_order_again`; analytics dual-emitted `vote_submitted` (old name) and `rating_submitted` (canonical).

Dan is moving to a native iOS app via Capacitor for the Memorial Day launch. Capacitor ships bundles with the app binary, so the "stale PWA service worker" class of risk goes away. Keeping compat shims baked into a v1.0 native binary is worse than cutting them now.

## Goal

Remove every Phase 1 compat shim. Leave a clean final shape for the Capacitor build.

The `votes.would_order_again` column stays (historical integrity). Everything else that references the binary in the server return path, the writer path, or the analytics contract gets deleted.

Additionally, wire up the `existingPhotoUrl` prop that `ReviewFlow` currently accepts but `Dish.jsx` passes as `null`, so the Keep/Replace/Remove photo UI lights up for users with a prior photo.

## Scope boundaries

**In scope:**
- Drop `p_would_order_again` parameter from `submit_vote_atomic`. Signature goes 8 → 7 params.
- Delete the rating-derivation block inside `submit_vote_atomic`. Column writes `NULL` for all new rows.
- Drop `yes_votes` and `percent_worth_it` from `get_ranked_dishes`, `get_restaurant_dishes`, `get_dish_variants` return signatures. Remove the SUM/weighted-count math that computes them.
- Drop `would_order_again` from `get_friends_votes_for_dish` and `get_friends_votes_for_restaurant` return signatures.
- Drop `would_order_again` from the `public_votes` view.
- `votesApi.submitVote`: drop the `vote_submitted` dual-emit. Keep only `rating_submitted`. Drop the `binary_removed: true` property and the derived `would_order_again` field from its payload.
- `seed-reviews` Edge Function: insert `would_order_again: null`. Refactor `buildReviewSnippet(phrases, wouldOrderAgain)` to `buildReviewSnippet(phrases, rating)` with `rating >= 7.0` gate inside.
- `Dish.jsx`: fetch the user's prior dish photo in parallel with the prior-vote fetch; pass the resulting `photo_url` to `ReviewFlow` as `existingPhotoUrl`. Use the existing `dishPhotosApi.getUserPhotoForDish(dishId)` helper.
- `dishPhotosApi.getUserPhotoForDish`: add `.order('created_at', { ascending: false }).limit(1)` before `.maybeSingle()` as multi-photo safety.
- `supabase/README.md`: update vote-shape documentation to remove `would_order_again`.
- Forward migration file + `supabase/schema.sql` both updated to match.
- Tests updated.

**Out of scope:**
- AI/seeded review removal (Dan's running that as a separate piece of work before launch).
- Any UI changes beyond lighting up the existing Keep/Replace/Remove photo UI.
- Capacitor / native app wrapping.
- `votes.would_order_again` column removal (historical data stays).

---

## Data / RPC Changes

### `submit_vote_atomic`

Drop and recreate. Final signature:

```sql
CREATE OR REPLACE FUNCTION submit_vote_atomic(
  p_dish_id UUID,
  p_user_id UUID,
  p_rating_10 DECIMAL DEFAULT NULL,
  p_review_text TEXT DEFAULT NULL,
  p_purity_score DECIMAL DEFAULT NULL,
  p_war_score DECIMAL DEFAULT NULL,
  p_badge_hash TEXT DEFAULT NULL
) RETURNS votes
```

Body:
- Access-control guard preserved (service-role OR user operating on own row).
- No derivation of `would_order_again`. Insert writes `NULL` for that column.
- Validation: `RAISE EXCEPTION 'rating_10 is required'` if `p_rating_10 IS NULL`.
- `ON CONFLICT (dish_id, user_id) WHERE source = 'user'` preserved.
- `DO UPDATE` no longer touches `would_order_again` at all (stays at whatever existing value the prior row had, which might be NULL from Phase 1 writes or a boolean from pre-Phase-1 writes — irrelevant now).
- `source = 'user'` preserved.
- `RETURNS votes` (rowtype) preserved.
- `SECURITY DEFINER SET search_path = public` preserved.

`DROP FUNCTION IF EXISTS submit_vote_atomic(UUID, UUID, BOOLEAN, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT)` precedes the CREATE.

`GRANT EXECUTE ON FUNCTION submit_vote_atomic(UUID, UUID, DECIMAL, TEXT, DECIMAL, DECIMAL, TEXT) TO authenticated`.

### Read RPCs

For each of `get_ranked_dishes`, `get_restaurant_dishes`, `get_dish_variants`:
- Remove `yes_votes BIGINT` and `percent_worth_it INT` (or equivalent types) from the `RETURNS TABLE (...)` clause.
- Remove the `SUM(CASE WHEN v.would_order_again ...)` aggregation.
- Remove the `ROUND((yes_votes / NULLIF(total_votes, 0)) * 100)` percent computation.
- Keep all other return columns and computation (avg_rating, total_votes, distance, value_score, etc.) unchanged.

For `get_friends_votes_for_dish` and `get_friends_votes_for_restaurant`:
- Remove `would_order_again` column from `RETURNS TABLE (...)`.
- Remove it from the SELECT list inside the function body.

### `public_votes` view

- Drop `would_order_again` column from the view's SELECT list.
- Recreate the view without the column.

### Column

- `votes.would_order_again` column stays. Nullable (set by Phase 1). Historical rows preserved.

### Migration artifact

`supabase/migrations/2026-04-13-binary-vote-removal-phase-2.sql` contains:
1. DROP + CREATE for `submit_vote_atomic`.
2. CREATE OR REPLACE for each of the 5 affected read RPCs.
3. CREATE OR REPLACE for `public_votes` view.
4. GRANT statements to match new signatures.

`supabase/schema.sql` updated to mirror the migration.

---

## API + Analytics Changes

### `src/api/votesApi.js`

**`submitVote` RPC call:**
- Drop `p_would_order_again` from the payload.

**Analytics:**

Before (Phase 1):
```js
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

After (Phase 2):
```js
capture('rating_submitted', {
  dish_id: dishId,
  rating: rating10,
  has_review: !!reviewText,
})
```

### `src/api/dishPhotosApi.js`

Add safety ordering to the existing `getUserPhotoForDish(dishId)`:

```js
const { data, error } = await supabase
  .from('dish_photos')
  .select('*')
  .eq('dish_id', dishId)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

No signature change; return shape unchanged. Just guards against a case where a user has somehow submitted multiple photos for the same dish.

### `src/pages/Dish.jsx`

Parallel fetch alongside existing prior-vote fetch:

```js
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
    .catch((err) => logger.error('Failed to fetch prior state:', err))
  return () => { cancelled = true }
}, [dishId, user])
```

Pass `existingPhotoUrl={existingPhotoUrl}` to `<ReviewFlow />` instead of the current hardcoded `null`.

---

## Seed Function Changes

### `supabase/functions/seed-reviews/index.ts`

**`buildReviewSnippet`:**

Before:
```ts
function buildReviewSnippet(phrases: string[], wouldOrderAgain: boolean): string | null {
  ...
  const closers = wouldOrderAgain
    ? [' Would definitely order again.', ' A must-try.', ' Highly recommend.']
    : [' Probably wouldn\'t order again.', ' Not my favorite.']
  ...
}
```

After:
```ts
function buildReviewSnippet(phrases: string[], rating: number | null): string | null {
  ...
  const positive = rating != null && rating >= 7.0
  const closers = positive
    ? [' Would definitely order again.', ' A must-try.', ' Highly recommend.']
    : [' Probably wouldn\'t order again.', ' Not my favorite.']
  ...
}
```

The caller site passes `rating10` (the actual rating being written) instead of the derived boolean.

**Insert:**
```ts
const { error: insertErr } = await supabase.from('votes').insert({
  dish_id: matched.id,
  user_id: AI_SYSTEM_USER_ID,
  would_order_again: null,  // column is nullable; Phase 2 stops writing this signal
  rating_10: rating10,
  ...
})
```

Stale compat comments referencing Phase 1 are removed.

Edge Function deploys manually after the PR merges (same flow as Phase 1: `supabase functions deploy seed-reviews --project-ref <id>`).

---

## Documentation

`supabase/README.md`:
- Find the section documenting the `votes` table shape or the vote-submission flow.
- Remove any mention of `would_order_again` as a required / produced field.
- Note that `rating_10` is the canonical single input.

---

## Test Updates

- `src/api/votesApi.test.js`: drop the `vote_submitted` assertions. Keep `rating_submitted`. Drop assertions on `would_order_again` field in the RPC payload.
- `src/api/dishesApi.test.js` + any test referencing `yes_votes` / `percent_worth_it` in expected RPC returns: update mocks so the RPC mock no longer returns those fields.
- `src/hooks/useVote.test.js`: confirmed already clean from Phase 1, no change expected.
- No new tests required — this is subtractive work with one trivial additive change (photo fetch in Dish.jsx).

---

## Rollout Sequence

1. Land this PR.
2. Deploy migration via Supabase SQL Editor (Dan's flow, same as Phase 1).
3. Deploy `seed-reviews` Edge Function via CLI.
4. Vercel auto-deploys the frontend on merge.
5. Spot-check production: submit a rating, verify `rating_submitted` fires in PostHog with no `vote_submitted` sibling. Verify no 500s on `/dish/:id` load (stale client compat is not required).

---

## Success Criteria

- `supabase/schema.sql` contains no reference to `p_would_order_again`, no SUM-based `yes_votes` computation, no `percent_worth_it` ROUND expression.
- `public_votes` view does not project `would_order_again`.
- `grep -rn "vote_submitted" src/` returns zero hits (outside test cleanup artifacts, if any).
- `grep -rn "binary_removed" src/` returns zero hits.
- `grep -rn "percent_worth_it\|yes_votes" src/ supabase/` returns zero hits outside historical migration files (which are frozen artifacts).
- `Dish.jsx` logged-in-with-prior-photo manual test: photo thumbnail appears in ReviewFlow with Keep/Replace/Remove options.
- `npm run build` and `npm run test -- --run` pass.
- Deployed migration's `submit_vote_atomic` call succeeds with 7 args (no boolean) and rejects calls that still pass 8 args.

---

## Surfaces Verified Clean

From the Phase 1 grep audit + Codex's Phase 2 inventory check:
- No other RPCs reference `would_order_again` in their return or body.
- No UI components still read `percent_worth_it` or `yes_votes` (all stripped in Phase 1).
- No other analytics events carry binary-vote properties.
- No email / push templates reference the feature.
