# Build Retrospective: What's Good Here

A reverse-engineered analysis of how this app was built, what worked, what didn't, and a playbook for next time.

---

## Part 1: What We Actually Did (Reconstructed Timeline)

### Phase 1: Big Bang Initial Commit (Jan 6)
**What happened:** Shipped a working MVP in a single commit with schema, auth, UI, and seed data all at once.

**Files involved:**
- `supabase/schema.sql` - Full database schema with RLS policies
- `src/pages/Home.jsx` - Main feed page
- `src/components/` - LoginModal, DishCard, DishFeed, CategoryFilter, VoteButtons
- `src/hooks/` - useDishes, useLocation, useVote
- `supabase/seed.sql` - Initial restaurant/dish data

**Dependencies created:** Everything assumed everything else existed. No clear layering.

---

### Phase 2: Category Chaos (Jan 7)
**What happened:** Rapid iteration on food categories - adding wings, lobster, sushi, sandwiches, breakfast, fries, poke bowls. 14 commits in one day just tweaking categories.

**Files involved:** Mostly data updates, some filter UI changes

**Problem:** Categories weren't planned upfront. Each addition required a commit cycle.

---

### Phase 3: Image Hell (Jan 11)
**What happened:** 10+ commits trying to get category images working. Tried Unsplash URLs, emoji illustrations, cache busting, debug logging, "NUCLEAR TEST" hard-coding.

**Files involved:** `categoryImages.js`, DishCard components

**Problem:** No image strategy was defined before building. Resulted in thrashing.

---

### Phase 4: Fun Features Before Core (Jan 12)
**What happened:** Added animated pizza slider, bite sound effects, food crumb physics animations. Fun, but premature.

**Files involved:** `PizzaRatingSlider.jsx`, `FoodRatingSlider.jsx`, `sounds.js`

**Problem:** Polish before the core flow was stable. These features were later mostly unused.

---

### Phase 5: Navigation & Page Structure (Jan 12-13)
**What happened:** Added bottom navigation, created Browse/Spots/Profile pages, redesigned homepage multiple times.

**Files involved:** `BottomNav.jsx`, all page files, `App.jsx` routing

**Problem:** Page structure should have been decided in Phase 1.

---

### Phase 6: UI Redesign Marathon (Jan 13-14)
**What happened:** 20+ commits redesigning the same screens. Logo sizing (5 commits alone), card layouts, hero sections, CTAs.

**Files involved:** Every page file, most components

**Problem:** No design system or mockups existed. Design happened in code through trial and error.

---

### Phase 7: Design System (Finally) (Jan 14)
**What happened:** Added color tokens, unified typography to DM Sans, standardized card architecture.

**Files involved:** `index.css`, all pages

**Problem:** This should have been Phase 1. Would have prevented the redesign marathon.

---

### Phase 8: Auth Fixes (Jan 14)
**What happened:** Fixed session persistence, magic link redirects, modal scroll issues. Multiple commits fixing the same auth flow.

**Files involved:** `AuthContext.jsx`, `LoginModal.jsx`, `supabase.js`

**Problem:** Auth was in initial commit but not properly tested. Required 6+ fix commits.

---

### Phase 9: Refactoring (Jan 14-15)
**What happened:** Extracted `AuthContext`, `LocationContext`, shared `DishModal`. Added API layer abstraction.

**Files involved:** New `context/`, `api/` folders

**Problem:** This architectural cleanup was needed because Phase 1 didn't establish patterns.

---

### Phase 10: Analytics & Monitoring (Jan 15)
**What happened:** Added Sentry error tracking, PostHog analytics, after the app was mostly built.

**Files involved:** `main.jsx`, various components for tracking calls

**Problem:** Should have been earlier. Missed learning from early user behavior.

---

### Phase 11: Gamification & Polish (Jan 15-16)
**What happened:** Added impact feedback toasts, contribution badges, tier system, photo quality scoring.

**Files involved:** `ImpactFeedback.jsx`, `photoQuality.js`, `imageAnalysis.js`, Profile enhancements

**Good:** This was appropriate timing - polish after core was stable.

---

### Phase 12: Onboarding & Welcome (Jan 16)
**What happened:** Added welcome modal for name, welcome splash for first-time users.

**Files involved:** `WelcomeModal.jsx`, `WelcomeSplash.jsx`

**Problem:** Onboarding should have been designed earlier (but implemented later).

---

