# Local Lists + Homepage Rhythm Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add curated Local Lists and tiered visual hierarchy to the homepage, transforming it from a flat spreadsheet into a food discovery experience with personality.

**Architecture:** Two new Supabase tables (`local_lists`, `local_list_items`) with public-read/admin-write RLS, two RPCs for homepage preview and profile detail. Homepage layout wraps existing `DishListItem` in tiered containers (hero #1, podium #2-3, compact #4-10) and adds a `LocalListsSection` below. Profile pages show full list via `LocalListCard`.

**Tech Stack:** Supabase (PostgreSQL, RLS, RPCs), React Query, React components with Tailwind layout + CSS variable styling.

**Spec:** `docs/superpowers/specs/2026-03-10-locals-lists-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `src/api/localListsApi.js` | API layer — wraps two RPCs (`get_local_lists_for_homepage`, `get_local_list_by_user`) |
| `src/hooks/useLocalLists.js` | React Query hook for homepage lists (random 4, 5min stale) |
| `src/hooks/useLocalListDetail.js` | React Query hook for full list detail by user ID |
| `src/components/home/LocalListsSection.jsx` | Homepage section — header + stacked list cards |
| `src/components/profile/LocalListCard.jsx` | Full list display for profile pages |
| `supabase/seed/local-lists.sql` | Seed script placeholder (populated when locals are chosen) |

### Modified Files

| File | Change |
|---|---|
| `supabase/schema.sql` | Add `local_lists` + `local_list_items` tables, RLS, indexes, 2 RPCs |
| `src/api/index.js` | Add `localListsApi` export |
| `src/pages/Map.jsx` | Tiered layout for Top 10 (hero/podium/compact wrappers), add `LocalListsSection` below |
| `src/pages/UserProfile.jsx` | Import `useLocalListDetail` + `LocalListCard`, show above journal feed |
| `SPEC.md` | Document new tables, RPCs, components |
| `TASKS.md` | Mark task done |

---

## Chunk 1: Database Schema + RPCs

### Task 1: Add tables to schema.sql

**Files:**
- Modify: `supabase/schema.sql` (append after last table)

- [ ] **Step 1: Add `local_lists` table to schema.sql**

After the last table definition, add:

```sql
-- 1u. local_lists
CREATE TABLE IF NOT EXISTS local_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT local_lists_one_per_user UNIQUE (user_id)
);

-- 1v. local_list_items
CREATE TABLE IF NOT EXISTS local_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES local_lists(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  position INT NOT NULL,
  note TEXT,
  CONSTRAINT local_list_items_unique_dish UNIQUE (list_id, dish_id),
  CONSTRAINT local_list_items_unique_position UNIQUE (list_id, position),
  CONSTRAINT local_list_items_position_range CHECK (position >= 1 AND position <= 10)
);
```

- [ ] **Step 2: Add indexes to schema.sql**

```sql
-- Indexes for local lists
CREATE INDEX IF NOT EXISTS idx_local_lists_user_id ON local_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_local_lists_is_active ON local_lists(is_active);
CREATE INDEX IF NOT EXISTS idx_local_list_items_list_position ON local_list_items(list_id, position);
```

- [ ] **Step 3: Add RLS policies to schema.sql**

```sql
-- RLS for local_lists
ALTER TABLE local_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "local_lists_public_read"
  ON local_lists FOR SELECT
  USING (is_active = true);

CREATE POLICY "local_lists_admin_insert"
  ON local_lists FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "local_lists_admin_update"
  ON local_lists FOR UPDATE
  USING (is_admin());

CREATE POLICY "local_lists_admin_delete"
  ON local_lists FOR DELETE
  USING (is_admin());

-- RLS for local_list_items
ALTER TABLE local_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "local_list_items_public_read"
  ON local_list_items FOR SELECT
  USING (true);

CREATE POLICY "local_list_items_admin_insert"
  ON local_list_items FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "local_list_items_admin_update"
  ON local_list_items FOR UPDATE
  USING (is_admin());

