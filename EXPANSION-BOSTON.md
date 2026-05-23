# Greater Boston Expansion — Design Doc

**Status:** Draft. NOT approved to execute.
**Owner:** Denis (product), Dan (design + brand), Claude sessions (implementation).
**Drafted:** 2026-05-23 (2 days before MV Memorial Day launch).
**Trigger:** Denis asked to pull restaurants + menus 25mi around 01887 (Wilmington, MA).

> **Recommendation up front:** **Do not start this work until after MV Memorial Day launch is stable.** Memorial Day is 2026-05-25 and `LAUNCH-READINESS.md` has 15+ unchecked items. Splitting focus 48h from launch is the textbook way to ship two half-done things. Park this until 2026-06-01 at the earliest.

---

## 1. Goal

Let users in Greater Boston (specifically the 25mi radius around Wilmington, MA — covering the North Shore, Merrimack Valley, and Boston proper) use What's Good Here to discover and rate dishes the same way MV users do.

Success criteria:
- Restaurants in the new geography appear in `/restaurants`, `/browse`, and the map for users physically in that region.
- MV users never see Boston results polluting their feed.
- Boston users never see MV results polluting their feed.
- Category coverage handles Boston-area cuisines (Indian, Thai, Korean, Chinese, Vietnamese, pho, ramen, dim sum) at parity with MV's seafood/American coverage.

Out of scope for v1:
- Multi-market user accounts (a user "follows" multiple regions). For v1, region is detected from GPS and that's it.
- Region-specific branding (e.g., "What's Good Here Boston" subdomain). One brand, one app.

---

## 2. What's already in place

A surprising amount. Worth not re-building:

| Layer | What exists | File |
|---|---|---|
| Schema | `restaurants.region TEXT NOT NULL DEFAULT 'mv'` | `supabase/schema.sql:34` |
| Schema | `restaurants.town TEXT` + index | `supabase/schema.sql:33`, `:377` |
| Constants | `REGIONS` map with `mv`, `nantucket`, `cape`, `boston` keys | `src/constants/towns.js:6-73` |
| Constants | `detectRegion(lat, lng)` bbox lookup | `src/constants/towns.js:79-89` |
| Constants | `getTownsForRegion(key)` for UI dropdowns | `src/constants/towns.js:94-99` |
| Constants | `BOSTON_TOWNS` with 9 neighborhoods (Back Bay, South End, North End, Seaport, Cambridge, Somerville, Brookline, JP) | `src/constants/towns.js:55-72` |

The expansion is **not** a from-scratch architecture build. It's a fill-in-the-blanks job against an existing region scaffold.

---

## 3. The gaps to close

### 3.1 The Boston bbox doesn't cover what Denis asked for
Current `boston.bounds`: `minLat: 42.22, maxLat: 42.50, minLng: -71.20, maxLng: -70.90`.
Wilmington is at `42.5562°N, -71.1745°W` — **above** the current maxLat. North Shore, Merrimack Valley, MetroWest are all outside the box.

**Decision needed:** Expand the `boston` bbox or add a separate `north_shore` / `metro_boston` region? My recommendation: **expand `boston`** to roughly `minLat: 42.10, maxLat: 42.80, minLng: -71.60, maxLng: -70.70` and rename the label to "Greater Boston". One region with many towns is easier to reason about than splintering. Sub-region filtering can be a town-list problem, not a region problem.

### 3.2 The towns list is City-of-Boston neighborhoods only
The 9 entries are neighborhoods (Back Bay, JP, etc.), not the suburbs Denis actually wants (Wilmington, Andover, Lowell, Lexington, Reading, Burlington, Salem, Beverly...).

**Action:** Add ~30 suburbs covering the 25mi radius. Keep the existing 9 neighborhoods so urban Boston still works. ~40 entries total.

