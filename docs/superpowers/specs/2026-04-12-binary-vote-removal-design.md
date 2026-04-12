# Binary Vote Removal — Design Spec

**Date:** 2026-04-12
**Status:** Approved design, ready for implementation plan
**Owner:** Dan
**Supersedes:** Thumbs/binary-vote references in `docs/superpowers/specs/2026-04-09-rate-your-meal-design.md`

---

## Problem

Every vote has two inputs: thumbs up/down ("Would you order again?") and a 1–10 rating. In practice the two almost always agree — a dish rated 8 almost always gets a thumbs up, a dish rated 4 almost always gets a thumbs down. The binary adds a step to the vote flow without adding signal. It also forces a derived layer everywhere (`percent_worth_it`, `yes_votes`) that clutters the read side with numbers that restate what the rating already says.

## Goal

Remove the binary vote from the product. The 1–10 rating is the sole input. Every surface that currently displays `percent_worth_it`, `yes_votes`, thumbs emoji, or "would order again" copy is cleaned up.

The `votes.would_order_again` column stays in the database for historical integrity, but stops being written, displayed, or returned from new read paths after the two-phase cleanup completes.

## Scope boundaries

**In scope, named honestly:**
- Dish detail interaction redesign: inline voting UI → read-only surface + "Rate this dish" CTA. Contained change, but it is a redesign.
- Profile shelf collapse: two binary-derived tabs → single "My Ratings" shelf.

**Out of scope (to keep this focused):**
- No other dish detail layout changes beyond the CTA.
- No other profile redesign beyond the shelf collapse.
- No ranking math changes. `dish_search_score` and `value_score` never used the binary; they're untouched.
- No backfill of historical `would_order_again` values.
- No new "Must try" / "Recommended" derived shelves or filters. If wanted later, separate feature.
- No mobile/Capacitor considerations — PWA only today.

---

## UX Changes

### Vote entry

- Dish detail page is **read-only by default**. Existing dish info (hero, stats, reviews, photos) stays as a browsing surface.
- A primary **"Rate this dish"** CTA button opens the rate flow.
- If the user already has a vote on this dish, the CTA label becomes **"Update your rating."** The flow opens prefilled with their prior rating, review text, and photo.
- Auth gate: if the user is logged out, tap on the CTA opens `LoginModal`. On successful login, `ReviewFlow` opens directly (intent preservation — not a bounce back to dish page). Same pattern as `Browse.jsx`.

### Single-dish rate flow (`ReviewFlow`)

Collapses from two-step to one screen.

- **Rating slider (1–10), required.** Initial state is **null/unrated**. The "Submit rating" button stays disabled until the user interacts with the slider. Prevents accidental 5/10 submissions.
- **"What stood out?" review text, optional.** Collapsed by default, tap to expand.
- **Photo upload, optional.** Collapsed by default, tap to expand.
- **"Submit rating" button** at the bottom. Stays visible above the fold because review/photo are collapsed.
- **Back/close behavior:** if user has typed review text or added a photo, show a "Discard draft?" confirmation. No silent auto-save.
- Step 1 (thumbs) is deleted. There is no "Would you order again?" screen.

### Rate Your Meal batch flow (`BatchRatingCard`)

- Thumbs toggle UI deleted. `wouldOrderAgain` state + prop removed.
- Card structure preserved: dish name, 1–10 rating slider, "What stood out?" review text, photo upload, "Next" button.
- Summary screen drops the thumbs column. Rows show: dish name + rating number + optional review snippet + optional photo thumbnail.

### Profile

- "Worth It" and "Avoid" tabs collapse into a single **"My Ratings"** shelf.
- Sort: most recent first.
- No quality-threshold tabs, no derived filters.

### Dish cards everywhere

No "% reorder" bar. No thumbs emoji. No "Must try" / "Worth it" badges.
Rating number + vote count is the skim signal. `getWorthItBadge()` deleted.

Read-side surfaces affected:
- `DishListItem` (all variants: ranked, voted, compact)
- `ChampionCard` (home): "X% would reorder" line replaced with vote count ("127 ratings")
- `DishHero` (dish detail): reorder % bar deleted
- `DishEvidence` (dish detail): "Would order / Would skip" chips deleted; review snippets lose their thumbs
- `RestaurantMap` pin popups
- `RestaurantMenu` / `RestaurantDishes` lists

