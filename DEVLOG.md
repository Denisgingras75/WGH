# Dev Log

A shared log of what each contributor worked on. Add your entries at the top.


---

## 2026-02-25 — Dan + Claude

### Map becomes the homepage + major cleanup

**Merged Home and Map pages.** They were redundant — both showed ranked dishes with a map. Now `/` is the full-screen map with a bottom sheet discovery panel. `/map` redirects to `/`. Removed the old Home page entirely.

**Simplified nav to 4 tabs:** Discover (was Hub), Restaurants, Map (center), You. Removed the separate Discover page — `/discover` redirects to `/hub`.

**Map UX overhaul:**
- Floating search bar with custom zoom buttons: `[+] [search] [-]` layout over the map, radius tucked top-right
- When you tap a food icon pin, the search bar and zoom controls fade out so the mini-card isn't blocked
- Tapping the map background brings the controls back
- Fixed touch event bleed-through — `stopPropagation` on BottomSheet pointer events + `touchAction: pan-x/pan-y` on scroll areas
- Map pins and list now use the **same ranked data source** (was two different queries showing different dishes — a 1-vote dish at 8.8 could appear as a pin but not in the list)
- Capped to top 10 dishes on map for clarity
- Removed town filter from map (was getting stuck on last-selected town with no UI to change it) — map always shows whole island
- Mini-card now shows **ranking badge**: "#3 nearby" or "#1 Burger nearby" based on active filters

**Profile cleanup:** Removed duplicate Settings section (already lives in the gear dropdown). Removed Edit Favorites (feature was deleted previously). Added pagination to JournalFeed — shows 5 items with "Show More" button.

**Restored WelcomeModal to Dan's version:** Denis's merge re-added a favorites/CategoryPicker step that Dan explicitly removed. Restored the 3-step flow (welcome → how it works → name). Kept location-agnostic text updates (DM Sans font, "near you", "Dish Discovery" tagline).

### Known issue: 131 orphaned dishes

There are **131 dishes with votes but no `restaurant_id`** in the database. These appear to be from seed data that was never linked to restaurants. Some have significant vote counts (Steamed Lobster: 29 votes, Miso Cod: 25 votes, Caesar Salad: 19 votes). They show up in ranked lists but can't appear on the map (no coordinates). Need to either match them to their actual restaurants or decide what to do with them. Full list was pulled — Dan has it.

### Where Dan's head is at

Still searching for the soul of the app. Moving in the right direction — the map-first homepage feels closer to right. A few things are staring us in the face that we're not seeing yet. Close but not there. WGH.

### Files changed
- `src/pages/Map.jsx` — Major rewrite: floating controls, custom zoom, single data source, pin-selected state
- `src/components/restaurants/RestaurantMap.jsx` — MapRefExposer, onMapClick callback, dishRanks/rankingContext props, ranking badge on mini-card
- `src/components/BottomSheet.jsx` — stopPropagation on pointer events, touchAction: pan-y
- `src/components/CategoryChips.jsx` — touchAction: pan-x
- `src/App.jsx` — Map as homepage, removed Home/Discover, added redirects
- `src/components/BottomNav.jsx` — 4 tabs (Discover, Restaurants, Map, You)
- `src/pages/Profile.jsx` — Removed duplicate Settings + Edit Favorites
- `src/components/profile/JournalFeed.jsx` — Pagination (5 items, Show More)
- `src/components/Auth/WelcomeModal.jsx` — Restored Dan's 3-step version (no favorites)
- `src/pages/NotFound.jsx` — Simplified to "Explore the Map" → `/`
- `src/pages/UserProfile.jsx` — Updated map link to `/`

---

## 2026-02-17 - Daniel + Claude

### Search Engine V2 — Tags, Ranking, Multi-Word Search

**Multi-word search was broken.** "Lobster roll" only searched "lobster" — the tokenizer took the first word and dropped the rest. Fixed with a 4-level fallback ladder: exact phrase → AND tokens on name → cross-field (name/category/tags) → OR broadest fallback.