### 3.3 `discover-restaurants` Edge Function is MV/Nantucket-only
`supabase/functions/discover-restaurants/index.ts:34-49` hardcodes town centers + radii for MV/Nantucket. `classifyTown(lat, lng)` returns one of those names. **For Boston, restaurants would either get classified as MV (incorrect) or fall through.**

**Action:**
- Add Boston-area town centers (lat/lng + radius) — one per major town/suburb, ~30 entries.
- Make `classifyTown()` region-aware: first detect region via the same bbox logic as the client, then classify to the nearest town within that region.
- Insert with `region = 'boston'` for any place inside the Boston bbox.

### 3.4 `parse-menu` Edge Function category vocab
Current valid categories (`supabase/functions/parse-menu/index.ts`): pizza, burger, taco, wings, sushi, breakfast, breakfast sandwich, lobster roll, chowder, pasta, steak, sandwich, salad, seafood, fish, tendys, fried chicken, apps, fries, entree, dessert, donuts, pokebowl, asian, chicken, quesadilla, soup, ribs, sides, duck, lamb, pork, clams, oysters, coffee, cocktails, ice cream, beer.

Greater Boston cuisine landscape that won't fit cleanly:
- **Pho** — gets dropped or coerced to "soup". Should be its own category — too iconic.
- **Ramen** — same. Distinct enough from "soup" or "asian" to warrant its own.
- **Dim sum** — would land in "apps" but it's a meal format, not appetizers.
- **Indian curry / tikka masala / biryani** — currently `asian` is the catch-all; biryani is a rice dish, not an appetizer. Need an `indian` category at minimum.
- **Korean BBQ / bibimbap / Korean fried chicken** — KFC overlaps `fried chicken` but bibimbap has nowhere to go.
- **Bagels** — Greater Boston bagel scene is real. Currently falls into `breakfast sandwich` or nowhere.

**Action:** Audit the category list against a sample of 20 Greater Boston menus. Add 4-6 new categories. Update `MAIN_CATEGORIES` + `BROWSE_CATEGORIES` in `src/constants/categories.js` AND the `VALID_CATEGORIES` vocab in `parse-menu/index.ts` AND its prompt. Three places to keep in sync — easy to miss one.

Dan should make these decisions, not me. They're brand calls — "what dishes does this app categorize" is a product decision.

### 3.5 Region-aware ranking
`get_ranked_dishes` (the main Browse feed) currently takes `filter_town TEXT` but doesn't filter by region. A Boston user opening Browse with no town selected would get dishes from all regions sorted by distance, putting MV results 80mi away above Boston results.

**Action:** Add a `filter_region TEXT DEFAULT NULL` param. When the client calls Browse, it passes the detected region. If GPS is unavailable or the user is outside any defined region, fall back to no filter (current behavior).

Same treatment for `get_map_dishes` and `find_nearby_restaurants`.

### 3.6 Brand / copy audit
Strings to grep and either generalize or make region-aware:
- "Martha's Vineyard" in `index.html`, `og-image.ts`, hero copy, `MapHero.jsx`, etc.
- "MV" in tagline, share text, JitterLanding, etc.
- `share.ts` social bot redirect — does it mention MV?

**Action:** Run `grep -rin "martha\|vineyard\|\\bmv\\b" src/ api/ index.html supabase/functions/` and audit each. Most should become region-aware ("What's good in Greater Boston" vs. "...on Martha's Vineyard").

This is Dan's call, not mine. Brand voice is his lane.

### 3.7 Map default-center
`Map.jsx` opens centered on MV. For a Boston user this is a 80mi pan on first load — bad UX.

**Action:** On first load, if `LocationContext` has GPS, center on the user. If not, fall back to MV center *only if the user's prior session was in MV* — otherwise center on whichever region the user most recently interacted with (read from `wgh_region` localStorage). Cold-cold start with no data → MV default (until traffic shifts).

