# Current Focus

*Dan (or any Claude session starting work) updates this file at session start. Every other Claude session reads it first to avoid collisions.*

**Last updated:** 2026-10-01

---

## Active handoff

<!-- Fill this in BEFORE touching files. Clear it when done.
     This is the collision-prevention surface — if it's stale, the whole
     system weakens. Keep it honest. -->

- **Owner / session:** Denis's Claude (cloud session)
- **Branch:** `ccr-ccdae7af-0e0kmr`
- **Files / modules claimed:** All of `src/pages/`, `src/components/`, `src/index.css`, `src/App.jsx`, plus lint-error fixes in `src/api/votesApi.js` and `src/hooks/useRestaurantManager.js`
- **Safe for others to continue:** `supabase/`, `api/`, `scripts/`, `e2e/`, docs other than this file and DEVLOG.md
- **Do not duplicate:** Site-wide pass to bring every page in line with the design system, plus usability and lint fixes

---

## This session — the goal

<!-- One paragraph. What are we actually shipping this session?
     Skip the long context — CLAUDE.md + SPEC.md provide that. -->

Site-wide consistency pass: bring every page and component in line with the documented design system (Appetite tokens, Amatic SC headings, Outfit body text, DishListItem for dish lists), fix usability bugs found in a full audit, and clear the 18 ESLint errors. Ships as one PR for Dan's review.

## Blockers / waiting on

<!-- Anything held up on Denis, Apple review, a design decision, etc.
     Claude should NOT quietly start work that's waiting on someone else. -->

- _(nothing)_

## Not this session

<!-- Stuff explicitly parked. Claude: don't pick this up even if it looks tempting. -->

- _(nothing)_

---

## Protocol

- **Update BEFORE touching files.** If you skip the update, you are the collision.
- **Clear the "Active handoff" block when the session ends** (commit or stash, then reset this section). A stale handoff is worse than none — the next session will assume it's accurate.
- **If `Last updated` is >24h old, treat the whole file as stale** — ask Dan what's current before assuming anything.
- **One active handoff per surface.** Two sessions can run in parallel if their scopes don't overlap — append a second handoff block, clearly labeled. But never two sessions on the same files at the same time.
