# Locals Lists — Design Spec

## Problem

The homepage is a flat ranked list — every row looks the same from #1 to #10. It feels like a spreadsheet, not a food discovery app. There's no personality, no story, no reason for a tourist to trust the rankings. Additionally, the app has a cold start problem: algorithmic rankings need vote volume to be meaningful.

## Solution

Two changes:

1. **Tiered visual hierarchy for the Top 10** — #1 gets a hero card, #2-3 get side-by-side podium cards, #4+ collapse into compact rows. Visual weight decreases with rank so you *feel* the ranking.

2. **Local Lists** — hand-picked MV locals curate their top 10 dishes for visitors. Lists appear as a section below the Top 10 on the homepage. Tapping a list goes to the curator's profile page where the full 10 is displayed. Lists rotate on the homepage (daily shuffle of which 3-4 are shown from the pool of 6).

## Why This Works

- **Solves cold start.** 6 locals × 10 dishes = 60 curated recommendations available day one, before any tourist votes.
- **Adds soul.** "Sarah the bartender says try the lobster roll" is 10x more compelling than "9.2 average rating."
- **Low effort to ship.** Dan and Denis hand-pick 6 locals and build their lists manually. No user-facing list creation UI needed for launch.
- **Lives on existing infrastructure.** Lists display on the existing public profile page (`/user/:userId`). Homepage just needs a new section.

## Data Model

### New table: `local_lists`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | |
| `user_id` | UUID FK → auth.users ON DELETE CASCADE | The local who curated this list |
| `title` | TEXT | e.g. "Sarah's MV Essentials" |
| `description` | TEXT | Optional one-liner, e.g. "What I send every friend to try" |
| `is_active` | BOOLEAN DEFAULT true | Controls homepage visibility |
| `created_at` | TIMESTAMPTZ | |

### New table: `local_list_items`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | |
| `list_id` | UUID FK → local_lists ON DELETE CASCADE | |
| `dish_id` | UUID FK → dishes ON DELETE CASCADE | |
| `position` | INT | 1-10, display order |
| `note` | TEXT | Optional curator's note for this dish |

**Constraints:**
- UNIQUE(list_id, dish_id) — no duplicate dishes in a list
- UNIQUE(list_id, position) — no duplicate positions
- CHECK(position >= 1 AND position <= 10)
- One list per user: UNIQUE(user_id) on `local_lists`

### RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| local_lists | public (where is_active = true) | admin only | admin only | admin only |
| local_list_items | public (via list join) | admin only | admin only | admin only |

Admin-only writes using `is_admin()` function (existing pattern). SELECT on `local_list_items` is unconditional public read (`USING (true)`) — items are only meaningful in context of active lists, and the RPCs filter by `is_active`.

### Indexes

- `local_lists(user_id)` — profile page lookup
- `local_lists(is_active)` — homepage RPC filter
- `local_list_items(list_id, position)` — ordered item retrieval

### New RPC: `get_local_lists_for_homepage`

Returns active lists with curator profile info and dish previews (first 4 dish names for the teaser). Randomized order, limited to 4 per call for homepage rotation.

```sql
CREATE OR REPLACE FUNCTION get_local_lists_for_homepage()
RETURNS TABLE (
  list_id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  display_name TEXT,
  item_count INT,
  preview_dishes TEXT[]
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    ll.id AS list_id,
    ll.user_id,
    ll.title,
    ll.description,
    p.display_name,
    (SELECT COUNT(*)::INT FROM local_list_items WHERE list_id = ll.id) AS item_count,
    (SELECT ARRAY_AGG(d.name ORDER BY li.position)
     FROM local_list_items li
     JOIN dishes d ON d.id = li.dish_id
     WHERE li.list_id = ll.id AND li.position <= 4) AS preview_dishes
  FROM local_lists ll
  JOIN profiles p ON p.id = ll.user_id
  WHERE ll.is_active = true
  ORDER BY RANDOM()
  LIMIT 4;
$$;
```

### New RPC: `get_local_list_by_user(target_user_id UUID)`

Returns the full list with all dishes for display on the profile page. Takes `user_id` (not `list_id`) because the profile page navigates by user and each user has at most one list (UNIQUE constraint).

