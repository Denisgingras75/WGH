# What's Good Here

Mobile-first food discovery app for Martha's Vineyard (expanding to Nantucket + Cape Cod). Ranks dishes by crowd-sourced "Would you order this again?" votes. Dual-mode homepage: full-screen list (default) or full-screen map, toggled via floating FAB.

## Tech Stack
- **Frontend:** React 19, Vite 7, Tailwind CSS 3, React Router v7
- **Maps:** Leaflet + React Leaflet (dish pins, restaurant discovery)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Hosting:** Vercel (whats-good-here.vercel.app)
- **Analytics:** PostHog, Sentry
- **Testing:** Vitest (unit), Playwright (E2E)
- **PWA:** vite-plugin-pwa with service worker

## Role
You are the senior project manager and design partner, not an order-taker. Your job is to make this the best dish rating app there ever was. That means: push back when an idea is wrong, propose better alternatives, flag when something will hurt UX or create debt. Agree when you genuinely agree — but never just to be agreeable. Honest disagreement is more valuable than fast compliance.

## Session Startup

Run this checklist before touching anything:

1. **Read `CURRENT_FOCUS.md`** — one paragraph on what we're working on *right now*. Source of truth for this session's scope. If it's stale, ask Dan to update before starting.
2. **Read `SPEC.md` and `TASKS.md`** — system state and backlog.
3. **Glance at `LAUNCH-READINESS.md`** — know what's shipped vs. outstanding for Memorial Day.
4. **Collision check for parallel work.** Multiple Claude sessions (Dan's + Denis's + scheduled agents) can claim the same surface. Before editing:
   - `git fetch origin main --quiet && git log --oneline HEAD..origin/main` — commits on main since your branch point. If this is non-empty, another session shipped work — rebase or pull before editing.
   - `git status` — modified or untracked files you didn't create = in-flight work from another session.
   - Read the **Active handoff** block in `CURRENT_FOCUS.md`. If another session has claimed files/modules you want to touch, STOP and ask Dan what's happening — don't duplicate or overwrite.
   - If any of these signals fire and you're not sure, ask Dan before editing.

## Quick Commands
```bash
npm run dev              # localhost:5173
npm run build            # production build
npm run test             # vitest unit tests
npm run lint             # eslint
npm run test:e2e         # playwright all personas
npm run test:e2e:browser # tourist persona E2E
npm run test:e2e:pioneer # foodie persona E2E
npm run test:e2e:business # manager persona E2E
```

## Key Docs
- `CURRENT_FOCUS.md` - What we're working on RIGHT NOW (read at session start)
- `LAUNCH-READINESS.md` - Memorial Day checklist, any Claude ticks boxes as work ships
- `SMOKE-TEST.md` - Test accounts + golden-path recipes for verifying UI changes
- `SPEC.md` - Full system specification (data model, features, RPCs, RLS)
- `TASKS.md` - Prioritized backlog of high-leverage tasks
- `NOTES.md` - Design tokens, architecture, file locations, category system
- `ICON-SPEC.md` - Neo-brutalist icon system spec
- `docs/DESIGN-SYSTEM.md` - "Lobster Buoy" UI system: palette, type, sticker patterns
- `DEVLOG.md` - Recent work history

---

## 1. Non-Negotiables (Hard Rules)

These rules are absolute. Violating any of them is a bug.

### 1.1 Browser Compatibility
- **No `toSorted()` or ES2023+ array methods.** Use `slice().sort()`. Crashes Safari <16, Chrome <110.
- **No `Array.at()`.** Use `arr[arr.length - 1]` for last element.
- **Test:** `npm run build` must succeed with no ES2023+ in output.

### 1.2 Error Handling
- **Never render error objects directly.** Always `{error?.message || error}`, never `{error}`.
- **Supabase/network errors must use `createClassifiedError()`.** Catch blocks in API files wrap unexpected errors: `throw error.type ? error : createClassifiedError(error)`. Early validation guards (auth checks, input validation) can throw plain `new Error('readable message')` — `classifyError()` parses the message downstream. See `src/api/dishesApi.js` for the canonical pattern.
- **Every page must have a loading state.** No empty `<div>` while fetching. Use skeleton or spinner.
- **New Supabase fields must be added in two places:** `selectFields` string AND `.map()` transform.
- **Test:** Grep for catch blocks in API files — each should have `throw error.type ? error : createClassifiedError(error)`.

