# Vintage Island Press — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin all WGH pages from the dark "Chalkboard" aesthetic to a light-default "Vintage Island Press" artisan food zine aesthetic.

**Architecture:** Pure CSS/JSX styling changes. No data model, API, hook, or routing changes. All color updates are global via CSS custom properties in `index.css`. Per-component work is typography (font-family), geometry (border-radius), and card styling (borders over shadows). Playfair Display (serif) replaces Amatic SC/Cormorant for headlines; Outfit stays for body; Amatic SC retained for zine accent labels only.

**Tech Stack:** React 19, Tailwind CSS 3, CSS custom properties, Google Fonts (Playfair Display)

**Spec:** `docs/superpowers/specs/2026-03-16-vintage-island-press-design.md`

**Branch:** `feat/chalkboard-redesign`

**Critical rules:**
- All colors via `var(--color-*)` — never hardcode hex in components
- `className` for layout/spacing only, `style={{}}` for color/bg/border
- No `toSorted()`, `Array.at()`, `findLast()`, `Object.groupBy()` (Safari <16)
- No `console.log` — use `logger` from `src/utils/logger.js`
- `npm run build` must pass before any commit

---

## Chunk 1: Foundation (index.css + Google Fonts)

### Task 1: Add Playfair Display to Google Fonts link

**Files:**
- Modify: `index.html` (Google Fonts `<link>` tag)

- [ ] **Step 1: Read index.html to find current font link**

Read `index.html` and locate the Google Fonts `<link>` tag. It currently loads `Outfit` and `Amatic+SC`.

- [ ] **Step 2: Add Playfair Display to the font link**