### 3.8 Google Places API cost ceiling
A 25mi radius around 01887 covers ~2,000 sq miles of dense suburbia. Even with restaurant-only filtering, expect 3,000–6,000 places. Google Places Nearby Search returns 60 results per query max (3 paged calls of 20), so we'd need to **grid-search**: iterate over town centers (the same ~30 we're adding in 3.3) with their own radii.

Cost estimate (Places API SKU pricing, 2026):
- Nearby Search (Basic): $32/1000 calls.
- Place Details (Contact + Atmosphere): $17 + $5 = $22/1000.
- 30 town centers × 3 paginated calls = 90 Nearby Search calls = **$2.88**.
- ~3,500 unique places × Place Details (for `website_url`, `phone`) = **~$77**.
- Total initial pull: **~$80**. Subsequent re-discovery runs at ~$3 (no new details fetched for known places).

Not catastrophic. Worth confirming with Denis before pulling the trigger because there's no in-product budget alarm right now.

**Action:** Add a `GOOGLE_PLACES_DAILY_BUDGET_USD` env var that `discover-restaurants` checks against a daily-spend audit table. Fail closed if over.

---

## 4. Phasing

| Phase | When | What ships | Risk |
|---|---|---|---|
| **0. MV launch lockdown** | now → 2026-05-25 | Nothing in this doc. Tunnel-vision on `LAUNCH-READINESS.md`. | Skipping = launching two half-products. |
| **1. Foundation** | 2026-06-01 → 2026-06-05 | Schema/RPC changes (§3.5), bbox expansion (§3.1), towns list (§3.2). All additive, no data ingest yet. | Low. Pure backend wiring with rollback. |
| **2. Categories + copy** | 2026-06-05 → 2026-06-10 | Category audit + additions (§3.4). Brand copy audit (§3.6). Dan-led. | Low. Mostly copy + config. |
| **3. Discovery** | 2026-06-10 → 2026-06-12 | `discover-restaurants` town-center config + region-aware `classifyTown` (§3.3). Run on **5mi smoke test radius first**. Verify town tagging, category fit, dedup. | Medium. Real Google Places spend. Validate before going wide. |
| **4. Full pull** | 2026-06-12 → 2026-06-15 | 25mi radius around 01887. Menu scraping via `menu-refresh` for restaurants with detected menu URLs. | Medium. Cost + data quality. Have rollback plan: `DELETE FROM restaurants WHERE region='boston' AND created_at > '<phase 4 start>'`. |
| **5. Launch Boston** | 2026-06-15+ | Map default-center logic (§3.7). Announcement / SEO / PostHog dashboard. | Brand call — Dan's lane. |

**Total elapsed:** ~3 weeks after MV launch. Achievable if MV launch holds and there are no fires.

---

## 5. Open questions (need Dan + Denis answers)

1. **Region name** — call it "Boston" (current key) or "Greater Boston"? Affects display labels everywhere.
2. **Sub-region filtering** — should "North Shore" vs. "City of Boston" be a sub-region or just a town-list filter? Likely a UI question, not a data model question.
3. **Category additions** — Dan: do `pho`, `ramen`, `indian`, `dim_sum`, `bagels`, `korean` belong in the canonical category set, or are they "search-only" (per CLAUDE.md §4.2: "Categories are shortcuts, not containers")?
4. **Brand voice** — Dan: how do we phrase "What's Good Here" when the user is in Boston? "What's good in Boston"? Or just drop the geography from copy entirely?
5. **Budget ceiling** — Denis: what daily Google Places spend cap is acceptable for ongoing discovery? (Initial pull ~$80; ongoing maintenance ~$3-10/day with re-checks.)
6. **Memorial Day launch posture** — what story do we tell users about Boston? Mention coming-soon or stay quiet until phase 5?

---

## 6. What I did NOT do

- I did not pull any data.
- I did not modify `discover-restaurants` or `parse-menu`.
- I did not touch the categories or towns constants.
- I did not call any Google API.

This doc is the only artifact. Pick it up post-launch.