### 1.3 Styling
- **Brand colors via CSS variables.** Use `var(--color-*)` for primary, rating, text, backgrounds, medals — anything that defines the app's identity. This makes rebranding a one-file change.
- **Hex is fine for one-off colors.** SVG fills, map markers, illustrations, third-party brand colors (Google logo), rgba overlays — use hex/rgba directly.
- **No Tailwind color classes.** No `text-gray-*`, `bg-blue-*`, `text-white`, etc. Tailwind is for layout/spacing only (`className` for flexbox, padding, margin, grid).
- **Fonts via tokens.** `var(--font-display)` / `var(--font-body)` / `var(--font-mono)` — never a font-family string literal.
- **Sticker system for surfaces.** Cards, buttons, inputs, modals use the ink outline + hard offset shadow tokens (`--border-ink`, `--shadow-hard*`, `--radius-*`) or the `.sticker` / `.btn-ink` classes. No soft blurred shadows, no glass. See `docs/DESIGN-SYSTEM.md`.

### 1.4 Data Access
- **No direct Supabase calls from components or hooks.** All data access goes through `src/api/`.
- **React Query is the data fetching layer.** Use `useQuery`/`useMutation` for all server state. No raw `useEffect` + `fetch` patterns for data fetching.
- **`supabase/schema.sql` is the source of truth.** Update it first when making DB changes, then run in SQL Editor.
- **`.rpc()` function names must exactly match `schema.sql`.** Don't rename based on Postgres hint messages.
- **Test:** Grep for `supabase.` in `src/pages/` and `src/components/` — should return zero results.

### 1.5 Supabase Query Safety
- **Use `.maybeSingle()` for lookups that might return zero rows.** `.single()` throws on zero results.
- **Optimistic updates must have rollback.** Revert to previous state on error, never leave stale data.
- **`ROUND()` needs `::NUMERIC` cast on float expressions.** `ROUND(expression::NUMERIC, 2)`.
- **New RPC functions must be run in Supabase SQL Editor.** Adding to `schema.sql` does NOT deploy. Run the CREATE FUNCTION, then verify with a test call.
- **Always qualify column references in PL/pgSQL functions.** `RETURNS TABLE` column names become variables inside the function body. Bare `dish_id` is ambiguous if a joined table also has `dish_id`. Always use `tablename.column` (e.g., `votes.dish_id`, not `dish_id`).
- **Every risky migration must declare a rollback path.** If a migration changes column types, drops/recreates triggers, alters FK strategies, or rewrites policies, include a commented `-- ROLLBACK:` block at the bottom of the file with paste-ready SQL to revert. Pure additive `CREATE INDEX IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION` changes don't need one (rollback is obvious). If no SQL rollback is possible (e.g., the migration triggers a data backfill), say so explicitly: `-- No SQL rollback. Recovery requires restore from the <timestamp> backup.`

### 1.6 Auth Gates
- **Voting, favorites, and photo uploads require login.** Check `user` from `useAuth()` first, show `<LoginModal>` if null. Pattern: `Browse.jsx`.

### 1.7 Logging
- **Use `logger` from `src/utils/logger.js`.** Never use `console.*` directly.
- `logger.error()` / `logger.warn()` — always logged (errors go to Sentry in prod).
- `logger.info()` / `logger.debug()` — only in development.
- **Test:** Grep for `console\.log|console\.error|console\.warn` in `src/` excluding `utils/logger.js` — should return zero results.

### 1.8 Storage
- **All localStorage access via `src/lib/storage.js`.** Use `getStorageItem`/`setStorageItem`/`removeStorageItem`. No direct `localStorage.*` calls in components, hooks, or context.
- **Exception:** `src/lib/supabase.js` passes `window.localStorage` to Supabase Auth config (required by SDK).
- **Test:** Grep for `localStorage\.` in `src/` excluding `lib/storage.js` and `lib/supabase.js` — should return zero results.