**Ranking was naive.** Raw `avg_rating DESC` meant a dish with 1 vote at 10.0 beat a dish with 50 votes at 9.2. Replaced with Bayesian shrinkage: `score = (v/(v+m)) * R + (m/(v+m)) * C` where m=3 for early data. Low-vote dishes shrink toward the global mean (7.668). Distance bonus (+0.3 within 1mi) and trend bonus (log-scaled recent votes) as tiebreakers.

**Tags populated.** Defined 32 intent-driven tags across 8 groups (texture, flavor, occasion, dietary, format, price, local, meta). Two migration rounds: regex pattern matching (53% coverage) + category-wide defaults (81.8% coverage). Tag synonyms expand at query time — searching "light" also matches fresh, healthy tags.

**Prior strength schedule:** m=3 now (< 500 total votes), bump to m=5 at 500, m=10 at 1000+. Documented in NOTES.md.

### Files changed
- `src/constants/tags.js` — Complete rewrite: 32 intent tags, TAG_SYNONYMS, expandTagSynonyms()
- `src/api/dishesApi.js` — search() rewritten with fallback ladder, stopwords, misspelling normalization
- `src/api/dishesApi.test.js` — Added overlaps mock, updated assertions for new search behavior
- `supabase/schema.sql` — dish_search_score() function, updated get_ranked_dishes with search_score
- `supabase/migrations/add-search-score.sql` — Bayesian ranking migration
- `supabase/migrations/populate-intent-tags.sql` — Round 1 tag population
- `supabase/migrations/populate-intent-tags-round2.sql` — Round 2 gap-filler
- `NOTES.md` — Bayesian prior strength schedule
- `docs/plans/2026-02-17-search-engine-v2-design.md` — Design doc
- `docs/plans/2026-02-17-search-engine-v2-implementation.md` — Implementation plan

---

### Dish Detail Page Simplification

**Philosophy:** The photo is the hero — let it be a photo. Below: information in clear hierarchy. Kill everything that doesn't earn its place.

**Photo section:**
- Removed gradient overlay, text overlay (dish name + restaurant), and floating photo CTA from hero image
- Photo is now pure: just the image, full bleed, no text
- Official Photo badge kept (top-right, unobtrusive)

**Stats card below photo:**
- Dish name (bold, 22px) + price on one line
- Restaurant name as tappable link with chevron
- Rating + vote count on their own row below
- Clean hierarchy: name → restaurant → stats

**Vote flow — from 5 screens to 2:**
- Was: Yes/No → Rating → Review prompt → Write review → Photo prompt → Share prompt
- Now: Yes/No → Rate + extras (review + photo) → Done
- Review field is tap-to-expand: shows "What stood out?" as a tappable prompt, expands to textarea on tap with auto-focus
- Photo upload inline on same screen, shows green "Photo added" confirmation
- Submit button label adapts: "Submit Rating" when empty, "Submit" when extras added
- Share prompt killed entirely — premature for current stage, felt needy
- "No written reviews yet" empty state removed — the vote flow's "What stood out?" already invites contributions

**DishPlaceholder cleanup:**
- Removed `showCTA` prop and floating "Be first to snap this dish" overlay
- Component simplified to just the visual placeholder

**Net result:** ReviewFlow went from 583 lines to ~465 lines. Dish page lost ~20 lines. The app's friend who said it was "so simple to use" would still say that.

### Files changed
- `src/pages/Dish.jsx` — Hero section, stats card, removed PhotoUploadButton + empty reviews state
- `src/components/ReviewFlow.jsx` — Two-screen flow, tap-to-expand review, inline photo, no share prompt
- `src/components/DishPlaceholder.jsx` — Removed showCTA logic

---

### Light Mode Default + V1 Theme + Hero Card Redesign

**Theme overhaul:**
- Light mode ("Appetite") is now the default — every user tested preferred it
- Swapped CSS: light is `:root`, dark is `[data-theme="dark"]`
- Reverted light theme from V2 (peach/copper everywhere) to V1 (white cards, orange-red primary, neutral gray text)
- Primary coral richer: `#E8663C` → `#E45A35`
- Medal gold warmer: `#B8860B` → `#C48A12` (amber, no olive undertone)
- Fixed `getCategoryNeonImage()` theme detection for new default
- Search bars on all pages now use `var(--color-bg)` for consistent white look
- Removed border from Restaurants Open/Closed tab switcher

