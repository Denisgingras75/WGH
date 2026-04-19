# Claude Design Integration — Full Port

**Started:** 2026-04-19
**Branch:** `redesign/claude-design`
**Reference:** `public/remix.html` (full prototype, mock data)
**Deadline:** Memorial Day 2026 (2026-05-25, ~36 days)

## Mandate

Redesign the live WGH React app to **look exactly like the Claude Design prototype** while preserving all existing functionality (auth, Supabase data, voting, favorites, admin, manager portal, menu import, photo upload, notifications, follows).

This is NOT a rewrite. It is a **visual rebuild on top of the existing data layer.** Every hook, every API call, every Supabase query stays. Only JSX + styles change.

## Non-negotiables (from CLAUDE.md, carry through every phase)

- No ES2023+ (no `toSorted()`, no `Array.at()`)
- Brand colors via CSS variables; prototype tokens (`--paper`, `--ink`, `--tomato`, `--ochre`, etc.) added alongside existing `--color-*` tokens
- No Tailwind color classes
- No direct Supabase calls from components/hooks (stays through API layer)
- React Query for all server state
- `logger` not `console.*`
- `storage.js` not direct `localStorage.*`
- `DishListItem` stays the single list component (its innards get rewritten, not its API)

## Phases

### Phase 01 — Foundation *(~2 days)*

Status: **in progress**

- [x] Masthead component (shipped on prior commit, uses prototype tokens)
- [ ] Font imports: Fraunces, Inter, JetBrains Mono, Archivo (+Black), Space Grotesk, DM Mono, Alfa Slab One, Bebas Neue, IBM Plex Mono, Caveat Brush
- [ ] All 6 themes as `[data-theme="..."]` CSS blocks in `src/index.css`:
  - `paper` (default warm editorial)
  - `dusk` (dark)
  - `zine` (hot pink/cyan/canary)
  - `diner` (deep red/cream/chrome)
  - `chalk` (slate board + chalk script)
  - `neon` (vaporwave teal + pink)
- [ ] Utility classes: `.serif`, `.mono`, `.hairline-b`, `.avatar`, `.chip`, `.press`, `.row-dish`
- [ ] `ThemeContext` — reads/writes selected theme via `src/lib/storage.js`
- [ ] `DesignStudio` modal component — 6 theme cards + live preview
- [ ] First-run onboarding: auto-open studio once, `wgh.themed` flag in storage
- [ ] `data-theme` attr applied to `.app-shell` root
- [ ] Keep legacy `--color-*` tokens so unported surfaces still render

**Definition of done:** theme picker works, all 6 themes switchable on existing (unported) pages with at least background + font family changing. No regressions on existing surfaces.

### Phase 02 — Home *(~3 days)*

- [x] Masthead (done)
- [ ] List-mode redesign: editorial ranked list (prototype DishRow pattern)
- [ ] Category chip strip (prototype `.chip` pattern)
- [ ] Top-10 editorial chart (replace `Top10Carousel` visuals)
- [ ] Locals ticker (keep existing `useLocalsAggregate` hook, reskin)

### Phase 03 — Dish Detail *(~2 days)*

- [ ] Editorial photo card
- [ ] Ballot-style vote flow wrapper around existing `ReviewFlow`
- [ ] Review snippets (pull-quote style, Fraunces italic)
- [ ] Friends-voted strip reskin

### Phase 04 — Profile *(~2 days)*

- [ ] Stat ledger (big Fraunces numerals, 4-up grid)
- [ ] Taste chart (editorial bar viz)
- [ ] Journal feed reskin (pull-quote cards)
- [ ] Existing shelves: map `favorites` → "Tried" without schema change (Goodreads-style Lists table deferred post-launch)

### Phase 05 — Restaurants + Browse *(~2 days)*

- [ ] Editorial rank rows (DishListItem variant="editorial")
- [ ] Section headings in Fraunces
- [ ] Menu view typographic polish

### Phase 06 — Nav + Chrome *(~1 day)*

- [ ] BottomNav re-skin (minimal ink/paper bar)
- [ ] Share cards (OG + in-app SharePicksButton)
- [ ] Auth modals (LoginModal, WelcomeModal)

### Buffer *(~3 days)*

- iOS Safari regression pass (Safari <16 compat)
- Island cell test (slow 3G)
- Contrast audit across all 6 themes, all surfaces
- Visual diff against prototype

## Deferred post-launch

- **Goodreads-style Shelves** (Tried / Want to try / Heard) — needs list tables + schema work. Phase 01 demo via existing `favorites`.
- **Dish-level AI snippets** — prototype shows curated snippets; real app has them via `get_smart_snippet` RPC but editorial styling deferred to post-launch.
- **Map mode** (currently untouched by redesign) — keep existing Leaflet, reskin later.

## Shipping cadence

- **One branch** `redesign/claude-design`
- **One surface per commit** — each commit leaves app fully working
- **No merge to `main` until Denis blesses the whole migration**
- **Vercel preview URL refreshed each phase** so Denis can click through before I continue

## Risks

- **R1 — Theme-token collisions.** Prototype uses `--card` (as `#FBF8F2`). Existing app uses `--color-card` (as `#FFFFFF`). Renamed prototype's to `--card-paper` in CSS. No collision.
- **R2 — Dark themes + map tiles.** Leaflet CartoDB tiles are light-mode. In `dusk`/`neon` themes, map mode will look wrong. Mitigation: swap to `voyager_labels_under` or gate map tile swap to themes post-Phase 05.
- **R3 — Contrast on dark themes.** Prototype chat history documented contrast bugs on dusk/neon that were fixed at `.app-shell` scope. Port fix when we wire root theme.
- **R4 — Safari flex + gap (per kb-global-rules).** Set explicit width on flex children when gap is present. Audit prototype markup before porting.

## Rollback

At any point, `git checkout main` reverts to current (pre-redesign) app. Branch is not merged until full migration passes.