### 1.9 Content Safety
- **All user-generated text must pass `validateUserContent()`.** From `src/lib/reviewBlocklist.js`. Reviews, restaurant names, dish names.
- **Client-side rate limiting via `src/lib/rateLimiter.js`.** `checkVoteRateLimit()` and `checkPhotoUploadRateLimit()` before server calls.

---

## 2. Standard Workflow

For any non-trivial change, follow this sequence:

1. **Read `SPEC.md`** — understand the current system state
2. **Check `TASKS.md`** — see if the work is already scoped
3. **Update `schema.sql` first** — if touching database (schema is source of truth)
4. **Make small, focused diffs** — one concern per change
5. **Run in SQL Editor** — if you added/changed RPCs or schema
6. **Verify:**
   - `npm run build` passes
   - `npm run test` passes
   - If you touched schema/RPC: test call returns expected result
   - If you touched sort/filter: edge cases (null, 0 votes, missing price) don't crash
   - If you added a component: exported from barrel index, imported where needed
7. **Update `SPEC.md`** — if the change adds/modifies features, tables, or RPCs
8. **Update `TASKS.md`** — mark task done or add follow-ups

---

## 3. Forbidden Actions

Never do these. If tempted, stop and reconsider.

- **Don't commit unused components, hooks, or dead code.** Delete immediately.
- **Don't duplicate constants.** Everything in `src/constants/`.
- **Don't commit direct `console.*` calls.** Use `logger`.
- **Don't commit ES2023+ syntax without polyfills.**
- **Don't commit direct `localStorage` calls.** Use `src/lib/storage.js`.
- **Don't add features not in `TASKS.md` or explicitly requested.** No speculative work.
- **Don't modify `schema.sql` without running the change in SQL Editor.**
- **Don't guess RPC function names.** Look them up in `schema.sql`.
- **Don't skip `npm run build` before saying "done".**

---

## 4. Project Conventions

### 4.1 Project Structure
```
src/
├── api/              # API layer (16 modules + barrel) — one file per domain
│   └── index.js      # Barrel export for all API modules
├── components/       # Shared + feature-grouped components
│   ├── Auth/         # LoginModal, WelcomeModal
│   ├── browse/       # BrowseSearchBar, BrowseResults, SortDropdown
│   ├── home/         # HomeListMode, Top10Carousel, LocalListsSection, CategoryIcons
│   ├── jitter/       # SessionCard, SessionBadge, TrustBadge
│   ├── profile/      # JournalCard, JournalFeed, ShelfFilter, HeroIdentityCard, FoodMap
│   ├── restaurant-admin/ # DishesManager, EventsManager, MenuImportWizard, SpecialsManager
│   └── restaurants/  # RestaurantMap, RestaurantDishes, RestaurantMenu
├── constants/        # App-wide constants (10 files)
├── context/          # AuthContext, LocationContext
├── hooks/            # Custom React hooks (20 hooks)
├── lib/              # Infrastructure (supabase, analytics, storage, sounds, rateLimiter, reviewBlocklist)
├── pages/            # Page components (19 pages, all lazy-loaded)
├── utils/            # Pure utilities (errorHandler, ranking, distance, logger, sanitize, etc.)
└── test/             # Test setup

supabase/
├── schema.sql        # Single source of truth — complete database schema
├── functions/        # 10 Edge Functions (Places proxies, menu scraping, restaurant discovery)
├── migrations/       # Manual migration scripts (run in SQL Editor)
├── seed/             # Seed data + test fixtures
└── tests/            # RLS validation tests

api/                  # Root-level Vercel serverless functions
├── og-image.ts       # OpenGraph image generation
└── share.ts          # Social bot redirect handler

e2e/                  # Playwright E2E tests (3 persona categories)
├── browser/          # Tourist persona (browse, dish detail, home, hub, restaurants)
├── pioneer/          # Foodie persona (voting, favorites, login, profile, social)
├── business/         # Manager persona (portal)
└── fixtures/         # Test helpers

scripts/              # Node utility scripts (review harvesting, menu import, backfill)
```

### 4.2 Key UI Architecture

**Homepage (Dual-Mode Toggle):** Two committed full-screen modes, no half-states. **List mode** (default): sticky search bar, category chips, ranked dish list using `DishListItem`. **Map mode**: full-screen Leaflet map with emoji dish pins, floating search bar with zoom buttons and radius control. `ModeFAB` (floating pill, bottom-right) toggles between modes. Scroll position preserved across switches. Dish detail "See on map" button bridges back to map mode via route state.