```sql
CREATE OR REPLACE FUNCTION get_local_list_by_user(target_user_id UUID)
RETURNS TABLE (
  list_id UUID,
  title TEXT,
  description TEXT,
  user_id UUID,
  display_name TEXT,
  position INT,
  dish_id UUID,
  dish_name TEXT,
  restaurant_name TEXT,
  restaurant_id UUID,
  avg_rating NUMERIC,
  total_votes INT,
  category TEXT,
  note TEXT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    ll.id AS list_id,
    ll.title,
    ll.description,
    ll.user_id,
    p.display_name,
    li.position,
    d.id AS dish_id,
    d.name AS dish_name,
    r.name AS restaurant_name,
    r.id AS restaurant_id,
    d.avg_rating,
    d.total_votes,
    d.category,
    li.note
  FROM local_lists ll
  JOIN profiles p ON p.id = ll.user_id
  JOIN local_list_items li ON li.list_id = ll.id
  JOIN dishes d ON d.id = li.dish_id
  JOIN restaurants r ON r.id = d.restaurant_id
  WHERE ll.user_id = target_user_id
    AND ll.is_active = true
  ORDER BY li.position;
$$;
```

## Homepage Changes

### Tiered Top 10 Layout

The existing `DishListItem` component stays as-is. The layout changes happen in `Map.jsx` (the homepage):

- **#1:** Rendered inside a hero wrapper — white card, gold left border, larger font sizes, full rating + vote count display
- **#2-3:** Rendered in a 2-column flex row — white cards, medal-colored left border, stacked layout (name, restaurant, rating)
- **#4-10:** Rendered in a grouped white card container — compact rows with dividers, same as current but tighter

This is purely a layout change in the homepage. `DishListItem` already supports the `isPodium` distinction — we just need to wrap the different tiers in different containers.

### Local Lists Section

Below the Top 10, after a subtle divider:

- **Section header:** "Local Lists" with subtitle "What islanders want you to try"
- **Stacked cards:** Each card shows avatar initial (colored), list title, comma-separated dish preview (first 4 names truncated), pick count
- **Tap behavior:** Navigate to `/user/:userId` where the full list is displayed
- **Rotation:** RPC returns random 4 of 6 active lists per page load

### Profile Page Addition

On `UserProfile.jsx`, if the user has a local list:

- New section above or below their vote history
- Shows list title, description, and all 10 dishes in order
- Each dish is a tappable `DishListItem` (compact variant)
- Curator's note shown below each dish if present

## New Files

| File | Purpose |
|---|---|
| `src/api/localListsApi.js` | API layer for list RPCs |
| `src/hooks/useLocalLists.js` | React Query hook for homepage lists |
| `src/hooks/useLocalListDetail.js` | React Query hook for full list detail |
| `src/components/home/LocalListsSection.jsx` | Homepage section with stacked list cards |
| `src/components/profile/LocalListCard.jsx` | Full list display for profile pages |

## Modified Files

| File | Change |
|---|---|
| `src/pages/Map.jsx` | Tiered layout for Top 10, add LocalListsSection below |
| `src/pages/UserProfile.jsx` | Show LocalListCard if user has a list |
| `src/api/index.js` | Export localListsApi |
| `src/lib/storage.js` | No changes needed |
| `supabase/schema.sql` | Add tables, RLS, RPCs |

## What's NOT in Scope

- No user-facing list creation UI (admin/manual only for launch)
- No list editing in the app
- No list sharing/social features
- No "like" or "save" on lists
- No list comments
- No homepage rhythm changes beyond the tiered Top 10 layout described above
- No changes to DishListItem component itself

## Seeding Plan

Dan and Denis identify 6 MV locals. For each:

1. Create a Supabase auth account (or use existing if they're already a user)
2. INSERT into `local_lists` with their title and description
3. INSERT 10 rows into `local_list_items` with dish_id + position
4. Set `is_active = true`

SQL seed script at `supabase/seed/local-lists.sql`.

## Launch Target

Ship before Memorial Day (May 25, 2026). This is a ~1-2 day build once the schema is deployed.