**#1 Hero card — dramatic redesign:**
- Dish name: 24→28px, weight 800, gold medal color
- Rating: 28→36px with breathing room
- "#1 in..." label: tighter tracking (0.06em), smaller (13px) — whispers, doesn't compete
- Gold left border 4px with soft amber edge glow
- Floating card shadow for depth
- More padding throughout

**Typography hierarchy tightened:**
- "What's Good Here" brand: 30→32px, weight 800, tighter tracking
- Tagline: lighter weight (400), tertiary color, wider tracking — recedes

**Contender rows:**
- Silver podium: rank 22→24px, name 15→17px
- Bronze podium: rank 20→22px, name 14→16px
- Category icons: soft floating shadows, 1.05x scale on active

**Category strip removed** — icons sit directly on surface with peach circle backgrounds matching PNG assets

### Files changed
- `src/index.css` — Theme swap (light=:root, dark=[data-theme="dark"]), new tokens
- `src/context/ThemeContext.jsx` — Default 'light', apply dark via data-theme="dark"
- `src/constants/categories.js` — Fixed theme detection for icon sets
- `src/pages/Home.jsx` — Hero card redesign, category icon shadows/scale, typography
- `src/components/home/SearchHero.jsx` — Surface background, heavier brand title
- `src/components/home/Top10Compact.jsx` — Bigger silver/bronze podium sizing
- `src/components/TownPicker.jsx` — Category strip background with border
- `src/pages/Restaurants.jsx` — White search bar, removed tab border
- `src/components/UserSearch.jsx` — White search bar
- `CLAUDE.md` — Updated design tokens, theme default docs
- `TASKS.md` — T26 progress updated

---

### Contender Row Reading Flow + Expandable Category Lists
- **Reading flow fix:** Moved rating + vote count below restaurant name in all contender rows (ranks 2-10), matching the hero card's top-to-bottom scan pattern. Removes eye zigzag to far-right rating column.
- **Podium rows (2-3):** Rating line now reads `8.3 · 10 votes` below restaurant name, green rating color preserved
- **Finalist rows (4-10):** Same rating placement, chevron removed (stacked layout already feels tappable)
- **Expandable category lists:** When clicking a category shortcut (e.g. Burgers), shows first 10 dishes with "Show all N [Category]" button to expand the full list. Collapses back with "Show less". Resets on category switch (component remounts via `key` prop).
- Removed unused `onSeeAll` prop from Top10Compact

### Files changed
- `src/components/home/Top10Compact.jsx` — Stacked rating layout, expand/collapse state, removed chevron
- `src/pages/Home.jsx` — Removed `.slice(0, 10)` cap on category-filtered dishes

---

### Theme-Aware Category Icons
- **Light mode icons:** Generated all 19 category icons with copper peach `#F2CDBC` (30% card color) circular backgrounds using Zach Roszczewski flat vector style — rich saturated mid-tones that pop against the warm stone `#F0ECE8` background
- **Dark mode icons:** Added missing icons for fish, clams, chicken, pork with `#1B2837` backgrounds to match existing dark icons
- **Seafood swap:** Old seafood icon (was a fish) → renamed to fish. New seafood icon is a seafood boil (shrimp, corn, shellfish) to differentiate
- **Theme-aware switching:** `getCategoryNeonImage()` now reads `data-theme` attribute to serve the correct icon set. Falls back to dark icons if light variant is missing
- **Prompt templates saved** to NOTES.md for both dark (`#1B2837` bg) and light (`#F2CDBC` bg) with all 19 category-specific color palettes
- Images stored in `public/categories/` with `-light.png` suffix for light variants
- Mapping in `CATEGORY_IMAGES_DARK` / `CATEGORY_IMAGES_LIGHT` in `src/constants/categories.js`

