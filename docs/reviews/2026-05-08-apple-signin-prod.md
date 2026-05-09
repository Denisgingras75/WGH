# Apple Sign-In Prod Review — fresh eyes before Phase C

**Reviewer:** Denis's Claude (Opus 4.7) on `claude/review-apple-signin-prod-SFBH0`
**Date:** 2026-05-09
**Trigger:** Dan's request on `Denisgingras75/wgh-phone#168` ("Apple Dev cleared, Phase A+B+root-fix+rotation shipped, want a second pair of eyes before Phase C tomorrow")

## Scope and what I could actually see

The Apple Sign-In source of truth — the three Edge Functions (`apple-token-exchange`,
`apple-revocation-retry`, `apple-token-persist`), the three migrations
(`user_apple_tokens`, `pending_apple_revocations`, `lease_apple_revocations`), the
generator script, and the Plan B / Phase C doc set — all live on
`Denisgingras75/wgh-phone`. My MCP scope is restricted to `Denisgingras75/wgh`,
so I did **not** read those files directly. This review is therefore:

- Architectural / pattern-level on the wgh-phone-only artifacts (based on the
  description in #168).
- File-level on the surfaces both repos share — the live Supabase project
  (`vpioftosgdkyiwvhxewy`), this repo's web feature flag, and the web CSP.

If you want a deeper line-by-line on the Edge Functions, push the wgh-phone
branch to a shared location or open a mirror issue here and I'll re-review.

## TL;DR

Architecture is sound. The leak-and-rotate pass was handled cleanly. End-to-end
worker test (lease → fail → backoff → release) is the strongest evidence. Six
issues worth touching before TestFlight; #1, #2, #6 below are the ones I'd
not ship without resolving.

---

## 1. Shared Supabase project = shared Apple provider config (verify Site URL / Redirect URLs)

`vpioftosgdkyiwvhxewy` is the same Supabase project both `wgh` (web) and
`wgh-phone` (web + Capacitor) talk to. Enabling the Apple provider activates
SIWA for **both** web origins simultaneously.

- In **this repo**, the SIWA button is intentionally `null`
  (`src/components/Auth/LoginModal.jsx:264`, `src/pages/Login.jsx:387`) and
  `signInWithApple()` is wired but unreachable from UI. So the user-facing
  surface is fine.
- The Supabase Auth dashboard config is global: **Site URL** and **Additional
  Redirect URLs** must include every host that will receive the callback. If
  only `https://wghapp.com` is whitelisted, an accidental SIWA attempt from
  `whats-good-here.vercel.app` (e.g. via dev console) will land on Supabase's
  default and may dead-end.
- Action: confirm the Redirect URL allowlist is `wghapp.com` + the Capacitor
  return URL + (defensively) `whats-good-here.vercel.app`. If you don't want
  the WGH web origin to ever issue Apple sessions, document that as an
  intentional limit somewhere (so a future Dan/Claude doesn't "fix" it by
  rendering the button).

## 2. The cron-auth alignment claim doesn't match _this_ repo's pattern

Dan: "moved apple-revocation-retry to CRON_SECRET, matching your existing
menu-refresh + scraper-dispatcher pattern."

In **this repo**, `menu-refresh` and `scraper-dispatcher` both gate on an
**authenticated admin JWT**, not a `CRON_SECRET` bearer:

- `supabase/functions/menu-refresh/index.ts:672-700` — requires
  `auth.getUser()` + `admins` table lookup.
- `supabase/functions/scraper-dispatcher/index.ts:22-45` — same pattern.

So the alignment claim only holds if `wgh-phone` has its own forks of these
two functions using a different (CRON_SECRET) pattern. That's plausible —
you've been driving `wgh-phone` independently — but it surfaces a real risk:

> **One Supabase project, one deployed copy of each function name.** Whoever
> deploys `menu-refresh` last wins. If `wgh-phone` later redeploys its fork
> over the version this repo's admin portal calls, the admin portal stops
> working (signature/auth-mode drift).

Action items:
- Decide which repo owns `menu-refresh`, `scraper-dispatcher`, and any
  other shared function. Add an `OWNER:` comment header to the file and a
  one-line note in `docs/AGENT-PHONE.md`.
- For new Apple-only functions (`apple-token-exchange` etc.), no conflict —
  they're net-new names.
- The CRON_SECRET pattern is fine for cron triggers; just don't claim it
  as "matching" until the older functions are migrated too. Codex was right
  that consistency matters, but right now you have _two_ patterns coexisting.

## 3. Vault slot naming after .p8 rotation

You rotated the `.p8` from key ID `JXT4ZZQW67` (v1) to `9LL6V25287` (v2), but
kept the Vault slot named `apple_signing_key_v1` and overwrote it with the v2
key material. Same for `apple_key_id_v1`. That makes the next rotation
ambiguous — the slot _name_ implies v1 but the _value_ is v2.

Cleaner: when you rotate again, write `apple_signing_key_v2` alongside,
flip readers, then delete v1. Or drop the suffix entirely and rely on
`apple_key_id_*` to record which Apple-side key is current.

Lower priority, but: pin a runbook line somewhere ("on 2026-05-08 the slot
named `apple_signing_key_v1` was rotated to Apple key ID 9LL6V25287") so the
audit trail isn't lost.

## 4. Backoff index — verify the boundary

You observed: synthetic row → fail → attempts 0→1 → ~16-min schedule, called
out as `BACKOFF_MINUTES[1]=15`. That works **if** the worker reads the array
as "next-attempt-index" (i.e. just-incremented `attempts` is the index).

If the array is meant as "delay after this attempt's failure," using
`BACKOFF_MINUTES[attempts]` after `attempts++` gives you `[1]` on the **first**
failure, which means `BACKOFF_MINUTES[0]` is dead code unless `attempts`
starts at -1.

Five-minute check on the worker: confirm whether the dead-letter threshold
also uses the same index, and whether you've dropped a leg of the backoff
ladder by accident. Not a blocker — the behavior you saw is acceptable —
just make sure intent matches code.

## 5. Apple sends user info ONCE — protect display_name on second sign-in

The classic SIWA regression: Apple includes `name`/`email` in the identity
token **only on the very first authorization** (and after a user revokes app
access in Settings → Apple ID). On every subsequent sign-in, those fields
are absent.

If `apple-token-persist` (or whatever populates `profiles.display_name` on
sign-in) does an unconditional UPSERT/UPDATE that writes whatever Apple
returned, you'll silently nuke a user's display_name on their second login.

Smoke test on Phase C device:
- First sign-in → display_name populated (or WelcomeModal opens).
- Sign out, sign in again → display_name **unchanged**.
- Settings → Apple ID → Stop using → sign in again → first-time fields return.

This repo's existing comment at `src/api/authApi.js:88-91` already calls
out the null-name case — make sure the persist function doesn't undo that
on round 2.

## 6. Account deletion → revocation queue: data dependency check

Apple requires deleted-account flows to also revoke the Apple refresh token.
The implied flow is:

1. User deletes account → `auth.users` row removed (cascades).
2. Row inserted into `pending_apple_revocations`.
3. Cron worker leases, decrypts the encrypted refresh token, calls Apple's
   `/auth/revoke`, deletes the pending row.

Failure mode to guard against: if `user_apple_tokens` is FK-cascaded to
`auth.users`, deleting the user removes the encrypted token row before the
worker runs. The pending revocation row then has no token to decrypt — the
worker either crashes or quietly dead-letters, and Apple is never told.

Two safe shapes:
- **Copy at enqueue:** the trigger that inserts into
  `pending_apple_revocations` copies the encrypted refresh token (and the
  apple `sub` / user_id) onto the pending row, so the row is self-contained.
- **Soft-delete the token row:** keep `user_apple_tokens` until revocation
  succeeds, then hard-delete. (Adds a privacy concern — encrypted tokens
  outliving the auth user.)

I'd bet on the first one being what you built. Worth a 60-second confirm
in `apple-token-persist` / the deletion trigger before you submit to
review — Apple's reviewer can and does test account deletion.

## 7. Phase C / TestFlight smoke checklist additions

In addition to what's in `docs/superpowers/specs/2026-05-07-b3-...`:

- **Hide My Email enabled** — sign in with the relay address
  (`*@privaterelay.appleid.com`). Confirm Sentry / PostHog / your email
  pipelines don't drop or normalize it.
- **Hide My Email disabled** — sign in with a personal Gmail. Confirm same
  user surface as a Google sign-in.
- **Sign out → sign in again** on same device (display_name regression check
  from §5).
- **Same device, different Apple ID** — confirm the second Apple user gets
  a fresh `auth.users` row, not the first user's profile.
- **Account deletion full path** — delete via in-app flow → check
  `pending_apple_revocations` row appears → wait one cron cycle → confirm
  Apple call returned 200 and the row is gone.
- **Capacitor URL scheme** — `whatsgoodhere://` only registered, not aliased.
  Codex was right to flag the missing fallback; without it the Capacitor
  return path can hang on a blank web view if the native bridge ever drops
  back to ASWebAuthenticationSession.

## 8. Lower-priority observations

- **AASA caching:** iOS caches AASA up to 7 days. If you spot a typo in
  `K447QTHBR9.com.whatsgoodhere.app` after TestFlight installs, devices
  won't pick up the fix until the cache expires. Validate the file with
  `https://branch.io/resources/aasa-validator/` before pushing TestFlight.
- **CSP on wgh web:** `vercel.json` is fine for SIWA-as-redirect (Apple
  pages are top-level navigations, not iframes). No `connect-src` change
  needed unless you start calling `appleid.apple.com` directly from JS.
- **`VITE_FEATURES_APPLE_SIGNIN=true` on Vercel:** harmless on the WGH web
  Vercel project (button render is `null` regardless), but if you flipped
  it on the wgh _web_ deploy expecting a button, that won't appear without
  the JSX in `LoginModal.jsx:264` / `Login.jsx:387` getting un-nulled.
  Confirm which Vercel project actually got the flag.

---

## Bottom line for Phase C

Ship it after spending ~30 minutes on:
1. Confirming Supabase Redirect URL allowlist (§1).
2. Confirming `pending_apple_revocations` row is self-contained re: refresh
   token (§6).
3. Confirming first-vs-subsequent sign-in display_name behavior (§5).

Everything else is housekeeping. Memorial Day buffer is healthy. Sleep well.
