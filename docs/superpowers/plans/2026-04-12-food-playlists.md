# Food Playlists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Spotify-style user-generated food playlists: create / share / follow, per spec `2026-04-12-food-playlists-design.md`.

**Architecture:** Three new tables (`user_playlists`, `user_playlist_items`, `user_playlist_follows`) are client-read-only. All mutations flow through `SECURITY DEFINER` RPCs. Read RPCs are `SECURITY INVOKER` so RLS filters naturally. Profile gets a horizontal playlist strip + Playlists/Saved tabs. Dish detail gets a "+ playlist" sheet next to the heart. `/playlist/:id` is a public route with a generated OG image.

**Tech Stack:** Supabase Postgres (pg_cron, RLS, SECURITY DEFINER, deferred unique indexes), React 19 + Vite 7, React Query, Tailwind (layout only — brand via `var(--color-*)`), Playwright, Vitest, Vercel serverless + @vercel/og.

**Prerequisite before starting:** Read `docs/superpowers/specs/2026-04-12-food-playlists-design.md`. Every decision is justified there.

---

## File Structure

### New files (create)

| Path | Responsibility |
|---|---|
| `supabase/migrations/2026-04-12-user-playlists.sql` | One-shot migration — tables, indexes, triggers, RLS, RPCs, grants |
| `src/api/userPlaylistsApi.js` | Wraps all playlist RPCs per the API layer pattern in §4.3 of CLAUDE.md |
| `src/api/userPlaylistsApi.test.js` | Vitest mock tests for the API wrappers |
| `src/hooks/useUserPlaylists.js` | `useQuery` for caller's own playlists |
| `src/hooks/useFollowedPlaylists.js` | `useQuery` for saved playlists |
| `src/hooks/usePlaylistDetail.js` | `useQuery` + invalidations for one playlist |
| `src/hooks/useDishPlaylistMembership.js` | `useQuery` for the add-to-playlist sheet checkmarks |
| `src/hooks/usePlaylistMutations.js` | `useMutation`s: create, update, delete, add-dish, remove-dish, reorder, update-note, follow, unfollow |
| `src/constants/playlists.js` | `MAX_PLAYLISTS_PER_USER = 50`, `MAX_ITEMS_PER_PLAYLIST = 100`, `MAX_TITLE_LEN = 60`, `MAX_DESC_LEN = 200`, `MAX_NOTE_LEN = 140` |
| `src/components/playlists/PlaylistStripCard.jsx` | The horizontal-strip card on the Journal tab |
| `src/components/playlists/PlaylistGridCard.jsx` | The 2-col grid card on Playlists/Saved tabs |
| `src/components/playlists/PlaylistCover.jsx` | The 4-emoji cover grid (pure, reusable) |
| `src/components/playlists/CreatePlaylistModal.jsx` | Title-only quick-create form (optionally seeds first dish) |
| `src/components/playlists/AddToPlaylistSheet.jsx` | Bottom sheet on dish detail page |
| `src/components/playlists/PlaylistDetailHeader.jsx` | Cover + title + byline + follow/edit button |
| `src/components/playlists/PlaylistItemRow.jsx` | One dish row on the detail page |
| `src/pages/Playlist.jsx` | `/playlist/:id` public route |
| `api/playlist-og.ts` | Vercel serverless OG image endpoint |
| `e2e/pioneer/playlists.spec.js` | Playwright end-to-end tests |

### Existing files (modify)

| Path | Change |
|---|---|
| `src/lib/rateLimiter.js` | Add `checkPlaylistCreateRateLimit`, `checkPlaylistItemAddRateLimit`, `checkPlaylistFollowRateLimit` |
| `src/api/index.js` | Add `userPlaylistsApi` to the barrel export |
| `src/pages/Profile.jsx` | Add tabs (Journal / Playlists / Saved), add horizontal playlist strip to Journal tab |
| `src/pages/UserProfile.jsx` | Mirror the tab structure for public profiles (no Saved tab) |
| `src/pages/Dish.jsx` | Add "+" button next to heart, wire to AddToPlaylistSheet |
| `src/App.jsx` (or the router file) | Add `/playlist/:id` route, lazy-load Playlist.jsx with `lazyWithRetry()` |
| `supabase/schema.sql` | Apply the full migration inline so schema stays authoritative |
| `vercel.json` | Add `/api/playlist-og` to existing function config |
| `src/lib/analytics.js` (if new events need named constants) | Add the 6 PostHog events from the spec |

---

## Phase 1 — Schema migration

### Task 1: Create migration file skeleton

**Files:**
- Create: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Create file with header comment and idempotency wrapper**

```sql
-- Migration: User playlists (Spotify-style user-generated food playlists)
-- Date: 2026-04-12
-- Spec: docs/superpowers/specs/2026-04-12-food-playlists-design.md
--
-- Tables are client-read-only. All writes through SECURITY DEFINER RPCs.
-- Read RPCs are SECURITY INVOKER so RLS applies naturally.

-- Safety: allow re-running by dropping existing objects in dev. For prod,
-- remove the DROP block before applying.

BEGIN;
```

- [ ] **Step 2: Commit the skeleton**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): migration skeleton"
```

### Task 2: Tables + constraints

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append table DDL**

Append:

```sql
CREATE TABLE user_playlists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 60),
  description     TEXT CHECK (description IS NULL OR char_length(description) <= 200),
  is_public       BOOLEAN NOT NULL DEFAULT true,
  slug            TEXT NOT NULL CHECK (char_length(slug) BETWEEN 1 AND 80),
  cover_mode      TEXT NOT NULL DEFAULT 'auto' CHECK (cover_mode IN ('auto')),
  follower_count  INT NOT NULL DEFAULT 0 CHECK (follower_count >= 0),
  item_count      INT NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE TABLE user_playlist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id  UUID NOT NULL REFERENCES user_playlists(id) ON DELETE CASCADE,
  dish_id      UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  position     INT NOT NULL CHECK (position BETWEEN 1 AND 100),
  note         TEXT CHECK (note IS NULL OR char_length(note) <= 140),
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (playlist_id, dish_id),
  CONSTRAINT user_playlist_items_unique_position UNIQUE (playlist_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE user_playlist_follows (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id  UUID NOT NULL REFERENCES user_playlists(id) ON DELETE CASCADE,
  followed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, playlist_id)
);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): tables + constraints"
```

### Task 3: Indexes

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append indexes**

```sql
CREATE INDEX idx_user_playlists_user_id ON user_playlists (user_id, created_at DESC);
CREATE INDEX idx_user_playlists_user_public ON user_playlists (user_id, created_at DESC) WHERE is_public;
CREATE INDEX idx_user_playlist_items_playlist_position ON user_playlist_items (playlist_id, position);
CREATE INDEX idx_user_playlist_items_dish_id ON user_playlist_items (dish_id);
CREATE INDEX idx_user_playlist_follows_user_id ON user_playlist_follows (user_id, followed_at DESC);
CREATE INDEX idx_user_playlist_follows_playlist_id ON user_playlist_follows (playlist_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): indexes"
```

### Task 4: Triggers (counters, updated_at, position compaction)

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append trigger functions**

```sql
CREATE OR REPLACE FUNCTION fn_user_playlist_items_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_playlists SET item_count = item_count + 1, updated_at = NOW() WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_playlists SET item_count = GREATEST(item_count - 1, 0), updated_at = NOW() WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_user_playlist_follows_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_playlists SET follower_count = follower_count + 1 WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_playlists SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_user_playlists_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_user_playlist_items_compact_positions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- FOR EACH ROW so we can access OLD. Constraint is DEFERRABLE INITIALLY
  -- DEFERRED, so temporary duplicate positions during the rewrite are OK.
  -- Cascade deletes fire this once per row — acceptable since n <= 100.
  UPDATE user_playlist_items x SET position = r.new_pos
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS new_pos
    FROM user_playlist_items
    WHERE playlist_id = OLD.playlist_id
  ) r
  WHERE x.id = r.id AND x.position IS DISTINCT FROM r.new_pos;
  RETURN NULL;
END;
$$;
```

- [ ] **Step 2: Append trigger registrations**

```sql
CREATE TRIGGER tr_user_playlist_items_count
  AFTER INSERT OR DELETE ON user_playlist_items
  FOR EACH ROW EXECUTE FUNCTION fn_user_playlist_items_count();

CREATE TRIGGER tr_user_playlist_follows_count
  AFTER INSERT OR DELETE ON user_playlist_follows
  FOR EACH ROW EXECUTE FUNCTION fn_user_playlist_follows_count();