### Files changed
- `src/constants/categories.js` — Theme-aware image maps and `getCategoryNeonImage()` logic
- `public/categories/*-light.png` — 19 new light mode icons
- `public/categories/{fish,clams,chicken,pork,seafood}.png` — New/updated dark mode icons
- `NOTES.md` — Prompt templates for both themes

### 60/30/10 Color Ratio (Light Mode)
- Applied food psychology 60/30/10 ratio to light theme — proper layer separation
- **60% (The Table):** Warm stone backdrop `#F0ECE8`, surface `#E8D4C8`
- **30% (The Room):** Orange-red appetite atmosphere — cards `#F2CDBC`, hover `#EBC2AE`, elevated `#EFCFBE`. Like sitting in a restaurant with terracotta walls and warm lighting
- **10% (The Dish):** Deep warm crimson `#9E2B1E` replaces orange-red for primary accent. Pops against warm orange surfaces without competing. Crimson CTAs, headers, active states
- **Text:** Neutral slate grays replaced with warm taupe (`#7A6E62`, `#A89888`) so text recedes into warm atmosphere. Primary text `#3A2818` (warm dark brown) for outdoor readability on MV
- **Danger color** aligned to new primary crimson
- Glow/focus tokens updated to match new primary
- Dark mode untouched — was already hitting the ratio

