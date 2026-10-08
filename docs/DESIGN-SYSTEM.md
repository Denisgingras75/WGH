# WGH Design System — "Lobster Buoy"

The visual system for What's Good Here. Tokens live in `src/index.css` (`:root`); shared
primitives (`.sticker`, `.sticker-press`, `.btn-ink`, `.eyebrow`, `.wordmark`) live in the
`@layer components` block of the same file. The brand lockup is `<Wordmark />`
(`src/components/Wordmark.jsx`). Reference implementations: `DishListItem.jsx`,
`home/HomeListMode.jsx` (BuoyCard), `pages/RestaurantDetail.jsx`, `pages/Restaurants.jsx`,
`dish/DishHero.jsx`.

## Concept
Screen-printed sticker sheet / Menemsha lobster-buoy palette on cream paper. Ink outlines + HARD
offset shadows (no blur) — the UI matches the neo-brutalist food icons (ICON-SPEC.md) instead of
fighting them. Quiet chrome, loud numbers.

Three inks, each with one job:
- **Lobster** (`--color-primary`) — act. Primary buttons, the brand mark.
- **Harbor** (`--color-accent`) — navigate. Links, restaurant names, secondary actions (Directions).
- **Butter** (`--color-butter`) — celebrate / "you are here". Active nav + chips, #1, price tags, highlights. Always ink text.

Ink black does everything else. Rating numerals keep the semantic green/amber/red scale from `getRatingColor()`.

## Palette
| Token | Hex | Notes |
|---|---|---|
| `--color-ink` / `--color-text-primary` | `#1B1611` | Text, outlines, hard shadows |
| `--color-text-secondary` | `#554A3E` | 7.5:1 on bg |
| `--color-text-tertiary` | `#73665A` | 4.8:1 on bg (AA body) |
| `--color-bg` | `#F6EEDC` | Cream paper — page background |
| `--color-surface` | `#FBF6EA` | Recessed / inactive |
| `--color-card`, `--color-surface-elevated` | `#FFFDF7` | Cards, inputs, sheets |
| `--color-divider` | `#E3D7BF` | Sand rule |
| `--color-primary` | `#CA3216` | Lobster — 5.3:1 with white text |
| `--color-accent` | `#1F4FA3` | Harbor — 7.8:1 with white text, 6.7:1 as text on bg |
| `--color-butter` | `#FFC83D` | 11.6:1 with ink text — never as a text color |
| `--color-category-strip` | `#F9DDB8` | Peach icon backdrop |
| `--color-rating` / `--color-green-deep` | `#0E7A3D` | Ratings ≥ 8 |
| `--color-amber` | `#A84E06` | Ratings 6–8 (text-safe amber) |
| `--color-red` / `--color-danger` | `#C1271A` | Ratings < 6, errors |
| `--color-medal-gold/silver/bronze` | `#FFC83D` / `#C9CDD1` / `#E0A06A` | Podium discs (ink text) |

## Typography
| Role | Font | Weights | Notes |
|---|---|---|---|
| Display (`--font-display`) | Bricolage Grotesque (variable opsz/wdth/wght) | 800 | h1–h3 default to it. Page title 28–30px, section 22–26px, card title 17–20px, score numerals 20–60px. Tracking −0.02 to −0.04em. `fontStretch: '75%'–'90%'` for condensed signage moments (wordmark, splash, buoy titles). |
| Body (`--font-body`) | Instrument Sans | 400–700 | Inherited from `body`. 15–16px for names/inputs, 12–13px meta. |
| Mono (`--font-mono`) | SF Mono stack | 700 | Jitter badges only. |

Amatic SC, Outfit, DM Sans, Cormorant and Aglet Sans are retired — don't reintroduce them.

## Map markers
Leaflet path options (`CircleMarker` `color`/`fillColor`) are handed straight to the SVG/canvas
renderer, so they take hex values, not CSS vars. `divIcon` HTML strings can use `var(--…)`.

## Tokens (use these; never raw hex for brand colors; never Tailwind color classes)
- Paper: `--color-bg` (page), `--color-surface` (recessed/inactive), `--color-card` / `--color-surface-elevated` (cards, inputs, modals)
- Ink: `--color-ink` (= `--color-text-primary`), `--color-text-secondary`, `--color-text-tertiary`, `--color-divider` (subtle sand rule)
- Inks: `--color-primary` Lobster = primary action / brand. `--color-accent` Harbor blue = links, restaurant names, secondary action.
  `--color-butter` = highlight / active / celebrate — ALWAYS with ink text, never as text color. `--color-butter-muted`.
  `--color-category-strip` = peach icon backdrop.