CREATE POLICY "local_list_items_admin_delete"
  ON local_list_items FOR DELETE
  USING (is_admin());
```

- [ ] **Step 4: Add RPCs to schema.sql**

```sql
-- RPC: Homepage preview (random 4 active lists with dish previews)
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

-- RPC: Full list detail by user ID (for profile pages)
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

- [ ] **Step 5: Commit schema changes**

```bash
git add supabase/schema.sql
git commit -m "feat: add local_lists schema, RLS, RPCs to schema.sql"
```

### Task 2: Deploy schema to Supabase

**Files:**
- None (SQL Editor operations)

- [ ] **Step 1: Run CREATE TABLE statements in SQL Editor**

Run the two CREATE TABLE statements from Task 1 Step 1 in the Supabase SQL Editor. Verify with:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'local%';
```

Expected: `local_lists`, `local_list_items`

- [ ] **Step 2: Run indexes in SQL Editor**

Run the 3 CREATE INDEX statements from Task 1 Step 2.

- [ ] **Step 3: Run RLS policies in SQL Editor**

Run all RLS statements from Task 1 Step 3.

- [ ] **Step 4: Run RPCs in SQL Editor**

Run both CREATE FUNCTION statements from Task 1 Step 4. Verify with:

```sql
SELECT get_local_lists_for_homepage();
```

Expected: Empty result set (no lists yet), no errors.

```sql
SELECT get_local_list_by_user('00000000-0000-0000-0000-000000000000');
```

Expected: Empty result set, no errors.

---

## Chunk 2: API Layer + Hooks

### Task 3: Create localListsApi

**Files:**
- Create: `src/api/localListsApi.js`

- [ ] **Step 1: Write the API module**

```js
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'
import { createClassifiedError } from '../utils/errorHandler'

export const localListsApi = {
  async getForHomepage() {
    try {
      const { data, error } = await supabase.rpc('get_local_lists_for_homepage')
      if (error) throw createClassifiedError(error)
      return data || []
    } catch (error) {
      logger.error('Failed to fetch local lists for homepage:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  async getByUser(userId) {
    try {
      const { data, error } = await supabase.rpc('get_local_list_by_user', { target_user_id: userId })
      if (error) throw createClassifiedError(error)
      return data || []
    } catch (error) {
      logger.error('Failed to fetch local list for user:', error)
      throw error.type ? error : createClassifiedError(error)
    }
  },
}
```

- [ ] **Step 2: Export from barrel**

In `src/api/index.js`, add after the last export:

```js
export { localListsApi } from './localListsApi'
```

- [ ] **Step 3: Commit**

```bash
git add src/api/localListsApi.js src/api/index.js
git commit -m "feat: add localListsApi with homepage + user detail RPCs"
```

### Task 4: Create React Query hooks

**Files:**
- Create: `src/hooks/useLocalLists.js`
- Create: `src/hooks/useLocalListDetail.js`

- [ ] **Step 1: Write useLocalLists hook**

```js
import { useQuery } from '@tanstack/react-query'
import { localListsApi } from '../api/localListsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useLocalLists() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['localLists', 'homepage'],
    queryFn: () => localListsApi.getForHomepage(),
    staleTime: 1000 * 60 * 5,
  })

  return {
    lists: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading local lists') } : null,
  }
}
```

- [ ] **Step 2: Write useLocalListDetail hook**

```js
import { useQuery } from '@tanstack/react-query'
import { localListsApi } from '../api/localListsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useLocalListDetail(userId) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['localList', 'user', userId],
    queryFn: () => localListsApi.getByUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    items: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading local list') } : null,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLocalLists.js src/hooks/useLocalListDetail.js