### #1 Hero Card Color Hierarchy
- **"#1 IN {TOWN} RIGHT NOW"** label: gold → crimson `var(--color-primary)`, bumped from 10px to 16px — the #1 announcement should command attention, not whisper
- **Dish name:** text-primary → gold `var(--color-medal-gold)` — completes the medal hierarchy (gold #1, silver #2, bronze #3)
- Tightened letter-spacing on label from 0.16em to 0.10em at larger size

### Docs Updated
- Updated light mode design tokens in `CLAUDE.md` and `NOTES.md` to reflect 60/30/10 ratio with layer annotations (60% backdrop, 30% atmosphere, 10% accent)

### Files changed
- `src/index.css` — All light mode token values (primary, cards, text, surfaces, glow, focus)
- `src/pages/Home.jsx` — NumberOneHero color hierarchy (crimson label, gold dish name, larger label)
- `CLAUDE.md` — Light mode design tokens table
- `NOTES.md` — Light mode design tokens table

---

## 2026-02-15 - Daniel + Claude (Session 2)

### T26: Homepage Brand Signature
- **Brand font:** Aglet Sans Bold (700) at 30px for all "What's Good Here" headings (SearchHero, WelcomeSplash, WelcomeModal, Login)
- **Adobe Fonts (Typekit):** Added `use.typekit.net/yxz4cgv.css` for Aglet Sans; fixed CSP in `vercel.json` to allow typekit domains on deployed versions
- **Two-font system:** Aglet Sans Bold (brand header only) + DM Sans (everything else). Tried Bryant Condensed, Clone Rounded, Informa Pro, Fira Sans — stripped back to avoid font sprawl
- **#1 Hero Card:** New `NumberOneHero` component — typographic hero announcement for the top-ranked dish. Gold accent border, Aglet Sans dish name, uppercase restaurant, large rating number. Top10Compact now starts at rank #2
- **"The Contenders"** section header replaces "Top 10 Right Now" for ranks #2-10
- **Inline search:** Search results now render directly on the homepage (no page navigation). DishSearch accepts `onSearchChange` prop for inline mode. "Show more" button paginates results in batches of 10
- **Category nav redesign:** Multiple iterations (circles → pills → text labels → back to smaller 44px circles with food photos). Final: compact photo circles + text labels in horizontal scroll with town picker
- **Trust signal exploration:** Tried live stats (votes, restaurants, dishes) under header — numbers too small to be credible yet. Reverted to "the #1 bite near you" tagline

### UX Fixes (Feb 16)
- **Town picker scroll:** Fixed horizontal swipe scrolling the whole page — moved `overflow-x-auto` to outer container, added `touch-action: pan-x` and `overscroll-behavior-x: contain`
- **Town picker flash:** Removed `transition-all` from TownPicker buttons to prevent red background flash when closing
- **Town picker scroll reset:** Scroll position resets to beginning when town picker closes so categories start from the left
- **Town picker icon:** Red location pin over ocean waves (replaced generic gold pin)
- **Category circles:** Restored to 56px (were shrunk to 44px, looked unintentional on mobile)

### Files changed
- `index.html` — Typekit CSS import
- `vercel.json` — CSP for typekit domains (style-src, font-src)
- `src/components/home/SearchHero.jsx` — Aglet Sans, onSearchChange prop
- `src/components/home/Top10Compact.jsx` — startRank prop, "The Contenders" header
- `src/components/DishSearch.jsx` — onSearchChange inline mode
- `src/pages/Home.jsx` — NumberOneHero, CategoryNav, inline search, scroll fixes
- `src/components/TownPicker.jsx` — Red pin, removed transition flash, scroll behavior
- `src/components/WelcomeSplash.jsx` — Aglet Sans font
- `src/components/Auth/WelcomeModal.jsx` — Aglet Sans font
- `src/pages/Login.jsx` — Aglet Sans font

---

## 2026-02-15 - Daniel + Claude

### Bug Fixes
- **T32:** Fixed DishSearch inputRef null check — added optional chaining to `inputRef.current?.contains()` in click-outside handler
- **T31:** Added error handling to Profile/Browse async operations — `handleSaveName` try-catch with user error message, `handleVote` refetch try-catch, `adminApi.isAdmin()` catch handler, `handleToggleFavorite` try-catch in Browse.jsx

### Resend Email Setup (In Progress)
- Resend account created, domain `wghapp.com` purchased and verified
- SMTP credentials configured in Supabase Auth settings (host: smtp.resend.com, port: 465, username: resend)
- **Blocked:** Resend had a service outage during testing, and API key was accidentally deleted
- **Next:** Once Resend is back up, create new API key, update Supabase SMTP password, test magic link delivery
- Note: Earlier test failures were due to using `user_repeated_signup` (existing account) which Supabase silently no-ops — need to test with magic link login or fresh email

### T28 Rescoped
- `react-helmet-async` doesn't support React 19 (peer dep conflict)
- Client-side meta tags don't help anyway — social crawlers (Facebook, iMessage, Twitter) don't execute JS
- Rescoped T28 to Vercel edge middleware approach, deferred to pre-launch
- Middleware will detect crawler user agents, fetch data from Supabase, return HTML with correct og tags

### Next Up
- Resend API key recreation + email delivery verification
- T26 (homepage polish), T27 (OG image), T29 (apple-touch-icon)

---

## 2026-02-13 - Daniel + Claude

### Homepage Simplification
- Removed emoji medals (🥇🥈🥉🏆) from Top 10 — replaced with typography-only rank numbers (red for top 3)
- Removed bordered card wrapper around Top 10 list (border, box-shadow, inner glow)
- Removed decorative radial gradients from SearchHero
- Removed uppercase tracked "BROWSE BY CATEGORY" section header
- Simplified expand/collapse to plain text (no chevron icon, no border-top)
- Moved category scroll from separate section to inside SearchHero, under town picker
- Category pills: removed borders, use subtle elevated background with category photos

### Color Palette
- Explored color ring palette redesign (branch `experiment/color-ring-palette-v2`)
- Vivid Red + Bright Yellow palette tested and reverted — too primary-colored, read as cheap
- Reverted to original Island Depths palette (Deep Rust + Warm Gold)
- Fixed `--color-divider` from gold tint to rust tint — gold at low opacity on dark navy produced a green appearance

### New Categories
- Added fish, clams, chicken, pork to `BROWSE_CATEGORIES` (now 18 shortcuts)

---

## 2026-01-22 - Daniel + Claude

### Social Features - Major Overhaul
Complete social system replacing global leaderboards with friend-based discovery:

#### Follows System
- Created `follows` table with one-way Twitter-style following
- Denormalized `follower_count` and `following_count` on profiles for performance
- Database trigger auto-updates counts on follow/unfollow
- Created `followsApi.js` with follow/unfollow/isFollowing methods

#### Public User Profiles (`/user/:id`)
- New `UserProfile.jsx` page showing any user's public profile
- Stats: dishes rated, Worth It count, Avoid count, avg rating
- Rating personality based on avg rating (Loves Everything, Generous Rater, Fair Judge, Tough Critic)
- Recent ratings with dish photos and community comparison
- Follow/unfollow button with real-time count updates

#### User Search
- `UserSearch.jsx` component with debounced search
- Search users by display name
- Shows follower count, follow status, quick follow button
- Expandable "Find Friends" section on Profile page

#### Followers/Following Modal
- `FollowListModal.jsx` shows full lists when tapping follower/following counts
- Click any user to visit their profile

#### In-App Notifications
- `notifications` table with trigger on new follows
- `NotificationBell.jsx` with unread count badge (polls every 30s)
- Dropdown showing recent notifications
- Auto-marks as read when viewed

#### Rating Comparisons on Friend Profiles
- When viewing a friend's recent ratings, shows your rating of the same dish
- Shows community average with delta (how friend rated vs community)
- "You: 8/10 (+2)" style comparison

#### Bug Fixes
- Fixed floating point display errors (was showing "-0.6000000000000005")
- Added `Math.round((value) * 10) / 10` for clean decimal display
- Share button now only shows on your OWN profile, not others'
- Fixed `badge_key` → `key` mapping for badges on friend profiles

#### Database Migrations
- `add-follows-table.sql` - follows table, triggers, RPC functions
- `add-notifications.sql` - notifications table and follow trigger

#### Known Issues Being Fixed
- Badges showing on friend profiles (data is there, rendering issue)
- Historical follow counts need manual sync (trigger added after some follows existed)
- Historical badges need evaluation for existing users

---

## 2025-01-20 - Daniel

### Dark Mode Overhaul
- New color system: #121212 background, warm orange accent (#F4A261)
- Updated design tokens in index.css for dark theme
- Migrated all pages (Home, Browse, Restaurants, Profile) to dark mode
- Updated all components (BottomNav, BrowseCard, DishSearch, LocationPicker)
- Food photos now pop as visual hero against dark backgrounds

### Premium Category Tiles
- Created new `CategoryIconTile` component with custom line icons
- Horizontal scrollable row replaces emoji grid
- 14 hand-drawn SVG icons matching Dribbble inspiration:
  - Pizza, Burgers, Tacos, Wings, Sushi, Breakfast
  - Lobster Rolls, Seafood, Chowder, Pasta
  - Steak, Sandwiches, Salads, Tendys
- Single-select with warm orange highlight
- Toggle behavior: tap again to deselect
- Design philosophy: "emoji = cheap signal, designed icons = intentional signal"

### Design Philosophy
- "Sleek earns trust. Simplicity earns participation."
- Dark mode = premium feel, but UX stays casual and low-friction
- Voting remains the loudest action on screen

---

## 2025-01-19 - Daniel

### Profile Page Polish
- Limited "Your Rated Dishes" to top 5 with expand/collapse
- Prevents messy long lists for power users

### PostHog Analytics for Restaurant Pitch
- Added detailed `vote_cast` event with properties:
  - dish_id, dish_name, restaurant_id, restaurant_name
  - vote_type (worth_it/not_worth_it), rating_1_to_10
  - is_first_vote, resulting_avg_rating, resulting_total_votes
- Data ready for restaurant sales pitch dashboard

---

## 2025-01-16 - Daniel

### Header & Brand Polish
- Added `TopBar` component with subtle brand-tinted background (5% primary color)
- Centered fork-checkmark logo mark in safe-area region
- Centered logo on Home page (was left-aligned with "Browse All" button)
- Removed redundant "Browse All" button (bottom nav has Browse)

### Visual Hierarchy Tightening
- Reduced TopBar height (28px → 20px) and icon size (20px → 18px)
- Standardized logo height to h-12 across all pages
- Reduced header padding to py-2 for tighter vertical rhythm
- Removed border between header and LocationPicker filters
- Header and filters now read as one contextual block

### Responsive Logo Scaling
- Mobile (<768px): h-12 (48px) - unchanged
- Tablet (≥768px): h-14 (56px) - +17%
- Desktop (≥1024px): h-16 (64px) - +33%

### Copy Fix
- Changed "Ranked by % who would order again" → "Ranked by average score"
- Now matches what users see in the UI (1-10 score display)

### Auth & Photo Fixes (from earlier session)
- Improved auth session persistence using `getSession()` instead of `getUser()`
- Added explicit auth event handling (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- Fixed duplicate PostHog analytics event in photo upload
- Fixed delete photo using wrong file extension
- Consolidated photo tier config into single source of truth

### Welcome Splash for First-Time Users
- Created `WelcomeSplash.jsx` component for one-time welcome screen
- Shows logo, "Welcome." header, mission statement, and tap hint
- Warm brand-tinted background (3% primary color mix)
- Subtle entrance animations: logo fade-up, staggered text fade-ins
- Tap anywhere to dismiss (no auto-dismiss — lets users read at their pace)
- Respects `prefers-reduced-motion` by disabling animations
- Uses localStorage to track seen state — never shows again after first visit

---

## 2025-01-15 - Daniel (Session 2)

### Gamification Phase 1 - Impact Visibility
- Created `ImpactFeedback.jsx` component (toast notification after voting)
- Added impact calculation to Home.jsx and Browse.jsx:
  - Tracks dish state before/after vote
  - Shows messages like "This dish is now ranked!", "Moved up 3 spots!", "2 more votes to qualify"
- Updated `BrowseCard.jsx` with "X votes to rank" progress indicators
- Updated `Profile.jsx` with contribution language ("You've rated X dishes", "MV Contributor" badge)
- Updated `ReviewFlow.jsx` copy to contribution language:
  - "Help rank this dish — be first to vote!"
  - "Add Your Vote" instead of "Submit Review"

---

## 2025-01-15 - Daniel

### API Layer Abstraction
- Created `src/api/` folder with modular services
- Added `dishesApi`, `restaurantsApi`, `votesApi`, `favoritesApi`, `adminApi`, `authApi`, `profileApi`
- Central `index.js` exporter for clean imports

### Error Handling
- Added `src/utils/errorHandler.js` with error classification
- User-friendly error messages for network, auth, timeout errors
- Exponential backoff retry logic with `withRetry()`

### Hook Migration
- Migrated `useProfile`, `useUserVotes`, `useFavorites` to use API layer
- No more direct Supabase calls outside of `src/api/` and `AuthContext`

### Testing
- Added `authApi.test.js` for auth API coverage
- Upgraded `@testing-library/react` to v16 for React 19 support

### UX Improvements
- Profile tabs now sort dishes by rating (highest first), unrated dishes at end

### Bug Fixes
- Fixed memory leak in `LocationContext` - geolocation permission listener now properly cleaned up
- Fixed unreliable search filtering in Browse - wrapped `filteredDishes` in `useMemo` with proper dependencies
- Fixed modal not reopening after magic link login - removed unreliable `setTimeout(100)`, opens immediately
- Fixed slow initial load - app no longer blocks on geolocation, dishes load instantly with default MV location

---

## 2025-01-14 - Daniel (Session 2)

### UX Improvements
- Added 300ms debounce to search input (smoother typing experience)
- Created skeleton loading components for Home and Browse pages
- Created `LocationContext` for centralized location state management

---

## 2025-01-14 - Daniel

### Code Structure Improvements
- Created `AuthContext` for global auth state management
- Extracted shared `DishModal` component (removed ~200 lines of duplicate code)
- Updated 6 components to use centralized auth

### Bug Fixes
- Fixed magic link redirect - now returns to the dish you were rating after login
- Fixed auth session persistence - no longer logs out after voting

### Database
- Added Chicken Nuggets to The Barn Bowl & Bistro
- Removed duplicate dishes (Winston's Kitchen Chicken Fingers)

---

## How to Add Entries

When you finish working on something, add a new section at the top:

```markdown
## YYYY-MM-DD - Your Name

### What You Worked On
- Brief description of changes
- Another change
```

Keep it short and scannable!
