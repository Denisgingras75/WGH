# Restaurant Metrics — Quick Wins (Post-Launch B2B Spec)

**Date:** 2026-04-27
**Status:** Draft spec — implement post-Memorial-Day if traction justifies B2B push
**Owner:** Denis
**Audience:** Whoever picks up the manager-portal analytics work

---

## Strategic context

Manager portal (`/manage`) today is pure CRUD — restaurant owners can edit dishes, specials, events, but see **zero analytics** on how their menu is performing. Meanwhile WGH already captures: ratings, free-text reviews, `would_order_again` boolean, photo quality, all timestamped + indexed. Schema is analytics-ready; UI is analytics-blind.

Three quick wins below take the existing data and surface it as actionable owner-facing metrics. Combined effort: ~6 days. None require schema changes; all require a new RPC + manager API method + UI tab.

**Privacy posture across all three:** managers see aggregates only — no individual user identities, no individual review text. RLS enforces "this restaurant_id only." Reviewers stay anonymous to owners.

---

## Win 1 — "Last 6 Months" Metrics Card

**Effort:** 2-3 hours
**Value:** Baseline visibility — "is my menu working?"

### What the manager sees

A new tab in `/manage` called **Metrics**. Top of the tab: a 6-card grid summarizing the last 180 days vs. lifetime.

| Card | 6-month value | Lifetime |
|---|---|---|
| Total votes | 142 | 891 |
| Avg rating | 7.8 | 7.4 |
| Reviews with text | 38 | 201 |
| Photos uploaded | 12 | 67 |
| % "Would order again" | 84% | 79% |
| Active dishes | 14 | 14 |

### RPC signature

```sql
CREATE OR REPLACE FUNCTION get_restaurant_metrics(
  p_restaurant_id UUID,
  p_lookback_days INT DEFAULT 180
)
RETURNS TABLE (
  scope TEXT,                   -- 'window' | 'lifetime'
  total_votes BIGINT,
  avg_rating NUMERIC,
  reviews_with_text BIGINT,
  photos_uploaded BIGINT,
  pct_would_order_again NUMERIC,
  active_dish_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Returns 2 rows: 'window' (last N days) and 'lifetime'
  -- Auth check: caller must be the manager of p_restaurant_id (existing pattern)
  -- ...
END;
$$;

REVOKE EXECUTE ON FUNCTION get_restaurant_metrics(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_restaurant_metrics(UUID, INT) TO authenticated, service_role;
```

### API + UI

- New method: `restaurantManagerApi.getMetrics(restaurantId, lookbackDays)`
- New page/tab component: `src/components/restaurant-admin/MetricsCard.jsx`
- Tab wired in existing `ManageRestaurant.jsx`

### Acceptance

- Manager visits `/manage` → Metrics tab → sees 6-card grid populated
- Numbers match a hand-rolled SQL query against the votes table for that restaurant
- Non-manager users get RLS-blocked (403, no data leak)
- Renders empty state cleanly when restaurant has zero votes

---

## Win 2 — Trending Dishes Leaderboard

**Effort:** 3-4 hours
**Value:** Tells owner *which* dishes are climbing or sliding — the most actionable signal

### What the manager sees

Below the metrics card, a sortable table of every dish at the restaurant with a velocity column.

| Dish | 30-day votes | Velocity (votes/day) | Δ vs prior 30 days | Avg rating |
|---|---|---|---|---|
| Lobster Roll | 24 | 0.80 | +33% | 8.4 |
| Calamari | 12 | 0.40 | +9% | 7.9 |
| Caesar Salad | 3 | 0.10 | -50% | 6.8 |

### RPC signature

```sql
CREATE OR REPLACE FUNCTION get_trending_dishes_for_restaurant(
  p_restaurant_id UUID,
  p_window_days INT DEFAULT 30
)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  votes_in_window BIGINT,
  votes_in_prior_window BIGINT,
  velocity NUMERIC,            -- votes_in_window::numeric / p_window_days
  delta_pct NUMERIC,           -- (current - prior) / NULLIF(prior, 0) * 100
  avg_rating NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
-- Compares window N (current) to window N (prior) for slope.
-- Uses idx_votes_created — fast at scale.
$$;
```

### Acceptance

