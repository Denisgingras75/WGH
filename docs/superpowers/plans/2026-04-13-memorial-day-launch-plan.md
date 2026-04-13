# Memorial Day 2026 Launch Plan

**Launch date:** 2026-05-26 (Memorial Day)
**Days until launch:** 43 (6 weeks + 1 day from 2026-04-13)
**One-line pitch:** *The local's food guide for Martha's Vineyard — real dishes rated by real locals, discovered on a map, curated by the people who actually eat here.*

> This is what we're doing, in what order, with whom. Honest about risks, specific about work, unafraid of ambition. We're changing how food discovery works — one dish at a time. Memorial Day is our first proof.

---

## 0. Launch Thesis

Martha's Vineyard's economy pivots on Memorial Day weekend. The island goes from 17,000 year-round residents to 200,000+ peak summer population in 12 weeks. Every year, tens of thousands of people arrive, pull out their phone, and type "best food Martha's Vineyard" into Google, Yelp, or TripAdvisor — and get the wrong answer. Tourist traps rank. Locals laugh. The actual best dishes go undiscovered.

WGH fixes that. Not by replicating Yelp with a lighthouse logo. By rebuilding food discovery around **dishes, not restaurants** — the unit a diner actually cares about — rated by **identified locals** with **trust-verified** reviews, discoverable on a **map** instead of a feed, curated by **real people with names**.

Memorial Day isn't our endgame. It's our **first shot on goal** — the launch moment that seeds the network, captures summer, and turns the island into our proof-of-concept before expanding to Nantucket and Cape Cod in 2027.

**We win Memorial Day if:**
- The product ships feeling genuinely "legit" (native app feel, trust signals, editorial authority)
- We activate 500+ accounts in week 1 with 50+ dishes rated by real users
- We get 3+ pieces of real local press (Vineyard Gazette, MV Times, local food blogs)
- We land 15+ restaurants as claimed profiles with manager access
- We collect enough real usage data to iterate intelligently for July 4 weekend

---

## 1. What We're Actually Shipping

### Core product (in scope for May 26)

| Feature | Status | Why it matters |
|---|---|---|
| **Dual-mode home** — list + map with category filter | Shipped | The core discovery experience |
| **Dish rankings** — map-first, category-filtered, weighted by vote confidence | Shipped, polishing | The "what's good?" answer |
| **Rate Your Meal redesign** — 1-10 slider, review, photo | In flight (spec Apr 9) | The contribution loop |
| **Binary vote removal** — kill thumbs, 1-10 only | In flight (spec Apr 12) | Cleaner signal, less friction |
| **Food Playlists** — user-generated Spotify-for-food | In flight (spec Apr 12) | Identity + virality + retention |
| **Rating Identity + Taste Compatibility** | Shipped | Trust signal + social depth |
| **Local Lists / Curators** | Shipped | Editorial authority |
| **Manager portal + Toast POS integration** | Partially shipped | B2B/restaurant buy-in |
| **Jitter WAR v2** | In flight | Review trust scoring |
| **Menu import queue** | Shipped (Apr 9) | Restaurant onboarding pipeline |
| **iOS App Store (Capacitor wrap)** | Aiming for May 26, backstop early June | Legitimacy + distribution |

### Deferred to post-launch (V2+)

- **Ask WGH** — AI conversational dish finder (deferred to V2)
- **FriendsFeed** — social activity feed (deferred)
- **TastePersonalityCard** — personality classifier (deferred)
- **Scoring history / dish versioning** — wgh-phone#150 (post-launch)
- **Nantucket + Cape Cod expansion** — 2027
- **Comment threads on playlists** — V1.1
- **Push notifications** — wire infra for launch, campaigns post-launch

### What "legit" means, operationalized

Every launch decision passes this test: *does this make the product feel more or less like a real business?*

- Yes: native app feel, haptics, no web-y loaders, editorial voice, trust badges, real curators, polished empty states, `getUserMessage()` everywhere
- No: placeholder copy, "coming soon," generic error strings, dead-end toasts, "1 dishes" pluralization bugs, web-style spinners

---

## 2. Success Metrics (Honest)

