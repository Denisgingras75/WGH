# Vintage Island Press — WGH UI Redesign

**Direction:** Artisan food zine. Letterpress editorial aesthetic with hand-drawn warmth.
**Branch:** `feat/chalkboard-redesign` (continuing from existing work)
**Scope:** Full visual reskin across all 19 pages. No structural/data changes.

---

## Color System

### Light Mode (New Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#C4472A` (Heritage Red) | CTAs, primary actions, #1 rank badge |
| `--color-accent-gold` | `#8B7355` (Brass) | Links, secondary text, metadata |
| `--color-accent-orange` | `#A0926D` (Warm Brass) | Hover states, tertiary text |
| `--color-rating` | `#4A6741` (Sage) | Rating displays |
| `--color-text-primary` | `#2C2416` (Deep Ink) | Main text, borders |
| `--color-text-secondary` | `#5C5548` | Secondary text |
| `--color-text-tertiary` | `#8B7355` (Brass) | Tertiary text, metadata |
| `--color-bg` | `#F5F0E8` (Parchment) | Page background |
| `--color-surface` | `#EDE7DC` | Surface areas |
| `--color-surface-elevated` | `#FFFFFF` (Cream) | Modals, sheets |
| `--color-card` | `#FFFFFF` (Cream) | Card backgrounds |
| `--color-card-border` | `#D4C9B4` (Warm Rule) | Card borders |
| `--color-divider` | `#D4C9B4` | Dividers, rules |
| `--color-medal-gold` | `#C4472A` (Heritage Red) | #1 rank |
| `--color-medal-silver` | `#8B7355` (Brass) | #2 rank |
| `--color-medal-bronze` | `#A0926D` | #3 rank |
| `--color-danger` | `#C4472A` | Error states |
| `--color-success` | `#4A6741` (Sage) | Success states |
| `--color-text-on-primary` | `#F5F0E8` | Text on red buttons |

### Dark Mode (Toggle)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#D4654E` (Faded Red) | CTAs, primary actions |
| `--color-accent-gold` | `#A0926D` (Warm Brass) | Links, secondary |
| `--color-rating` | `#7DAF72` (Light Sage) | Rating displays |
| `--color-text-primary` | `#F5F0E8` (Parchment) | Main text |
| `--color-text-secondary` | `#B8A99A` | Secondary text |
| `--color-text-tertiary` | `#7D7168` | Tertiary text |
| `--color-bg` | `#1A1612` (Deep Paper) | Page background |
| `--color-surface` | `#1F1B16` | Surface areas |
| `--color-surface-elevated` | `#242018` (Dark Cream) | Modals, sheets |
| `--color-card` | `#242018` | Card backgrounds |
| `--color-card-border` | `#3A3428` (Dark Rule) | Card borders |
| `--color-divider` | `#3A3428` | Dividers |

---

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headlines | Playfair Display | 700, 900 | Page titles, dish names, ratings, rank numbers |
| Body / UI | Outfit | 400-700 | Descriptions, metadata, buttons, form inputs |
| Zine Accents | Amatic SC | 700 | Section labels ("Also Worth Ordering"), decorative moments |

New CSS custom properties:
- `--font-headline: 'Playfair Display', Georgia, serif`
- `--font-body: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif`
- `--font-accent: 'Amatic SC', cursive`

Google Fonts link adds: `Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700`

---

## Design Principles

1. **Light mode is the default.** Press/zine is fundamentally a light medium. Dark mode inverts elegantly but parchment-on-ink is primary.

2. **Photos: hero for #1, thumbnails for 2-3, none for 4+.** Type-first editorial hierarchy. The #1 dish earns a full photo. 2-3 get stamp-sized thumbnails. 4+ are pure typography.

3. **Sharp corners (4px radius).** Print doesn't round. All `border-radius` values drop from 12-24px to 4px. Category chips become rectangular stamps.

4. **Halftone dots replace fractal noise.** Subtle `radial-gradient(circle, color 0.5px, transparent 0.5px)` at `background-size: 6px 6px`, ~8% opacity. Letterpress/newsprint feel.