CREATE TRIGGER tr_user_playlists_updated_at
  BEFORE UPDATE ON user_playlists
  FOR EACH ROW EXECUTE FUNCTION fn_user_playlists_touch_updated_at();

CREATE TRIGGER tr_user_playlist_items_compact_positions
  AFTER DELETE ON user_playlist_items
  FOR EACH ROW EXECUTE FUNCTION fn_user_playlist_items_compact_positions();
```

Note: `FOR EACH ROW` fires per deletion. Under cascade deletes the trigger runs up to 100 times; each run is a small sorted UPDATE so total cost is O(n²) on n ≤ 100 — fine for non-hot-path cascades.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): triggers (counters + compaction)"
```

### Task 5: RLS + direct-write revocations

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append RLS**

```sql
ALTER TABLE user_playlists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_follows ENABLE ROW LEVEL SECURITY;

-- Lock down direct writes; all mutations go through SECURITY DEFINER RPCs.
REVOKE INSERT, UPDATE, DELETE ON user_playlists       FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON user_playlist_items  FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON user_playlist_follows FROM PUBLIC, anon, authenticated;

-- SELECT policies
CREATE POLICY user_playlists_select ON user_playlists FOR SELECT
  USING (is_public OR user_id = auth.uid());

CREATE POLICY user_playlist_items_select ON user_playlist_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_playlists p
    WHERE p.id = user_playlist_items.playlist_id
      AND (p.is_public OR p.user_id = auth.uid())
  ));

CREATE POLICY user_playlist_follows_select ON user_playlist_follows FOR SELECT
  USING (user_id = auth.uid());
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): RLS + direct-write revocations"
```

---

## Phase 2 — Write RPCs

### Task 6: Hard-cap triggers (50 playlists, 100 items)

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append cap triggers**

```sql
CREATE OR REPLACE FUNCTION fn_enforce_playlist_cap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cnt INT;
BEGIN
  -- Lock the owner's profile row to serialize concurrent creates.
  -- `profiles.id` is the auth.users id (see schema.sql:103).
  PERFORM 1 FROM profiles WHERE id = NEW.user_id FOR UPDATE;
  SELECT COUNT(*) INTO cnt FROM user_playlists WHERE user_id = NEW.user_id;
  IF cnt >= 50 THEN
    RAISE EXCEPTION 'You can have up to 50 playlists' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_enforce_item_cap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cnt INT;
BEGIN
  PERFORM 1 FROM user_playlists WHERE id = NEW.playlist_id FOR UPDATE;
  SELECT COUNT(*) INTO cnt FROM user_playlist_items WHERE playlist_id = NEW.playlist_id;
  IF cnt >= 100 THEN
    RAISE EXCEPTION 'A playlist can hold up to 100 dishes' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_enforce_playlist_cap
  BEFORE INSERT ON user_playlists
  FOR EACH ROW EXECUTE FUNCTION fn_enforce_playlist_cap();

CREATE TRIGGER tr_enforce_item_cap
  BEFORE INSERT ON user_playlist_items
  FOR EACH ROW EXECUTE FUNCTION fn_enforce_item_cap();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): hard-cap triggers"
```

### Task 6b: DB-side content blocklist function

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

Closes the "bypass client validation" vector for UGC. Mirrors the most egregious categories from `src/lib/reviewBlocklist.js` (slurs + hate speech) — a full content moderation port would duplicate too much; this catches drive-by abuse. Full richer moderation stays client-side, backed by this floor.

- [ ] **Step 1: Append the function**

```sql
CREATE OR REPLACE FUNCTION fn_check_content_blocklist(p_text TEXT, p_field TEXT)
RETURNS VOID
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  IF p_text IS NULL OR p_text = '' THEN RETURN; END IF;
  v_normalized := lower(regexp_replace(p_text, '\s+', ' ', 'g'));
  IF v_normalized ~ '\y(nigger|nigga|n\*gger|faggot|f\*ggot|retard(ed)?|spic|chink|kike|wetback|beaner|dyke|tranny|nazi|hitler|kkk)\y' THEN
    RAISE EXCEPTION '% contains blocked content', p_field USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION fn_check_content_blocklist(TEXT, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION fn_check_content_blocklist(TEXT, TEXT) TO authenticated, service_role;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): DB-side content blocklist function"
```

### Task 7: Slug helper + `create_user_playlist` RPC

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append slug helper and create RPC**

```sql
CREATE OR REPLACE FUNCTION fn_playlist_slug_from_title(p_title TEXT, p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  suffix INT := 2;
BEGIN
  base_slug := regexp_replace(lower(trim(p_title)), '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  IF base_slug = '' THEN base_slug := 'playlist'; END IF;
  base_slug := LEFT(base_slug, 70);
  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM user_playlists WHERE user_id = p_user_id AND slug = candidate) LOOP
    candidate := base_slug || '-' || suffix;
    suffix := suffix + 1;
    IF suffix > 999 THEN EXIT; END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION create_user_playlist(
  p_title TEXT, p_description TEXT, p_is_public BOOLEAN
) RETURNS user_playlists
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row user_playlists;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  PERFORM fn_check_content_blocklist(p_title, 'Playlist title');
  PERFORM fn_check_content_blocklist(p_description, 'Description');
  INSERT INTO user_playlists (user_id, title, description, is_public, slug)
  VALUES (v_user, p_title, NULLIF(p_description, ''), p_is_public,
          fn_playlist_slug_from_title(p_title, v_user))
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): create_user_playlist RPC"
```

### Task 8: Update / delete RPCs

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append update and delete RPCs**

```sql
CREATE OR REPLACE FUNCTION update_user_playlist(
  p_id UUID, p_title TEXT, p_description TEXT, p_is_public BOOLEAN
) RETURNS user_playlists
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row user_playlists;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  IF p_title IS NOT NULL THEN PERFORM fn_check_content_blocklist(p_title, 'Playlist title'); END IF;
  IF p_description IS NOT NULL THEN PERFORM fn_check_content_blocklist(p_description, 'Description'); END IF;
  UPDATE user_playlists
     SET title = COALESCE(p_title, title),
         description = NULLIF(p_description, ''),
         is_public = COALESCE(p_is_public, is_public),
         slug = CASE WHEN p_title IS NOT NULL AND p_title <> title
                     THEN fn_playlist_slug_from_title(p_title, user_id)
                     ELSE slug END
   WHERE id = p_id AND user_id = v_user
   RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION delete_user_playlist(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_deleted INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  DELETE FROM user_playlists WHERE id = p_id AND user_id = v_user;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): update + delete RPCs"
```

### Task 9: Add / remove / reorder / note RPCs

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append item-mutation RPCs**

```sql
CREATE OR REPLACE FUNCTION add_dish_to_playlist(
  p_playlist_id UUID, p_dish_id UUID, p_note TEXT
) RETURNS user_playlist_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_owner UUID;
  v_next_pos INT;
  v_row user_playlist_items;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  SELECT user_id INTO v_owner FROM user_playlists WHERE id = p_playlist_id FOR UPDATE;
  IF v_owner IS NULL OR v_owner <> v_user THEN
    RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002';
  END IF;
  IF p_note IS NOT NULL THEN PERFORM fn_check_content_blocklist(p_note, 'Note'); END IF;
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_pos
    FROM user_playlist_items WHERE playlist_id = p_playlist_id;
  INSERT INTO user_playlist_items (playlist_id, dish_id, position, note)
  VALUES (p_playlist_id, p_dish_id, v_next_pos, NULLIF(p_note, ''))
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION remove_dish_from_playlist(
  p_playlist_id UUID, p_dish_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_owner UUID;
  v_deleted INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  SELECT user_id INTO v_owner FROM user_playlists WHERE id = p_playlist_id FOR UPDATE;
  IF v_owner IS NULL OR v_owner <> v_user THEN
    RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002';
  END IF;
  DELETE FROM user_playlist_items
    WHERE playlist_id = p_playlist_id AND dish_id = p_dish_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'Dish not in playlist' USING ERRCODE = 'P0002';
  END IF;
  -- Compaction trigger fires automatically on DELETE.
END;
$$;

CREATE OR REPLACE FUNCTION reorder_playlist_items(
  p_playlist_id UUID, p_ordered_dish_ids UUID[]
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_owner UUID;
  v_current_count INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  SELECT user_id INTO v_owner FROM user_playlists WHERE id = p_playlist_id FOR UPDATE;
  IF v_owner IS NULL OR v_owner <> v_user THEN
    RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002';
  END IF;

  -- Exact-permutation validation
  SELECT COUNT(*) INTO v_current_count
    FROM user_playlist_items WHERE playlist_id = p_playlist_id;
  IF v_current_count <> COALESCE(array_length(p_ordered_dish_ids, 1), 0) THEN
    RAISE EXCEPTION 'Reorder must include every dish exactly once' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (
      SELECT dish_id FROM user_playlist_items WHERE playlist_id = p_playlist_id
      EXCEPT
      SELECT unnest(p_ordered_dish_ids)
    ) diff
  ) OR EXISTS (
    SELECT 1 FROM (
      SELECT unnest(p_ordered_dish_ids) AS dish_id
      GROUP BY 1 HAVING COUNT(*) > 1
    ) dup
  ) THEN
    RAISE EXCEPTION 'Reorder must be an exact permutation' USING ERRCODE = 'P0001';
  END IF;

  -- Atomic rewrite under the deferred unique (playlist_id, position)
  UPDATE user_playlist_items upi
     SET position = o.pos
    FROM (
      SELECT dish_id, ordinality AS pos
      FROM unnest(p_ordered_dish_ids) WITH ORDINALITY
    ) o
   WHERE upi.playlist_id = p_playlist_id AND upi.dish_id = o.dish_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_playlist_item_note(
  p_playlist_id UUID, p_dish_id UUID, p_note TEXT
) RETURNS user_playlist_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_owner UUID;
  v_row user_playlist_items;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  SELECT user_id INTO v_owner FROM user_playlists WHERE id = p_playlist_id;
  IF v_owner IS NULL OR v_owner <> v_user THEN
    RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002';
  END IF;
  IF p_note IS NOT NULL THEN PERFORM fn_check_content_blocklist(p_note, 'Note'); END IF;
  UPDATE user_playlist_items
     SET note = NULLIF(p_note, '')
   WHERE playlist_id = p_playlist_id AND dish_id = p_dish_id
   RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Dish not in playlist' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): item mutation RPCs (add/remove/reorder/note)"
```