### Launch week (May 26 - June 2)

| Metric | Target | Stretch | What it means |
|---|---|---|---|
| Signups | 500 | 1,000 | People who committed past the anonymous view |
| DAU | 200 | 500 | Genuine repeat usage |
| Dishes rated | 1,500 | 5,000 | The actual data we're collecting |
| Unique photographers | 50 | 150 | Trust signal density |
| Restaurants with claimed profiles | 15 | 30 | B2B credibility |
| Playlists created | 100 | 500 | Identity + virality proxy |
| Local press hits | 3 | 8 | Independent validation |
| App Store reviews (if live) | 25, 4.5+ avg | 100, 4.8+ avg | Discoverability + social proof |

### What "launched successfully" actually means

- **The app didn't embarrass us.** No launch-day crashes, no viral Twitter screenshot of a broken flow, no Reddit thread titled "What's Good Here is a scam" from a missing account deletion or spam flood.
- **Real people used it and came back.** D7 retention > 30%. That's the single honest signal that we shipped something worth using, not just launching.
- **Someone who matters noticed.** One credible local personality or outlet amplified us unpaid. That validates the positioning.
- **The product told us what to build next.** Feedback, edge cases, feature requests, usage patterns — we come out of launch week with a prioritized punch list for July 4.

### What failure looks like

- We shipped a buggy iOS app that got rejected, or worse, 1-star bombed in the first week
- No press, no curator momentum, no restaurants bought in — we launched into silence
- We blew past budget on Google Places API / Supabase costs because we didn't instrument
- Dan or Denis burned out in week 4 trying to hit iOS and nothing else got the attention it needed

Plan aggressively to avoid all four.

---

## 3. Six-Week Roadmap

### Week 1 — April 13-19: Foundation + paperwork
**Goal:** External dependencies started. Hard gates in progress. No surprises from here.

**Dan (external):**
- [ ] Enroll Apple Developer Individual ($99) — starts the clock on Apple verification
- [ ] Decide physical address for Privacy/ToS (P.O. Box or registered agent) — needed for legal copy
- [ ] Reach out to 20 MV restaurants (list + outreach template) — claim-profile pitch
- [ ] Draft press list: Vineyard Gazette, MV Times, Martha's Vineyard Magazine, Edible Vineyard, MV Times Food Blog, 3-5 food Instagrammers with MV audience
- [ ] Decide LLC formation timing (pre- or post-launch — recommend post, per prior memo)
- [ ] Daily: 30 minutes of "use the app like a stranger" — maintain the empathy loop

**Claude(s) — product work:**
- [ ] H1 Account deletion — Edge Function + frontend + privacy copy update (13-18h)
- [ ] L1 Privacy + ToS comprehensive update — add operator, address, disclosures (photos, Jitter), fix "contact us" language, bump dates (2-4h)
- [ ] L3 Google Places attribution — "Powered by Google" on relevant screens (1-2h)
- [ ] L2 Small cleanups — old Supabase preconnect in index.html, target=_blank audit (partial, 2h)

**Denis — infra lane:**
- [ ] Finish Jitter WAR v2 work (per memory, in flight)
- [ ] Respond to app-store-readiness#151 with lane picks
- [ ] Verify all Supabase migrations are clean on Denis's project

**Metrics checkpoint Sunday:**
- H1 done?
- Apple Dev application submitted?
- 5+ restaurant outreach messages sent?

---

### Week 2 — April 20-26: Hard gates + Capacitor scaffold
**Goal:** Second hard gate done. Native iOS shell exists. Feature work moving.

**Product:**
- [ ] H3 UGC Reporting + Blocking — reports + user_blocks tables, RPCs, RLS, ReportModal, BlockUserModal, /profile blocks section (10-15h)
- [ ] Capacitor scaffold — install, Xcode project, build to simulator, test on physical device once Apple Dev approved (~3 days setup)
- [ ] Binary vote removal implementation (per Apr 12 spec) — ReviewFlow simplified, shelves collapsed, derived stats cleaned
- [ ] Food Playlists MVP — user_playlists table, CRUD RPCs, basic UI (creating, adding dishes, viewing)

