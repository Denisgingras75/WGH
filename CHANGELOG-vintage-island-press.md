# Vintage Island Press — Full Redesign Changelog

**Branch:** `feat/chalkboard-redesign`
**Date:** March 16, 2026
**Status:** Built, tested, pushed to origin. NOT yet on Vercel (needs PR to main).

---

## For Denis & Dan — What Changed and Why

### 1. Visual System: "Vintage Island Press"

**What:** Complete visual overhaul from the dark Chalkboard aesthetic to a light-default editorial food zine style.

**Why:** The Chalkboard was cool but dark themes reduce readability in outdoor sunlight — and 80% of our users are tourists on Martha's Vineyard in summer. Light mode is now the default.

**Details:**
- **Colors:** Parchment background (#F5F0E8), Heritage Red (#C4472A) for CTAs, Sage (#4A6741) for ratings, Brass (#8B7355) for secondary text
- **Typography:** Playfair Display (serif) for headlines/dish names/ratings. Outfit stays for body text. Amatic SC kept for zine accent labels ("Also Worth Ordering").
- **Texture:** Halftone dot pattern (subtle letterpress feel) replaces the old fractal noise overlay
- **Geometry:** Sharp 4px corners everywhere (was 12-24px rounded). Cards use 1.5px borders instead of shadows. Double-rule dividers for editorial weight.
- **Dark mode:** Still works — toggle flips to "Island Depths" with deep paper background (#1A1612) and faded red accents

**Files:** `src/index.css` (entire color system), `index.html` (fonts, theme-color)

---

### 2. Homepage (Map.jsx) — The Real Front Page

**What:** The actual homepage (`/` route = Map.jsx) now has the Vintage Island Press styling. Both list mode and map mode updated.

**Why:** This was still showing the old Chalkboard styling while we redesigned everything else. It's the first thing 80% of users see.

**Details:**
- Editorial masthead: "Est. 2026 · Martha's Vineyard" + "What's Good Here" in Playfair Display
- Sharp search bar (4px corners), editorial section dividers
- Map mode: sharp zoom buttons, sharp search overlay
- Check In FAB: sharp corners, Heritage Red

**Files:** `src/pages/Map.jsx`

---

### 3. Action Buttons on Every Dish Row — The Money Path

**What:** Every dish in the ranked list now shows Directions, Call, and/or Order buttons directly on the card.

**Why:** The #1 user flow for tourists (80% of users) is: see dish → get there. Action buttons were buried before — now they're front and center. This is the path that converts a browser into a customer walking through a restaurant's door.

**Details:**
- **Podium cards (ranks 1-3):** Full-size buttons — Order Now (if available) or Call as primary, Directions with distance as secondary
- **Compact rows (ranks 4+):** Small pill buttons — Call + distance
- Order/Phone shown first (primary action), Distance second
- Distance displayed in the button itself ("📍 0.3 mi")
- Buttons use `e.stopPropagation()` so they don't trigger the card navigation

**Files:** `src/components/DishListItem.jsx`

---

### 4. Dish Detail Page — Magazine Feature Article

**What:** Complete layout restructure of the dish detail page. Reads like a food magazine article instead of a data dump.

**Why:** Denis said the review page needed more substance and better design. The old layout buried action buttons at the bottom and hid social proof under the fold.

**Details:**
- **Photo hero:** Real dish photo full-width (aspect 4:3) with gradient fade. No more 120px emoji placeholder.
- **56px verdict rating:** Centered dramatic score, "out of 10" label, framed with editorial rules. Feels like a Wine Spectator verdict.
- **Action buttons RIGHT under the title:** Order/Directions/Call visible immediately — not a floating bar at the bottom
- **Social proof up front:** Friends' ratings and smart snippet (best review) moved above the fold
- **Collapsible ReviewFlow:** "Rate This Dish" button that expands to the full review form on click. Doesn't push content down for users who just want to read.
- **Editorial review cards:** Each review is a journal entry with Playfair italic block-quote, big inline rating, trust badge next to reviewer name
- **"What People Are Saying"** editorial section header
- **"Verified by Jitter"** banner before reviews section

**Files:** `src/pages/Dish.jsx`

---

### 5. ReviewFlow Simplified — Slider + Review Only

**What:** Removed the yes/no "Would you order this again?" step. Users go straight to the 1-10 slider + review text.

**Why:** The binary question added friction without much value. Rating > 6.5 now auto-sets "would order again" = true. Fewer steps = more completed reviews.

**Details:**
- Step 1 (thumbs up/down) completely removed
- Flow is now: see slider → rate 1-10 → optional review text → submit
- `would_order_again` auto-derived: rating > 6.5 = true, ≤ 6.5 = false
- Auth gated at submit time (not on render)
- Pending vote saved to localStorage for post-OAuth redirect

**Files:** `src/components/ReviewFlow.jsx`, `src/lib/storage.js`

---

### 6. Profile Page — The Food Journal

**What:** Profile transformed from a functional vote list into a Goodreads-style personal food diary.

**Why:** The Pioneer persona (5% of users but 50x data generation) needs to feel like a food critic, not a database entry. The journal layout makes rating feel personal and meaningful.

**Details:**
- **Newspaper stats bar:** Three columns (Dishes Rated / Restaurants / Avg Rating) with big Playfair Display numbers. No cards — clean editorial stats.
- **"My Tasting Notes"** editorial section header
- **Journal entries:** Each vote is a diary entry with dish name (Playfair bold), restaurant (italic), relative date, and a big rating number. Sage for 7+, Heritage Red for under 7.
- **Review quotes:** Shown as indented italic text with a 2px left border (like a diary notation)
- **Rating Identity badge** in profile header ("The Generous Critic")
- **Badges row** (scrollable, earned achievements)

**Files:** `src/pages/Profile.jsx`, `src/components/profile/HeroIdentityCard.jsx`, `src/components/profile/JournalCard.jsx`, `src/components/profile/JournalFeed.jsx`

---

### 7. Personal List Maker — NEW FEATURE

**What:** Users can create personal curated lists of dishes. Like Goodreads shelves or Spotify playlists for food.

**Why:** Pioneer retention. "Best Seafood 2026", "Date Night MVY", "Must-Try Before I Leave" — personal investment that keeps users coming back and sharing.

**Details:**
- Create named lists from Profile page ("+ Create a List" button)
- Expand any list to see its dishes
- Search dishes to add (uses existing useDishSearch hook)
- Remove dishes with ✕
- "Heard it was Good Here" built-in list (existing favorites)
- Stored in localStorage (no database changes needed for MVP)
- Future: share lists, migrate to Supabase for persistence across devices

**Files:** `src/lib/lists.js` (new), `src/pages/Profile.jsx`

---

### 8. Restaurant Pages — Editorial Directory

**What:** Both the restaurant list and restaurant detail pages restyled as editorial content.

**Why:** Restaurants page felt like a generic card list. Now feels like a dining directory in a food guide.

**Details:**
- **Restaurants list:** "The Restaurants: Martha's Vineyard Dining Guide" masthead. Flat classified rows (no cards). Open/Closed status inline. Rating right-aligned. Editorial tab switcher.
- **Restaurant Detail:** Stats bar (dish count / avg rating / cuisine). "Their Best Dishes" editorial divider. Double-rule header. Clean contact section with equal-width action buttons (Directions / Call / Website).

**Files:** `src/pages/Restaurants.jsx`, `src/pages/RestaurantDetail.jsx`

---

### 9. Jitter Trust System — Made Visible

**What:** Jitter (keystroke biometric verification) was fully integrated but invisible to users. Now it's a visible trust differentiator.

**Why:** Jitter is what makes WGH reviews trustworthy — real people, verified by typing biometrics. If users don't know it exists, it doesn't build trust. Making it visible is free marketing for the Jitter brand.

**Details:**
- **TrustBadge moved inline with reviewer name** — bigger, next to @username on every review
- **"Reviews verified by Jitter" banner** — shield icon + explainer on dish detail page, right before reviews
- **SessionBadge live while typing** — keystroke count, purity %, and WPM visible as you write a review. Users can see Jitter working in real time.
- **Search bar captures Jitter data** — every keystroke in DishSearch feeds the purity tracker (background, no UI)

**Files:** `src/pages/Dish.jsx`, `src/components/ReviewFlow.jsx`, `src/components/DishSearch.jsx`

---

### 10. All Other Pages — Consistent Styling

**What:** Every page in the app got the Vintage Island Press treatment.

**Details:**
- Browse: editorial category grid, sharp search, Playfair headers
- Login: masthead, sharp form inputs, editorial buttons
- CategoryChips: rectangular stamps (uppercase, tight tracking) instead of rounded pills
- CategoryImageCard: emoji + Playfair label in bordered box (replaced PlateIcon ceramic plates)
- BottomNav: parchment background, Heritage Red active state
- DishSearch: sharp corners, editorial dropdown headers
- WelcomeSplash: parchment gradient, Heritage Red accent
- All modals/sheets: 4px corners, editorial typography
- Privacy, Terms, HowReviewsWork, ForRestaurants, NotFound, Admin, ManageRestaurant, AcceptInvite, ResetPassword, UserProfile: all consistent

**Files:** 19 page files + 8 component files

---

## What's NOT on Vercel Yet

This is all on `feat/chalkboard-redesign` branch. To deploy:
1. Create PR from `feat/chalkboard-redesign` → `main` on Dan's repo
2. Dan reviews and merges
3. Vercel auto-deploys from main

## What's Next

- [ ] Test on real phones in sunlight (MV outdoor readability)
- [ ] Migrate list maker from localStorage to Supabase (persistence across devices)
- [ ] List sharing (generate share links)
- [ ] "Add to List" button on dish detail page
- [ ] Restaurant analytics dashboard (Business persona — post-launch)
- [ ] Photo-to-Rate flow (take photo → match dish → rate later queue)
