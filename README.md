# What's Good Here

Dish-level food discovery for Martha's Vineyard. Ranks individual dishes by crowd-sourced "Would you order this again?" votes. Launching Memorial Day 2026.

## Why dishes, not restaurants

Restaurant ratings are useless. A 4.2-star restaurant tells you nothing about which dish to order. WGH ranks the actual food — the lobster roll at Net Result, the burger at Lookout Tavern — so you know what's worth ordering before you sit down.

## Product Philosophy

**Dishes, not restaurants.** Restaurant grouping breaks the core value prop. A 4.2-star restaurant tells you nothing about what to order. If categories are specific enough, users never need restaurant grouping. The request for it is a symptom of bad categories, not a need for grouping.

**Categories are shortcuts, not containers.** The test: "Would a user say 'I want [category]'?" — "I want wings" passes, "I want an appetizer" fails. Browse shows curated shortcuts. Search is the universal access layer.

**Town beats radius.** A radius slider is technically correct but wrong for an island. Domain-specific UX beats generic UX. That's why the town picker exists.

**Anti-gamification golden rule.** If a mechanic risks inflating scores, biasing ratings, or low-effort behavior — it does not ship. No streaks, no leaderboards, no XP, no Yelp Elite nonsense. Users are contributors, not consumers — "Add Your Vote," "Help rank this dish."

**Don't punish real users for hypothetical bots.** Light protection first. Add friction only if abuse appears. No CAPTCHA on every vote, no phone number upfront, no public vote history.

**Subtract before you add.** Before adding anything, ask "can I remove something instead?" Removing the Categories tab made the app better.

**Ship over perfect.** The app is "done" when a user can open it at a restaurant, see ranked dishes in under 10 seconds, vote with one tap, and come back next time. Everything else is iteration.

## Expansion

**Geography:** Martha's Vineyard (live) → Nantucket → Cape Cod → Boston/Providence. Code is multi-city ready — expansion is a data problem, not a code problem.

**Data strategy:** Seed menus before pitching restaurants. "Look, your restaurant is already here." Automated menu import pipeline: v1 script + LLM + human spot-check → v2 confidence scoring → v3 POS integrations (Toast, Square, Clover).

**Launch seeding:** Founders rate 50+ dishes before public launch. Real ratings, not fake seeds. Soft launch: 20 friends, 2 weeks, 100+ ratings before marketing push.

## Roadmap

**Gamification phases:**
- Phase 1 (built): Impact feedback, contribution counts, "needs X votes to rank" progress
- Phase 2 (after traction): Explorer → Contributor → Tastemaker → Local Legend, trust-based unlocks
- Phase 3 (restaurants): Specials voting, community favorite badges (earned, not paid)

**Photo-to-rate flow:** Capture the moment users photograph food → match to dish → rate later. V1: manual pick. V2: AI matching when dish database is large enough.

**Success signals:** Top 3 ranked dishes changing = healthy app. Track voting completion rate (start modal → submit). 100 active users OR multi-region ready as next milestone.

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 3, React Router v7
- **Maps:** Leaflet + React Leaflet (dish pins, restaurant discovery)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Hosting:** Vercel
- **Analytics:** PostHog, Sentry
- **Testing:** Vitest (unit), Playwright (E2E, 3 persona suites)
- **PWA:** vite-plugin-pwa with service worker

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in your Supabase URL + anon key

# Run schema
# Copy supabase/schema.sql into Supabase SQL Editor and run

# Start dev server
npm run dev        # localhost:5173
```

See [PARTNER-SETUP.md](PARTNER-SETUP.md) for full onboarding (Supabase config, Edge Functions, env vars).

## Commands

```bash
npm run dev              # Dev server (localhost:5173)
npm run build            # Production build
npm run test             # Vitest unit tests
npm run lint             # ESLint
npm run test:e2e         # Playwright — all personas
npm run test:e2e:browser # Tourist persona
npm run test:e2e:pioneer # Foodie persona
npm run test:e2e:business # Manager persona
```

## Architecture

```
src/
  api/           16 API modules (one per domain, barrel export)
  components/    Shared + feature-grouped (Auth, browse, home, profile, restaurants)
  constants/     App-wide constants (categories, towns, tags, features)
  context/       AuthContext, LocationContext
  hooks/         20 custom hooks
  lib/           Infrastructure (supabase, analytics, storage, rate limiter)
  pages/         18 pages (all lazy-loaded)
  utils/         Pure utilities (error handling, ranking, distance, logger)

supabase/
  schema.sql     Single source of truth — complete database schema
  functions/     10 Edge Functions (Places proxy, menu scraping, restaurant discovery)
  migrations/    Manual migration scripts
  seed/          Seed data + test fixtures

e2e/             Playwright E2E tests (3 persona categories)
```

**20 database tables** | **37+ RPCs** | **Row-level security on all tables** | **10 Edge Functions**

## Key Features

- Dual-mode homepage: ranked dish list (default) or full-screen map with emoji dish pins
- Category shortcuts (23 curated) + universal search
- Worth It / Skip voting with reviews
- Bayesian ranking with review decay
- Google OAuth + magic link auth
- Social layer: follows, taste compatibility, friend votes
- Restaurant manager portal (specials, events, menu import)
- Toast integration (deep-link ordering for 35 MV restaurants)
- Jitter Protocol anti-bot verification on reviews
- Distance-based filtering with town picker
- Photo uploads with quality scoring
- OG image generation for social sharing

## Key Docs

| Doc | Purpose |
|-----|---------|
| [CLAUDE.md](CLAUDE.md) | Rules, conventions, architecture — read before any session |
| [SPEC.md](SPEC.md) | Verified system specification (tables, RPCs, RLS, routes) |
| [TASKS.md](TASKS.md) | Prioritized backlog with acceptance criteria |
| [NOTES.md](NOTES.md) | Design tokens, build order, category system |
| [DEVLOG.md](DEVLOG.md) | Chronological work history |
| [ICON-SPEC.md](ICON-SPEC.md) | Neo-brutalist icon system (42 icons) |

## Coverage

- **Martha's Vineyard:** 7 towns, 35+ restaurants with Toast ordering
- **Nantucket:** Town constants ready, data pending
- **Cape Cod:** Town constants ready, data pending

## License

Private. All rights reserved.