### Journal scan cue

- Drop opacity muting on `JournalCard` (currently applied when `would_order_again === false`).
- Replace with a color treatment on the rating number itself by threshold (green 8+, neutral 5–7, muted <5). No new badge system — just a color applied to the already-visible number.

### Restaurant list sort order

- `RestaurantMenu` and `RestaurantDishes`: sort by `avg_rating DESC`, tiebreaker `total_votes DESC`.
- `percent_worth_it` no longer used as a secondary sort key.

---

## Data / RPC Changes (Two-Phase Cut)

The DB change is phased to avoid hard-breaking stale PWA bundles that read `would_order_again` directly from tables or expect derived fields in RPC returns.

### Phase 1 — this release (compat-safe removal)

**Schema migration.**
- `ALTER TABLE votes ALTER COLUMN would_order_again DROP NOT NULL`.
- Applied to both `supabase/schema.sql` (canonical) and a forward migration file in `supabase/migrations/`.

**`submit_vote_atomic` RPC.**
- `p_would_order_again` parameter becomes optional (default `NULL`).
- Signature preserved — old clients continue to call it successfully.
- Server logic: if caller passes a boolean, honor it (for old bundles). If `NULL`, derive from `p_rating_10 >= 7.0` and write that. Either way, the column gets a coherent boolean value during phase 1.

**Read RPCs stay compat.**
- `get_ranked_dishes`, `get_restaurant_dishes`, `get_dish_variants`: still return `yes_votes` and `percent_worth_it` in their signatures. Values computed from the (shadow-written) column. Stale UI keeps rendering coherently.
- `get_friends_votes_for_dish`, `get_friends_votes_for_restaurant`: still return `would_order_again`.
- `public_votes` view: unchanged.

**Seed function.**
- `supabase/functions/seed-reviews/index.ts` stops writing `would_order_again` on new inserts (passes `NULL`; the RPC derives from rating). Historical seed rows untouched.

**API layer (`src/api/`).**
- `votesApi.submitVote()` drops the `wouldOrderAgain` argument and its `typeof !== 'boolean'` validation. Called with only rating, review, photo.
- `selectFields` strings + `.map()` transforms in `dishesApi`, `votesApi`, `followsApi` drop `yes_votes`, `percent_worth_it`, `would_order_again` from the projected output — even though RPCs still return them, the app stops passing them to the UI layer.
- `src/api/dishesApi.js:479` direct `.eq('would_order_again', true)` query: replaced with rating-based count (e.g., `.gte('rating_10', 7)`) or removed if dead.

**Direct consumer audit (all must be updated in this release):**
- `api/share.ts:101–105` — drops the `.eq('would_order_again', true)` query. Social description becomes `"${rating}/10 · ${votes} ratings · ${town}"`. Restaurant-level copy ("worth ordering") also scrubbed.
- `api/og-image.ts:62–66` — drops the query. OG image text becomes `"${rating}/10 · ${votes} ratings"`.
- Low-data fallback (votes < 5): `"Rated on What's Good Here · ${town}"` — avoids limp single-number share cards.

### Phase 2 — follow-up PR (~1 release later, separate TASKS.md entry)

- Drop server-side shadow-write in `submit_vote_atomic`.
- Drop `p_would_order_again` parameter entirely.
- Drop `yes_votes`, `percent_worth_it` from `get_ranked_dishes`, `get_restaurant_dishes`, `get_dish_variants` return signatures.
- Drop `would_order_again` from friends-votes RPC returns.
- Drop `would_order_again` from `public_votes` view.
- The column `votes.would_order_again` stays — historical data is preserved indefinitely.

---

## Copy Cleanup

Every user-facing mention of "would order again," "worth it," "worth ordering," "reorder," and thumbs emoji (👍 👎) removed.

**Onboarding / login splash.**
- `WelcomeModal`: thumbs-based step and visual deleted. Onboarding becomes a single rating-first panel.
- `Login.jsx` "How We Rate" block: rewritten. No thumbs language, no binary step.
- `HowReviewsWork` page: rewritten to tell the single-input rating story.