**Growth:**
- [ ] Landing page / pre-launch waitlist (whatsgoodhere.app) — capture emails, "Coming to iOS on Memorial Day"
- [ ] Press kit v1 — screenshots, founder story, key metrics, high-res logos, social assets
- [ ] Instagram + TikTok account set up, first posts ("we're building this")
- [ ] Outreach to 10 local food creators with a preview link + ask: "be a founding curator with a local list"
- [ ] Finalize positioning / tagline with Dan

**Ops:**
- [ ] Analytics dashboard — PostHog events for signup, first vote, playlist create, share
- [ ] Error budget dashboard — Sentry alert thresholds set
- [ ] Customer support: create [help.whatsgoodhere.app](help.whatsgoodhere.app) basic page + hello@ inbox routing
- [ ] Cost monitoring — Supabase + Google Places + Claude API budget alerts

**Metrics checkpoint Sunday:**
- H3 done?
- Capacitor builds to physical iPhone?
- 20+ restaurants pitched, 5+ responded?
- Waitlist has 100+ emails?

---

### Week 3 — April 27-May 3: Features locked + Sign in with Apple
**Goal:** Feature freeze. H2 done. Content seeded. Press kit live.

**Product:**
- [ ] H2 Sign in with Apple — native plugin, ID token flow, Supabase integration, button placement, edge cases (14-20h)
- [ ] Food Playlists complete — share URLs, OG images, follow/save, profile surfaces
- [ ] Binary vote removal complete + Rate Your Meal redesign shipped
- [ ] **Feature freeze April 30** — no new features after this date. All work is polish, bugs, iOS. Period.
- [ ] **April 30 checkpoint decision:** iOS on track for May 12 submission? Go / fall-back to early June.

**Growth:**
- [ ] 20 curator lists live (real curators, real names, real dishes)
- [ ] 50+ restaurants have at least one rated dish — fills the map
- [ ] Launch narrative locked with 1-line + 2-paragraph version (for pitch, press, app store)
- [ ] Screenshots + App Store Connect metadata drafted
- [ ] Beta invite list locked — 50-100 people to TestFlight

**Ops:**
- [ ] Legal copy frozen (Privacy.jsx, Terms.jsx) — run by an attorney if possible ($300-500 one-time review)
- [ ] Backup + restore plan for Supabase verified (at least one test restore)
- [ ] Abuse response plan written — what do we do if someone mass-reports, posts hate speech, spams?
- [ ] Demo account for Apple reviewers created — loaded with sample data

**Metrics checkpoint Sunday:**
- H2 done?
- iOS builds and runs with SIWA on device?
- Feature freeze holding?
- 50 restaurants with ≥1 dish?
- Press list outreach drafted, 5+ journalists responded?

---

### Week 4 — May 4-10: Polish, polish, polish + TestFlight
**Goal:** Every surface feels native. First Apple submission goes in.

**Product:**
- [ ] P4 Capacitor plugins — geolocation, camera, share, browser, haptics, splash, status bar
- [ ] P2 Accessibility pass — tertiary contrast fix, ARIA, VoiceOver on key flows
- [ ] P1 Remaining UX bugs — iPhone SE overflow, tab ARIA on RestaurantDetail, getUserMessage everywhere
- [ ] P3 Performance — code splitting audit, image optimization, memory test on map
- [ ] TestFlight build 1 → distribute to 50-100 testers
- [ ] **Submit to App Store review by May 12** — if ready per April 30 checkpoint

**Growth:**
- [ ] App Store Connect page filled in — name, subtitle, description, keywords, screenshots (6-8), support URL, privacy, age rating 12+
- [ ] Press embargo pitch sent to top 3 outlets — Vineyard Gazette, MV Times, Edible Vineyard
- [ ] 50+ restaurants with manager access activated
- [ ] Curator content: every featured curator has 1+ shareable list
- [ ] Scheduled launch-week content queue — 21 posts across IG/TikTok for 3-week window

**Ops:**
- [ ] Load testing — can we handle 100 concurrent users? 500?
- [ ] On-call rotation for launch week — Dan primary, Denis backup
- [ ] Launch-day runbook v1 written (see §6)
- [ ] Monitoring dashboards on a second screen ready for launch day