5. **Borders over shadows.** Cards defined by 1.5px solid borders, not box-shadows. #1 card gets 2.5px. Hover = border darken, no transform.

6. **Double-rule dividers.** `border: 3px double` for major section breaks (masthead bottom). Single 1px rules for minor dividers.

7. **Rank badges as edition markers.** "No. 1", "No. 2", "No. 3" positioned at top-right of cards, punching through the border. Styled as small-caps, heritage red on parchment background.

---

## Component Changes

### index.css
- Replace entire `:root` color block with light mode palette
- Replace `[data-theme="light"]` with `[data-theme="dark"]` (swap default)
- Replace `body::after` fractal noise with halftone dot pattern
- Add `--font-headline`, `--font-body`, `--font-accent` properties
- `.card-elevated`: remove box-shadow, add `border: 1.5px solid var(--color-card-border)`. Hover = border darken.
- `.glass-header`: parchment background with bottom rule instead of blur
- Global `border-radius`: 4px default instead of 12-16px

### Home.jsx
- Masthead: Playfair Display 900, "Est. 2026 · Martha's Vineyard" subhead, double-rule bottom border
- Section headers: Playfair Display italic with horizontal rule
- "The Best" → italic editorial heading
- "Also Great" → "Also Worth Ordering" in Amatic SC
- #1 card: full hero treatment with photo area, bold border, "No. 1" badge
- #2-3: thumbnail + text, lighter border, "No. 2/3" badges
- #4+: compact classified listing rows, italic rank numbers

### DishListItem.jsx
- Font: Playfair Display for dish name
- Rating: Playfair Display 900, Sage color
- Restaurant name: Outfit, italic, Brass color
- Rank display: "No. X" badge (top-3) or italic numeral (4+)
- Hero variant: photo + wider card + bold border
- Remove rounded corners (was 16px → 4px)

### Browse.jsx
- Category grid: sharp-cornered cards with emoji + Playfair Display labels
- Search bar: sharp corners, warm-rule border
- Category header: Playfair Display italic
- Autocomplete dropdown: sharp corners, warm-rule borders

### CategoryChips.jsx
- Rounded pills → rectangular stamps
- Active: solid ink fill, parchment text
- Inactive: ink or warm-rule border
- Typography: uppercase, letter-spacing 0.1em, 10px

### BottomNav
- Background: parchment (light) / deep paper (dark)
- Icons: ink color, active = Heritage Red
- Top border: 1px solid warm-rule

### All Modals / Sheets
- Background: parchment
- Buttons: Heritage Red fill or ink outline
- Border-radius: 4px
- Typography follows new stack

### DishPhotoFade.jsx
- Existing component stays — just used selectively based on rank
- Photo shimmer uses warm-rule color instead of current

---

## Pages Not Explicitly Mocked (Apply System Consistently)

| Page | Notes |
|------|-------|
| Dish Detail | Feature-article layout. Hero photo, Playfair Display name, editorial review snippets |
| Restaurants | Directory listing style. Bold restaurant names, address in italic |
| Restaurant Detail | Like a restaurant review feature spread |
| Hub | Events/specials as classified listings |
| Discover | Curated editorial picks |
| Profile | Personal food journal with Playfair Display headers |
| User Profile | Their food story, same editorial treatment |
| Login / Auth | Minimal, clean, masthead + centered form |
| Manage Restaurant | Dashboard — functional, follows type/color system |
| Privacy / Terms | Standard text pages with editorial typography |
| How Reviews Work | Explanatory with editorial tone |
| For Restaurants | Marketing — most editorial, feature-spread feel |

---

## Implementation Order

1. **index.css** — Color tokens, font tokens, halftone texture, card system
2. **Home.jsx** — Masthead, dish sections, FAB
3. **DishListItem.jsx** — Typography, rank badges, photo hierarchy
4. **CategoryChips.jsx** — Stamps instead of pills
5. **Browse.jsx** — Category grid, search
6. **BottomNav** — Colors, borders
7. **Remaining pages** — Apply system consistently
8. **Dark mode pass** — Verify all tokens work in dark
9. **Build + test** — `npm run build`, visual check