Add `Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700` to the existing Google Fonts URL. Keep Outfit and Amatic SC — both are still used.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Playfair Display font for editorial redesign"
```

---

### Task 2: Replace index.css color tokens (light default)

**Files:**
- Modify: `src/index.css:33-89` (`:root` block — currently Chalkboard dark theme)
- Modify: `src/index.css:111-147` (`[data-theme="light"]` block — currently Daylight kraft paper)

The current setup: `:root` = Chalkboard (dark), `[data-theme="light"]` = Daylight.
The new setup: `:root` = Vintage Island Press (light), `[data-theme="dark"]` = Dark mode.

- [ ] **Step 1: Replace the `:root` color block**

Replace the entire `:root { ... }` block (lines 33-89) with the Vintage Island Press light palette:

```css
:root {
  --color-primary: #C4472A;
  --color-primary-muted: rgba(196, 71, 42, 0.10);
  --color-primary-glow: rgba(196, 71, 42, 0.15);
  --color-rating: #4A6741;
  --color-accent-gold: #8B7355;
  --color-accent-gold-muted: rgba(139, 115, 85, 0.10);
  --color-link-secondary: #8B7355;
  --color-accent-orange: #A0926D;
  --color-accent-yellow: #C4472A;
  --color-text-primary: #2C2416;
  --color-text-secondary: #5C5548;
  --color-text-tertiary: #8B7355;
  --color-bg: #F5F0E8;
  --color-surface: #EDE7DC;
  --color-surface-elevated: #FFFFFF;
  --color-divider: #D4C9B4;
  --color-category-strip: #EDE7DC;
  --color-card: #FFFFFF;
  --color-card-hover: #F8F4EE;
  --color-card-border: #D4C9B4;
  --color-medal-gold: #C4472A;
  --color-medal-silver: #8B7355;
  --color-medal-bronze: #A0926D;
  --color-danger: #C4472A;
  --color-success: #4A6741;
  --color-success-light: #F0FFF4;
  --color-success-muted: rgba(74, 103, 65, 0.10);
  --color-success-border: rgba(74, 103, 65, 0.30);
  --color-muted: #8B7355;
  --color-text-tagline: #8B7355;
  --color-text-on-primary: #F5F0E8;

  --color-emerald: #4A6741;
  --color-emerald-light: #7DAF72;
  --color-red: #C4472A;
  --color-red-light: #D4654E;
  --color-amber: #A0926D;
  --color-amber-light: #B8A99A;
  --color-amber-dark: #8B7355;
  --color-orange: #A0926D;
  --color-lime: #7DAF72;
  --color-yellow: #C4472A;
  --color-green-deep: #4A6741;
  --color-green-dark: #4A6741;
  --color-blue: #5C7A8A;
  --color-blue-light: #7A9AAA;
  --color-purple: #8B6E7A;

  --color-tier-featured: #C4472A;
  --color-tier-community: #5C7A8A;
  --color-tier-hidden: #8B7355;

  --glow-primary: 0 0 12px rgba(196, 71, 42, 0.15);
  --glow-gold: 0 0 10px rgba(139, 115, 85, 0.20);
  --focus-ring: 0 0 0 3px rgba(196, 71, 42, 0.25);

  --font-headline: 'Playfair Display', Georgia, serif;
  --font-body: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-accent: 'Amatic SC', cursive;
}
```

- [ ] **Step 2: Replace the theme toggle block**

Change `[data-theme="light"]` to `[data-theme="dark"]` and replace its contents with the dark palette:

```css
[data-theme="dark"] {
  --color-primary: #D4654E;
  --color-primary-muted: rgba(212, 101, 78, 0.12);
  --color-primary-glow: rgba(212, 101, 78, 0.18);
  --color-rating: #7DAF72;
  --color-accent-gold: #A0926D;
  --color-accent-gold-muted: rgba(160, 146, 109, 0.12);
  --color-link-secondary: #A0926D;
  --color-accent-yellow: #D4654E;
  --color-accent-orange: #B8A99A;
  --color-text-primary: #F5F0E8;
  --color-text-secondary: #B8A99A;
  --color-text-tertiary: #7D7168;
  --color-bg: #1A1612;
  --color-surface: #1F1B16;
  --color-surface-elevated: #242018;
  --color-divider: #3A3428;
  --color-category-strip: #1F1B16;
  --color-card: #242018;
  --color-card-hover: #2D2820;
  --color-card-border: #3A3428;
  --color-medal-gold: #D4654E;
  --color-medal-silver: #A0926D;
  --color-medal-bronze: #7D7168;
  --color-green-deep: #7DAF72;
  --color-danger: #D4654E;
  --color-success: #7DAF72;
  --color-success-light: #1A2418;
  --color-success-muted: rgba(125, 175, 114, 0.10);
  --color-success-border: rgba(125, 175, 114, 0.30);
  --color-muted: #7D7168;
  --color-text-tagline: #7D7168;
  --color-text-on-primary: #F5F0E8;
  --glow-primary: 0 0 10px rgba(212, 101, 78, 0.15);
  --glow-gold: 0 0 8px rgba(160, 146, 109, 0.20);
  --focus-ring: 0 0 0 3px rgba(212, 101, 78, 0.25);
}
```

- [ ] **Step 3: Swap all `[data-theme="light"]` references to `[data-theme="dark"]`**

Search the rest of `index.css` for every `[data-theme="light"]` selector and change it to `[data-theme="dark"]`. These are theme-specific overrides for components like `.glass-header`, `.card-elevated`, `.animate-shimmer`, etc.

Also update `.glass-header`:
- Default (light): `background: rgba(245, 240, 232, 0.95);` (parchment)
- `[data-theme="dark"] .glass-header`: `background: rgba(26, 22, 18, 0.95);` (deep paper)

---

### Task 3: Replace fractal noise texture with halftone dots

**Files:**
- Modify: `src/index.css:91-105` (`body::after` pseudo-element)

- [ ] **Step 1: Replace the body::after texture**

Replace the fractal noise SVG with a halftone dot pattern:

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99998;
  opacity: 0.08;
  background-image: radial-gradient(circle, #c4b99a 0.5px, transparent 0.5px);
  background-size: 6px 6px;
}

[data-theme="dark"] body::after {
  opacity: 0.05;
  background-image: radial-gradient(circle, rgba(196, 185, 154, 0.4) 0.5px, transparent 0.5px);
}
```

