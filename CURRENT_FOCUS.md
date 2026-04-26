# Current Focus

*Dan (or any Claude session starting work) updates this file at session start. Every other Claude session reads it first to avoid collisions.*

**Last updated:** 2026-04-26

---

## Active handoff

<!-- Fill this in BEFORE touching files. Clear it when done.
     This is the collision-prevention surface — if it's stale, the whole
     system weakens. Keep it honest. -->

- **Owner / session:** Dan's Claude
- **Branch:** `claude/integrate-claude-design-BE9tL`
- **Files / modules claimed:** `index.html` (font link), `src/index.css` (paper tokens + utility classes), `src/components/home/Masthead.jsx` (new), `src/components/home/index.js` (export), `src/components/home/HomeListMode.jsx` (brand header → Masthead)
- **Safe for others to continue:** all `src/api/`, `supabase/`, `src/pages/` (except Map's home wiring), all other components
- **Do not duplicate:** Claude Design integration — porting `public/remix.html` (only present on `redesign/*` remote branches) one screen at a time. First screen: Home list mode masthead. Prior attempts on `redesign/claude-design`, `redesign/prototype-as-app`, `redesign/phase-01-reskin` are abandoned — do not pull from them.

---

## This session — the goal

<!-- One paragraph. What are we actually shipping this session?
     Skip the long context — CLAUDE.md + SPEC.md provide that. -->

_(stub)_

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