**DishListItem:** THE single component for all dish lists everywhere. Do not create new dish card components. Three variants:
- `ranked` (default) — home, browse, restaurant detail. Shows rank + emoji + name + restaurant + rating.
- `voted` — profile pages. Card layout with photo, restaurant, rating comparison.
- `compact` — condensed version.

**Category test:** "Would a user say 'I want [category]'?" — "I want wings" passes, "I want an appetizer" fails. Use this test for all category additions.

**RestaurantMap:** Dual-mode Leaflet map. Dish mode shows emoji pins for top dishes. Restaurant mode shows restaurant markers + Google Places discovery for unclaimed restaurants.

### 4.3 API Layer Pattern
Every API file follows this structure:
```js
import { supabase } from '../lib/supabase'
import { createClassifiedError } from '../utils/errorHandler'
import { logger } from '../utils/logger'

export const fooApi = {
  async getSomething(params) {
    try {
      const { data, error } = await supabase.rpc('rpc_name', { ... })
      if (error) throw createClassifiedError(error)
      return data || []
    } catch (error) {
      logger.error('Context:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
```
For table queries (not RPCs), use `selectFields` string + `.map()` transform. See `dishesApi.search()`.

### 4.4 Hook Pattern
```js
import { useQuery } from '@tanstack/react-query'
import { fooApi } from '../api/fooApi'
import { getUserMessage } from '../utils/errorHandler'

export function useFoo(params) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['foo', params],
    queryFn: () => fooApi.getSomething(params),
    enabled: !!params,
  })
  return {
    foos: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading foos') } : null,
    refetch,
  }
}
```

### 4.5 Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Components | PascalCase named exports | `export function DishListItem()` |
| Hooks | `use` prefix, camelCase | `useDishes`, `useVote` |
| API files | camelCase + `Api` suffix | `dishesApi`, `votesApi` |
| Constants | UPPER_SNAKE_CASE | `MIN_VOTES_FOR_RANKING` |
| Utility functions | camelCase | `createClassifiedError` |
| CSS variables | `--color-*` prefix | `var(--color-primary)` |
| Use "favorites" not "saved" | Database table is `favorites` | `useFavorites`, `isFavorite` |

### 4.6 Typography
Two-font system loaded via Google Fonts in `index.html`, referenced only through tokens.

| Font | Token | Role | Weights |
|------|-------|------|---------|
| **Bricolage Grotesque** (variable opsz/wdth/wght) | `--font-display` | Brand wordmark, page/section headings, card titles, rank + rating numerals, avatar initials. `h1`–`h3` default to it. | 800 |
| **Instrument Sans** | `--font-body` | Everything else — dish names, meta, buttons, inputs. Inherited from `body`. | 400–700 |
| **SF Mono stack** | `--font-mono` | Jitter badges only | 700 |

**Rule:** display = things that name a place/section or a number you decide on; body = things you read or tap.

**Brand lockup:** use `<Wordmark size={…} />` (`src/components/Wordmark.jsx`) — "What's **Good** Here" in condensed Bricolage with "Good" on a butter sticker. Don't hand-roll it.

**Retired:** Amatic SC, Outfit, DM Sans, Cormorant, Aglet Sans. Do not re-introduce these fonts.