---

### Task 4: Update card system and geometry

**Files:**
- Modify: `src/index.css` (`.card-elevated`, `.card-subtle`, `.top-bar`)

- [ ] **Step 1: Update `.card-elevated`**

Replace shadow-based cards with border-based:

```css
.card-elevated {
  @apply transition-all duration-300;
  background: var(--color-card);
  border: 1.5px solid var(--color-card-border);
  border-radius: 4px;
  box-shadow: none;
}

.card-elevated:hover {
  background: var(--color-card-hover);
  border-color: var(--color-text-tertiary);
  box-shadow: none;
  transform: none;
}

[data-theme="dark"] .card-elevated {
  border: 1.5px solid var(--color-divider);
  box-shadow: none;
}

[data-theme="dark"] .card-elevated:hover {
  border-color: var(--color-text-tertiary);
  box-shadow: none;
}
```

- [ ] **Step 2: Update `.card-subtle`**

```css
.card-subtle {
  background: var(--color-card);
  border: 1.5px solid var(--color-card-border);
  border-radius: 4px;
}
```

- [ ] **Step 3: Update `.top-bar` to editorial masthead style**

```css
.top-bar {
  position: relative;
  width: 100%;
  background: var(--color-bg);
  padding-top: env(safe-area-inset-top, 0px);
  border-bottom: 3px double var(--color-text-primary);
  box-shadow: none;
}

[data-theme="dark"] .top-bar {
  background: var(--color-bg);
  border-bottom: 3px double var(--color-divider);
  box-shadow: none;
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat: Vintage Island Press foundation — color tokens, halftone texture, card system"
```

---

## Chunk 2: Core Components (Home, DishListItem, CategoryChips)

### Task 5: Restyle Home.jsx masthead and sections

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Replace Chalkboard header with editorial masthead**

Replace the `CHALKBOARD HEADER` section (lines ~174-209). Change from Amatic SC centered title to Playfair Display editorial masthead with double-rule:

```jsx
{/* ── EDITORIAL MASTHEAD ── */}
<div style={{
  textAlign: 'center',
  padding: '20px 20px 14px',
  borderBottom: '3px double var(--color-text-primary)',
}}>
  <div style={{
    fontSize: '9px',
    letterSpacing: '0.4em',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    marginBottom: '3px',
  }}>
    Est. 2026 &bull; Martha&rsquo;s Vineyard
  </div>
  <h1 style={{
    fontFamily: 'var(--font-headline)',
    fontSize: '28px',
    fontWeight: 900,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  }}>
    What&rsquo;s Good Here
  </h1>
  <div style={{
    fontSize: '9px',
    letterSpacing: '0.4em',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    marginTop: '4px',
  }}>
    A Dish-Level Food Guide
  </div>
</div>
```

- [ ] **Step 2: Replace section headers**

Update "The Best" section divider (lines ~76-98): Change `fontFamily` from `'Amatic SC'` to `var(--font-headline)`. Change `fontSize` to `18px`. Add `fontStyle: 'italic'`. Replace the gradient line with `height: '1px', background: 'var(--color-divider)'`.

Update "Also Great" section divider (lines ~128-144): Change text to "Also Worth Ordering". Change `fontFamily` to `var(--font-accent)` (keeps Amatic SC here for zine feel). Keep the gradient line but use `var(--color-divider)`.

- [ ] **Step 3: Update section header title (h2)**

Change the section header h2 (line ~270-283): Replace `fontFamily: "'Amatic SC', cursive"` with `fontFamily: 'var(--font-headline)'`. Change `fontSize` to `20px`. Add `fontStyle: 'italic'`.

- [ ] **Step 4: Update search radius chip**

Change the radius chip (lines ~236-249): Set `borderRadius: '2px'`. Change `fontFamily` to `var(--font-body)`. Set `letterSpacing: '0.1em'`, `textTransform: 'uppercase'`.

- [ ] **Step 5: Update Check In FAB**

