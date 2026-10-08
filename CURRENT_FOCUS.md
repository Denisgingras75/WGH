# Current Focus

*Dan (or any Claude session starting work) updates this file at session start. Every other Claude session reads it first to avoid collisions.*

**Last updated:** 2026-10-08

---

## Active handoff

<!-- Fill this in BEFORE touching files. Clear it when done.
     This is the collision-prevention surface — if it's stale, the whole
     system weakens. Keep it honest. -->

- **Owner / session:** Denis's Claude (cloud session)
- **Branch:** `ccr-0a624ce3-i5unc8`
- **Files / modules claimed:** visual layer of essentially every `src/**/*.jsx` file, `src/index.css`, `index.html` (fonts), `tailwind.config.js`, `public/favicon.svg`, design docs (CLAUDE.md §4.6–4.7, NOTES.md, `docs/DESIGN-SYSTEM.md`)
- **Safe for others to continue:** `src/api/`, `src/hooks/`, `supabase/`, `api/`, `e2e/`, `scripts/` — no logic/data changes in this branch
- **Do not duplicate:** full-site visual redesign ("Lobster Buoy": new palette, Bricolage Grotesque + Instrument Sans, sticker/hard-shadow system). Rebase UI work onto this branch or expect style conflicts.

---

## This session — the goal

<!-- One paragraph. What are we actually shipping this session?
     Skip the long context — CLAUDE.md + SPEC.md provide that. -->

Top-to-bottom visual redesign requested by Denis: new color system (Lobster / Harbor / Butter inks on cream, ink outlines, hard offset shadows that match Dan's neo-brutalist food icons), new type (Bricolage Grotesque display + Instrument Sans body, replacing Amatic SC + Outfit), and every screen moved onto shared tokens/primitives. Visual only — no behavior, copy, or data changes. **Needs Dan's sign-off** (he owns visual identity) before merge.

## Blockers / waiting on

<!-- Anything held up on Denis, Apple review, a design decision, etc.
     Claude should NOT quietly start work that's waiting on someone else. -->

- Dan's review of the redesign direction (brand/visual identity is his call).
- Regenerated `og-image.png`/`.svg`, `wgh-icon.png`, `favicon.png`/`.svg` in the new style. `public/logo*.svg`, `logo.webp`, `wgh-splash.webp` are unreferenced legacy assets — left untouched.

## Not this session

<!-- Stuff explicitly parked. Claude: don't pick this up even if it looks tempting. -->

- _(nothing)_

---

## Protocol

- **Update BEFORE touching files.** If you skip the update, you are the collision.
- **Clear the "Active handoff" block when the session ends** (commit or stash, then reset this section). A stale handoff is worse than none — the next session will assume it's accurate.
- **If `Last updated` is >24h old, treat the whole file as stale** — ask Dan what's current before assuming anything.
- **One active handoff per surface.** Two sessions can run in parallel if their scopes don't overlap — append a second handoff block, clearly labeled. But never two sessions on the same files at the same time.
