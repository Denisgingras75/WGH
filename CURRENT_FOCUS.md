# Current Focus

*Dan (or any Claude session starting work) updates this file at session start. Every other Claude session reads it first to avoid collisions.*

**Last updated:** 2026-05-23 (Denis's Claude session)

---

## Active handoff

<!-- Fill this in BEFORE touching files. Clear it when done.
     This is the collision-prevention surface — if it's stale, the whole
     system weakens. Keep it honest. -->

- **Owner / session:** Denis's Claude
- **Branch:** `claude/admin-menu-management-lWngH`
- **Files / modules claimed:** none — work for this session is committed + pushed. Branch is open for review.
- **Safe for others to continue:** everything outside the restaurant-manager invite flow. Specifically `src/pages/Admin.jsx`, `src/api/restaurantManagerApi.js`, `supabase/functions/send-invite-email/`, `supabase/migrations/invite-email-audit.sql` — read-only until branch merges.
- **Do not duplicate:** restaurant manager invite emails (shipped this session — `8b75cf0`). Greater Boston geographic expansion (design doc only — DO NOT START execution; see `EXPANSION-BOSTON.md`).

---

## This session — what shipped

<!-- One paragraph. What are we actually shipping this session?
     Skip the long context — CLAUDE.md + SPEC.md provide that. -->

Restaurant manager invite emails via Resend. The existing admin `/admin` flow still mints `restaurant_invites` rows; the new `send-invite-email` Edge Function only sends. Sender + reply-to: `wghapp@wghapp.com` (DKIM/SPF/DMARC verified). New `invite_email_sends` audit table records every attempt (success and failure). Rate limit 20/hour/admin. UI adds a recipient input + "Send Email" primary button; existing **Copy** and **Email (mailto)** kept as fallbacks. Branch: `claude/admin-menu-management-lWngH`, commits `7b85a64` (mailto button) + `8b75cf0` (Resend integration). Needs Dan to: set `RESEND_API_KEY` secret, deploy the function, and run the migration in SQL Editor. Status posted to wgh-phone via a `for-dan:` issue body Denis pasted.

Also drafted `EXPANSION-BOSTON.md` — design doc for Greater Boston expansion. Denis asked to pull restaurants 25mi around 01887; I pushed back because (a) Memorial Day launch is 2 days away, (b) the existing region scaffold needs concrete decisions before ingest. The doc lays out 8 workstreams and a 3-week post-launch phasing plan. **NOT approved to execute.** Park until post-launch.

## Blockers / waiting on

<!-- Anything held up on Denis, Apple review, a design decision, etc.
     Claude should NOT quietly start work that's waiting on someone else. -->

- Dan to deploy the Resend Edge Function in prod (3-step checklist in the wgh-phone issue body).
- Dan to review / sign off on `EXPANSION-BOSTON.md` open questions (region name, category additions, brand voice in non-MV regions, budget ceiling) before any Boston work starts.

## Not this session

<!-- Stuff explicitly parked. Claude: don't pick this up even if it looks tempting. -->

- Greater Boston data ingestion. See `EXPANSION-BOSTON.md`. **Do not** run `discover-restaurants` against Boston coordinates, do not modify town centers, do not change category vocab until MV launch is shipped and Dan has answered the open questions in the doc.
- Other unchecked items in `LAUNCH-READINESS.md` — Denis didn't ask me to pick those up this session. Available for parallel work by other sessions.

---

## Protocol

- **Update BEFORE touching files.** If you skip the update, you are the collision.
- **Clear the "Active handoff" block when the session ends** (commit or stash, then reset this section). A stale handoff is worse than none — the next session will assume it's accurate.
- **If `Last updated` is >24h old, treat the whole file as stale** — ask Dan what's current before assuming anything.
- **One active handoff per surface.** Two sessions can run in parallel if their scopes don't overlap — append a second handoff block, clearly labeled. But never two sessions on the same files at the same time.