Change the FAB (lines ~321-337): Set `borderRadius: '4px'`. Update `boxShadow` to `'0 4px 12px rgba(196, 71, 42, 0.3)'`.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: Home page editorial masthead, section headers, press typography"
```

---

### Task 6: Restyle DishListItem.jsx

**Files:**
- Modify: `src/components/DishListItem.jsx`

This is the most complex component (571 lines, 3 variants). Focus on the `ranked` variant since that's what Home and Browse use.

- [ ] **Step 1: Update typography in podium cards (ranks 1-3)**

Find all instances of `fontFamily: "'Amatic SC'"` and `fontFamily: "'Cormorant'"` in the podium card section. Replace with:
- Dish name: `fontFamily: 'var(--font-headline)'`
- Rating number: `fontFamily: 'var(--font-headline)'`, keep bold weight
- Restaurant name: add `fontStyle: 'italic'`

- [ ] **Step 2: Update typography in compact rows (ranks 4+)**

Same font replacements for the compact row section. Rank numbers should use `fontFamily: 'var(--font-headline)'`, `fontStyle: 'italic'`.

- [ ] **Step 3: Update geometry**

Find all `borderRadius` values in the component. Change:
- Card containers: `borderRadius: '4px'` (was 12-16px)
- Thumbnails: `borderRadius: '3px'` (was 8-12px)
- Rank badges: `borderRadius: '2px'` (was rounded-full)
- Action buttons: `borderRadius: '4px'`

- [ ] **Step 4: Add "No. X" rank badge for top 3**

For podium cards (isPodium === true), add a positioned rank badge:

```jsx
{isPodium && (
  <div style={{
    position: 'absolute',
    top: '-1px',
    right: '12px',
    fontSize: '8px',
    letterSpacing: '0.2em',
    color: rank === 1 ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    fontWeight: 800,
    background: 'var(--color-bg)',
    padding: '0 6px',
    transform: 'translateY(-50%)',
  }}>
    No. {rank}
  </div>
)}
```

- [ ] **Step 5: Update card borders**

Change podium cards: `border: '2.5px solid var(--color-text-primary)'` for rank 1, `border: '1.5px solid var(--color-divider)'` for ranks 2-3.

Change compact rows: `border: '1px solid var(--color-divider)'` for the grouped list container.

- [ ] **Step 6: Remove box-shadows from cards**

Find all `boxShadow` in the component and remove or replace with `'none'`.

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 8: Commit**

```bash
git add src/components/DishListItem.jsx
git commit -m "feat: DishListItem editorial typography, sharp corners, rank badges"
```

---

### Task 7: Restyle CategoryChips.jsx

**Files:**
- Modify: `src/components/CategoryChips.jsx`

- [ ] **Step 1: Change chip shape from pills to stamps**

Find the chip button styling. Change:
- `borderRadius` from rounded/pill value → `'2px'`
- Active chip: `background: 'var(--color-text-primary)'`, `color: 'var(--color-bg)'`
- Inactive chip: `border: '1.5px solid var(--color-divider)'`, `color: 'var(--color-text-tertiary)'`
- Typography: `textTransform: 'uppercase'`, `letterSpacing: '0.1em'`, `fontSize: '10px'`, `fontWeight: 700`

- [ ] **Step 2: Remove the active dot indicator**

The current 4px dot beneath selected chips doesn't fit the stamp aesthetic. Remove it. The active state is now communicated through the filled background.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/CategoryChips.jsx
git commit -m "feat: CategoryChips rectangular stamps, uppercase labels"
```

---

## Chunk 3: Browse, Search, BottomNav

### Task 8: Restyle Browse.jsx

**Files:**
- Modify: `src/pages/Browse.jsx`

- [ ] **Step 1: Update category grid cards**

Find the category grid section (lines ~516-526). For each `CategoryImageCard`, the wrapper styling should change to:
- `borderRadius: '4px'`
- `border: '1.5px solid var(--color-divider)'`
- Sharp corners, Playfair Display labels