git commit -m "feat: add useLocalLists + useLocalListDetail hooks"
```

---

## Chunk 3: Homepage Tiered Layout

### Task 5: Refactor Map.jsx dish list into tiered layout

**Files:**
- Modify: `src/pages/Map.jsx` (lines 252-303, the dish list section)

The current code renders all dishes uniformly in a flat `flex-col` with `gap: 2px`. Replace that section with tiered wrappers. `DishListItem` already handles `isPodium` styling (rank <= 3 gets larger padding, tinted background, rounded corners).

- [ ] **Step 1: Replace the flat dish list with tiered layout**

In `Map.jsx`, find the dish list rendering block (inside the `activeDishes.map` section, lines ~257-270). Replace:

```jsx
<div className="flex flex-col" style={{ gap: '2px' }}>
  {activeDishes.map(function (dish, i) {
    return (
      <DishListItem
        key={dish.dish_id}
        dish={dish}
        rank={i + 1}
        showDistance
        onClick={function () { navigate('/dish/' + dish.dish_id) }}
      />
    )
  })}
</div>
```

With this tiered layout (only when NOT searching and no category selected — the default homepage view):

```jsx
{(!searchQuery && !selectedCategory) ? (
  <div>
    {/* Hero #1 */}
    {activeDishes.length > 0 && (
      <div
        className="rounded-2xl mb-3"
        style={{
          background: 'var(--color-surface-elevated)',
          borderLeft: '4px solid var(--color-medal-gold)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <DishListItem
          key={activeDishes[0].dish_id}
          dish={activeDishes[0]}
          rank={1}
          showDistance
          onClick={function () { navigate('/dish/' + activeDishes[0].dish_id) }}
        />
      </div>
    )}

    {/* Podium #2-3 */}
    {activeDishes.length > 1 && (
      <div className="flex gap-2 mb-3">
        {activeDishes.slice(1, 3).map(function (dish, i) {
          var medalColor = i === 0 ? 'var(--color-medal-silver)' : 'var(--color-medal-bronze)'
          return (
            <div
              key={dish.dish_id}
              className="flex-1 rounded-xl"
              style={{
                background: 'var(--color-surface-elevated)',
                borderLeft: '3px solid ' + medalColor,
              }}
            >
              <DishListItem
                dish={dish}
                rank={i + 2}
                showDistance
                onClick={function () { navigate('/dish/' + dish.dish_id) }}
              />
            </div>
          )
        })}
      </div>
    )}

    {/* Compact #4-10 */}
    {activeDishes.length > 3 && (function () {
      var compactDishes = activeDishes.slice(3, 10)
      return (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--color-surface-elevated)',
          }}
        >
          {compactDishes.map(function (dish, i) {
            return (
              <DishListItem
                key={dish.dish_id}
                dish={dish}
                rank={i + 4}
                showDistance
                onClick={function () { navigate('/dish/' + dish.dish_id) }}
                isLast={i === compactDishes.length - 1}
              />
            )
          })}
        </div>
      )
    })()}
  </div>
) : (
  <>
    <div className="flex flex-col" style={{ gap: '2px' }}>
      {activeDishes.map(function (dish, i) {
        return (
          <DishListItem
            key={dish.dish_id}
            dish={dish}
            rank={i + 1}
            showDistance
            onClick={function () { navigate('/dish/' + dish.dish_id) }}
          />
        )
      })}
    </div>
    {hasMoreDishes && !searchQuery && (
      <button
        onClick={function () { setListLimit(function (prev) { return prev + 5 }) }}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          marginTop: '8px',
          background: 'none',
          border: '1.5px solid var(--color-divider)',
          borderRadius: '10px',
          color: 'var(--color-accent-gold)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Show more
      </button>
    )}
  </>
)}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Manual test in browser**

Run `npm run dev`, open homepage. Verify:
- #1 has white card with gold left border and shadow
- #2-3 are side-by-side with silver/bronze left borders
- #4-10 are compact rows in a single white card
- Selecting a category reverts to flat list
- Search results are flat list

- [ ] **Step 4: Commit**

```bash
git add src/pages/Map.jsx
git commit -m "feat: tiered visual hierarchy for Top 10 homepage layout"
```

---