## Part 2: Build Order Comparison Chart

```
ACTUAL ORDER                          vs    IDEAL ORDER
─────────────────────────────────────────────────────────────────────────────
Week 1 (Jan 6-7)                            Week 1
├─ Schema + Auth + UI + Data (all at once)  ├─ Discovery & spec document
├─ Category additions (14 commits)          ├─ Define MVP scope + success metrics
└─ No design system                         ├─ Architecture decisions (stack, auth)
                                            └─ Design tokens & component patterns

Week 2 (Jan 11-14)                          Week 2
├─ Image debugging (10+ commits)            ├─ Schema design (with room to grow)
├─ Fun animations (premature)               ├─ API contracts (what data, what shape)
├─ Navigation added (should be Week 1)      ├─ Core auth flow (tested)
├─ 20+ UI redesign commits                  └─ Seed data strategy
└─ Design system added (too late)

Week 3 (Jan 14-15)                          Week 3
├─ Auth bug fixes                           ├─ Core screens (Home, Browse, Detail)
├─ Refactoring (AuthContext, API layer)     ├─ Primary user flow (view → vote)
├─ Analytics added                          ├─ Basic error handling
└─ Testing setup                            └─ Analytics instrumentation

Week 4 (Jan 15-16)                          Week 4
├─ Gamification & polish                    ├─ Secondary features (Profile, Save)
├─ Photo system                             ├─ Polish & animations
├─ Onboarding flows                         ├─ Onboarding flows
└─ Welcome splash                           └─ Testing & bug fixes
─────────────────────────────────────────────────────────────────────────────
```

---

## Part 3: What Worked vs. What Didn't

### What Worked Well

| Decision | Why It Worked |
|----------|---------------|
| Supabase for backend | Fast to set up, auth built-in, RLS for security |
| React + Vite | Quick dev server, fast builds |
| Starting with real data | MV restaurants made it feel real immediately |
| Iterating in production | Vercel deploys let you see real behavior fast |
| DEVLOG for tracking | Created accountability and memory |

### What Caused Problems

| Decision | Consequence | Debt Created |
|----------|-------------|--------------|
| No design system upfront | 20+ redesign commits | Had to retrofit color tokens |
| Auth in initial commit, untested | 6+ auth fix commits later | Users hit bugs in production |
| Categories not planned | 14 commits adding categories | Inconsistent naming, missing images |
| No image strategy | 10+ debugging commits | Cache busting hacks, unreliable URLs |
| Features before flow | Pizza animations unused | Wasted effort, dead code |
| No API layer initially | Direct Supabase calls everywhere | Required full refactor later |
| Analytics added late | Missed early user insights | Flying blind for first week |
| No component patterns | Duplicate code across pages | Required DishModal extraction |

---

## Part 4: The Ideal Build Order (Playbook)

### Stage 0: Discovery (Before Writing Code)
**Goal:** Know what you're building and why.

- [ ] Write a 1-paragraph product description
- [ ] Define the core user flow in words (e.g., "User opens app → sees dishes nearby → taps one → votes → sees updated ranking")
- [ ] List 3-5 MVP features (no more)
- [ ] Define success metrics (what does "working" mean?)
- [ ] Decide: who is this for? (even if just "me")

**Done when:** You can explain the app in 30 seconds without hesitation.

---

### Stage 1: Architecture Decisions
**Goal:** Choose your stack and establish patterns before coding.

- [ ] Choose frontend framework (React, Vue, etc.)
- [ ] Choose backend/database (Supabase, Firebase, etc.)
- [ ] Choose auth strategy (magic link, OAuth, passwords)
- [ ] Choose hosting (Vercel, Netlify, etc.)
- [ ] Decide on state management approach
- [ ] Set up project structure (folders, naming conventions)

**Done when:** You have a blank project with routing and auth skeleton working.

---

### Stage 2: Design Foundation
**Goal:** Establish visual language before building screens.