Note: If `CategoryImageCard` is a separate component (`src/components/CategoryImageCard.jsx`), modify it there instead. Read the file first to determine where styling lives.

- [ ] **Step 2: Update search bar styling**

Find the search input (lines ~530-580). Change:
- Container `borderRadius` → `'4px'`
- Border on focus: `'2px solid var(--color-primary)'`
- Autocomplete dropdown: `borderRadius: '4px'`

- [ ] **Step 3: Update section labels**

Change "Categories" label to use `letterSpacing: '0.3em'` and `textTransform: 'uppercase'`.

- [ ] **Step 4: Update header when showing dishes**

In the dish list header section, change `font` to `fontFamily: 'var(--font-headline)'` for the h2. Update border and background to match parchment.

- [ ] **Step 5: Update radius chip and sort dropdown geometry**

Change `borderRadius` to `'2px'` for the radius chip. Update the sort dropdown to use sharp corners.

- [ ] **Step 6: Update "Show more" button**

Change `borderRadius` to `'4px'`. Style as editorial: solid border, no fill, uppercase text.

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Browse.jsx src/components/CategoryImageCard.jsx
git commit -m "feat: Browse editorial grid, sharp search bar, press typography"
```

---

### Task 9: Restyle DishSearch.jsx

**Files:**
- Modify: `src/components/DishSearch.jsx`

- [ ] **Step 1: Update search container geometry**

Change `rounded-2xl` class to manual `borderRadius: '4px'` in style. Keep the transition and focus behavior.

- [ ] **Step 2: Update dropdown geometry**

Change dropdown `borderRadius` from `rounded-xl` equivalent to `'4px'`. Update borders to `1.5px solid var(--color-divider)`.

- [ ] **Step 3: Update section headers in dropdown**

Use `letterSpacing: '0.2em'`, `textTransform: 'uppercase'` for dropdown section labels.

- [ ] **Step 4: Fix any hardcoded focus shadow color**

The current code has `rgba(244, 208, 63, 0.1)` (chalkboard yellow tint). Replace with `rgba(196, 71, 42, 0.1)` (heritage red tint) or use `var(--color-primary-muted)`.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 6: Commit**

```bash
git add src/components/DishSearch.jsx
git commit -m "feat: DishSearch editorial geometry, sharp corners"
```

---

### Task 10: Restyle BottomNav.jsx

**Files:**
- Modify: `src/components/BottomNav.jsx`

- [ ] **Step 1: Update nav container**

Change background to `var(--color-bg)`. Add `borderTop: '1px solid var(--color-divider)'`. Remove any shadow.

- [ ] **Step 2: Update active indicator**

Replace the gold bar + glow with a simple Heritage Red underline:
- Width: `20px`, height: `2px`
- Background: `var(--color-primary)`
- No box-shadow/glow

- [ ] **Step 3: Update icon/label colors**

Active state: `color: 'var(--color-primary)'` (Heritage Red)
Inactive state: `color: 'var(--color-text-tertiary)'`

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/BottomNav.jsx
git commit -m "feat: BottomNav editorial style, heritage red active state"
```

---

## Chunk 4: Secondary Pages

### Task 11: Restyle Dish.jsx detail page

**Files:**
- Modify: `src/pages/Dish.jsx`

- [ ] **Step 1: Update dish name heading**

Already uses Playfair Display — verify `fontFamily` is `var(--font-headline)`. Update `fontWeight` to `900` if not already.

- [ ] **Step 2: Update rating display**

Change `fontFamily` from `'Inter'` to `var(--font-headline)`. Keep the large size. Change color to Sage: `var(--color-rating)`.

- [ ] **Step 3: Update all border-radius values**

Search for `rounded-xl`, `rounded-2xl`, `rounded-full` (non-circular items) and reduce to `rounded` (4px) or `rounded-sm`. Keep `rounded-full` only for truly circular elements (profile photos, vote buttons).

- [ ] **Step 4: Update card/section borders**

Replace shadows with solid borders: `1.5px solid var(--color-divider)`.