## Chunk 4: Local Lists Components

### Task 6: Create LocalListsSection for homepage

**Files:**
- Create: `src/components/home/LocalListsSection.jsx`

- [ ] **Step 1: Write the component**

```jsx
import { useNavigate } from 'react-router-dom'
import { useLocalLists } from '../../hooks/useLocalLists'

export function LocalListsSection() {
  const navigate = useNavigate()
  const { lists, loading } = useLocalLists()

  if (loading || lists.length === 0) return null

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="px-4 mb-3">
        <h2 style={{
          fontSize: '17px',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Local Lists
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          marginTop: '2px',
        }}>
          What islanders want you to try
        </p>
      </div>

      {/* Stacked cards */}
      <div className="px-4 flex flex-col" style={{ gap: '10px' }}>
        {lists.map(function (list) {
          const initial = (list.display_name || '?').charAt(0).toUpperCase()
          const previewText = list.preview_dishes
            ? list.preview_dishes.join(', ')
            : ''

          return (
            <button
              key={list.list_id}
              onClick={function () { navigate('/user/' + list.user_id) }}
              className="w-full text-left rounded-xl active:scale-[0.98]"
              style={{
                background: 'var(--color-surface-elevated)',
                padding: '14px 16px',
                border: '1px solid var(--color-divider)',
                cursor: 'pointer',
                transition: 'transform 100ms ease',
              }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar initial */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--color-primary)',
                    color: 'var(--color-text-on-primary)',
                    fontSize: '16px',
                  }}
                >
                  {initial}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.01em',
                  }}>
                    {list.title}
                  </p>
                  <p
                    className="truncate"
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-text-tertiary)',
                      marginTop: '2px',
                    }}
                  >
                    {previewText}
                  </p>
                </div>

                {/* Pick count */}
                <div className="flex-shrink-0 text-right">
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                  }}>
                    {list.item_count} picks
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add to barrel export**

In `src/components/home/index.js`, add:

```js
export { LocalListsSection } from './LocalListsSection'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/LocalListsSection.jsx src/components/home/index.js
git commit -m "feat: add LocalListsSection component for homepage"
```

### Task 7: Create LocalListCard for profile pages

**Files:**
- Create: `src/components/profile/LocalListCard.jsx`

- [ ] **Step 1: Write the component**

```jsx
import { useNavigate } from 'react-router-dom'
import { DishListItem } from '../DishListItem'

