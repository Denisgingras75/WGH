# App Store Readiness — Issue List

**Target:** iOS App Store submission by 2026-05-12, launch Memorial Day 2026-05-26.
**Path:** Capacitor wrapper over existing React/Vite codebase. Individual Apple Developer account now, LLC upgrade post-launch.
**Organizing principle:** Legitimacy. Every fix should make WGH feel more like a real product.

Source: full 10-dimension audit on 2026-04-13 (dimension 1 by Codex gpt-5.4 xhigh, dimensions 2-10 direct code review). See `wgh-phone#151` for conversation context.

---

## Parallel tracks (external, no code)

### T1 — Apple Developer enrollment
- [ ] Enroll at developer.apple.com/programs as Individual ($99/yr)
- [ ] Verify identity (1-48h)
- [ ] Set up App Store Connect profile
- [ ] Create App ID for `com.whatsgoodhere.app` (or chosen bundle ID)

### T2 — Physical address for legal copy
- [ ] Get a P.O. Box or commercial mail address (~$30/mo), OR
- [ ] Defer until LLC forms (use registered agent address then)
- [ ] Decision: which one, what address

### T3 — LLC formation (post-launch, parallel)
- [ ] Form "What's Good Here LLC" via Stripe Atlas (~$500, 1-2 weeks)
- [ ] Get D-U-N-S number (free, ~1-3 days verification)
- [ ] Transfer Apple Developer account Individual → Organization via App Transfer (7-28 days)
- [ ] Update Privacy + ToS "operated by" line to reference the LLC

---

## 🚫 Hard gates — Apple auto-rejects without these

### H1 — Account deletion flow (Guideline 5.1.1(v))
**Verdict:** Does not exist. Privacy.jsx:123-124 currently says "contact us to delete" — exactly what Apple rejects.
**Effort:** 13-18h