- [ ] **Step 5: Verify build, commit**

```bash
git add src/pages/Dish.jsx
git commit -m "feat: Dish detail editorial typography, sharp geometry"
```

---

### Task 12: Restyle Restaurants.jsx and RestaurantDetail.jsx

**Files:**
- Modify: `src/pages/Restaurants.jsx`
- Modify: `src/pages/RestaurantDetail.jsx`

- [ ] **Step 1: Restaurants.jsx — Update tab switcher**

Change tab container and items from `rounded-xl` to sharp corners (`borderRadius: '4px'`).

- [ ] **Step 2: Restaurants.jsx — Update restaurant cards**

Reduce `borderRadius`. Replace shadow with border. Add Playfair Display for restaurant names.

- [ ] **Step 3: Restaurants.jsx — Update search bar**

`borderRadius: '4px'`.

- [ ] **Step 4: RestaurantDetail.jsx — Verify Playfair is using var(--font-headline)**

Already has Playfair Display. Switch to `var(--font-headline)`.

- [ ] **Step 5: RestaurantDetail.jsx — Update tabs, buttons, action bar**

Sharp corners throughout. Solid borders.

- [ ] **Step 6: Verify build, commit**

```bash
git add src/pages/Restaurants.jsx src/pages/RestaurantDetail.jsx
git commit -m "feat: Restaurants + RestaurantDetail editorial press style"
```

---

### Task 13: Restyle Login.jsx

**Files:**
- Modify: `src/pages/Login.jsx`

- [ ] **Step 1: Update brand heading**

Already uses Playfair Display. Switch to `var(--font-headline)`. Add "Est. 2026" subtitle and double-rule like the masthead.

- [ ] **Step 2: Update form inputs**

`borderRadius: '4px'`. Border: `2px solid var(--color-divider)`, focus: `2px solid var(--color-primary)`.

- [ ] **Step 3: Update buttons**

`borderRadius: '4px'`. Primary buttons: Heritage Red fill. Secondary: ink outline.

- [ ] **Step 4: Update numbered badges**

Change from `rounded-full` circles to small serif numbers with Playfair Display.

- [ ] **Step 5: Verify build, commit**

```bash
git add src/pages/Login.jsx
git commit -m "feat: Login editorial press style"
```

---

### Task 14: Restyle Profile.jsx

**Files:**
- Modify: `src/pages/Profile.jsx`

- [ ] **Step 1: Add Playfair Display to section headers**

Profile currently has no font overrides. Add `fontFamily: 'var(--font-headline)'` to major headings.

- [ ] **Step 2: Update dashboard cards**

Change `rounded-2xl` → `rounded` (4px). Replace shadows with borders.

- [ ] **Step 3: Update buttons and form inputs**

`borderRadius: '4px'` globally. Solid borders.

- [ ] **Step 4: Verify build, commit**

```bash
git add src/pages/Profile.jsx
git commit -m "feat: Profile editorial press style"
```

---

### Task 15: Restyle ForRestaurants.jsx

**Files:**
- Modify: `src/pages/ForRestaurants.jsx`

- [ ] **Step 1: Add editorial typography**

Add `fontFamily: 'var(--font-headline)'` to the hero heading and step card headings.

- [ ] **Step 2: Update geometry**

`borderRadius: '4px'` on step cards. Sharp badge pills.

- [ ] **Step 3: Verify build, commit**

```bash
git add src/pages/ForRestaurants.jsx
git commit -m "feat: ForRestaurants editorial press style"
```

---

## Chunk 5: Remaining Components, Pages + Polish

### Task 16: Update modals and sheets

**Files:**
- Modify: `src/components/Auth/LoginModal.jsx`
- Modify: `src/components/Auth/WelcomeModal.jsx`
- Modify: `src/components/LocationPicker.jsx` (RadiusSheet)
- Modify: `src/components/AddRestaurantModal.jsx`
- Modify: `src/components/AddDishModal.jsx` (if exists)
- Modify: `src/components/FollowListModal.jsx` (if exists)
- Modify: `src/components/BottomSheet.jsx` (if exists)