### Task 10: Follow / unfollow RPCs

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append follow/unfollow RPCs**

```sql
CREATE OR REPLACE FUNCTION follow_playlist(p_playlist_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM user_playlists
    WHERE id = p_playlist_id
      AND (is_public OR user_id = v_user)
      AND user_id <> v_user
  ) THEN
    -- Identical error for: nonexistent, private-not-yours, self-follow.
    RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO user_playlist_follows (user_id, playlist_id)
  VALUES (v_user, p_playlist_id)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION unfollow_playlist(p_playlist_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  DELETE FROM user_playlist_follows
    WHERE user_id = v_user AND playlist_id = p_playlist_id;
  -- Idempotent: no row is not an error.
END;
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): follow/unfollow RPCs"
```

---

## Phase 3 — Read RPCs + grants

### Task 11: Read RPCs (get_playlist_detail, get_user_playlists, get_followed_playlists, get_dish_playlist_membership)

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append read RPCs (SECURITY INVOKER)**

```sql
-- All read RPCs are SECURITY INVOKER so RLS applies to their queries.
-- Private/invisible rows simply don't appear in the result set.

-- Helper: first-4 dish categories for cover rendering. Returns array in
-- position order, filters non-visible items out (not strictly necessary —
-- this helper is only called from contexts that already passed RLS).
CREATE OR REPLACE FUNCTION fn_first_four_categories(p_playlist_id UUID)
RETURNS TEXT[]
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(array_agg(d.category ORDER BY upi.position), ARRAY[]::TEXT[])
  FROM (
    SELECT dish_id, position FROM user_playlist_items
    WHERE playlist_id = p_playlist_id
    ORDER BY position LIMIT 4
  ) upi
  JOIN dishes d ON d.id = upi.dish_id;
$$;

CREATE OR REPLACE FUNCTION get_playlist_detail(p_playlist_id UUID)
RETURNS TABLE (
  playlist_id UUID, title TEXT, description TEXT, is_public BOOLEAN,
  slug TEXT, item_count INT, follower_count INT, created_at TIMESTAMPTZ,
  owner_id UUID, owner_display_name TEXT,
  is_owner BOOLEAN, is_followed BOOLEAN,
  cover_categories TEXT[],
  items JSONB
)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.description, p.is_public, p.slug,
    p.item_count, p.follower_count, p.created_at,
    p.user_id, pr.display_name,
    (p.user_id = auth.uid()) AS is_owner,
    EXISTS (SELECT 1 FROM user_playlist_follows f
            WHERE f.playlist_id = p.id AND f.user_id = auth.uid()) AS is_followed,
    fn_first_four_categories(p.id) AS cover_categories,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'dish_id', d.id, 'dish_name', d.name, 'position', upi.position,
        'note', upi.note,
        'restaurant_id', r.id, 'restaurant_name', r.name,
        'category', d.category, 'avg_rating', d.avg_rating, 'total_votes', d.total_votes,
        'photo_url', d.photo_url
      ) ORDER BY upi.position)
      FROM user_playlist_items upi
      JOIN dishes d ON d.id = upi.dish_id
      JOIN restaurants r ON r.id = d.restaurant_id
      WHERE upi.playlist_id = p.id
    ) AS items
  FROM user_playlists p
  LEFT JOIN profiles pr ON pr.id = p.user_id
  WHERE p.id = p_playlist_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_playlists(p_user_id UUID)
RETURNS TABLE (
  id UUID, user_id UUID, title TEXT, description TEXT, is_public BOOLEAN,
  slug TEXT, cover_mode TEXT, follower_count INT, item_count INT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  cover_categories TEXT[]
)
LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT p.id, p.user_id, p.title, p.description, p.is_public, p.slug,
         p.cover_mode, p.follower_count, p.item_count, p.created_at, p.updated_at,
         fn_first_four_categories(p.id) AS cover_categories
  FROM user_playlists p
  WHERE p.user_id = p_user_id
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_followed_playlists()
RETURNS TABLE (
  playlist_id UUID, title TEXT, is_public BOOLEAN, slug TEXT,
  item_count INT, follower_count INT, owner_display_name TEXT,
  followed_at TIMESTAMPTZ, visibility TEXT, cover_categories TEXT[]
)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.playlist_id, p.title, p.is_public, p.slug,
    p.item_count, p.follower_count, pr.display_name,
    f.followed_at,
    CASE WHEN p.id IS NULL OR (NOT p.is_public AND p.user_id <> auth.uid())
         THEN 'unavailable' ELSE 'visible' END AS visibility,
    CASE WHEN p.id IS NULL THEN ARRAY[]::TEXT[]
         ELSE fn_first_four_categories(p.id) END AS cover_categories
  FROM user_playlist_follows f
  LEFT JOIN user_playlists p ON p.id = f.playlist_id
  LEFT JOIN profiles pr ON pr.id = p.user_id
  WHERE f.user_id = auth.uid()
  ORDER BY f.followed_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_dish_playlist_membership(p_dish_id UUID)
RETURNS TABLE (
  playlist_id UUID, title TEXT, slug TEXT,
  item_count INT, cover_mode TEXT, contains_dish BOOLEAN,
  cover_categories TEXT[]
)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.slug, p.item_count, p.cover_mode,
    EXISTS (SELECT 1 FROM user_playlist_items upi
            WHERE upi.playlist_id = p.id AND upi.dish_id = p_dish_id) AS contains_dish,
    fn_first_four_categories(p.id) AS cover_categories
  FROM user_playlists p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at DESC;
END;
$$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): read RPCs (SECURITY INVOKER)"
```

### Task 12: Grants — paste exactly from spec §Grants

**Files:**
- Modify: `supabase/migrations/2026-04-12-user-playlists.sql`

- [ ] **Step 1: Append the Grants block verbatim from the spec**

Copy the entire `sql` block from `docs/superpowers/specs/2026-04-12-food-playlists-design.md` §Grants. Paste at the end of the migration file.

- [ ] **Step 2: Close the transaction**

Append:

```sql
COMMIT;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/2026-04-12-user-playlists.sql
git commit -m "feat(playlists): grants + close migration transaction"
```

### Task 13: Sync schema.sql, then apply migration to live + verify

CLAUDE.md §2 says "Update schema.sql first — if touching database." So we update schema.sql BEFORE running against live, not after.

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Append the full migration contents into `supabase/schema.sql`**