**Backend (7-9h):**
- [ ] New Supabase Edge Function `delete-account` using `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Authenticate the caller, derive their `user.id` from JWT
- [ ] Null or delete rows in 10 blocking `created_by` FK columns before auth delete:
  - `restaurants.created_by` (schema.sql:35)
  - `dishes.created_by` (schema.sql:61)
  - `admins.created_by` (schema.sql:128)
  - `specials.created_by` (schema.sql:240)
  - `restaurant_managers.created_by` (schema.sql:251)
  - `restaurant_invites.created_by` (schema.sql:260)
  - `restaurant_invites.used_by` (schema.sql:263)
  - `curator_invites.created_by` (schema.sql:271)
  - `curator_invites.used_by` (schema.sql:273)
  - `events.created_by` (schema.sql:322)
- [ ] Purge Supabase Storage `dish-photos` bucket objects under `user.id/` prefix
- [ ] Call `supabase.auth.admin.deleteUser(userId)` for hard delete (not soft-delete)
- [ ] Return success/error payload to client

**Frontend (3.5-4.5h):**
- [ ] Add `deleteAccount()` method in `src/api/authApi.js`
- [ ] Add "Delete Account" section to `/profile` (destructive, red, bottom of page)
- [ ] Confirmation modal requiring user to type "DELETE"
- [ ] Loading state during deletion
- [ ] Error state with `getUserMessage()` per project convention
- [ ] On success: call `authApi.signOut()`, `navigate('/')`, show toast "Your account has been deleted"

**Storage + analytics (1.5-2.5h):**
- [ ] Verify AuthContext's `USER_DELETED` event clears PostHog identity (AuthContext.jsx:48)
- [ ] Verify Sentry user scope is cleared (or confirm it was never set)

**Legal copy (0.5h):**
- [ ] Update `Privacy.jsx:123-124` — remove "contact us" language, replace with "Delete your account anytime from Profile → Delete Account. This permanently removes your votes, reviews, photos, and profile."

**QA (1-2h):**
- [ ] Normal user delete end-to-end
- [ ] Restaurant manager delete (has invites/specials created_by rows)
- [ ] Verify storage objects are gone post-delete
- [ ] Verify user cannot log back in

---

### H2 — Sign in with Apple (Guideline 4.8)
**Verdict:** Not implemented. Google OAuth present in LoginModal.jsx:231 + Login.jsx:352 → Apple requires SIWA as equivalent.
**Effort:** 14-20h
**Gated on:** Apple Developer account exists (T1 complete)

**Apple Developer setup (1-2h):**
- [ ] Enable "Sign in with Apple" capability on App ID in Apple Dev portal
- [ ] Create Services ID (web flow client ID)
- [ ] Generate .p8 private key for SIWA, note Key ID
- [ ] Note Team ID

**Supabase config (0.5h):**
- [ ] Enable Apple provider in Supabase Auth → Providers
- [ ] Paste Services ID, Team ID, Key ID, .p8 secret
- [ ] Add Apple callback URL to Apple Dev portal Services ID config

**Frontend — web flow (3-4h):**
- [ ] Add `signInWithApple()` to `src/api/authApi.js` (mirror `signInWithGoogle` at line 51)
- [ ] Add Apple button to `LoginModal.jsx` options mode — **above Google** (Apple HIG requires SIWA prominence when multiple providers are offered)
- [ ] Add Apple button to `Login.jsx` — match modal treatment
- [ ] Use Apple's official button styling (black/white, rounded, Apple logo, "Sign in with Apple" label, min 44pt tap target)
- [ ] Match Google button dimensions exactly
- [ ] Handle `setLoading(false)` in catch block (same pattern as Google)

**Frontend — Capacitor native flow (4-6h):**
- [ ] Install `@capacitor-community/apple-sign-in` plugin
- [ ] Add "Sign In with Apple" capability in Xcode project
- [ ] Detect runtime: `Capacitor.isNativePlatform()` → use native plugin, else web OAuth
- [ ] Native path: plugin returns Apple ID token → call `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })`
- [ ] Nonce generation + SHA256 hashing per Apple spec

**Edge cases (2-3h):**
- [ ] Name capture on FIRST sign-in only (Apple doesn't resend) — persist to `profiles.display_name`
- [ ] Accept `@privaterelay.appleid.com` emails without validation errors
- [ ] Handle user declining to share name → fallback display_name
- [ ] Document that users who sign up with Google then try Apple with same email create a duplicate (Supabase doesn't auto-link) — defer merge flow post-launch
- [ ] Call Apple token revocation endpoint from account deletion Edge Function (ties into H1)

**Legal copy (0.25h):**
- [ ] Update Privacy.jsx to mention Apple Sign-In alongside Google

**QA (3-5h):**
- [ ] Test with normal Apple ID
- [ ] Test with private-relay email
- [ ] Test first sign-in name capture
- [ ] Test repeat sign-in (no name)
- [ ] Test on device via Xcode

---

### H3 — UGC reporting + blocking (Guideline 1.2)
**Verdict:** `validateUserContent()` pre-submit filter exists and is used widely. But **zero** report or block mechanisms anywhere in `src/`.
**Effort:** 10-15h

**Backend (4-5h):**
- [ ] New `reports` table in `schema.sql`: `id`, `reporter_id`, `reported_type` (dish/review/photo/user), `reported_id`, `reason` (enum), `details` (text), `status` (open/reviewed/dismissed), `created_at`
- [ ] New `user_blocks` table: `id`, `blocker_id`, `blocked_id`, `created_at` + unique constraint
- [ ] RLS: users can insert their own reports and blocks, read their own blocks, not read others' reports
- [ ] New RPC `submit_report` + `block_user` + `unblock_user`
- [ ] Votes/reviews from blocked users should be filtered out of the viewer's feed — update `get_ranked_dishes` and related RPCs to exclude votes from users in viewer's blocks list
- [ ] Rate limits on reports (prevent harassment via reporting)
- [ ] Admin view: `get_open_reports` RPC for eventual moderation queue

**Frontend — report flow (3-4h):**
- [ ] New `ReportModal` component — shared across report targets
- [ ] Add "Report" menu on review card in DishEvidence / reviews list (three-dot menu or kebab icon)
- [ ] Add "Report" on dish photos
- [ ] Add "Report user" on user profile pages
- [ ] Add "Report dish" on dish detail page (for bad names or AI-generated garbage)
- [ ] Report reasons enum: spam, hate speech, harassment, misinformation, inappropriate content, other
- [ ] Submit → toast confirmation "Thanks, we'll review this"

**Frontend — block flow (2-3h):**
- [ ] "Block user" on UserProfile page
- [ ] Confirmation modal: "You won't see reviews or ratings from this user"
- [ ] "Blocked users" section in Profile settings to unblock
- [ ] Apply block filter in all places that show per-user content (reviews, follower lists, friend feeds)

**Legal copy (0.5h):**
- [ ] Add moderation section to `Terms.jsx`: reporting mechanism, blocking, our response commitments
- [ ] Privacy.jsx: mention we store reports and blocks

**QA (1-2h):**
- [ ] Report a review — appears in admin queue
- [ ] Block a user — their content disappears from viewer's feed
- [ ] Unblock a user — their content returns
- [ ] Try to report the same content twice rapidly — rate limit hits

---

## ⚠️ Likely rejections — fix before submission

### L1 — Privacy policy + ToS comprehensive update
**Verdict:** Privacy.jsx missing disclosures for dish photos, Jitter biometrics; stale "Last updated January 2025"; "contact us to delete" violation. ToS missing moderation section.
**Effort:** 2-4h (copy work)

- [ ] Add to Privacy.jsx: "What's Good Here is operated by Daniel Walsh. Contact: hello@whatsgoodhere.app, [physical address]"
- [ ] Disclose dish photo uploads (sensitive — we collect photos)
- [ ] Disclose Jitter keystroke biometrics (typing cadence data — privacy-sensitive)
- [ ] Disclose Google Places API as third party (we send location queries to Google)
- [ ] Disclose Sentry collects device + browser + crash data
- [ ] Update "Last updated" to real date
- [ ] Fix Privacy.jsx:123-124 "contact us to delete" language (also covered in H1)
- [ ] Add iOS-specific section: camera permission, photo library permission, push notifications (when added)
- [ ] Add to Terms.jsx: moderation section referencing H3 report + block mechanisms
- [ ] Add to Terms.jsx: acceptable use enforcement details
- [ ] Jurisdiction / governing law clause (pick a state)

---

### L2 — Web-in-a-shell cleanup
**Verdict:** `target="_blank"` used in 5 files for external links; need Capacitor routing. Old Supabase preconnect in index.html.
**Effort:** 4-6h

- [ ] Wrap `target="_blank"` external links in `@capacitor/browser` when running native — apply in:
  - `src/pages/Dish.jsx`
  - `src/components/restaurants/RestaurantMap.jsx`
  - `src/components/DishListItem.jsx` (Order Now, Directions buttons)
  - `src/pages/Restaurants.jsx`
  - `src/pages/RestaurantDetail.jsx`
- [ ] Update `index.html:11` — remove preconnect to old Supabase project `fzgbxwonitnqmeguqixn.supabase.co`, replace with Denis's project `vpioftosgdkyiwvhxewy.supabase.co`
- [ ] Audit `navigator.geolocation` → plan `@capacitor/geolocation` replacement in `src/context/LocationContext.jsx`
- [ ] Audit `navigator.share` → `@capacitor/share` wrapper in `src/utils/share.js`
- [ ] Verify no back-button-dependent flows break in WebView (test sign-up → vote → profile flow on device)

---

### L3 — Google Places attribution (Google TOS + Apple 5.2)
**Verdict:** Zero "Powered by Google" attribution anywhere despite heavy Google Places API use.
**Effort:** 1-2h

- [ ] Add "Powered by Google" attribution on screens showing Google Places data:
  - `src/pages/Browse.jsx` (when autocomplete shows place results)
  - `src/pages/Restaurants.jsx` (NearbyPlaceCard discovery section)
  - `src/components/AddRestaurantModal.jsx` (place search)
- [ ] Use Google's official attribution image or text per their brand guidelines
- [ ] Attribution placement per Google Places Web Service policy

---

## 🔧 Polish — won't fail review but hurts "legit" feel

### P1 — Remaining UX bugs from Denis's consumer audit
**Effort:** 2-3h (leftovers from wgh-phone#147)

- [ ] iPhone SE 375px overflow — 20 elements clip on home, add ellipsis or responsive layout
- [ ] `RestaurantDetail.jsx` tab switcher — `role="button"` + `aria-pressed` → `role="tab"` + `aria-selected`
- [ ] `RestaurantDetail.jsx` error state — raw `fetchError.message` → `getUserMessage()`
- [ ] Nav height consistency — `BottomNav.jsx:49` is `h-16` (64px), fix `Restaurants.jsx` FAB assumption of 72px
- [ ] `Map.jsx:338-340` Suspense fallback — replace blank div with skeleton/spinner

---

### P2 — Accessibility
**Effort:** 3-5h

- [ ] Fix contrast: `--color-text-tertiary: #999999` on `--color-bg: #F0ECE8` fails WCAG AA 4.5:1 (currently ~2.8:1). Used for vote counts, distances, timestamps. Bump to #6b6b6b or similar (~5:1 ratio).
- [ ] Verify `role="button"` divs have keyboard handlers (we fixed DishListItem; audit the other 4 uses in Restaurants, RestaurantDetail, WelcomeSplash)
- [ ] Add `aria-label` to all icon-only buttons (camera, ear, thumbs)
- [ ] Ensure all modals have proper focus return on close
- [ ] Screen reader pass with VoiceOver on key flows (vote, favorite, login)