- [ ] **Step 1: Read each modal/sheet file**

Read each file listed above. For files that don't exist, skip. Identify all `borderRadius`, `background`, `boxShadow`, and button styling in each.

- [ ] **Step 2: Update geometry and typography in all modals**

For each modal/sheet:
- Container `borderRadius: '4px'`
- Buttons: `borderRadius: '4px'`, Heritage Red fill or ink outline
- Headings: `fontFamily: 'var(--font-headline)'`
- Background: `var(--color-surface-elevated)`
- Remove box-shadows, use borders

- [ ] **Step 3: Verify build, commit**

```bash
git add src/components/Auth/ src/components/LocationPicker.jsx src/components/AddRestaurantModal.jsx src/components/AddDishModal.jsx src/components/FollowListModal.jsx src/components/BottomSheet.jsx
git commit -m "feat: modals and sheets editorial press style"
```

---

### Task 16b: Update DishPhotoFade.jsx

**Files:**
- Modify: `src/components/home/DishPhotoFade.jsx`

- [ ] **Step 1: Update shimmer placeholder color**

The `.photo-shimmer` class in `index.css` uses `var(--color-bg)` which will already be parchment after Task 2. Verify it looks correct. If the component has any inline background colors, update to use `var(--color-divider)` (warm-rule) for the shimmer placeholder.

- [ ] **Step 2: Verify build, commit if changed**

```bash
git add src/components/home/DishPhotoFade.jsx
git commit -m "feat: DishPhotoFade warm-rule shimmer color"
```

---

### Task 16c: Update shared components (TopBar, SectionHeader)

**Files:**
- Modify: `src/components/TopBar.jsx` (if exists — may only use `.top-bar` CSS class)
- Modify: `src/components/SectionHeader.jsx` (if exists)

- [ ] **Step 1: Read each file**

Check if these components exist and have inline styles that need updating. TopBar may rely entirely on the `.top-bar` CSS class (already updated in Task 4). SectionHeader may have hardcoded font-family values.

- [ ] **Step 2: Update any inline styles**

Replace hardcoded font-family with `var(--font-headline)`. Update border-radius to 4px. Remove shadows.

- [ ] **Step 3: Verify build, commit if changed**

```bash
git add src/components/TopBar.jsx src/components/SectionHeader.jsx
git commit -m "feat: shared components editorial press style"
```

---

### Task 16d: Sweep remaining pages

**Files:**
- Modify: `src/pages/UserProfile.jsx`
- Modify: `src/pages/ResetPassword.jsx`
- Modify: `src/pages/Admin.jsx`
- Modify: `src/pages/AcceptInvite.jsx`
- Modify: `src/pages/ManageRestaurant.jsx`
- Modify: `src/pages/Privacy.jsx`
- Modify: `src/pages/Terms.jsx`
- Modify: `src/pages/HowReviewsWork.jsx`
- Modify: `src/pages/NotFound.jsx`
- Modify: `src/pages/Hub.jsx` (if exists)
- Modify: `src/pages/Discover.jsx` (if exists)

These pages need the same consistent treatment. Most are simple sweeps.

- [ ] **Step 1: Read each file**

Read each page file. For any that don't exist, skip. Identify: hardcoded font-family, border-radius values > 4px (except `rounded-full` on truly circular elements), box-shadows on cards, and any hardcoded colors.

- [ ] **Step 2: Apply editorial press system to each page**

For each page:
- Replace any hardcoded `fontFamily` with `var(--font-headline)` for headings
- Change `borderRadius` values: `rounded-2xl` → 4px, `rounded-xl` → 4px. Keep `rounded-full` only for circular avatars/profile photos.
- Replace `boxShadow` on cards with `border: '1.5px solid var(--color-divider)'`
- Add `fontFamily: 'var(--font-headline)'` to any page title headings that don't have it

- [ ] **Step 3: Verify build, commit**