- Text on lobster/harbor/ink fills: `--color-text-on-primary`. On ink fill you may also use `--color-bg`.
- Status: `--color-danger`, `--color-success`, `--color-rating` (green), plus `getRatingColor()` for scores.
- Shape: `--radius-sm` 8 / `--radius-md` 12 / `--radius-lg` 16 / `--radius-xl` 22 / `--radius-pill`
- Borders: `--border-ink` (2px ink), `--border-ink-thin` (1.5px ink)
- Shadows: `--shadow-hard-sm` (2px), `--shadow-hard` (3px), `--shadow-hard-lg` (5px). `--shadow-float` = soft, ONLY for things floating over the map.
- Fonts: `--font-display` (Bricolage Grotesque; headings, big numbers, avatars initials), `--font-body` (Instrument Sans; inherited, don't set it), `--font-mono` (Jitter only)
- RGB triplets for rgba(): `--color-primary-rgb`, `--color-accent-rgb`, `--color-success-rgb`, `--color-danger-rgb`, `--color-bg-rgb`

## Patterns
- **Card / panel**: `background: 'var(--color-card)', border: 'var(--border-ink)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-hard)'`
  (or `className="sticker"`). Tappable card: add `className="sticker-press"` (sinks into its shadow). Nested/secondary cards inside a sticker: ink border, NO shadow.
- **Empty / placeholder / "add" box**: `border: '2px dashed var(--color-text-tertiary)'`, radius lg, `--color-surface` bg.
- **Primary button**: `className="btn-ink ..."` + `background: 'var(--color-primary)', color: 'var(--color-text-on-primary)'`.
  Secondary: btn-ink with `background: 'var(--color-card)', color: 'var(--color-ink)'`. Harbor variant for "Directions"/"Order"/"Follow"-type secondary actions.
  `.btn-ink` sets border, radius-md, hard shadow, bold, flex-center, press + disabled states — don't stack rounded-*/font-*/shadow classes on it.
  Small inline pill buttons: `border: 'var(--border-ink-thin)', borderRadius: 'var(--radius-pill)'`, no shadow.
- **Inputs / textareas / selects**: `background: 'var(--color-surface-elevated)', border: 'var(--border-ink)', borderRadius: 'var(--radius-md)'`, `fontSize: '16px'` (prevents iOS zoom). Search-style inputs also get `boxShadow: 'var(--shadow-hard)'`.
- **Segmented control / tabs**: container = card + ink border + radius-md + `--shadow-hard-sm`, padding 4px; active segment `background: 'var(--color-ink)', color: 'var(--color-bg)'`, radius-sm, fontWeight 800.
  Underline-style tabs: active = ink text 800 + 3px ink underline; inactive = text-tertiary.
- **Filter chips**: active `background: 'var(--color-butter)', border: 'var(--border-ink-thin)', color: ink, fontWeight 800`; inactive `background: 'var(--color-card)', border: '1.5px solid var(--color-divider)', color: text-secondary`.
- **Modals / sheets**: backdrop `rgba(27, 22, 17, 0.55)`; panel = card bg + `--border-ink` + radius-xl + `--shadow-hard-lg`. Bottom sheets: ink top/side border, top radius-xl, no hard shadow needed. Modal titles = display font.
- **Section heading**: optional `<p className="eyebrow">LABEL</p>` above an `<h2>` (h1–h3 already default to display font 800, -0.02em). Typical sizes: page title 28–30px, section 22–24px, card title 17–20px.
- **Small caps labels**: `className="eyebrow"` (11px, 700, 0.14em tracking, uppercase, tertiary).
- **Rating / score numerals**: `fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1`, color `getRatingColor(x)`. List 20–22px, hero 44–60px.
- **Avatars (initials)**: circle, `border: 'var(--border-ink)'`, display font 800, bg rotates through `['var(--color-primary)', 'var(--color-accent)', 'var(--color-ink)', 'var(--color-rating)']`.
- **Dividers**: within cards `1.5px solid var(--color-divider)` or `1.5px dashed var(--color-divider)`; structural rules (header bottoms, card section splits) `var(--border-ink)`. Delete decorative `linear-gradient(...transparent...)` hairlines.
- **Badges / tags**: pill, 1.5px ink border, butter or card bg, ink text, 10–11px weight 800.
- Sticky headers: `background: 'var(--color-bg)'`, `borderBottom: 'var(--border-ink)'`. Round icon buttons in headers: card bg + ink border + `--shadow-hard-sm`.
- No soft drop shadows or `backdrop-filter` glass. Tailwind `shadow-sm/md/lg/xl` map to the hard ink shadows.
- Text weights: 500–600 for meta, 700 for names/labels, 800 for emphasis. Quotes use weight, not italics.

## Hard rules (from CLAUDE.md)
- No Tailwind color classes (`text-gray-*`, `bg-white`, `ring-*` colors…). Tailwind = layout/spacing only.
- Brand colors only via `var(--color-*)`. Hex OK only for one-offs (SVG illustration fills, third-party logos like Google).
- Never render error objects directly (`{error?.message || error}`).
- No `console.*`, no `localStorage.*`, no ES2023 array methods (`toSorted`, `.at()`).
- New tokens or shared classes go in `src/index.css` — don't invent one-off values inline.