### 4.7 Design Tokens
Defined in `src/index.css` `:root` — "Lobster Buoy" (light only). Full system in `docs/DESIGN-SYSTEM.md`.

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#CA3216` (Lobster) | Primary actions, brand mark |
| `--color-accent` | `#1F4FA3` (Harbor) | Links, restaurant names, secondary actions |
| `--color-butter` | `#FFC83D` (Butter) | Highlights, active states, #1 — always with ink text |
| `--color-ink` / `--color-text-primary` | `#1B1611` | Text, outlines, hard shadows |
| `--color-text-secondary` | `#554A3E` | Secondary text |
| `--color-text-tertiary` | `#73665A` | Tertiary text (AA on bg) |
| `--color-bg` | `#F6EEDC` (Cream) | Page background |
| `--color-surface` | `#FBF6EA` | Recessed / inactive surfaces |
| `--color-card` / `--color-surface-elevated` | `#FFFDF7` | Cards, inputs, sheets |
| `--color-divider` | `#E3D7BF` | Subtle rules |
| `--color-rating` | `#0E7A3D` | Rating displays (scale via `getRatingColor()`) |
| `--color-medal-gold/silver/bronze` | `#FFC83D` / `#C9CDD1` / `#E0A06A` | Podium discs |
| `--color-category-strip` | `#F9DDB8` (Peach) | Category icon backdrop |
| `--color-danger` | `#C1271A` | Error states |
| `--color-success` | `#0E7A3D` | Success states |
| `--border-ink` / `--border-ink-thin` | 2px / 1.5px ink | Sticker outlines |
| `--shadow-hard-sm` / `--shadow-hard` / `--shadow-hard-lg` | 2 / 3 / 5px ink offset, no blur | Sticker shade |
| `--radius-sm/md/lg/xl/pill` | 8 / 12 / 16 / 22 / 999px | Corner scale |

`--color-accent-gold` is a deprecated alias of `--color-accent` — don't use it in new code.

### 4.8 Constants & Configuration
- **`MIN_VOTES_FOR_RANKING` = 5** — `src/constants/app.js` — dishes below this show as "Early"
- **`MAX_REVIEW_LENGTH` = 200** — `src/constants/app.js` — enforced client + DB constraint
- **`MIN_VOTES_FOR_VALUE` = 8** — `src/constants/app.js` — value score eligibility
- **`VALUE_BADGE_THRESHOLD` = 90** — `src/constants/app.js` — top 10% percentile for "GREAT VALUE"
- **Category definitions** — `src/constants/categories.js` — `BROWSE_CATEGORIES` (23 shortcuts), `MAIN_CATEGORIES` (24), `ALL_CATEGORIES`
- **Categories are shortcuts, NOT containers** — Browse shows curated shortcuts. Search covers all dishes.
- **Towns** — `src/constants/towns.js` — `MV_TOWNS` (7), `NANTUCKET_TOWNS` (5), `CAPE_COD_TOWNS` (9), `ALL_TOWNS`
- **Tags** — `src/constants/tags.js` — `TEXTURE_TAGS`, `FLAVOR_TAGS`, `OCCASION_TAGS`, `TAG_SYNONYMS`
- **Event types** — `src/constants/eventTypes.js` — live_music, trivia, comedy, karaoke, open_mic, other
- **Photo quality** — `src/constants/photoQuality.js` — validation thresholds, tiers (featured/community/hidden)
- **Feature flags** — `src/constants/features.js` — `FEATURES.RATING_IDENTITY_ENABLED` (env var)
- **Jitter tiers** — `src/constants/jitter.js` — `JITTER_TIERS`, `getConsumerTier()`
- **Search suggestions** — `src/constants/searchSuggestions.js` — curated search prompts

### 4.9 localStorage Keys
| Key | Constant | Purpose |
|---|---|---|
| `whats_good_here_pending_vote` | (storage.js) | Vote saved before auth redirect |
| `wgh_has_seen_ear_tooltip` | `HAS_SEEN_EAR_TOOLTIP` | Ear icon tooltip shown |
| `soundMuted` | `SOUND_MUTED` | Sound preference |
| `wgh_radius` | `RADIUS` | Radius filter preference |
| `wgh_town` | `TOWN` | Town filter preference |
| `whats-good-here-auth` | (Supabase SDK) | Supabase auth session |
| `whats-good-here-location-permission` | `LOCATION_PERMISSION` | Geolocation permission state |
| `whats-good-here-email` | `EMAIL_CACHE` | Cached email for auth |