```bash
git add src/pages/UserProfile.jsx src/pages/ResetPassword.jsx src/pages/Admin.jsx src/pages/AcceptInvite.jsx src/pages/ManageRestaurant.jsx src/pages/Privacy.jsx src/pages/Terms.jsx src/pages/HowReviewsWork.jsx src/pages/NotFound.jsx
git commit -m "feat: remaining pages editorial press style sweep"
```

---

### Task 17: Update WelcomeSplash styling in index.css + JSX

**Files:**
- Modify: `src/index.css` (`.welcome-splash` section, lines ~279-477)
- Modify: `src/components/WelcomeSplash.jsx` (inline styles if any)

- [ ] **Step 1: Update welcome-splash background**

Change gradient from Chalkboard dark to Parchment light:
```css
.welcome-splash {
  background: linear-gradient(145deg, #FFFFFF 0%, #F5F0E8 50%, #EDE7DC 100%);
}
[data-theme="dark"] .welcome-splash {
  background: linear-gradient(145deg, #242018 0%, #1A1612 50%, #151210 100%);
}
```

- [ ] **Step 2: Update splash icon gradient**

Change from chalkboard yellow to Heritage Red:
```css
.welcome-splash__icon {
  background: linear-gradient(145deg, var(--color-primary), #8B3A1E);
}
```

- [ ] **Step 3: Update button colors**

`.welcome-splash__btn--primary` already uses `var(--color-primary)` — verify it looks correct with Heritage Red.

- [ ] **Step 4: Update border-radius**

Change `.welcome-splash__btn` `borderRadius` from `12px` to `4px`.

- [ ] **Step 5: Update WelcomeSplash.jsx inline styles**

Read `src/components/WelcomeSplash.jsx`. If it has inline `fontFamily`, `borderRadius`, or hardcoded color values, update them:
- Font: `var(--font-headline)` for headings
- Borders: `borderRadius: '4px'`
- Colors: use CSS variables only

- [ ] **Step 6: Verify build, commit**

```bash
git add src/index.css src/components/WelcomeSplash.jsx
git commit -m "feat: WelcomeSplash editorial press style"
```

---

### Task 18: Update App.jsx toast config

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update toast border-radius**

Find the Toaster/toast config and change `borderRadius: '12px'` to `borderRadius: '4px'`.

- [ ] **Step 2: Verify build, commit**

```bash
git add src/App.jsx
git commit -m "feat: toast notifications sharp corners"
```

---

## Chunk 6: Dark Mode Pass + Final Verification

### Task 19: Dark mode visual verification

**Files:**
- No file changes expected — verification only.

- [ ] **Step 1: Start dev server**

```bash
lsof -i :5173  # Check if port is in use first
npm run dev
```

- [ ] **Step 2: Test light mode (default)**

Open `localhost:5173`. Verify:
- Parchment background (#F5F0E8)
- Heritage Red primary actions
- Playfair Display headlines
- Halftone dot texture visible (subtle)
- Sharp 4px corners on cards
- Double-rule under masthead

- [ ] **Step 3: Test dark mode**

Toggle theme. Verify:
- Deep paper background (#1A1612)
- Faded red primary actions
- Readable text contrast
- Halftone dots still visible but dimmer
- All cards have proper borders

- [ ] **Step 4: Fix any contrast or readability issues found**

Address anything that doesn't look right. Typical issues: text too light on dark, borders invisible, rating color not distinct enough.

---

### Task 20: Final build verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```
Expected: Clean build, zero errors.

- [ ] **Step 2: Run unit tests**

```bash
npm run test -- --run
```
Expected: All passing (no functional changes, only visual).

- [ ] **Step 3: Run lint**

```bash
npm run lint
```
Expected: Clean or only pre-existing warnings.

- [ ] **Step 4: Final commit (if any fixes from Steps 2-3)**

Stage only changed files by name (no `git add -A`):
```bash
git status
git add <specific files that were fixed>
git commit -m "fix: dark mode polish and final adjustments"
```