**Marketing.**
- `ForRestaurants` page: scrub binary pitch.

**First-open / splash copy.**
- `"Rate dishes you've actually tried, 1–10. Find the best food faster."`
- Used in `WelcomeModal` and login splash.

**In-app string scrub.**
- `RateYourMeal.jsx`, `RestaurantReviews.jsx`, `Dish.jsx`, `UserProfile.jsx`, `MyList.jsx` — audit and remove inline "worth it" / "would order" / "reorder" strings.

**Social share / OG images (high leverage, public-facing).**
- Copy changes listed under Phase 1 above (`api/share.ts`, `api/og-image.ts`).

**Code-internal names deleted or renamed.**
- `wouldOrderAgain` (variable) — deleted.
- `worthItVotes`, `avoidVotes` (UserProfile split arrays) — deleted.
- `percentWorthIt` (mapped field) — deleted.
- `getWorthItBadge`, `calculatePercentWorthIt`, `getPercentColor` (all in `src/utils/ranking.js`) — deleted.

**Analytics migration (explicit, not deferred).**
- For one release, emit **both** old event names (those containing `worth_it` / `would_order` in name or properties) and new event names with a `binary_removed: true` property flag.
- PostHog funnels and trend dashboards keep running through the transition.
- Follow-up PR (paired with phase 2 RPC cleanup) drops the old event names.

---

## Rate Your Meal Spec Update

`docs/superpowers/specs/2026-04-09-rate-your-meal-design.md` gets an **amendment block at the top**, not a silent rewrite:

```
> **Amendment 2026-04-12:** Binary vote ("Would you order again?") removed from the
> product. This flow no longer includes thumbs up/down — each card is rating + review +
> photo only. Supersedes the earlier thumbs-based flow described below. See
> docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md for context.
```

Then the specific lines (screen 2 thumbs toggle, screen 3 thumbs column) are edited in place to match the new flow. Future readers see the amendment first, then read the updated spec.

---

## Test Updates

- `src/hooks/useVote.test.js` — drop binary assertions.
- `src/components/profile/JournalCard.test.jsx` — drop `would_order_again: true/false` mocks.
- `src/components/profile/JournalFeed.test.jsx` — same.
- `src/api/votesApi.test.js`, `src/api/authApi.test.js`, `src/api/dishesApi.test.js` — adjust to new API shapes (no `wouldOrderAgain` argument, no `percent_worth_it` / `yes_votes` in returns once phase 2 lands; in phase 1 tests just stop asserting on them).
- E2E (`e2e/pioneer/`): review voting tests stop clicking thumbs. Update selectors and flow.

---

## Rollout Sequence

1. Land phase 1 — shadow-write, UI removal, copy cleanup, consumer audit fixes, analytics dual-emit. Single PR.
2. One release window passes; monitor for errors from stale bundles via Sentry.
3. Land phase 2 — drop shadow-write, drop RPC return fields, drop analytics old event names. Separate PR.
4. `votes.would_order_again` column stays permanently.

---

## Surfaces Verified Clean

From the pre-spec code survey + Codex audit:
- No repo-local email templates tied to this feature.
- No push notification templates tied to this feature.
- No third-party CSP-loaded copy to update.
- Vote triggers and RLS policies do not depend on `would_order_again` — no blockers.
- `dish_search_score`, `value_score` don't reference the binary — untouched.

---

## Success Criteria

- No user-facing strings containing "would order again," "worth it," "worth ordering," "reorder," or thumbs emoji in any shipped UI. (Column references in `supabase/schema.sql` and internal migration files are fine and expected.)
- Single-dish vote flow is one screen. Slider starts unrated. Submit stays disabled until the slider is touched.
- Dish detail has a primary "Rate this dish" CTA (or "Update your rating" if the user already has a vote on this dish).
- Profile has a single "My Ratings" shelf, sorted by most recent first, no split tabs.
- OG / share images show the `${rating}/10 · ${votes} ratings` format, with the low-data fallback for votes < 5.
- PostHog funnels keep reporting through the release window — verified by dual-emit.
- Stale PWA bundles continue to submit votes successfully after phase 1 ships — verified by manual test against an old bundle (devtools "disable cache" off, pinned to pre-release build).
