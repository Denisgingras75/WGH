# Current Focus

*Dan (or any Claude session starting work) updates this file at session start. Every other Claude session reads it first to avoid collisions.*

**Last updated:** 2026-04-19

---

## Active handoff

<!-- Fill this in BEFORE touching files. Clear it when done.
     This is the collision-prevention surface — if it's stale, the whole
     system weakens. Keep it honest. -->

- **Owner / session:** Denis's Claude
- **Branch:** `redesign/phase-01-reskin`
- **Files / modules claimed:** `src/pages/Map.jsx` (list-mode only), `src/components/home/Masthead.jsx` (NEW), `src/index.css` (hairline utility add)
- **Safe for others to continue:** everything outside list-mode branch of Map.jsx; all API/schema; map-mode code; Profile/Restaurants/Browse pages; Dish detail
- **Do not duplicate:** Phase 01 masthead port from `prototype → Whats Good Here.html` (full plan: `REDESIGN-PLAN.md` if Dan drops it)

---

## This session — the goal

<!-- One paragraph. What are we actually shipping this session?
     Skip the long context — CLAUDE.md + SPEC.md provide that. -->

Porting the editorial "daily paper" masthead from the Claude Design prototype (`Whats Good Here.html`) onto list-mode of Map.jsx. This is Phase 01 surface #1 of the Prototype → Production Integration Plan: re-skin only, no schema changes, no feature changes, CSS vars only. Map mode untouched. Amatic SC + Outfit preserved; Fraunces swap is Phase 02. Committing on branch only — not pushing.

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