---

### P3 — Performance
**Effort:** 2-4h

- [ ] Verify `pdf-gh-BrLFn.js` (334KB) only loads on admin routes, not main bundle
- [ ] `index-WQwq3Su6.js` is 438KB (145KB gzip) — investigate further code splitting for browse / map routes
- [ ] `wgh-splash.webp` 240KB won't ship in Capacitor bundle (native splash replaces it) but verify
- [ ] Memory test: leave map open with 50+ pins, scroll, switch tabs, verify no leaks
- [ ] Add `fetchpriority="high"` to above-the-fold images

---

### P4 — Native polish (Capacitor plugins)
**Effort:** 20-30h total, spans all of Sprint 3

- [ ] `@capacitor/geolocation` → replace `navigator.geolocation` in `src/context/LocationContext.jsx`
- [ ] `@capacitor/camera` → native photo picker in dish photo upload flow (`src/hooks/useDishPhotos.js`)
- [ ] `@capacitor/share` → improve `src/utils/share.js` native path
- [ ] `@capacitor/browser` → external link wrapper (ties into L2)
- [ ] `@capacitor/haptics` → light tap on vote submit, favorite toggle
- [ ] `@capacitor/app` → handle deep links + background/foreground state
- [ ] `@capacitor/splash-screen` → native splash (no white flash on launch)
- [ ] `@capacitor/status-bar` → match status bar to app theme
- [ ] `@capacitor/push-notifications` → setup for post-launch use
- [ ] Universal Links entitlement for `/dish/:id` and `/restaurants/:id` share URLs (Apple Associated Domains)
- [ ] Native permission prompt copy for camera, photos, location — must explain WHY before OS prompt (via in-app sheet)