export function LocalListCard({ items }) {
  const navigate = useNavigate()

  if (!items || items.length === 0) return null

  const listTitle = items[0].title
  const listDescription = items[0].description

  return (
    <div className="px-4 pt-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-divider)',
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <h3 style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {listTitle}
          </h3>
          {listDescription && (
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
              marginTop: '4px',
            }}>
              {listDescription}
            </p>
          )}
        </div>

        {/* Dish list */}
        {items.map(function (item, i) {
          const dish = {
            dish_id: item.dish_id,
            id: item.dish_id,
            dish_name: item.dish_name,
            restaurant_name: item.restaurant_name,
            restaurant_id: item.restaurant_id,
            avg_rating: item.avg_rating,
            total_votes: item.total_votes,
            category: item.category,
          }

          return (
            <div key={item.dish_id}>
              <DishListItem
                dish={dish}
                rank={item.position}
                onClick={function () { navigate('/dish/' + item.dish_id) }}
                isLast={i === items.length - 1}
              />
              {item.note && (
                <div
                  className="px-4 pb-2"
                  style={{
                    marginTop: '-4px',
                    paddingLeft: '56px',
                  }}
                >
                  <p style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: 'var(--color-text-secondary)',
                    lineHeight: '1.4',
                  }}>
                    "{item.note}"
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add to barrel export**

In `src/components/profile/index.js`, add:

```js
export { LocalListCard } from './LocalListCard'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/LocalListCard.jsx src/components/profile/index.js
git commit -m "feat: add LocalListCard component for profile pages"
```

---

## Chunk 5: Integration + Docs

### Task 8: Wire components into pages

**Files:**
- Modify: `src/pages/Map.jsx`
- Modify: `src/pages/UserProfile.jsx`

- [ ] **Step 1: Add LocalListsSection to Map.jsx**

At top of `Map.jsx`, add import:

```js
import { LocalListsSection } from '../components/home'
```

Inside the scrollable content area, after the dish list `</div>` (the `px-4 pb-4` div, around line 303), add:

```jsx
{/* Local Lists — only on default homepage view */}
{!searchQuery && !selectedCategory && <LocalListsSection />}
```

- [ ] **Step 2: Add LocalListCard to UserProfile.jsx**

At top of `UserProfile.jsx`, add imports:

```js
import { useLocalListDetail } from '../hooks/useLocalListDetail'
import { LocalListCard } from '../components/profile'
```

Note: `LocalListCard` is imported via the `src/components/profile/index.js` barrel, consistent with existing imports like `{ FoodMap, ShelfFilter, JournalFeed }` on line 13.

Inside the `UserProfile` function, after the existing hooks (around line 87), add:

```js
var localList = useLocalListDetail(userId)
```

In the JSX, after the `{/* Food Map */}` section (after line 650), add:

```jsx
{/* Local List */}
{localList.items.length > 0 && (
  <LocalListCard items={localList.items} />
)}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Manual test**

1. Homepage: verify tiered layout renders, Local Lists section appears below (will be empty until seed data exists)
2. Profile page: verify no errors when user has no list

- [ ] **Step 5: Commit**

```bash
git add src/pages/Map.jsx src/pages/UserProfile.jsx
git commit -m "feat: integrate LocalListsSection + LocalListCard into pages"
```

### Task 9: Create seed script placeholder

**Files:**
- Create: `supabase/seed/local-lists.sql`

- [ ] **Step 1: Write seed script template**

```sql
-- Local Lists Seed Data
-- Run in Supabase SQL Editor after identifying 6 MV locals
--
-- For each local:
-- 1. Get or create their auth.users UUID
-- 2. INSERT into local_lists
-- 3. INSERT 10 rows into local_list_items
--
-- Example:
--
-- INSERT INTO local_lists (user_id, title, description)
-- VALUES (
--   'USER_UUID_HERE',
--   'Sarah''s MV Essentials',
--   'What I send every friend to try'
-- );
--
-- INSERT INTO local_list_items (list_id, dish_id, position, note)
-- VALUES
--   ((SELECT id FROM local_lists WHERE user_id = 'USER_UUID_HERE'), 'DISH_UUID', 1, 'The best on the island'),
--   ((SELECT id FROM local_lists WHERE user_id = 'USER_UUID_HERE'), 'DISH_UUID', 2, NULL),
--   ...
```

- [ ] **Step 2: Commit**

```bash
git add supabase/seed/local-lists.sql
git commit -m "chore: add local lists seed script template"
```

### Task 10: Update docs

**Files:**
- Modify: `SPEC.md`
- Modify: `TASKS.md`

- [ ] **Step 1: Update SPEC.md**

Add to the Tables section:
- `local_lists` — Curated local lists (6 at launch). Columns: id, user_id, title, description, is_active, created_at
- `local_list_items` — Items in local lists (up to 10 per list). Columns: id, list_id, dish_id, position, note

Add to the RPCs section:
- `get_local_lists_for_homepage()` — Returns random 4 active lists with preview dishes
- `get_local_list_by_user(target_user_id)` — Returns full list detail for profile page

- [ ] **Step 2: Update TASKS.md**

Mark T26 (homepage polish) as done or add a new completed task for Local Lists + Homepage Rhythm.

- [ ] **Step 3: Commit**

```bash
git add SPEC.md TASKS.md
git commit -m "docs: add local lists tables and RPCs to SPEC, update TASKS"
```

- [ ] **Step 4: Run final build verification**

```bash
npm run build && npm run test
```

Expected: Both pass.
