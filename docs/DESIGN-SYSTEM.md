# WGH Design System — "Quiet"

The visual system for What's Good Here. Tokens live in `src/index.css` (`:root`); the few shared
primitives (`.press`, `.btn`, `.eyebrow`, `.wordmark`) live in the `@layer components` block of the
same file. The brand lockup is `<Wordmark />` (`src/components/Wordmark.jsx`). Every dish image goes
through `<DishThumb />` (`src/components/DishThumb.jsx`).

Reference implementations: `DishListItem.jsx`, `dish/DishHero.jsx`, `home/HomeListMode.jsx`
(GuideCard), `pages/RestaurantDetail.jsx`, `pages/Restaurants.jsx`, `BottomNav.jsx`.

> Superseded: "Lobster Buoy" (neo-brutalist stickers, cream paper, Bricolage) shipped in commit
> `526e295` and was replaced because it read as generic. Earlier: "Island Depths", "Appetite".

## Idea
A good menu, not an app. White paper, black type, hairline rules, generous space. The food — real
photos as they arrive, Dan's illustrated icons until then — and the scores are the only things with
colour. Chrome stays out of the way.

- **One accent, used once.** Brand red (`--color-brand`) appears in the mark (pin, seal, splash
  period, notification dot) and nowhere else. Actions are ink.
- **Type does the hierarchy.** A serif display face for names, places and numbers; a plain sans for
  everything you read or tap. Weight, size and spacing — not boxes — separate things.
- **Flat until it floats.** Surfaces have no shadow. Only things that sit *over* other content
  (map overlays, popovers, toasts, the Map/List FAB, modals) get `--shadow-float`.
- **Photo-ready.** Every dish image slot is the same box whether it holds a photo or an icon, so the
  layout doesn't change as photo coverage grows.

## Palette
| Token | Value | Use |
|---|---|---|
| `--color-bg` / `--color-card` / `--color-surface-elevated` | `#FFFFFF` | Page, cards, inputs, sheets |
| `--color-surface` | `#F6F5F2` | Recessed: resting inputs, segmented controls, avatar discs, quiet panels |
| `--color-category-strip` | `#F3F1EC` | DishThumb tile behind icons |
| `--color-highlight` / `-muted` | `#EFEDE8` / `#F6F5F2` | Quiet tags, active chip fill, hover |
| `--color-divider` | `#EAE8E3` | Hairline rules (also `--border-default`) |
| `--color-divider-strong` | `#D6D3CC` | Secondary-button outline, dashed "add" boxes |
| `--color-ink` / `--color-text-primary` | `#141414` | Text, primary buttons, active states |
| `--color-text-secondary` | `#5C5C5C` | Restaurant names, meta |
| `--color-text-tertiary` | `#707070` | Eyebrows, timestamps (AA on white) |
| `--color-primary` / `--color-accent` | `#141414` | Kept for call-site compatibility — both are ink now |
| `--color-brand` | `#C8361B` | The mark only |
| `--color-rating` / `--color-success` | `#1E6E45` | Ratings ≥ 8 |
| `--color-amber` / `--color-orange` / `--color-yellow` | `#9A5A10` / `#A8540C` / `#85690A` | Rating scale steps (`getRatingColor()`), text-safe |
| `--color-danger` | `#B42318` | Errors, destructive actions |
| `--color-medal-gold/silver/bronze` | `#C9A227` / `#A3A8AE` / `#A9714B` | Podium discs |
| `--color-backdrop` | `rgba(20,20,20,0.42)` | Modal scrim |

`--color-accent-gold` is a deprecated alias of `--color-accent` — don't use it in new code.
RGB triplets for `rgba()`: `--color-primary-rgb`, `--color-accent-rgb`, `--color-ink-rgb`,
`--color-success-rgb`, `--color-danger-rgb`, `--color-rating-rgb`, `--color-bg-rgb`.

Leaflet `pathOptions` (CircleMarker etc.) go straight to the SVG/canvas renderer, so they take hex
values, not CSS vars. `divIcon` HTML strings can use vars. Map tiles are desaturated via
`.wgh-map-tiles` so pins and photos carry the colour.

## Type
| Font | Token | Role |
|---|---|---|
| **Newsreader** (variable, opsz 6–72, roman 400–700 + italic 400–600) | `--font-display` | Wordmark, page/section headings, dish and restaurant names in headers and cards, rank + rating numerals, avatar initials. `h1`–`h3` default to it at weight 500. |
| **Instrument Sans** (400–700) | `--font-body` | Everything else — list dish names, meta, buttons, inputs. Inherited from `body`. |
| SF Mono stack | `--font-mono` | Jitter only |

Rules of thumb:
- Display weight is **400–500**, never bold. Numerals: 400 at hero size, 500 at list size, with
  `fontVariantNumeric: 'lining-nums tabular-nums'`.