Copy everything between `BEGIN;` and `COMMIT;` of `supabase/migrations/2026-04-12-user-playlists.sql` (exclusive of those markers — schema.sql doesn't wrap in a transaction). Append to the end of schema.sql OR insert under a clear "# User Playlists" heading near the other feature blocks.

- [ ] **Step 2: Commit the schema update**

```bash
git add supabase/schema.sql
git commit -m "chore(schema): add user_playlists tables + RPCs"
```

- [ ] **Step 3: Apply the migration to the live DB**

Open https://supabase.com/dashboard/project/vpioftosgdkyiwvhxewy/sql/new and paste the full migration file (including `BEGIN;`/`COMMIT;` markers).

Expected: `Success. No rows returned.` — any error aborts the whole migration atomically.

- [ ] **Step 4: Smoke test via SQL**

In the same SQL editor:

```sql
-- Should error: 'Not authenticated' (anon context in SQL editor)
SELECT create_user_playlist('Test', null, true);

-- Should return empty (read RPC callable, returns nothing for unknown user)
SELECT * FROM get_user_playlists('00000000-0000-0000-0000-000000000000');

-- Verify grants are applied
SELECT proname, proacl FROM pg_proc
 WHERE proname IN ('create_user_playlist','claim_menu_import_jobs')
 ORDER BY proname;
```

- [ ] **Step 5: Rollback plan if something goes wrong**

The migration is wrapped in `BEGIN/COMMIT`, so a mid-apply failure rolls back automatically. If the migration committed but something's broken, run this to reverse (safe — only drops the new objects):

```sql
BEGIN;
DROP TABLE IF EXISTS user_playlist_follows, user_playlist_items, user_playlists CASCADE;
DROP FUNCTION IF EXISTS
  create_user_playlist, update_user_playlist, delete_user_playlist,
  add_dish_to_playlist, remove_dish_from_playlist, reorder_playlist_items,
  update_playlist_item_note, follow_playlist, unfollow_playlist,
  get_playlist_detail, get_user_playlists, get_followed_playlists,
  get_dish_playlist_membership,
  fn_playlist_slug_from_title, fn_first_four_categories,
  fn_check_content_blocklist,
  fn_enforce_playlist_cap, fn_enforce_item_cap,
  fn_user_playlist_items_count, fn_user_playlist_follows_count,
  fn_user_playlists_touch_updated_at, fn_user_playlist_items_compact_positions
  CASCADE;
COMMIT;
```

Document the rollback ran and what went wrong in the PR.

---

## Phase 4 — API layer + hooks

### Task 14: Constants + client rate limiter

**Files:**
- Create: `src/constants/playlists.js`
- Modify: `src/lib/rateLimiter.js`

- [ ] **Step 1: Create constants file**

```js
// src/constants/playlists.js
export const MAX_PLAYLISTS_PER_USER = 50
export const MAX_ITEMS_PER_PLAYLIST = 100
export const MIN_TITLE_LEN = 3
export const MAX_TITLE_LEN = 60
export const MAX_DESC_LEN = 200
export const MAX_NOTE_LEN = 140
```

- [ ] **Step 2: Add rate limiter helpers**

Append to `src/lib/rateLimiter.js`:

```js
export function checkPlaylistCreateRateLimit() {
  return checkRateLimit('playlist-create', { maxAttempts: 5, windowMs: 60 * 60 * 1000 })
}
export function checkPlaylistItemAddRateLimit() {
  return checkRateLimit('playlist-item-add', { maxAttempts: 60, windowMs: 60 * 60 * 1000 })
}
export function checkPlaylistFollowRateLimit() {
  return checkRateLimit('playlist-follow', { maxAttempts: 120, windowMs: 60 * 60 * 1000 })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/constants/playlists.js src/lib/rateLimiter.js
git commit -m "feat(playlists): constants + client rate limits"
```

### Task 15: API layer `userPlaylistsApi.js` + barrel

**Files:**
- Create: `src/api/userPlaylistsApi.js`
- Modify: `src/api/index.js`

- [ ] **Step 1: Write the API module**

```js
// src/api/userPlaylistsApi.js
import { supabase } from '../lib/supabase'
import { createClassifiedError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import {
  checkPlaylistCreateRateLimit,
  checkPlaylistItemAddRateLimit,
  checkPlaylistFollowRateLimit,
} from '../lib/rateLimiter'

function rethrow(error, context) {
  logger.error(context, error)
  throw error.type ? error : createClassifiedError(error)
}

export const userPlaylistsApi = {
  async create({ title, description, isPublic }) {
    const rl = checkPlaylistCreateRateLimit()
    if (!rl.allowed) throw new Error(`Slow down — try again in ${Math.ceil(rl.retryAfterMs / 1000)}s`)
    try {
      const { data, error } = await supabase.rpc('create_user_playlist', {
        p_title: title, p_description: description ?? null, p_is_public: isPublic ?? true,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow(e, 'userPlaylistsApi.create') }
  },

  async update(id, { title, description, isPublic }) {
    try {
      const { data, error } = await supabase.rpc('update_user_playlist', {
        p_id: id, p_title: title ?? null,
        p_description: description ?? null, p_is_public: isPublic ?? null,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow(e, 'userPlaylistsApi.update') }
  },

  async remove(id) {
    try {
      const { error } = await supabase.rpc('delete_user_playlist', { p_id: id })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow(e, 'userPlaylistsApi.remove') }
  },

  async addDish(playlistId, dishId, note) {
    const rl = checkPlaylistItemAddRateLimit()
    if (!rl.allowed) throw new Error(`Slow down — try again in ${Math.ceil(rl.retryAfterMs / 1000)}s`)
    try {
      const { data, error } = await supabase.rpc('add_dish_to_playlist', {
        p_playlist_id: playlistId, p_dish_id: dishId, p_note: note ?? null,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow(e, 'userPlaylistsApi.addDish') }
  },

  async removeDish(playlistId, dishId) {
    try {
      const { error } = await supabase.rpc('remove_dish_from_playlist', {
        p_playlist_id: playlistId, p_dish_id: dishId,
      })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow(e, 'userPlaylistsApi.removeDish') }
  },

  async reorder(playlistId, orderedDishIds) {
    try {
      const { error } = await supabase.rpc('reorder_playlist_items', {
        p_playlist_id: playlistId, p_ordered_dish_ids: orderedDishIds,
      })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow(e, 'userPlaylistsApi.reorder') }
  },

  async updateItemNote(playlistId, dishId, note) {
    try {
      const { data, error } = await supabase.rpc('update_playlist_item_note', {
        p_playlist_id: playlistId, p_dish_id: dishId, p_note: note ?? null,
      })
      if (error) throw createClassifiedError(error)
      return data
    } catch (e) { rethrow(e, 'userPlaylistsApi.updateItemNote') }
  },

  async follow(playlistId) {
    const rl = checkPlaylistFollowRateLimit()
    if (!rl.allowed) throw new Error(`Slow down — try again in ${Math.ceil(rl.retryAfterMs / 1000)}s`)
    try {
      const { error } = await supabase.rpc('follow_playlist', { p_playlist_id: playlistId })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow(e, 'userPlaylistsApi.follow') }
  },

  async unfollow(playlistId) {
    try {
      const { error } = await supabase.rpc('unfollow_playlist', { p_playlist_id: playlistId })
      if (error) throw createClassifiedError(error)
    } catch (e) { rethrow(e, 'userPlaylistsApi.unfollow') }
  },

  async getDetail(id) {
    try {
      const { data, error } = await supabase.rpc('get_playlist_detail', { p_playlist_id: id })
      if (error) throw createClassifiedError(error)
      return data?.[0] ?? null
    } catch (e) { rethrow(e, 'userPlaylistsApi.getDetail') }
  },

  async getByUser(userId) {
    try {
      const { data, error } = await supabase.rpc('get_user_playlists', { p_user_id: userId })
      if (error) throw createClassifiedError(error)
      return data ?? []
    } catch (e) { rethrow(e, 'userPlaylistsApi.getByUser') }
  },

  async getFollowed() {
    try {
      const { data, error } = await supabase.rpc('get_followed_playlists')
      if (error) throw createClassifiedError(error)
      return data ?? []
    } catch (e) { rethrow(e, 'userPlaylistsApi.getFollowed') }
  },

  async getDishMembership(dishId) {
    try {
      const { data, error } = await supabase.rpc('get_dish_playlist_membership', { p_dish_id: dishId })
      if (error) throw createClassifiedError(error)
      return data ?? []
    } catch (e) { rethrow(e, 'userPlaylistsApi.getDishMembership') }
  },
}
```

- [ ] **Step 2: Add to barrel export**

Append to `src/api/index.js`:

```js
export { userPlaylistsApi } from './userPlaylistsApi'
```

- [ ] **Step 3: Commit**

```bash
git add src/api/userPlaylistsApi.js src/api/index.js
git commit -m "feat(playlists): API layer + barrel export"
```

### Task 16: Hooks (React Query)

**Files:**
- Create: `src/hooks/useUserPlaylists.js`
- Create: `src/hooks/useFollowedPlaylists.js`
- Create: `src/hooks/usePlaylistDetail.js`
- Create: `src/hooks/useDishPlaylistMembership.js`
- Create: `src/hooks/usePlaylistMutations.js`

- [ ] **Step 1: Write the four `useQuery` hooks**

```js
// src/hooks/useUserPlaylists.js
import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useUserPlaylists(userId) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-playlists', userId],
    queryFn: () => userPlaylistsApi.getByUser(userId),
    enabled: !!userId,
  })
  return {
    playlists: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading playlists') } : null,
    refetch,
  }
}
```

```js
// src/hooks/useFollowedPlaylists.js
import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useFollowedPlaylists(enabled) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['followed-playlists'],
    queryFn: () => userPlaylistsApi.getFollowed(),
    enabled: enabled !== false,
  })
  return {
    playlists: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading saved playlists') } : null,
    refetch,
  }
}
```

```js
// src/hooks/usePlaylistDetail.js
import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function usePlaylistDetail(id) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['playlist-detail', id],
    queryFn: () => userPlaylistsApi.getDetail(id),
    enabled: !!id,
  })
  return {
    playlist: data,
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading playlist') } : null,
    refetch,
  }
}
```

```js
// src/hooks/useDishPlaylistMembership.js
import { useQuery } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'
import { getUserMessage } from '../utils/errorHandler'

export function useDishPlaylistMembership(dishId, enabled) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dish-playlist-membership', dishId],
    queryFn: () => userPlaylistsApi.getDishMembership(dishId),
    enabled: enabled !== false && !!dishId,
  })
  return {
    entries: data || [],
    loading: isLoading,
    error: error ? { message: getUserMessage(error, 'loading your playlists') } : null,
    refetch,
  }
}
```

- [ ] **Step 2: Write the mutations hook**

```js
// src/hooks/usePlaylistMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userPlaylistsApi } from '../api/userPlaylistsApi'

export function usePlaylistMutations() {
  const qc = useQueryClient()

  const invalidate = (playlistId) => {
    qc.invalidateQueries({ queryKey: ['user-playlists'] })
    qc.invalidateQueries({ queryKey: ['followed-playlists'] })
    if (playlistId) qc.invalidateQueries({ queryKey: ['playlist-detail', playlistId] })
    qc.invalidateQueries({ queryKey: ['dish-playlist-membership'] })
  }

  return {
    create: useMutation({
      mutationFn: (payload) => userPlaylistsApi.create(payload),
      onSuccess: () => invalidate(),
    }),
    update: useMutation({
      mutationFn: ({ id, ...rest }) => userPlaylistsApi.update(id, rest),
      onSuccess: (_, { id }) => invalidate(id),
    }),
    remove: useMutation({
      mutationFn: (id) => userPlaylistsApi.remove(id),
      onSuccess: () => invalidate(),
    }),
    addDish: useMutation({
      mutationFn: ({ playlistId, dishId, note }) =>
        userPlaylistsApi.addDish(playlistId, dishId, note),
      onSuccess: (_, { playlistId }) => invalidate(playlistId),
    }),
    removeDish: useMutation({
      mutationFn: ({ playlistId, dishId }) =>
        userPlaylistsApi.removeDish(playlistId, dishId),
      onSuccess: (_, { playlistId }) => invalidate(playlistId),
    }),
    reorder: useMutation({
      mutationFn: ({ playlistId, orderedDishIds }) =>
        userPlaylistsApi.reorder(playlistId, orderedDishIds),
      onSuccess: (_, { playlistId }) => invalidate(playlistId),
    }),
    updateNote: useMutation({
      mutationFn: ({ playlistId, dishId, note }) =>
        userPlaylistsApi.updateItemNote(playlistId, dishId, note),
      onSuccess: (_, { playlistId }) => invalidate(playlistId),
    }),
    follow: useMutation({
      mutationFn: (playlistId) => userPlaylistsApi.follow(playlistId),
      onSuccess: (_, playlistId) => invalidate(playlistId),
    }),
    unfollow: useMutation({
      mutationFn: (playlistId) => userPlaylistsApi.unfollow(playlistId),
      onSuccess: (_, playlistId) => invalidate(playlistId),
    }),
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUserPlaylists.js src/hooks/useFollowedPlaylists.js src/hooks/usePlaylistDetail.js src/hooks/useDishPlaylistMembership.js src/hooks/usePlaylistMutations.js
git commit -m "feat(playlists): React Query hooks"
```

---

## Phase 5 — UI primitives

### Task 16b: Export CATEGORY_EMOJI lookup from categories.js

**Files:**
- Modify: `src/constants/categories.js`

The plan's components expect a `category → emoji` lookup, but the existing file only has `BROWSE_CATEGORIES` / `MAIN_CATEGORIES` arrays. Derive a map once and export.

- [ ] **Step 1: Append to categories.js**

```js
// Derived emoji lookup for playlist covers, map pins, etc.
// Pulls from BROWSE_CATEGORIES and MAIN_CATEGORIES so any new category auto-flows.
export const CATEGORY_EMOJI = Object.fromEntries([
  ...BROWSE_CATEGORIES.map(c => [c.id, c.emoji]),
  ...MAIN_CATEGORIES.map(c => [c.id, c.emoji]),
])
export const DEFAULT_CATEGORY_EMOJI = '🍽️'

export function categoryEmojiFor(categoryId) {
  if (!categoryId) return DEFAULT_CATEGORY_EMOJI
  return CATEGORY_EMOJI[categoryId] || DEFAULT_CATEGORY_EMOJI
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/categories.js
git commit -m "feat(playlists): CATEGORY_EMOJI lookup helpers"
```

### Task 17: PlaylistCover (reusable 4-emoji grid)

**Files:**
- Create: `src/components/playlists/PlaylistCover.jsx`

- [ ] **Step 1: Write the component**

```jsx
import { DEFAULT_CATEGORY_EMOJI, categoryEmojiFor } from '../../constants/categories'

const BG_COLORS = ['#C48A12', '#E4440A', '#B07340', '#16A34A']

export function PlaylistCover({ coverCategories = [], size = 120 }) {
  const tiles = [0, 1, 2, 3].map(i =>
    coverCategories[i] ? categoryEmojiFor(coverCategories[i]) : DEFAULT_CATEGORY_EMOJI
  )
  return (
    <div
      style={{
        width: size, height: size,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
        borderRadius: 8, overflow: 'hidden',
      }}
    >
      {tiles.map((emoji, i) => (
        <div key={i} style={{
          background: BG_COLORS[i],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.round(size / 3.5),
        }}>{emoji}</div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playlists/PlaylistCover.jsx
git commit -m "feat(playlists): PlaylistCover component"
```

### Task 18: PlaylistStripCard + PlaylistGridCard

**Files:**
- Create: `src/components/playlists/PlaylistStripCard.jsx`
- Create: `src/components/playlists/PlaylistGridCard.jsx`

- [ ] **Step 1: Strip card (horizontal-scroll row)**

```jsx
// src/components/playlists/PlaylistStripCard.jsx
import { Link } from 'react-router-dom'
import { PlaylistCover } from './PlaylistCover'

export function PlaylistStripCard({ playlist, coverCategories }) {
  return (
    <Link to={`/playlist/${playlist.id}`} style={{ flexShrink: 0, width: 110, textDecoration: 'none' }}>
      <PlaylistCover coverCategories={coverCategories} size={110} />
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 6, lineHeight: 1.2 }}>
        {playlist.title}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
        {playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
        {playlist.follower_count > 0 && ` · ${playlist.follower_count} saves`}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Grid card (2-col grid)**

```jsx
// src/components/playlists/PlaylistGridCard.jsx
import { Link } from 'react-router-dom'
import { PlaylistCover } from './PlaylistCover'

export function PlaylistGridCard({ playlist, coverCategories, tombstone }) {
  if (tombstone) {
    return (
      <div style={{ width: '100%', opacity: 0.5 }}>
        <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8, background: 'var(--color-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 32 }}>🔒</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 8 }}>{playlist.title}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>No longer available</div>
      </div>
    )
  }
  return (
    <Link to={`/playlist/${playlist.id}`} style={{ width: '100%', textDecoration: 'none' }}>
      <div style={{ width: '100%', aspectRatio: '1' }}>
        <PlaylistCover coverCategories={coverCategories} size={160} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 8 }}>
        {playlist.title}
        {playlist.is_public === false && (
          <span style={{ marginLeft: 6, fontSize: 9, background: 'var(--color-text-primary)', color: '#fff', padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5 }}>PRIVATE</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
        {playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
        {playlist.follower_count > 0 && ` · ${playlist.follower_count} saves`}
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/playlists/PlaylistStripCard.jsx src/components/playlists/PlaylistGridCard.jsx
git commit -m "feat(playlists): strip + grid cards"
```

### Task 19: CreatePlaylistModal (quick-create)

**Files:**
- Create: `src/components/playlists/CreatePlaylistModal.jsx`

- [ ] **Step 1: Write the modal**

Pattern: follows `AddRestaurantModal.jsx` — backdrop + focus trap + error state.

```jsx
import { useState, useEffect } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { validateUserContent } from '../../lib/reviewBlocklist'
import { MIN_TITLE_LEN, MAX_TITLE_LEN } from '../../constants/playlists'
import { capture } from '../../lib/analytics'

export function CreatePlaylistModal({ isOpen, onClose, onCreated, seedDishId }) {
  const [title, setTitle] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const containerRef = useFocusTrap(isOpen, onClose)
  const { create, addDish } = usePlaylistMutations()

  useEffect(() => { if (isOpen) { setTitle(''); setIsPublic(true); setError(null) } }, [isOpen])
  if (!isOpen) return null

  const submit = async () => {
    setError(null)
    const t = title.trim()
    if (t.length < MIN_TITLE_LEN || t.length > MAX_TITLE_LEN) {
      return setError(`Title must be ${MIN_TITLE_LEN}–${MAX_TITLE_LEN} characters`)
    }
    const contentErr = validateUserContent(t, 'Playlist title')
    if (contentErr) return setError(contentErr)
    setSubmitting(true)
    try {
      const playlist = await create.mutateAsync({ title: t, description: null, isPublic })
      capture('playlist_created', { playlist_id: playlist.id, is_public: isPublic })
      if (seedDishId) {
        await addDish.mutateAsync({ playlistId: playlist.id, dishId: seedDishId, note: null })
        capture('playlist_dish_added', { playlist_id: playlist.id, dish_id: seedDishId, from_sheet: 'dish_detail' })
      }
      onCreated?.(playlist)
      onClose()
    } catch (e) {
      setError(e?.message || 'Failed to create playlist')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={containerRef} role="dialog" aria-modal="true" className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}>
        <h2 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)', marginBottom: 12 }}>New playlist</h2>
        {error && (<div className="px-4 py-3 rounded-lg text-sm mb-3" style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>{error}</div>)}
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Playlist name (e.g. Best Hangover Food)"
          className="w-full px-4 py-3 rounded-xl text-sm mb-3"
          style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
          maxLength={MAX_TITLE_LEN} />
        <label className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Public (shareable link)
        </label>
        <button onClick={submit} disabled={submitting}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--color-primary)', color: 'white', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Creating…' : 'Create playlist'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playlists/CreatePlaylistModal.jsx
git commit -m "feat(playlists): CreatePlaylistModal (quick-create)"
```

---

## Phase 6 — Profile surfaces

### Task 20: Wire tabs + playlist strip into Profile.jsx

**Files:**
- Modify: `src/pages/Profile.jsx`

- [ ] **Step 1: Add tab state and render logic around the current journal content**

Change: add tab state (`'journal' | 'playlists' | 'saved'`, default `'journal'`), render the existing journal feed ONLY when tab === `'journal'`, render new subviews for the other tabs, and add the horizontal playlist strip at the top of the Journal view between the chalkboard and the existing "Recently Rated" section. Use the new hooks (`useUserPlaylists`, `useFollowedPlaylists`) and components (`PlaylistStripCard`, `PlaylistGridCard`, `CreatePlaylistModal`). Do not delete anything in Profile.jsx that currently works — surround the existing feed with a tab guard.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: passes with no ES2023+ warnings.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Profile.jsx
git commit -m "feat(playlists): profile tabs + playlist strip on Journal"
```

### Task 21: Mirror into UserProfile.jsx (public profile)

**Files:**
- Modify: `src/pages/UserProfile.jsx`

- [ ] **Step 1: Same pattern as Profile.jsx, minus Saved tab**

The public `/user/:userId` page gets Journal + Playlists tabs only. Saved is personal and hidden from others.

- [ ] **Step 2: Commit**

```bash
git add src/pages/UserProfile.jsx
git commit -m "feat(playlists): mirror tabs to UserProfile (no Saved)"
```

---

## Phase 7 — Public playlist page

### Task 22: `Playlist.jsx` page + route

**Files:**
- Create: `src/pages/Playlist.jsx`
- Modify: the router file (where other routes live — commonly `src/App.jsx` or `src/main.jsx`)

- [ ] **Step 1: Page component**

```jsx
// src/pages/Playlist.jsx
import { useParams, Link } from 'react-router-dom'
import { usePlaylistDetail } from '../hooks/usePlaylistDetail'
import { usePlaylistMutations } from '../hooks/usePlaylistMutations'
import { useAuth } from '../context/AuthContext'
import { PlaylistCover } from '../components/playlists/PlaylistCover'
import { capture } from '../lib/analytics'
import { DEFAULT_CATEGORY_EMOJI, CATEGORY_EMOJIS } from '../constants/categories'

export function Playlist() {
  const { id } = useParams()
  const { user } = useAuth()
  const { playlist, loading, error } = usePlaylistDetail(id)
  const { follow, unfollow } = usePlaylistMutations()

  if (loading) return <div style={{ padding: 20 }}>Loading…</div>
  if (!playlist) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🔒</div>
        <h1 style={{ fontFamily: "'Amatic SC', cursive", fontSize: 32, marginTop: 12 }}>Playlist not found</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>This playlist may be private or no longer exists.</p>
        <Link to="/" style={{ color: 'var(--color-accent-gold)', marginTop: 16, display: 'inline-block' }}>Go home</Link>
      </div>
    )
  }

  const items = playlist.items || []
  const covers = items.slice(0, 4).map(i => CATEGORY_EMOJIS?.[i.category] || DEFAULT_CATEGORY_EMOJI || '🍽️')

  const toggleFollow = () => {
    if (!user) return
    if (playlist.is_followed) {
      unfollow.mutate(id)
    } else {
      follow.mutate(id)
      capture('playlist_followed', { playlist_id: id, creator_id: playlist.owner_id })
    }
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80, background: 'var(--color-bg)' }}>
      <div style={{ padding: 20, background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-bg) 100%)' }}>
        <PlaylistCover coverCategories={covers} size={280} />
        <h1 style={{ fontFamily: "'Amatic SC', cursive", fontSize: 42, lineHeight: 1, marginTop: 16, color: 'var(--color-text-primary)' }}>{playlist.title}</h1>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
          by <b>@{playlist.owner_handle || 'unknown'}</b> · {playlist.item_count} dishes · {playlist.follower_count} followers
        </div>
        {!playlist.is_owner && (
          <button onClick={toggleFollow} style={{ marginTop: 16, padding: '10px 24px', background: 'var(--color-text-primary)', color: '#fff', border: 0, borderRadius: 999, fontWeight: 700 }}>
            {playlist.is_followed ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🥄</div>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>No dishes yet</p>
          {playlist.is_owner && <Link to="/browse" style={{ color: 'var(--color-accent-gold)' }}>Find a dish to add</Link>}
        </div>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map(item => (
            <li key={item.dish_id} style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--color-divider)' }}>
              <div style={{ width: 24, color: 'var(--color-text-tertiary)', fontSize: 13, fontWeight: 700 }}>{item.position}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/dish/${item.dish_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.dish_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{item.restaurant_name}</div>
                </Link>
                {item.note && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, borderLeft: '2px solid var(--color-primary)', paddingLeft: 8, fontStyle: 'italic' }}>{item.note}</div>
                )}
              </div>
              {item.avg_rating != null && (
                <div style={{ fontSize: 14, color: 'var(--color-rating)', fontWeight: 700 }}>{Number(item.avg_rating).toFixed(1)}</div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add the route with lazyWithRetry**

In the router file:

```jsx
const Playlist = lazyWithRetry(() => import('./pages/Playlist').then(m => ({ default: m.Playlist })))
// ...
<Route path="/playlist/:id" element={<Playlist />} />
```

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Playlist.jsx src/App.jsx
git commit -m "feat(playlists): public /playlist/:id route"
```

---

### Task 22b: Owner overflow menu on playlist detail (Edit / Delete / Toggle Privacy)

**Files:**
- Create: `src/components/playlists/PlaylistOwnerMenu.jsx`
- Modify: `src/pages/Playlist.jsx`

Spec §UI says: "Overflow menu: Share (all); Edit, Delete, Toggle Privacy (owner only)". This adds that owner path. Reorder-by-drag and per-item note editor are deliberately deferred to v1.1 — their RPCs ship now (so the DB is ready), but the UI to invoke them is out of scope for v1. Owner can still edit title/description/privacy from this menu.

- [ ] **Step 1: Write the owner menu component**

```jsx
// src/components/playlists/PlaylistOwnerMenu.jsx
import { useState } from 'react'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { capture } from '../../lib/analytics'
import { useNavigate } from 'react-router-dom'

export function PlaylistOwnerMenu({ playlist }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(playlist.title)
  const [description, setDescription] = useState(playlist.description || '')
  const [saving, setSaving] = useState(false)
  const { update, remove } = usePlaylistMutations()
  const navigate = useNavigate()

  const togglePrivacy = async () => {
    const next = !playlist.is_public
    setOpen(false)
    await update.mutateAsync({ id: playlist.playlist_id, isPublic: next })
    capture('playlist_privacy_toggled', { playlist_id: playlist.playlist_id, to: next ? 'public' : 'private' })
  }

  const save = async () => {
    setSaving(true)
    try {
      await update.mutateAsync({ id: playlist.playlist_id, title: title.trim(), description: description.trim() || null })
      setEditing(false)
    } finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!confirm(`Delete "${playlist.title}"? This can't be undone.`)) return
    await remove.mutateAsync(playlist.playlist_id)
    navigate('/profile')
  }

  if (editing) {
    return (
      <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 12, margin: 16 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60}
               style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1.5px solid var(--color-divider)', background: 'var(--color-bg)' }} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={200} rows={2} placeholder="Description (optional)"
                  style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1.5px solid var(--color-divider)', background: 'var(--color-bg)' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: 10, background: 'var(--color-primary)', color: '#fff', border: 0, borderRadius: 8, fontWeight: 700 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 10, background: 'transparent', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-divider)', borderRadius: 8 }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Playlist menu"
        style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-surface-elevated)', border: 0, fontSize: 18 }}>⋯</button>
      {open && (
        <div style={{ position: 'absolute', top: 42, right: 0, minWidth: 180, background: 'var(--color-surface-elevated)', border: '1px solid var(--color-divider)', borderRadius: 8, zIndex: 10 }}>
          <button onClick={() => { setEditing(true); setOpen(false) }} style={{ display: 'block', width: '100%', padding: 12, textAlign: 'left', background: 'transparent', border: 0, color: 'var(--color-text-primary)' }}>
            Edit details
          </button>
          <button onClick={togglePrivacy} style={{ display: 'block', width: '100%', padding: 12, textAlign: 'left', background: 'transparent', border: 0, color: 'var(--color-text-primary)', borderTop: '1px solid var(--color-divider)' }}>
            {playlist.is_public ? 'Make private' : 'Make public'}
          </button>
          <button onClick={onDelete} style={{ display: 'block', width: '100%', padding: 12, textAlign: 'left', background: 'transparent', border: 0, color: 'var(--color-danger)', borderTop: '1px solid var(--color-divider)' }}>
            Delete playlist
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into `Playlist.jsx`**

In the header area (next to the title), render `<PlaylistOwnerMenu playlist={playlist} />` when `playlist.is_owner`.

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/playlists/PlaylistOwnerMenu.jsx src/pages/Playlist.jsx
git commit -m "feat(playlists): owner overflow menu (edit/delete/privacy)"
```

---

## Phase 8 — Add-to-playlist sheet on dish detail

### Task 23: AddToPlaylistSheet component

**Files:**
- Create: `src/components/playlists/AddToPlaylistSheet.jsx`

- [ ] **Step 1: Write the sheet**

Pattern: bottom-anchored modal with a backdrop. Optimistic toggle with rollback using React Query mutations.

```jsx
import { useState } from 'react'
import { useDishPlaylistMembership } from '../../hooks/useDishPlaylistMembership'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { CreatePlaylistModal } from './CreatePlaylistModal'
import { capture } from '../../lib/analytics'

export function AddToPlaylistSheet({ isOpen, onClose, dishId, dishName, restaurantName }) {
  const { entries, loading } = useDishPlaylistMembership(dishId, isOpen)
  const { addDish, removeDish } = usePlaylistMutations()
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  // Optimistic local override — snap the check state immediately; revert on error.
  // Required by CLAUDE.md §1.5: "Optimistic updates must have rollback."
  const [optimistic, setOptimistic] = useState({}) // { [playlistId]: boolean }
  const isChecked = (e) => optimistic[e.playlist_id] ?? e.contains_dish

  const toggle = async (entry) => {
    const wasChecked = isChecked(entry)
    setBusyId(entry.playlist_id)
    setOptimistic(prev => ({ ...prev, [entry.playlist_id]: !wasChecked }))
    try {
      if (wasChecked) {
        await removeDish.mutateAsync({ playlistId: entry.playlist_id, dishId })
      } else {
        await addDish.mutateAsync({ playlistId: entry.playlist_id, dishId, note: null })
        capture('playlist_dish_added', { playlist_id: entry.playlist_id, dish_id: dishId, from_sheet: 'dish_detail' })
      }
      // On success, invalidations refresh `entries`; clear the override so
      // the authoritative DB state takes over.
      setOptimistic(prev => {
        const next = { ...prev }; delete next[entry.playlist_id]; return next
      })
    } catch {
      // Rollback — revert to prior state.
      setOptimistic(prev => ({ ...prev, [entry.playlist_id]: wasChecked }))
    } finally {
      setBusyId(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }}
           onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="w-full rounded-t-2xl" style={{ background: 'var(--color-surface)', padding: '8px 0 20px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ width: 40, height: 4, background: 'var(--color-divider)', borderRadius: 2, margin: '8px auto 12px' }} />
          <div style={{ padding: '0 20px 12px', borderBottom: '1px solid var(--color-divider)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Add to a playlist</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{dishName} · {restaurantName}</div>
          </div>
          <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', color: 'var(--color-primary)', fontWeight: 700, fontSize: 13, background: 'var(--color-surface)', border: 0, width: '100%', textAlign: 'left' }}>
            <span style={{ width: 36, height: 36, border: '1.5px dashed var(--color-primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>+</span>
            Create new playlist
          </button>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>No playlists yet — create one above</div>
          ) : (
            entries.map(e => (
              <button key={e.playlist_id} onClick={() => toggle(e)} disabled={busyId === e.playlist_id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--color-divider)', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, background: 'var(--color-category-strip)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🍽️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{e.item_count} {e.item_count === 1 ? 'dish' : 'dishes'}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${isChecked(e) ? 'var(--color-primary)' : 'var(--color-divider)'}`,
                  background: isChecked(e) ? 'var(--color-primary)' : 'transparent',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                }}>{isChecked(e) ? '✓' : ''}</div>
              </button>
            ))
          )}
        </div>
      </div>
      <CreatePlaylistModal isOpen={createOpen} onClose={() => setCreateOpen(false)} seedDishId={dishId} onCreated={() => setCreateOpen(false)} />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playlists/AddToPlaylistSheet.jsx
git commit -m "feat(playlists): AddToPlaylistSheet with optimistic toggles"
```

### Task 24: Wire "+" button into Dish.jsx

**Files:**
- Modify: `src/pages/Dish.jsx`

- [ ] **Step 1: Add state + button + sheet**

Add next to the existing heart/favorite button: a square "+" button. If user is not logged in, tap shows `LoginModal` (existing pattern in this page). If logged in, tap opens `AddToPlaylistSheet`.

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dish.jsx
git commit -m "feat(playlists): + button on dish detail page opens sheet"
```

---

## Phase 9 — OG image + share

### Task 25: Create `/api/playlist-og` endpoint

**Files:**
- Create: `api/playlist-og.tsx` (.tsx — file contains JSX)
- Modify: `package.json` to add `@vercel/og`
- Modify: `vercel.json` if required for function routing

- [ ] **Step 1: Install the dep**

```bash
npm install @vercel/og
```

- [ ] **Step 2: Write the serverless function**

```tsx
// api/playlist-og.tsx
import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  // Query as anon so RLS filters private rows naturally.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  let playlist: any = null
  if (id && /^[0-9a-f-]{36}$/i.test(id)) {
    const { data } = await sb.rpc('get_playlist_detail', { p_playlist_id: id })
    playlist = data?.[0]
  }

  const title = playlist?.title ?? 'Playlist not found'
  const byline = playlist
    ? `by @${playlist.owner_handle ?? 'unknown'} · ${playlist.item_count} dishes · ${playlist.follower_count} followers`
    : 'This playlist may be private or no longer exists.'

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#F0ECE8', padding: 60, fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 22, color: '#999', marginBottom: 20 }}>What's Good Here</div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: 360, height: 360 }}>
            <div style={{ background: '#C48A12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120 }}>🌯</div>
            <div style={{ background: '#E4440A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120 }}>🥪</div>
            <div style={{ background: '#B07340', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120 }}>🍳</div>
            <div style={{ background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120 }}>🍔</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>{title}</div>
            <div style={{ fontSize: 26, color: '#555', marginTop: 20 }}>{byline}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 630,
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    },
  )
}
```

Note: wire real per-playlist cover emojis by pulling `cover_categories` from the `get_playlist_detail` RPC response and mapping via `categoryEmojiFor` (Task 16b).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: dist includes `api/playlist-og` function, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add api/playlist-og.tsx package.json package-lock.json
git commit -m "feat(playlists): OG image endpoint with short-TTL cache"
```

### Task 26: Share button on playlist detail page

**Files:**
- Modify: `src/pages/Playlist.jsx`

- [ ] **Step 1: Add a Share button that copies the current URL**

If `navigator.share` is available (mobile), use it; else copy to clipboard with a toast. Fire `capture('playlist_shared', { playlist_id, share_target })`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Playlist.jsx
git commit -m "feat(playlists): share button on playlist detail"
```

---

## Phase 10 — Tests + verification

### Task 27: API unit tests

**Files:**
- Create: `src/api/userPlaylistsApi.test.js`

- [ ] **Step 1: Follow the pattern in `src/api/menuImportApi.test.js`**

Mock `supabase.rpc` to return `{ data, error }`. Cover:
- `create` happy path returns row
- `create` throws classified error when rate-limited (mock rate limiter to return `!allowed`)
- `update` passes through args
- `addDish` happy path + rate-limited
- `getDetail` returns `null` when empty
- `follow` throws on error

- [ ] **Step 2: Run tests**

```bash
npm run test -- userPlaylistsApi
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/api/userPlaylistsApi.test.js
git commit -m "test(playlists): API unit tests"
```

### Task 28: SQL regression tests (manual)

**Files:**
- None (one-off SQL)

Run each of these in Supabase SQL editor using two different authenticated sessions (two browser tabs logged in as different test users). Document results as you go.

- [ ] **Anon cannot SELECT private playlist rows or items** — create a private playlist as user A; log out; query `get_playlist_detail` with that ID; expect NULL.
- [ ] **Anon cannot call write RPCs** — expect `permission denied for function` on `create_user_playlist`, `follow_playlist`, etc.
- [ ] **User A cannot mutate user B's playlist** — expect `P0002 Playlist not found`.
- [ ] **Identical error for private vs nonexistent** — `get_playlist_detail(random-uuid)` and `get_playlist_detail(private-from-other-user)` both return no row.
- [ ] **Self-follow rejected** — `follow_playlist(your-own-id)` returns `P0002`.
- [ ] **Cap race** — run two tabs at count=49, both fire `create_user_playlist` at once. Only one should succeed, the other gets `P0001`.
- [ ] **Cascade compaction** — add 3 dishes to a playlist; delete the dish in position 2 from `dishes`; verify positions in `user_playlist_items` are now `1, 2` (not `1, 3`).
- [ ] **Reorder permutation validation** — `reorder_playlist_items([invalid-ids])` returns `P0001`.
- [ ] **Privacy flip + Saved tab tombstone** — user B follows user A's public playlist; user A flips private; user B's `get_followed_playlists` shows `visibility = 'unavailable'`.

### Task 29: E2E tests

**Files:**
- Create: `e2e/pioneer/playlists.spec.js`

- [ ] **Step 1: Write tests**

```js
// e2e/pioneer/playlists.spec.js
import { test, expect } from '@playwright/test'
import { loginAsPioneer } from '../fixtures/auth'

test.describe('Playlists', () => {
  test('create a playlist from profile strip', async ({ page }) => {
    await loginAsPioneer(page)
    await page.goto('/profile')
    await page.getByText(/See all/i).first()
    await page.getByText(/New/i).first().click()
    await page.getByPlaceholder(/Playlist name/i).fill('Test Playlist')
    await page.getByRole('button', { name: /Create playlist/i }).click()
    await expect(page.getByText(/Test Playlist/)).toBeVisible()
  })

  test('add a dish to a playlist from dish detail', async ({ page }) => {
    await loginAsPioneer(page)
    await page.goto('/browse')
    await page.locator('[data-testid="dish-row"]').first().click()
    await page.getByRole('button', { name: /\+/ }).click()
    await expect(page.getByText(/Add to a playlist/)).toBeVisible()
    await page.getByText(/Test Playlist/).click()
    await expect(page.locator('[aria-label="Selected"]')).toBeVisible()
  })

  test('share URL loads in incognito', async ({ browser, page }) => {
    // Create a playlist in the logged-in session first, capture its id from the
    // URL after clicking it, then open /playlist/:id in a fresh incognito context.
    await loginAsPioneer(page)
    await page.goto('/profile')
    await page.getByText(/New/i).first().click()
    await page.getByPlaceholder(/Playlist name/i).fill('Share Test')
    await page.getByRole('button', { name: /Create playlist/i }).click()
    await page.getByText('Share Test').click()
    const url = page.url()
    const match = url.match(/\/playlist\/([0-9a-f-]{36})/i)
    expect(match).not.toBeNull()
    const [, id] = match

    const incognito = await browser.newContext()
    const anonPage = await incognito.newPage()
    await anonPage.goto(`/playlist/${id}`)
    await expect(anonPage.locator('h1')).toContainText('Share Test')
    await incognito.close()
  })
})
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e:pioneer
```

- [ ] **Step 3: Commit**

```bash
git add e2e/pioneer/playlists.spec.js
git commit -m "test(playlists): E2E pioneer flows"
```

### Task 30: Analytics smoke check + PostHog event registration

**Files:**
- Modify: `src/lib/analytics.js` only if new events need named constants there

- [ ] **Step 1: Verify every event defined in spec §Analytics fires from the code at least once (search for `capture('playlist_`)**

Expected events found in code:
- `playlist_created` — in `CreatePlaylistModal`
- `playlist_dish_added` — in `CreatePlaylistModal` (seed path) and `AddToPlaylistSheet` (toggle path)
- `playlist_followed` — in `Playlist.jsx`
- `playlist_shared` — in `Playlist.jsx` share button
- `playlist_privacy_toggled` — in the Edit playlist UI (add in future sub-task if not yet implemented; otherwise mark as 1.1)
- `playlist_detail_viewed` — fire in `Playlist.jsx` useEffect on mount

Add the missing `playlist_detail_viewed` capture and any missing `playlist_privacy_toggled` capture.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Playlist.jsx
git commit -m "feat(playlists): analytics events for detail view + privacy toggle"
```

### Task 31: Deploy + verify live

**Files:**
- None

- [ ] **Step 1: Push main to origin**

```bash
git push origin main
```

- [ ] **Step 2: Watch Vercel deploy complete**

Open https://vercel.com/ and confirm the deploy is green.

- [ ] **Step 3: Smoke test the live site**

- Log in, go to Profile, create a playlist "Test 1". Confirm it appears in the strip.
- Open a dish detail page, tap "+", add the dish to "Test 1". Confirm checkmark.
- Open `/playlist/:id` in an incognito window. Confirm the Spotify-ish layout renders.
- Share the URL with yourself via iMessage or Slack and confirm the OG image renders via unfurl.

- [ ] **Step 4: Flip a playlist to private, confirm**

- As the owner, flip privacy to private.
- In an incognito window, visit `/playlist/:id`. Confirm the "not found" state renders.
- Wait 90 seconds and fetch `/api/playlist-og?id=:id` — confirm the generic "not found" image renders.

- [ ] **Step 5: If any smoke test fails, open a fix-forward task**

Don't roll back — the queue + feature are compatible with partial rollout.

---

## Post-launch checklist (week 1)

- [ ] Check PostHog dashboards daily for `playlist_created`, `playlist_dish_added`, `playlist_followed` volumes.
- [ ] Check Sentry for unhandled errors tagged with the new file paths.
- [ ] Review any failed `follow_playlist` attempts — spike may indicate abuse or a bug.
- [ ] Consider shipping 1.1 Browse-strip discovery once there are ≥ 10 real user-made playlists.
