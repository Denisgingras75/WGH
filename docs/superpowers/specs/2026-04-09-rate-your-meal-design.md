# Rate Your Meal — Design Spec

> **Amendment 2026-04-12:** Binary vote ("Would you order again?") removed from
> the product. This flow no longer includes thumbs up/down — each card is
> rating + review + photo only. Supersedes the earlier thumbs-based flow
> described below. See
> `docs/superpowers/specs/2026-04-12-binary-vote-removal-design.md` for context.

## Problem

Users eat multiple dishes at a restaurant but WGH only supports rating one dish at a time. This friction means:
- Users only rate the standout dish (data loss on 2-3 other dishes)
- Users lump all items into one review (breaks dish-level model)
- Users skip rating entirely (worst outcome)

## Solution

A batch rating flow triggered from the restaurant detail page. Select all dishes you ate, then quick-rate each one sequentially in a card-based flow.

## Flow

### Entry Point
- "Rate Your Meal" button on restaurant detail page
- Located in the sticky bottom action bar (alongside Order Now / Directions)
- Auth gate: requires login. Show LoginModal if not authenticated.

### Screen 1 — Select Your Dishes
- Same menu layout as the existing RestaurantMenu component (grouped by menu section)
- Each dish row has a checkmark toggle (tap to select/deselect)
- Search bar at top to filter dishes
- At the bottom of the list: "Special" option — tap to type in a dish name that's not on the menu
- Sticky footer: "Rate X Dishes" button (disabled until at least 1 selected, shows count)
- Back button returns to restaurant detail

### Screen 2 — Rate Each Dish (Card Flow)
- One screen per selected dish, auto-advances on "Next"
- Progress indicator at top: dots or "1 of 4" text
- Each card contains:
  - Dish name prominently displayed
  - 1-10 rating slider
  - "What stood out?" tap-to-expand review text field (same as existing ReviewFlow)
  - Photo upload button (optional, inline)
  - "Next" button at bottom
- Back button goes to previous dish
- Last dish shows "Review" instead of "Next"

### Screen 3 — Summary
- All rated dishes listed with their rating number and optional review snippet
- Tap any dish row to jump back to its rating card for editing
- "Submit All" button — submits all votes as individual vote records
- Loading state during submission
- Success state: "Rated X dishes at [Restaurant]!" with a satisfying confirmation

## Data Model

No new tables needed. Each dish gets its own row in the `votes` table, identical to the existing single-vote flow. The batch flow is purely a UX wrapper.

Each vote uses the existing `votesApi.submitVote()` — submitted sequentially (not Promise.all, to respect rate limits).

## Technical Approach

### New Components
- `RateYourMeal.jsx` — orchestrator component (could be a page or a full-screen modal)
- `DishSelector.jsx` — the menu checklist with search and "Special" option
- `BatchRatingCard.jsx` — the per-dish rating card
- `BatchSummary.jsx` — the summary screen before submission

### New Route
- `/restaurants/:restaurantId/rate` — or render as a full-screen modal from the restaurant detail page

### Integration Points
- Reuses `useDishes(location, radius, null, restaurantId)` for dish data
- Reuses `votesApi.submitVote()` for each vote
- Reuses `LoginModal` for auth gate
- Reuses `useDishPhotos` for photo upload per dish
- Reuses `checkVoteRateLimit` — called once before batch, not per dish

### Existing Patterns to Follow
- CSS variables for all colors (no Tailwind color classes)
- No ES2023+ methods (no toSorted, no Array.at)
- Error handling via createClassifiedError
- Logger instead of console.*
- Lazy-loaded via lazyWithRetry in App.jsx

## Edge Cases
- Restaurant has no dishes yet: hide "Rate Your Meal" button
- User selects only 1 dish: still works, just a single-card flow
- User is rate-limited mid-batch: show error, save progress, let them resume
- User navigates away mid-flow: unsaved ratings are lost (acceptable for v1)
- "Special" dish: create the dish via dishesApi.createDish() before submitting the vote
- Duplicate vote: if user already rated a dish, the existing upsert behavior updates it