---

## Sequence of operations

### Week 1 (starting 2026-04-13)
- External: T1 Apple Dev enrollment, T2 physical address decision
- Code: **H1 account deletion** end-to-end
- Code: L1 Privacy + ToS comprehensive update (includes H1 copy fix)

### Week 2
- Code: **H3 UGC reporting + blocking** end-to-end
- Code: L3 Google Places attribution
- Code: L2 web-in-a-shell audits (old Supabase preconnect, link wrapping)
- Parallel: Capacitor scaffold (~2-3 days of setup)

### Week 3
- Code: **H2 Sign in with Apple** (requires Apple Dev account from T1)
- Code: P4 core Capacitor plugins (geolocation, camera, share, browser, splash)
- Start TestFlight submissions

### Week 4
- Code: P1 remaining UX bugs
- Code: P2 accessibility pass
- Code: P4 haptics + push notification setup
- App Store Connect: screenshots, metadata, privacy details, demo account

### Week 5 (2026-05-12 target)
- Submit to Apple review
- Buffer for rejection cycle

### Week 6 (2026-05-26 Memorial Day)
- Launch

---

## Total effort: ~70-107 hours

Split between Dan, Denis, and Claude sessions. Doable but tight — every week matters.

## Definition of done for submission

- [ ] All three hard gates (H1, H2, H3) shipped and tested
- [ ] Privacy + ToS compliant (L1 done)
- [ ] Google attribution present (L3 done)
- [ ] Web-in-a-shell cleanup done (L2)
- [ ] Capacitor app builds + runs on physical iPhone
- [ ] Account deletion verified end-to-end on device
- [ ] TestFlight build distributed to at least 3 test users
- [ ] App Store Connect listing complete: screenshots, description, keywords, support URL, privacy policy URL, age rating, demo account, reviewer notes