- [ ] Define color tokens (primary, secondary, text colors, surfaces)
- [ ] Choose typography (1-2 fonts max)
- [ ] Define spacing scale (4px, 8px, 16px, etc.)
- [ ] Sketch key screens (paper or Figma, doesn't need to be pretty)
- [ ] Define component patterns (cards, buttons, modals, inputs)

**Done when:** You have a `tokens.css` or theme file and know what a "card" looks like.

**Avoid:** Designing in code through trial and error.

---

### Stage 3: Data Model
**Goal:** Design your schema with room to grow.

- [ ] List all entities (users, restaurants, dishes, votes, etc.)
- [ ] Define relationships (one-to-many, many-to-many)
- [ ] Add fields you'll need later (created_at, updated_at always)
- [ ] Write RLS policies for security
- [ ] Create seed data script
- [ ] Test queries manually before writing code

**Done when:** You can query your data in the Supabase dashboard and get expected results.

**Avoid:** Adding columns one at a time as you realize you need them.

---

### Stage 4: API Layer
**Goal:** Create a clean interface between UI and database.

- [ ] Create API modules by domain (dishes, votes, auth, etc.)
- [ ] Define function signatures before implementing
- [ ] Add error handling wrapper
- [ ] Write at least one test per critical function

**Done when:** Components will never call Supabase directly.

**Avoid:** Putting database calls inside components.

---

### Stage 5: Core User Flow
**Goal:** Build the critical path end-to-end.

- [ ] Implement the primary screen (where users land)
- [ ] Implement the primary action (the main thing users do)
- [ ] Connect auth to the flow (gate actions appropriately)
- [ ] Add loading and error states
- [ ] Test the flow manually 10+ times

**Done when:** A new user can complete the core action without errors.

**Avoid:** Building secondary features before the core flow works perfectly.

---

### Stage 6: Instrumentation
**Goal:** See what's happening in production.

- [ ] Add error tracking (Sentry or similar)
- [ ] Add analytics (PostHog, Mixpanel, or similar)
- [ ] Track key events (page views, core actions, errors)
- [ ] Set up alerts for errors

**Done when:** You can see user behavior and errors in a dashboard.

**Avoid:** Waiting until "later" - you need this data from day one.

---

### Stage 7: Secondary Features
**Goal:** Build everything else.

- [ ] Profile/settings page
- [ ] Secondary flows (save, share, etc.)
- [ ] Admin tools (if needed)
- [ ] Additional pages

**Done when:** All MVP features are implemented.

---

### Stage 8: Polish & Onboarding
**Goal:** Make it feel good.

- [ ] Add micro-animations (tastefully)
- [ ] Implement onboarding flow
- [ ] Add empty states
- [ ] Add success feedback (toasts, confirmations)
- [ ] Refine copy and messaging

**Done when:** A new user can understand and use the app without explanation.

---

### Stage 9: Testing & Hardening
**Goal:** Make sure it doesn't break.

- [ ] Write tests for critical paths
- [ ] Test on multiple devices/browsers
- [ ] Fix edge cases
- [ ] Security review (auth, RLS, input validation)
- [ ] Performance check (load times, bundle size)

**Done when:** You're confident enough to share it publicly.

---

## Part 5: One-Page Checklist for Next Time

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    APP BUILD CHECKLIST                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BEFORE YOU CODE                                                        │
│  □ Can I explain this app in 30 seconds?                                │
│  □ What's the ONE core action users take?                               │
│  □ What are my 3-5 MVP features? (Write them down, no more)             │
│  □ What does "done" look like?                                          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FOUNDATION (Do these FIRST, in order)                                  │
│  □ Stack chosen (frontend, backend, auth, hosting)                      │
│  □ Design tokens defined (colors, fonts, spacing)                       │
│  □ Database schema designed (with room to grow)                         │
│  □ API layer structure created                                          │
│  □ Project structure established (folders, naming)                      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CORE BUILD (Do these BEFORE any secondary features)                    │
│  □ Auth flow working and tested                                         │
│  □ Primary screen implemented                                           │
│  □ Core user action working end-to-end                                  │
│  □ Error handling in place                                              │
│  □ Analytics instrumented                                               │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SECONDARY BUILD                                                        │
│  □ Additional screens                                                   │
│  □ Secondary features                                                   │
│  □ Admin tools (if needed)                                              │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  POLISH (Do these LAST)                                                 │
│  □ Onboarding flow                                                      │
│  □ Animations and micro-interactions                                    │
│  □ Empty states and edge cases                                          │
│  □ Copy refinement                                                      │
│  □ Testing on multiple devices                                          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RED FLAGS (Stop if you're doing these)                                 │
│  ✗ Adding "fun" features before core flow works                         │
│  ✗ Redesigning the same screen 5+ times                                 │
│  ✗ Adding database columns one at a time                                │
│  ✗ Putting database calls directly in components                        │
│  ✗ Skipping analytics "for now"                                         │
│  ✗ No design tokens (hardcoding colors everywhere)                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Lessons

1. **Design system first, not last.** Every hour spent on color tokens upfront saves 5 hours of redesign commits.

2. **Schema with room to grow.** Add `created_at`, `updated_at`, and fields you might need. Adding columns later means migrations.

3. **API layer from day one.** Never let components call the database directly. You'll thank yourself during refactoring.

4. **Analytics early, not late.** You need to see what users actually do, not what you think they do.

5. **Core flow before features.** A working login → view → vote flow matters more than pizza animations.

6. **Test auth thoroughly.** Auth bugs are the worst bugs. Users lose trust instantly.

7. **Categories/taxonomies upfront.** If your app has categories, define them all before building the filter UI.

8. **Images need a strategy.** Decide where images come from (CDN, user upload, placeholders) before you build.

---

*Phases 1-12 generated from analysis of 100+ commits over 11 days of building What's Good Here.*

---

## Part 6: Post-Retrospective Phases (Jan 16–29)

377 additional commits over 13 days. The app evolved from MVP to launch-ready.

---

### Phase 13: App Restructure & Core UX (Jan 16–17)
**16 commits.** Tore apart the app's information architecture and rebuilt it around focused user jobs.

- Implemented dual-view ranking (Discovery by avg_rating vs Confidence by % order again)
- Restructured entire app for focused user jobs
- Added smart dish-first search to Homepage
- Built dedicated dish detail page
- Added trust signals: winner badge, credibility line
- Added Top 10 on the Island sidebar
- Completed search flow (Enter key → full results)
- Refined restaurant list (top dishes, vote counts, alphabetical)
- Made dish cards clickable in restaurant view
- Fixed UX clarity: language, framing, confusing vote language

**Pattern:** This was the first major architectural rethink — shifting from "show everything" to "help users decide."

---

### Phase 14: Category Architecture & Admin (Jan 18)
**22 commits.** Established that categories are shortcuts, not containers — a key architectural principle.

- Implemented category architecture: shortcuts not containers
- Renamed Browse to Categories
- Updated welcome splash with mission statement
- Added gold/silver/bronze medals to Top 10
- Cleaned up vote language, removed confusing "Early" prefix
- Built app audit and roadmap document
- Added community avg comparison to Profile dish cards
- Built Admin Panel with search/edit functionality
- Added admin RLS policies
- Applied consistent error policy: APIs throw, callers catch
- Added accessibility improvements, RLS docs

**Pattern:** Category architecture decision shaped everything that followed. Admin panel was needed for data management.

---

### Phase 15: Gamification & Analytics (Jan 19)
**24 commits.** Added the engagement layer and started measuring what users actually do.

- Added color-coded ratings based on score quality
- Built badges/achievements gamification system with dedicated page
- Set up PostHog reverse proxy via Vercel Edge Middleware
- Added analytics tracking for restaurant sales data and vote events
- Built multi-step onboarding flow
- Reduced bundle size by 26%
- Fixed mobile scrolling with dynamic viewport height
- Added security headers and rate limiting
- Auto-reload on stale chunk errors after deploys
- Improved voting auth flow for non-logged-in users

**Pattern:** Analytics should have been earlier (see Phase 10 lesson), but gamification timing was right — core was stable.

---

### Phase 16: Dark Mode & Visual Identity (Jan 20)
**65 commits.** The biggest single-day push. Complete visual overhaul — dark mode, category tiles, plates, logo. Heavy iteration.

- Dark mode overhaul + premium category tiles
- Category tiles: photos → plates on dark wood → neon plate style
- Scalloped plate edges (6+ iterations finding the right curve)
- Logo updates (8+ iterations, reverts, size changes)
- Dark wood table background for categories
- Major Browse layout restructure
- Consistent dark theme across all pages
- Search bar styling to match new theme

**Problem:** 65 commits in one day is Phase 6 all over again — designing in code through trial and error. The plate/logo iterations could have been resolved in a design tool first.

**Lesson reinforced:** Visual identity work in code is expensive. Even a quick Figma mockup saves dozens of commits.

---

### Phase 17: Social Features & Security (Jan 22)
**26 commits.** Added the social layer: follows, notifications, friend profiles.

- Follow system with list modals
- Friend profiles with rating comparison
- Notification bell with dropdown
- Forgot password flow, Create Account button
- Username uniqueness check
- Notification management (delete on close)
- Security hardening: path traversal, SQL injection, auth checks
- RLS policies for profiles, notifications, storage
- RLS validation test suite
- Fixed critical issues: double-vote, auth session, distance scaling
- Added pagination and server-side rate limiting

**Pattern:** Social features shipped in one focused day. Security hardening was done right — same session, not deferred.

---

### Phase 18: Performance & Learning (Jan 23)
**12 commits.** Optimization pass and knowledge capture.

- Applied Vercel React best practices
- Performance optimizations (caching, bundling)
- Created LEARNING.md glossary with 150+ technical terms
- Added personalized category selection
- Built friends leaderboard and voting streaks
- Redesigned Badges page to match gamified Achievements section

**Good:** Pausing to document learnings. LEARNING.md captures knowledge that would otherwise be lost.

---

### Phase 19: Reviews, Branding & Major Refactor (Jan 24)
**55 commits.** Three things at once: new feature (reviews), rebrand, and code cleanup. Ambitious day.

- Added text reviews with smart snippets
- Rebranded to "What's Good Here" throughout
- Decluttered Profile page with simplified Hero Identity Card
- Replaced all emojis with neon icons throughout app
- Added granular decimal ratings
- Built cuisine/tags system for enhanced search
- Added dish variants system for grouped flavors
- **Major refactor:** extracted shared profile components, barrel exports, file organization
- Standardized on 'favorites' naming, coding standards in CLAUDE.md
- Standardized error handling, removed dead code and unused dependencies

**Problem:** Too many concerns in one day. Refactoring + new features + rebranding simultaneously is risky. Any one of these is a full day of work.

---

### Phase 20: Hardening & Accessibility (Jan 25)
**75 commits.** The biggest day by commit count. Comprehensive quality pass.

- Comprehensive test coverage for core APIs and utilities
- WCAG AAA accessibility improvements
- React Query caching, optimistic updates, route prefetching
- Security fixes: critical auth, medium-severity, CSP headers
- Performance: virtualization, service worker, lazy-load Sentry, parallel fetches
- Scalability fixes for 500+ records
- Search bug fixes: cuisine matching, multi-word queries, synonyms, defensive checks
- Mobile smoothness polish: animations, touch targets
- Launch readiness: SEO, 404 page, share button, offline indicator
- Rating Identity system with consensus-based bias tracking
- Focus styling fixes across all search inputs

**Pattern:** This was the "make it production-ready" day. Everything here maps to Stage 9 (Testing & Hardening) in the ideal playbook.

---

### Phase 21: Debugging & UX Fixes (Jan 26)
**19 commits.** Real-world bug hunting — radius persistence, dish limits, env cleanup.

- Fixed radius persistence and excluded closed restaurants
- Debug cycle to find 100-dish limit hiding category results
- Removed .env from repo, added to .gitignore
- Added personalized greeting and simplified location UI
- Refactored Home screen with unified SearchHero component
- Added UI polish: toasts, route progress bar, HearingIcon
- Updated to neon-style logo

**Pattern:** The debug cycle (6 commits adding logging, 1 commit fixing the actual bug, 1 commit removing logging) is a pattern worth noting. Structured debugging saves time.

---

### Phase 22: Theme Evolution (Jan 27)
**24 commits.** Third visual identity pass — from dark mode to Deep Ocean to Island Depths.

- Splash screen redesign (retro mascot → friendlier logo → fork+knife)
- WelcomeModal fixes (dark mode, click issues, repeat showing)
- Deep Ocean theme with bioluminescent cyan accents
- Pivoted to Island Depths theme with warm gold accents
- Coral neon category images
- Fork+knife checkmark logo design
- Consistent logo across all screens (splash, signin, welcome)

**Problem:** Third theme in a week (dark mode Jan 20, Deep Ocean Jan 27 morning, Island Depths Jan 27 evening). Each requires touching every screen. This is the Phase 6 lesson again — visual identity decisions in code are expensive.

---

### Phase 23: Homepage Redesign & Information Architecture (Jan 28)
**24 commits.** Restructured the entire homepage discovery flow and navigation.

- Redesigned homepage with intentional discovery flow
- Removed Categories tab from bottom nav (categories live on Home now)
- Authoritative copy/branding throughout ("Find What's Good on the Vineyard")
- Replaced Browse photo grid with ranked list view
- Simplified restaurant dish rating to single metric
- Changed all "say it's good here" to "would order again"
- Replaced radius filter with town dropdown for Martha's Vineyard
- Added restaurant initials with town-based colors
- Added Discover page for restaurant specials

**Good:** Removing the Categories tab was a bold call — consolidating navigation is hard but the app is simpler for it. Town dropdown is a much better fit than radius for an island.

---

### Phase 24: Category Icons & Visual Polish (Jan 29)
**15 commits.** Final polish pass and new icon set.

- Replaced all 14 category icons with new cohesive illustrated set
- Moved Top 10 list above category grid on Home page
- Updated Top 10 title to reflect selected town
- Added ear icon tooltip for first-time discoverability
- Visual polish pass: Home page (typography, spacing, depth, micro-interactions)
- Visual polish pass: Profile page (atmospheric gradients, avatar glow, sticky tabs)
- Visual polish pass: Restaurants page (depth shadows, gradient dividers, refined cards)
- Changed dish sorting to granular rating score (avg_rating)

**Good:** This is the right kind of polish — systematic, same color palette, no redesign. Refinement, not reinvention.

---

## Part 7: Updated Build Order Comparison

```
ACTUAL ORDER (Full Build)                     IDEAL ORDER
──────────────────────────────────────────────────────────────────────────────
Week 1 (Jan 6-7): Phases 1-2                  Week 1
├─ Big Bang MVP commit                        ├─ Discovery & spec
├─ 14 category commits                        ├─ Design tokens & patterns
└─ No design system                           └─ Schema with room to grow

Week 2 (Jan 11-16): Phases 3-12               Week 2
├─ Image debugging (10+ commits)              ├─ Core screens + user flow
├─ Fun animations (premature)                 ├─ Auth (tested)
├─ Navigation (should be Week 1)              ├─ API layer
├─ 20+ UI redesign commits                    └─ Analytics from day one
├─ Design system (too late)
├─ Auth fixes, refactoring
├─ Analytics, gamification
└─ Onboarding

Week 3 (Jan 16-19): Phases 13-15              Week 3
├─ App restructure (right timing)             ├─ Secondary features
├─ Category architecture (key decision)       ├─ Social, gamification
├─ Admin panel                                ├─ Admin tools
├─ Gamification & badges                      └─ Performance baseline
└─ Analytics tracking

Week 4 (Jan 20-24): Phases 16-19              Week 4
├─ Dark mode (65 commits in a day)            ├─ Visual identity (IN A DESIGN TOOL)
├─ Social features (well-executed)            ├─ Theme implementation (once)
├─ Performance & learning                     ├─ Reviews & new features
├─ Reviews, rebrand, major refactor           └─ Code cleanup
└─ 55 commits mixing 3 concerns

Week 5 (Jan 25-29): Phases 20-24              Week 5
├─ Hardening (75 commits)                     ├─ Testing & hardening
├─ Accessibility (WCAG AAA)                   ├─ Accessibility pass
├─ Theme evolution (3rd theme)                ├─ Final polish (one pass)
├─ Homepage redesign                          ├─ Launch readiness
├─ Town filtering                             └─ Data seeding
└─ Visual polish pass
──────────────────────────────────────────────────────────────────────────────
```

---

## Part 8: New Lessons (Phases 13-24)

9. **Design in a design tool, not in code.** Phase 16 (65 commits) and Phase 22 (3 themes in a week) prove this. Every visual identity iteration in code costs a full app-wide commit cycle.

10. **One concern per session.** Phase 19 mixed reviews + rebrand + refactor in one day. Any one of those is a full day. Mixing them makes bugs harder to trace.

11. **Town > radius for a small geography.** The radius slider was technically correct but wrong for an island. Domain-specific UX beats generic UX.

12. **Structured debugging pays off.** Phase 21's debug cycle (6 logging commits → 1 fix → 1 cleanup) is a pattern. A systematic approach (reproduce → hypothesize → instrument → fix) is faster than random logging.

13. **Polish is refinement, not reinvention.** Phase 24's polish pass worked because it changed typography/spacing/depth within the existing design system. Phases 16 and 22 were reinvention — much more expensive.

14. **Remove features to simplify.** Removing the Categories tab (Phase 23) made the app better. Subtraction is underrated.

15. **Commit count is a smell.** 65 commits in a day means you're iterating in production. 15 focused commits means you knew what you were building.

---

*Updated January 29, 2026. 477+ commits over 24 days.*
