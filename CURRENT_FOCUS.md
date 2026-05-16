# Current Focus

*Dan (or any Claude session starting work) updates this file at session start. Every other Claude session reads it first to avoid collisions.*

**Last updated:** 2026-05-16

---

## Active handoff

**v1.0 SHIPPED 2026-05-15 (same-day Apple approval). v1.1 status: 17 PRs merged (including #198 menu-refresh pipeline fixes, merged 2026-05-16). T42 data-quality sweep partially in flight — #3 (stale menus) jumped from "0 done" to "159 dishes refreshed/added" today.**

9 days to Memorial Day (5/25). Web users get v1.1 continuously (Vercel auto-deploy on merge). **iOS users are still on v1.0** — Capacitor config has `webDir: 'dist'` with NO `server.url`, so iOS uses the locally bundled web assets. To push v1.1 to App Store users: `npm run build` → `npx cap sync ios` → Xcode archive → TestFlight → App Store review. None of the v1.1 PRs touched native iOS code, so the build is trivial; submission cycle is the only real cost.

The bar from here is **care, not features** — every menu real, every restaurant open, every locals' list trustworthy.

**Known parallel sessions:** Denis has 6 stale-ish open PRs from late April (#110, #111, #113, #115, #120, plus older). None blocking — review when you have a window. `fix/codex-hardening-wave-2` may still be live on Denis's side — confirm before touching shared surfaces.

---

## v1.1 — what's DONE (since 5/15 launch)

**Auth + onboarding polish**
- ✅ #185 — email confirmation code exchange on web (live post-launch hotfix)
- ✅ #186 — live "too short" username hint on auth input
- ✅ #187 — closed-restaurant banner on dish page + friendlier "name taken" copy

**Profile rebuild — the big push (5/15 → 5/16)**
- ✅ #188 — re-add People tab on /profile for searching users
- ✅ #189 — profile picture upload (your own profile, MVP)
- ✅ #190 — inline people search above Your Food Story, drop People tab
- ✅ #191 — UserProfile visual parity with own profile (avatar, food story, no share button)
- ✅ #192 — drop Food Map + make Food Story items linkable
- ✅ #194 — surface `avatar_url` everywhere users appear (Phase 2)
- ✅ #196 — moderate avatar uploads + codex hardening (fail-closed, URL parsing, cache-busted moderation URL)
- ✅ #197 — Seal `variant='icon'` everywhere — match iOS app icon across web

**Search + UX**
- ✅ #184 — post-launch cleanup (drop /10, dead favorites, reorder categories)
- ✅ #195 — rank user search by follower count server-side (not after limit)

**Legal**
- ✅ #193 — remove home address from Privacy + Terms, add Denis as co-operator

**Backlog scoping**
- ✅ #182 — T42 data-quality sweep task defined
- ✅ #183 — T42 #5 — local lists added to the sweep

**Menu-refresh pipeline sprint (5/16) — PR #198 MERGED, deployed live to Denis's project**
- 4 code fixes (each codex-reviewed): DNS-vs-Claude error classifier · direct-PDF Content-Type detection · base64 image mode for Claude vision (bypasses Anthropic robots.txt) · anchor-text-aware sub-page detection. 47 menu-candidates tests pass.
- Triggered + verified live on 6 stale restaurants. Pipeline now handles direct-PDF responses (19 Raw +73 dishes) + ASPX/PHP sub-page navigation (Farm Neck +24 from PDFs found via the cafe menu hub). Mad Martha refreshed earlier (+24). Aalia's was a dead domain — corrected URL, but site is a JS-SPA the pipeline still can't extract from; **imported manually from screenshots (+38 dishes)**.
- Bad Martha = Toast 403 (Toast actively blocks scrapers). Fundamentally unfixable from code — needs ~5 manual entries from their site copy ('pretzels, charcuterie, pizzas').
- **159 fresh/new dishes landed today.** That's the first real chunk of T42 #3.
- Two new v1.2 bugs surfaced during the sprint (saved to memory + tasks): coffee category missing (users asking to rate coffee), `is_offensive()` substring match on `spic` blocks any new dish/restaurant name containing `spicy`.

---

## v1.1 — what NEEDS WORK

**Ship v1.1 — what's left**

1. **(Optional) Cut a v1.1 App Store build** — every web change is shipped; iOS users still on v1.0 bundle. New build is mechanical (`npm run build` → `cap sync ios` → archive → TestFlight → submit). No native code changes since v1.0 so submission risk is low.
2. **T42 — Post-App-Store data quality sweep** (the main body of work, see `TASKS.md` for full spec, attack in order — no point refreshing menus for places that closed last year):
   - **#1 Permanently closed restaurants** — pull `business_status` from Google Places for every restaurant with `google_place_id`. Hide `CLOSED_PERMANENTLY`. Flag `CLOSED_TEMPORARILY`. **NOT STARTED.**
   - **#2 Seasonal restaurants not yet open** — no Google review in last 30 days = probably still dark. Flag with "Opens soon" badge or hide until first recent activity. **NOT STARTED.**
   - **#3 Stale menus** — refresh anything where `menu_last_checked IS NULL OR < now() - interval '30 days'`. **IN PROGRESS** — 6 done today (5 via pipeline, 1 manual), ~30+ others still stale. The pipeline now actually works for most shapes; rolling the cron will drain the queue.
   - **#4 Garbage dishes** — placeholder names (`^Item \d+$`), null prices, missing descriptions, missing category. Acceptance: zero placeholder-named dishes, reasonable coverage on top-ranked dishes. **NOT STARTED.**
   - **#5 Local lists (curator top-10s)** — the trust front door. Find lists pointing at closed restaurants, orphaned dish refs, abandoned curators (< 10 items + > 60 days idle), empty lists, missing display_name, `is_local_curator = false` but visible. **NOT STARTED.**

**On "should we launch v1.1 to the App Store?"** — yes if you want iOS users on parity with web before Memorial Day. The build itself is one command (`npm run build && npx cap sync ios`); the real cost is Apple review (1-3 days, occasionally + 1 rejection cycle). At 9 days to Memorial Day you still have margin for a rejection cycle if you submit in the next ~3 days. After the build is up, T42 #1 (closed-restaurant Google Places check) is the highest-leverage next move — kills credibility risk from showing closed restaurants over Memorial Day weekend.

**Smaller post-launch items (not blocking T42 but worth keeping in view)**

- **Issue #156** — Unify email auth on `verifyOtp` + `token_hash`, retire `exchangeCodeForSession` pipeline (post-launch refactor — was parked behind launch, still worth doing)
- **Browser E2E realignment** — 6 of 13 browser-chromium specs drifted (`/hub` removed, locals UI redesigned, restaurants/browse selectors changed). Per-spec UI realignment, PR-sized.
- **Denis's open PRs (5)** — review #110 (Call button on dish), #111 ("You're here" badge), #113 (search bar unify), #115 (B2B metrics doc), #120 (Oak Bluffs menu tooling). Some may have bitrotted in 3 weeks — assess before merging.

**Pre-existing post-launch backlog** (still parked, not v1.1 scope unless reprioritized)
- Ask WGH v1 — conversational AI dish finder. Was P1 in memory but smart call was to wait for real user data to calibrate prompts against.
- Jitter WAR v2 — keystroke biometrics for review trust. Wait for review volume.
- Toast POS integration — Order Now buttons with auto-detected slugs (Denis-led).
- Check In + action buttons (Order/Directions/Call) on dishes + restaurants (Denis-led; #110 + #111 are partial).
- Scoring history, FriendsFeed, TastePersonalityCard, Specials/events/hub (Launch 2.0+).

---

## Daily ritual

Post-launch:
1. Check inbox for App Store / TestFlight notifications, `wghapp@wghapp.com` for user reports
2. Check Sentry for unexpected error spikes — first real-user traffic is the most informative
3. Check Agent Phone for messages from Denis's Claude (`gh issue list --repo Denisgingras75/wgh-phone --state open --label "📨 for-dan"`)
4. Run major changes through Codex CLI before pushing (`/codex-cli`)

---

## Reference docs

| Topic | File |
|---|---|
| Post-launch data quality sweep | `TASKS.md` → T42 |
| Launch readiness checklist (now historical) | `LAUNCH-READINESS.md` |
| ASC description (Dan's voice) | `docs/superpowers/specs/2026-05-13-app-store-description.md` |
| ASC submission paste guide | `docs/superpowers/specs/2026-05-06-app-store-submission-day.md` |
| Reviewer notes copy | `docs/superpowers/specs/2026-05-03-app-store-reviewer-notes.md` |
| Privacy nutrition labels | `docs/app-store-connect-privacy-details.md` |
| What's New v1.0 copy | `docs/superpowers/specs/2026-05-06-app-store-whats-new.md` |
| JWT generator script (Apple) | `scripts/generate-apple-client-secret.mjs` (KEY_ID = 9LL6V25287, expires 2026-11-04) |

---

## Protocol

- **Update BEFORE touching files.** If you skip the update, you are the collision.
- **Read the active handoff block.** If another session is on a surface you want to touch, STOP and ask.
- **If `Last updated` is >24h old, treat the file as stale** — ask Dan what's current.
- **Always Codex-review before shipping** — `/codex-cli` per fix, not batched.
- **One active handoff per surface.** Parallel sessions OK if scopes don't overlap; append a second handoff block.
- **Tasks are the canonical to-do.** T42 in `TASKS.md` is the source of truth for v1.1 data-quality work.