### 4.10 All Hooks (check before building new ones)
| Hook | Purpose |
|---|---|
| `useDish` | Single dish by ID |
| `useDishes` | Location-based ranked dishes via React Query |
| `useDishPhotos` | Photo upload with quality analysis, progress |
| `useDishSearch` | Debounced dish search (2+ chars) |
| `useEvents` | Active restaurant events |
| `useFavorites` | Optimistic favorite toggling with rollback |
| `useFocusTrap` | Keyboard focus trap for modals |
| `useAllDishes` | All dishes cached for client-side search |
| `useNearbyPlaces` | Google Places discovery (unclaimed restaurants) |
| `useNearbyRestaurant` | Single closest restaurant within radius |
| `useNearbyRestaurants` | Restaurants within meters of GPS |
| `useProfile` | User profile with get/update |
| `usePurityTracker` | Keystroke jitter analysis (anti-bot) |
| `useRestaurantManager` | Manager portal — owned restaurant |
| `useRestaurantSearch` | Combined local DB + Google Places search |
| `useRestaurants` | Restaurant list with filters |
| `useSpecials` | Restaurant specials CRUD |
| `useUnratedDishes` | Dishes photographed but not voted on |
| `useUserVotes` | User vote history with rating stats |
| `useVote` | Vote submission with rating, review, duplicate prevention |

### 4.11 All API Modules
| Module | Key methods |
|---|---|
| `dishesApi` | `getRankedDishes`, `getDishesForRestaurant`, `search`, `getMapDishes`, `getVariants`, `getTrending`, `createDish` |
| `votesApi` | `submitVote`, `getUserVotes` |
| `favoritesApi` | `getFavorites`, `addFavorite`, `removeFavorite` |
| `restaurantsApi` | `getRestaurants`, `createRestaurant`, `findNearby`, `getWithinRadius` |
| `profileApi` | `getOrCreateProfile`, `updateProfile`, `getTasteStats`, `getRatingBias`, `getBadgeEvaluationStats` |
| `followsApi` | `follow`, `unfollow`, `getFollowCounts`, `getTasteCompatibility`, `getFriendsVotesForRestaurant`, `getFriendsVotesForDish`, `getUserBadges` |
| `tasteApi` | `getSimilarTasteUsers` |
| `authApi` | Auth helpers |
| `adminApi` | Admin operations |
| `notificationsApi` | `getNotifications` |
| `dishPhotosApi` | `uploadPhoto`, `getUnratedDishesWithPhotos` |
| `specialsApi` | Restaurant specials CRUD |
| `eventsApi` | `getActiveEvents` |
| `restaurantManagerApi` | `getMyRestaurant`, `getInviteDetails`, `acceptInvite` |
| `placesApi` | `autocomplete`, `discoverNearby`, `getDetails` (via Edge Functions) |
| `jitterApi` | `getMyProfile`, `getTrustBadgeType`, `attestReview`, `joinWaitlist` |

### 4.12 Key Supabase RPCs
- `get_ranked_dishes` — Main Browse feed (ranked by votes, distance, variants, value score)
- `get_restaurant_dishes` — Dishes for a specific restaurant
- `get_dish_variants` — Variants/sizes for a dish
- `get_smart_snippet` — Best review snippet for a dish
- `check_vote_rate_limit` — Server-side vote rate limiting (10/min)
- `check_photo_upload_rate_limit` — Photo upload rate limiting (5/min)
- `check_dish_create_rate_limit` — Dish creation rate limiting (20/hr)
- `check_restaurant_create_rate_limit` — Restaurant creation rate limiting (5/hr)
- `get_taste_compatibility` — Taste match % between two users
- `get_similar_taste_users` — Users with similar taste you don't follow
- `get_user_rating_identity` — Rating style analysis (MAD-based bias)
- `get_friends_votes_for_dish` / `get_friends_votes_for_restaurant` — Social context
- `get_user_badges` — User badge display
- `get_badge_evaluation_stats` — Badge evaluation data
- `get_invite_details` / `accept_restaurant_invite` — Manager invite flow
- `find_nearby_restaurants` — Geo-proximity restaurant search
- `get_restaurants_within_radius` — Distance-filtered restaurant list
- `get_jitter_badges` — Jitter Protocol trust badges
- `get_unseen_reveals` / `mark_reveals_seen` — Rating identity reveal system

### 4.13 Supabase Edge Functions (10)
| Function | Purpose |
|---|---|
| `discover-restaurants` | Google Places discovery pipeline |
| `menu-refresh` | Fetch menu URL, parse with Claude Haiku, upsert dishes |
| `parse-menu` | Menu text/PDF extraction |
| `places-autocomplete` | Google Places autocomplete proxy |
| `places-details` | Google Places details proxy |
| `places-nearby-search` | Google Places nearby search proxy |
| `restaurant-scraper` | Scrape restaurant website data |
| `scraper-dispatcher` | Cron dispatcher for scraper jobs |
| `seed-reviews` | AI review generation (dev utility) |
| `backfill-restaurants` | Data migration tool |