**Metrics checkpoint Sunday:**
- TestFlight in hand?
- App submitted to Apple?
- 75+ restaurants?
- 10+ press responses?

---

### Week 5 — May 11-17: Review cycle + pre-launch ramp
**Goal:** Apple review clears. Beta feedback loops close. Marketing ramps up.

**Product:**
- [ ] Respond to Apple review feedback if bounced — turn around in <48h
- [ ] TestFlight build 2 incorporating beta feedback
- [ ] Hot-fix everything critical from beta
- [ ] Lock release build, submit final version if needed

**Growth:**
- [ ] Press embargo date locked for May 25 (Sunday before Memorial Day)
- [ ] Instagram Reels + TikTok videos: "How to find the best dish in any MV restaurant"
- [ ] Email to waitlist: "Launch Day is May 26 — here's how to be first"
- [ ] Founder story pitch sent to podcast + long-form outlets
- [ ] Paid promotion budget decided (if any — $200-500 Meta ads targeting MV visitors)

**Ops:**
- [ ] Final legal review of Privacy + ToS (if attorney engaged)
- [ ] Support playbook — common questions, who escalates what
- [ ] Backup tested once more
- [ ] Rate limits verified under load

**Metrics checkpoint Sunday:**
- App Store status: approved, in review, or pending?
- Beta feedback addressed?
- Press embargo commitments locked?
- 100+ restaurants?
- 500+ email waitlist?

---

### Week 6 — May 18-24: Final countdown + soft launch
**Goal:** Everything is ready. We're rehearsing the launch, not scrambling.

**Mon May 18:**
- [ ] All code frozen. Only hot-fixes from here.
- [ ] 100 tester-only TestFlight invite wave — real users, real feedback

**Tue May 19:**
- [ ] Soft launch: announce on personal channels to immediate network
- [ ] Monitor: sign-up flow, vote flow, playlist flow. Fix anything that breaks in real use.

**Wed May 20:**
- [ ] Press outreach final push — "Monday launch, can we get you early access?"
- [ ] Launch-day content assets finalized

**Thu May 21:**
- [ ] Final run of the launch-day runbook end-to-end
- [ ] Check-in with top 10 curators — make sure they'll post their lists on launch day

**Fri May 22:**
- [ ] Warm-up post: "Launching Memorial Day — here's what we've been building"
- [ ] Last-call press pitches
- [ ] Restaurant owner email blast: "Your profile is live — share it with your staff"

**Sat May 23:**
- [ ] Curator content goes live on their personal channels (coordinated)
- [ ] Instagram Story takeovers from early testers