- Manager sees every dish at their restaurant, sortable by any column
- Velocity column shows votes/day with 2-decimal precision
- Δ column color-codes: green for +, red for -, gray for flat (±5%)
- Empty windows render "—", not 0 (so flat ≠ silent)
- Visual default sort: by velocity descending

---

## Win 3 — Photo Coverage Audit

**Effort:** 2 hours
**Value:** Cheapest visibility unlock — "add photos to your underperforming dishes"

### What the manager sees

A simple table beneath trending — every dish with photo count + average quality. Dishes with <3 photos or <50 avg quality flagged.

| Dish | Photos | Avg quality | Status |
|---|---|---|---|
| Lobster Roll | 7 | 78 | ✅ Strong |
| Calamari | 2 | 64 | ⚠️ Add more |
| Caesar Salad | 0 | — | 🚨 No photos |

### Data source

`dish_photos.quality_score` already computed per upload. RPC just aggregates.

### RPC signature

```sql
CREATE OR REPLACE FUNCTION get_dish_photo_coverage(
  p_restaurant_id UUID
)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  photo_count BIGINT,
  avg_quality NUMERIC,
  featured_count BIGINT,        -- status = 'featured'
  has_recent_photo BOOLEAN      -- any photo in last 90 days
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ ... $$;
```

### Acceptance

- Every dish at restaurant appears in table (even zero-photo dishes)
- Status column: ✅ ≥3 photos AND avg ≥70, ⚠️ 1-2 photos OR avg 50-69, 🚨 0 photos OR avg <50
- "Recent photo" indicator: ✓ if any photo in last 90 days
- Empty `avg_quality` renders as "—"

---

## Combined wireframe

```
/manage → Metrics tab
┌──────────────────────────────────────────────────┐
│ MENU PERFORMANCE                                 │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┐           │
│ │142v │7.8★ │38rev│12pic│84%↻ │14d │           │
│ └─────┴─────┴─────┴─────┴─────┴─────┘           │
│ Last 180 days · vs. lifetime in subtext          │
│                                                  │
│ TRENDING DISHES (last 30 days)                   │
│ Dish          Votes  Velocity  Δ      Rating     │
│ Lobster Roll   24    0.80/d   +33%    8.4       │
│ Calamari       12    0.40/d   +9%     7.9       │
│ Caesar Salad   3     0.10/d   -50%    6.8       │
│                                                  │
│ PHOTO COVERAGE                                   │
│ Dish          Photos Avg Q  Status   Recent      │
│ Lobster Roll   7     78    ✅ Strong  ✓          │
│ Calamari       2     64    ⚠️ Add     ✓          │
│ Caesar Salad   0     —     🚨 None    ✗          │
└──────────────────────────────────────────────────┘
```

---

## Implementation order

1. **RPCs first** — write all three in one migration file, deploy via SQL Editor, test with a real restaurant_id from a Supabase query
2. **API methods** — add to `restaurantManagerApi.js`
3. **UI** — single new component `MetricsTab.jsx` mounting in `ManageRestaurant.jsx`, three sub-components for the three sections
4. **RLS sanity check** — non-manager calls each RPC, expect zero rows or 403

---

## What to *not* build in this sprint

These are tempting adjacencies — defer to longer-term work:

- **Sentiment classification** — needs a Claude/Sonnet pipeline, ~1-2 weeks of work, high value but bigger scope. Ship as a separate plan.
- **Peer percentiling** ("you rank top 15% of MV appetizers") — needs comparison layer, privacy review on what owners see about other restaurants
- **Return-customer loyalty signal** — needs distinct-user-with-N-votes aggregation, easy to build but harder to interpret
- **Time-of-day / day-of-week heatmap** — fun visualization but unclear actionability
- **Email digest** ("your weekly metrics") — distribution is a separate problem from the dashboard itself

Pick these up after the dashboard tab ships and someone is actually using it.

---

## Pricing implication (optional)

If the dashboard becomes the foundation of a paid B2B tier, sentiment + peer percentile + loyalty become the upsell. Free tier = the 3 quick wins above; paid tier = sentiment + comparative + retention. That's a defensible segmentation — free tier is honest analytics, paid tier is "why and what to do."

Don't gate the free tier in the first version. Get owners using it first; monetize once usage proves out.