### 4.14 Routes (18 pages, all lazy-loaded via `lazyWithRetry()`)
| Route | Page | Auth |
|---|---|---|
| `/` | Map (dual-mode list/map homepage) | No |
| `/map` | Redirect → `/` | No |
| `/browse` | Browse | No |
| `/dish/:dishId` | Dish | No |
| `/restaurants` | Restaurants | No |
| `/restaurants/:restaurantId` | RestaurantDetail | No |
| `/profile` | Profile (journal feed) | Yes |
| `/user/:userId` | UserProfile (public) | No |
| `/login` | Login | No |
| `/reset-password` | ResetPassword | No |
| `/admin` | Admin | Yes |
| `/invite/:token` | AcceptInvite | No |
| `/manage` | ManageRestaurant | Yes |
| `/privacy` | Privacy | No |
| `/terms` | Terms | No |
| `/how-reviews-work` | HowReviewsWork | No |
| `/for-restaurants` | ForRestaurants | No |
| `/jitter` | JitterLanding | No |
| `*` | NotFound | No |

### 4.15 File Organization
- **Storage helpers go in `src/lib/storage.js`** — not scattered in components
- **Extract components when files exceed ~400 lines** — keep pages focused on orchestration
- **Use barrel exports** — import from `'../components/home'` not individual files
- **Delete unused code immediately** — don't let dead code accumulate
- **Component subdirectories match pages** — `components/browse/` for Browse page components

### 4.16 Deployment
- **CSP in `vercel.json`** — external resources need `connect-src` too. Add new external domains to both `img-src` and `connect-src`.
- **OG images** — `api/og-image.ts` generates social share images server-side.
- **Share handler** — `api/share.ts` redirects social bot crawlers.

---

## 5. Architecture Principles

- **Dual-mode homepage.** Full-screen list (default) or full-screen map, toggled via `ModeFAB`. No half-states — each mode gets 100% of the screen. Dish pins use category emoji for consistent visual identity.
- **DishListItem is the ONE list component.** All dish lists everywhere use `DishListItem` with variant props. No duplicating dish display logic.
- **Categories are shortcuts, NOT containers.** Browse shows curated shortcuts, not all categories. Search is the universal access layer — any dish is searchable.
- **No direct Supabase calls from UI.** All data access through `src/api/`.
- **`supabase/schema.sql` is the source of truth.** Update it first, then run in SQL Editor.
- **React Query for server state.** `useQuery`/`useMutation` — never raw `useEffect` + `fetch`.
- **Optimistic updates with rollback.** UI updates before server confirms, reverts on error.
- **Unexpected errors classified.** Catch blocks use `createClassifiedError()`. Validation guards throw plain readable errors.
- **Lazy-loaded pages.** All pages use `lazyWithRetry()` for code splitting with chunk failure recovery.
- **Light theme only.** "Lobster Buoy" palette. All brand colors, fonts, radii and shadows via CSS variables in `src/index.css`.
- **Vote source weighting.** Votes have a `source` field (`user` or `ai_estimated`). AI votes weighted at 0.5x in all ranking aggregations.
- **Multi-city ready.** Towns constant covers MV + Nantucket + Cape Cod. Schema supports expansion.
- **Provider order:** `AuthProvider > LocationProvider > BrowserRouter`

---

## 6. Collaboration

This codebase is a merge of Dan's design direction and Denis's infrastructure. Denis (Denisgingras75) is a collaborator with write access. Branch protection on main requires 1 PR approval.

- **Lanes are flexible.** Both can touch frontend and backend. Some bleed-over is expected.
- **Dan owns:** Final design direction, visual identity, icon system, brand voice
- **Denis owns:** Schema deployment, RPCs, Edge Functions, E2E tests, infrastructure
- **Icon system:** Dan's flat illustrated WebP icons are canonical (`public/categories/icons/`). See `ICON-SPEC.md`.
- **Agent Phone:** Denisgingras75/wgh-phone — Claude-to-Claude async communication