**Sun May 24 (embargo day):**
- [ ] Press coverage drops (Gazette, MV Times if they're in)
- [ ] Email blast to waitlist: "Download tomorrow"
- [ ] Social push on all channels

### Launch Day — Mon May 26
See §6. Hour-by-hour runbook.

### Week 7 (post-launch) — May 27-Jun 1
See §7. Honest retrospective + iteration.

---

## 4. Three Parallel Tracks (Ongoing Ownership)

### Track A — Product (Dan + Denis + Claudes)

**Owned by Dan (Claude assists):**
- Design direction, brand voice, icon system
- UX decisions on new features (Food Playlists, Rate flow, binary vote UX)
- Content strategy (curator lists, editorial copy, launch tagline)
- Final go/no-go on what ships

**Owned by Denis (his Claude assists):**
- Schema, Edge Functions, migrations
- Jitter WAR v2 finish
- Supabase infra, cron jobs, storage
- E2E tests, QA infrastructure

**Shared:**
- Hard gates (H1, H2, H3), privacy/ToS, Capacitor scaffold
- Capacitor plugin integration work
- Bug fixes and polish items

### Track B — Growth (Dan primary)

- Restaurant outreach (15-30 claimed profiles by launch)
- Curator recruitment (20 featured local lists)
- Press outreach (3-5 confirmed pieces by launch)
- Social media presence (IG + TikTok + launch thread)
- Email waitlist growth (500+ by launch)
- Creator partnerships (3-5 influencers for launch week)
- Launch narrative + messaging

### Track C — Ops (lightweight, Dan + Claude)

- Legal copy + entity decisions
- Analytics + monitoring infrastructure
- Support inbox + help docs
- Cost monitoring + budget alerts
- Incident response planning
- Launch-day runbook maintenance

---

## 5. Launch Week Day-By-Day (May 26 - Jun 1)

### Mon May 26 — Launch Day
See §6 below.

### Tue May 27 — Day 2
- 9 AM: Launch retro meeting (Dan + Denis) — what broke, what worked, what to fix
- 10 AM-noon: Hot-fix push if needed
- Afternoon: Respond to press requests
- Evening: Thank-you posts to amplifiers, curators, early users
- Metric check: D1 retention, signup velocity, vote velocity

### Wed May 28 — Day 3
- Morning: Review all support requests, common issues surface
- Afternoon: Second press wave if opportunity surfaces
- Evening: First "Week in dishes" Instagram post — what's being rated most

### Thu May 29
- Morning: Data deep-dive — which features being used, which ignored
- Afternoon: Restaurant follow-ups — "here's what your dishes are getting rated"
- Evening: Coordinated curator post day — three local curators drop lists

### Fri May 30
- Morning: Post-launch product roadmap V1.1 drafted
- Afternoon: Weekend traffic prep — server capacity, monitoring heightened
- Evening: Weekend content queue locked

### Sat May 31 - Sun Jun 1
- Peak summer traffic hits — this is the real test
- Monitor: sign-ups, votes, map loads, server cost spike
- Respond fast to any issues surfacing

### Launch week retrospective — Mon Jun 2
Written retrospective: what we committed to, what actually happened, what we're changing for July 4. See §7.

---

## 6. Launch Day Runbook — Mon May 26

### 6 AM — Pre-flight
- [ ] Dan awake, coffee, at desk
- [ ] Denis on standby (he doesn't have to be live but reachable)
- [ ] Verify: app live, auth working, search working, map loads, vote flow completes
- [ ] Check: Supabase health dashboard green, Vercel deployment status green
- [ ] Sentry alert threshold active, PostHog capturing events
- [ ] Take a deep breath. This is just the first day.

### 7 AM — Public go-live
- [ ] Announce on Dan's personal channels (LinkedIn, Twitter/X, Instagram, text to close network)
- [ ] Post launch thread — founder story, 5-screenshot carousel, call-to-action
- [ ] Email blast to waitlist
- [ ] Update press coordinators: "We're live, share when ready"

### 9 AM — First wave of traffic
- [ ] Monitor: signup conversion, first-vote conversion, bounce points
- [ ] If auth broken: immediate hot-fix priority 0
- [ ] If map slow: investigate Leaflet tile loading
- [ ] Respond to every support ticket within 30 min

### 12 PM — Press coverage
- [ ] Gazette / MV Times / Edible Vineyard pieces publish if embargoed
- [ ] Amplify on social, tag sources, thank them
- [ ] Restaurant owners text: "You're in the press, here's your profile link"

### 3 PM — Mid-afternoon check
- [ ] Metrics dashboard update — share in team channel
- [ ] Any unexpected load patterns? Hot takes? Viral threads?
- [ ] If someone's gaming the vote system, deploy the abuse-response playbook

### 6 PM — Dinner rush (peak for food apps)
- [ ] Monitor: active users, votes-per-minute, map loads
- [ ] Restaurants watching their dishes get rated in real time
- [ ] Share first "24h highlights" teaser on social

### 10 PM — End of day
- [ ] Aggregate metrics: signups, votes, restaurants, playlists, press
- [ ] Any unresolved bugs? File and prioritize for tomorrow.
- [ ] Thank the team (Denis, curators, early users) publicly and privately
- [ ] Set Day 2 tempo

### Incident response during launch day
- **Severity 1 (app down / auth broken / payments broken):** Dan + Denis drop everything. Target: 30 min to fix or workaround.
- **Severity 2 (feature broken but app usable):** Fix in 2-4 hours if possible. If not, add to known-issues page and keep moving.
- **Severity 3 (cosmetic / edge case):** Add to backlog. Don't fix on launch day unless trivial.

---

## 7. Week 1 Post-Launch Retrospective (Mon Jun 2)

### Honest self-assessment

Write answers to each, publish internally, share highlights with curators/early users:

1. **What actually launched vs what we planned?** Feature-by-feature, honest gaps.
2. **What were the top 3 bugs users hit?** From Sentry + support inbox.
3. **What's the real D1, D3, D7 retention?** Don't lie to yourself.
4. **Which feature got the most use? Least?** PostHog event funnels.
5. **What did press say vs what we wanted them to say?** Gap analysis.
6. **Which restaurants activated? Which ghosted?** List each.
7. **Are we on budget?** Supabase, Google Places, Claude, Vercel costs.
8. **What did users complain about most?** By volume.
9. **What did users praise most?** Anchor the next feature to this.
10. **What would we do differently?** Short list.

### Week 2 (Jun 2-8) plan based on retro

- Fix the top-3 bugs
- Ship the one feature users are clearly missing (likely a social feature or push notification)
- Second press cycle — post-launch momentum story
- Restaurant follow-through — get the ghosted ones back
- Prep July 4 campaign — next big moment

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Apple rejects iOS app at launch window | Medium | High | April 30 checkpoint + early-June backstop. Submit early (May 12 target). |
| Feature scope slips into freeze | High | Medium | Hard feature freeze April 30. No new features after that date — period. |
| Dan or Denis burns out | Medium | Very High | 40h/week max, one full day off per week, explicit check-ins each week. Retention = launch success. |
| Supabase/API cost spike | Medium | Medium | Budget alerts at 50/75/100% thresholds. Rate limit aggressively. |
| Abuse / trolling / spam votes | Medium | High | H3 report+block shipped. Jitter flags low-confidence users. Manual moderation on day 1. |
| Account deletion has bugs that leak data | Low | Catastrophic | QA twice — Dan tests, Denis tests. Admin audit log on all deletion events. Never release without verifying. |
| Press ghost | Medium | Medium | Cast wide — 20+ outlets pitched, expect 5 to respond, 3 to publish. Don't depend on any single hit. |
| No restaurants bought in | Low | High | Start outreach week 1, not week 5. Target 100 pitches for 15-30 activations. |
| Launch-day incident (Supabase outage, Vercel deploy fail, etc.) | Low | High | Runbook rehearsed, Denis on call, status page + apology playbook ready. |
| Memorial Day weather kills tourist traffic to MV | Low | Low-Medium | Can't control weather. Product value still applies to locals. |
| Competing app launches with press | Low | Medium | Our differentiation is specific (dishes not restaurants, locals not tourists, MV-specific). Leaning into it is the defense. |

### The biggest risk isn't technical

**The biggest risk is launching into silence.** You can ship a flawless product on May 26 and have no one hear about it. That's worse than launching a rougher product with 3 press pieces and 20 influencer posts.

Treat marketing with the same urgency as code. Every week of this plan, the Growth track has milestones equal to the Product track. Don't let Product eat Growth.

---

## 9. Team Roles + Ownership

### Dan
- **Owner:** Vision, brand, design, content, launch narrative
- **Hands-on:** UX, design systems, final product decisions, press outreach, restaurant outreach, curator recruitment
- **Check-in cadence:** Daily with self, weekly reflection, weekly sync with Denis

### Denis
- **Owner:** Backend infrastructure, schema, Edge Functions, E2E tests
- **Hands-on:** Jitter v2, menu import pipeline, hard-gate backend (Edge Functions for account deletion), Capacitor native integration
- **Check-in cadence:** Weekly sync with Dan via wgh-phone, daily availability for urgent

### Claude Sessions (both sides)
- **Owner:** Acceleration, tracking, drafting, coding under direction
- **Hands-on:** Feature implementation, test writing, docs, PM tracking (plans, specs, retros), cross-Claude coordination via wgh-phone
- **Check-in cadence:** Per-session scope agreement upfront, honest completion reporting

### Who decides what
- Product direction, design, brand: **Dan**
- Schema, infra, Edge Functions: **Denis**
- Hard gates (spans both): **jointly — whoever picks up the lane leads**
- Launch timing decisions (checkpoints): **Dan, after consulting Denis**
- Cost / budget decisions: **Dan**

### What to do if blocked
- Blocked on code → post in wgh-phone, tag for-dan or for-denis
- Blocked on decision → pick up the phone / Slack / text — Claudes can relay but humans move faster
- Blocked on yourself (stuck, fried) → say so. Don't mask it. Retention > output.

---

## 10. Definition of Done (Memorial Day)

### Must-have (non-negotiable, blocks launch)
- [ ] No P0 or P1 bugs open — app doesn't crash, auth works, vote flow completes, map loads
- [ ] Privacy + ToS updated with operator, address, disclosures — legally compliant
- [ ] Account deletion flow working end-to-end (H1)
- [ ] Google Places attribution present (L3)
- [ ] Supabase migration is clean — no leftover orphan tables or dead RPCs
- [ ] Analytics capturing signup, vote, playlist create, share
- [ ] Error monitoring catching production issues
- [ ] Rate limits tested — no vote-flooding possible
- [ ] PWA works on iOS Safari + Chrome Android + desktop

### Should-have (important, high confidence of shipping)
- [ ] UGC report + block mechanisms (H3)
- [ ] Sign in with Apple (H2) — if not, SIWA ships in first patch release
- [ ] Food Playlists MVP live
- [ ] Binary vote removal complete, Rate Your Meal redesign complete
- [ ] 15+ restaurants with claimed profiles
- [ ] 5+ curators with published lists
- [ ] 3+ press pieces confirmed
- [ ] iOS App Store submission in review (live by early June if not May 26)
- [ ] Contrast fix for accessibility (tertiary text)

### Nice-to-have (ship if time, otherwise post-launch patch)
- [ ] Native Capacitor plugins fully integrated (haptics, share, browser for external links)
- [ ] Universal Links for deep-linking dish/restaurant URLs
- [ ] Push notifications wired (campaigns post-launch)
- [ ] TastePersonalityCard + FriendsFeed
- [ ] Toast POS integration complete for all restaurants claiming profiles
- [ ] Nuanced performance polish (code splitting, image optimization)

### Explicitly post-launch
- Ask WGH (V2)
- Scoring history / dish versioning
- Nantucket + Cape Cod expansion
- Multi-editor playlists
- Playlist comment threads
- Push notification campaigns
- LLC formation + Apple Dev Organization upgrade

---

## 11. The Mindset

### What this plan is not

- Not a promise that everything ships. It's a ruthlessly prioritized best-effort plan with honest backstops.
- Not a guarantee of virality. Distribution takes effort we're budgeting for; success isn't preordained.
- Not an iOS deathmarch. If the April 30 checkpoint says we're not on track for May 26 iOS, we fall back to early June without shame. The ambition serves the work, not the reverse.

### What this plan is

- A commitment to shipping with pride.
- A commitment to saying no to scope that doesn't serve the launch.
- A commitment to treating Dan + Denis's well-being as a launch-critical dependency.
- A commitment to marketing with the same discipline as engineering.
- A commitment to changing how food discovery works — starting with one island, one dish rating, one rated meal at a time.

### The operating principle

**Every week, Friday afternoon, ask two questions:**

1. Did we ship what we said we'd ship? If not, why, and what's the learning?
2. Is the team in good shape to ship next week's scope? If not, cut.

Discipline about these two questions is the difference between a launch that works and a launch that grinds everyone down and still doesn't work.

---

## 12. The Launch Line

When we publish the Medium post, the LinkedIn announcement, the App Store description — this is the story:

> *"We started What's Good Here because the best dish at every restaurant was a secret only locals knew. Now Martha's Vineyard's food scene has a map. Real dishes rated by real locals, discoverable by taste, not by tourist trap SEO. This is day one. We're changing how food discovery works — one dish at a time."*

Memorial Day is our first proof. July 4 is scale. Labor Day weekend is expansion. By 2027, we're on Nantucket, Cape Cod, Boston. One island at a time. One dish at a time.

Let's go.