- Body weights: 400 reading, 500 meta/labels, 600 names and buttons. Nothing heavier.
- Italic is the emphasis voice of the display face (the *Good* in the wordmark, rating-style labels).
- Sizes: page title 28–32px, section 22–24px, card title 17–20px, list name 15px, meta 12–13px.
- `.eyebrow`: 11px, 600, 0.12em tracking, uppercase, tertiary — for small labels above headings.

## Shape & shade
- Radius: `--radius-sm` 6 / `--radius-md` 10 / `--radius-lg` 14 / `--radius-xl` 20 / `--radius-pill`.
- Borders: `--border-default` and `--border-subtle` are both `1px solid var(--color-divider)`;
  `--border-dashed` for "add" / empty boxes.
- Shadows: `--shadow-card` is `none` (kept so call sites stay valid). `--shadow-float` is the only
  real shadow. Tailwind `shadow-sm/md` → none, `shadow-lg/xl` → float.

## Components & patterns
- **DishThumb** — `dish` (any shape with `dish_name`/`name`, `category`, `featured_photo_url`,
  `photo_url`), `size` (square px) or `fill` (fills a parent that sets size/aspect-ratio), `radius`,
  `iconScale`. Shows the real photo (fades in, falls back to the icon on error), else the dish-name
  or category icon on the `--color-category-strip` tile, else the category emoji. Never build a
  separate image slot for dishes.
- **List rows** (`DishListItem` ranked): no card — a row with a bottom hairline, `className="press"`.
  Rank in serif, DishThumb 56px (64px for the top three), name 15px/600, restaurant 13px secondary,
  score in serif on the right coloured by `getRatingColor()`.
- **Cards / panels**: prefer no container at all — space and a hairline. When a panel is needed:
  `background: 'var(--color-surface)'`, radius lg, no border, no shadow; or white with
  `--border-default`.
- **Buttons**: `className="btn ..."` (pill, 600, flex-centre, press + disabled states).
  Primary: `background: 'var(--color-primary)', color: 'var(--color-text-on-primary)'`.
  Secondary: `background: 'var(--color-card)', color: 'var(--color-text-primary)'` — `.btn` adds the
  `--color-divider-strong` hairline automatically. Text links: underline with `textUnderlineOffset: '3px'`.
- **Inputs**: resting `background: 'var(--color-surface)', border: '1px solid transparent'`, radius md,
  min-height 48, `fontSize: '16px'` (prevents iOS zoom); focused → card background + `1px solid var(--color-ink)`.
- **Segmented control**: surface container, padding 4px; active segment ink fill with white text.
  Underline tabs: active ink text 600 + `2px solid var(--color-ink)`; inactive tertiary 500 + `2px solid transparent`.
- **Chips**: active `background: 'var(--color-highlight)'`, ink text, 600; inactive transparent,
  secondary text, 500. No outlines.
- **Avatars (initials)**: circle, `--color-surface` fill, ink serif initial. No rotating colours.
- **Modals / sheets**: `--color-backdrop`; panel card bg + radius xl + `--shadow-float`.
- **Sticky headers / bottom nav**: `--color-bg` with a hairline (`--border-default`). Nav icons are
  1.6-stroke outlines; active = ink + 600, inactive = tertiary.
- **Map**: white pins with the category emoji/icon, 1px divider ring (1.5px ink for 9+, 2px ink when
  selected), ink rank badge. Overlays are white with `--shadow-float`.
- **Marks**: `SmileyPin` (flat brand-red pin, white plate, ink face) and `WghSeal` (brand disc,
  hairline ring text). These are the only places `--color-brand` should appear.

## Photos
Production has very few real photos today (14 of ~8,800 dishes at the time of this pass), so every
screen must look finished with icons alone. Photos enter through the same DishThumb slot:
`featured_photo_url` (best community photo) → `photo_url` (dish row) → icon. Don't use stock or
AI-generated photos for specific dishes — a picture of *a* lobster roll presented as *this*
restaurant's lobster roll misleads diners.

## Brand assets
`public/favicon.svg` / `favicon.png` (32px), `public/wgh-icon.png` (180px apple-touch),
`public/og-image.svg` → `og-image.png` (1200×630), and the dynamic generators `api/og-image.ts`
and `api/playlist-og.ts` all use the Quiet palette. The generators can't read CSS vars — keep their
hex constants in sync with `:root` when the palette changes.

## Hard rules (from CLAUDE.md)
- No Tailwind color classes (`text-gray-*`, `bg-white`, `ring-*` colours…). Tailwind = layout/spacing only.
- Brand colours only via `var(--color-*)`. Hex OK only for one-offs (SVG illustration fills, Leaflet
  paths, third-party logos like Google).
- Fonts only via `--font-*` tokens.
- Never render error objects directly (`{error?.message || error}`).
- No `console.*`, no `localStorage.*`, no ES2023 array methods (`toSorted`, `.at()`).
- New tokens or shared classes go in `src/index.css` — don't invent one-off values inline.
