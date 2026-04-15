-- Migration: User playlists (Spotify-style user-generated food playlists)
-- Date: 2026-04-12
-- Spec: docs/superpowers/specs/2026-04-12-food-playlists-design.md
--
-- Tables are client-read-only. All writes through SECURITY DEFINER RPCs.
-- Read RPCs are SECURITY INVOKER so RLS applies naturally.

-- Safety: allow re-running by dropping existing objects in dev. For prod,
-- remove the DROP block before applying.

BEGIN;

-- ============================================================================
-- Tables + constraints
-- ============================================================================

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

-- ============================================================================
-- Indexes (hot paths)
-- ============================================================================

CREATE INDEX idx_user_playlists_user_id ON user_playlists (user_id, created_at DESC);
CREATE INDEX idx_user_playlists_user_public ON user_playlists (user_id, created_at DESC) WHERE is_public;
CREATE INDEX idx_user_playlist_items_playlist_position ON user_playlist_items (playlist_id, position);
CREATE INDEX idx_user_playlist_items_dish_id ON user_playlist_items (dish_id);
CREATE INDEX idx_user_playlist_follows_user_id ON user_playlist_follows (user_id, followed_at DESC);
CREATE INDEX idx_user_playlist_follows_playlist_id ON user_playlist_follows (playlist_id);

-- ============================================================================
-- Triggers: counters, updated_at, position compaction
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_user_playlist_items_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_playlists
       SET item_count = user_playlists.item_count + 1, updated_at = NOW()
     WHERE user_playlists.id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_playlists
       SET item_count = GREATEST(user_playlists.item_count - 1, 0), updated_at = NOW()
     WHERE user_playlists.id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION fn_user_playlist_follows_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_playlists
       SET follower_count = user_playlists.follower_count + 1
     WHERE user_playlists.id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_playlists
       SET follower_count = GREATEST(user_playlists.follower_count - 1, 0)
     WHERE user_playlists.id = OLD.playlist_id;
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
  -- Advisory xact lock serializes compaction per playlist; prevents
  -- deadlocks when concurrent deletes (or parent cascade) touch the same
  -- playlist. Released at transaction end.
  PERFORM pg_advisory_xact_lock(hashtextextended(OLD.playlist_id::TEXT, 0));
  UPDATE user_playlist_items x SET position = r.new_pos
    FROM (
      SELECT i.id, ROW_NUMBER() OVER (ORDER BY i.position) AS new_pos
      FROM user_playlist_items i
      WHERE i.playlist_id = OLD.playlist_id
    ) r
    WHERE x.id = r.id AND x.position IS DISTINCT FROM r.new_pos;
  RETURN NULL;
END;
$$;

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

-- ============================================================================
-- RLS + direct-write revocations
-- ============================================================================

ALTER TABLE user_playlists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_follows ENABLE ROW LEVEL SECURITY;

-- Lock down direct writes; all mutations go through SECURITY DEFINER RPCs.
REVOKE INSERT, UPDATE, DELETE ON user_playlists        FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON user_playlist_items   FROM PUBLIC, anon, authenticated;
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

-- ============================================================================
-- Hard-cap triggers (BEFORE INSERT with parent-row FOR UPDATE locks)
-- ============================================================================

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

-- ============================================================================
-- Content blocklist (DB-side floor; client-side blocklist is richer)
-- Mirrors the most egregious categories from src/lib/reviewBlocklist.js.
-- ============================================================================

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

-- ============================================================================
-- Slug helper + create/update/delete RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_playlist_slug_from_title(
  p_title TEXT, p_user_id UUID, p_exclude_playlist_id UUID DEFAULT NULL
)
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
  -- p_exclude_playlist_id lets update_user_playlist skip its own row so a
  -- title-case or punctuation-only rename doesn't falsely collide with self.
  WHILE EXISTS (
    SELECT 1 FROM user_playlists
    WHERE user_id = p_user_id AND slug = candidate
      AND (p_exclude_playlist_id IS NULL OR id <> p_exclude_playlist_id)
  ) LOOP
    candidate := base_slug || '-' || suffix;
    suffix := suffix + 1;
    IF suffix > 999 THEN EXIT; END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Note: no server-side rate limit in this RPC. Hard cap is enforced by
-- fn_enforce_playlist_cap (50/user). Client-side throttling lives in
-- src/lib/rateLimiter.js. Adding a server-side rate_limits insert here
-- would be a defense-in-depth layer, deferred to 1.1 if abuse shows up.
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
     SET title = COALESCE(p_title, user_playlists.title),
         description = NULLIF(p_description, ''),
         is_public = COALESCE(p_is_public, user_playlists.is_public),
         slug = CASE WHEN p_title IS NOT NULL AND p_title <> user_playlists.title
                     THEN fn_playlist_slug_from_title(p_title, user_playlists.user_id, user_playlists.id)
                     ELSE user_playlists.slug END
   WHERE user_playlists.id = p_id AND user_playlists.user_id = v_user
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

-- ============================================================================
-- Item mutation RPCs: add, remove, reorder, update-note
-- ============================================================================

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
    ) d
    GROUP BY dish_id HAVING COUNT(*) > 1
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

-- ============================================================================
-- Follow / unfollow RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION follow_playlist(p_playlist_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_is_public BOOLEAN;
  v_owner UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000'; END IF;
  -- FOR SHARE locks the playlist row so a concurrent public→private flip
  -- (update_user_playlist takes FOR UPDATE implicitly via the UPDATE) can't
  -- interleave between the visibility check and the INSERT below.
  SELECT is_public, user_id INTO v_is_public, v_owner
    FROM user_playlists WHERE id = p_playlist_id FOR SHARE;
  IF v_owner IS NULL
     OR v_owner = v_user
     OR (NOT v_is_public AND v_owner <> v_user) THEN
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

-- ============================================================================
-- Read RPCs (SECURITY INVOKER — RLS filters naturally)
-- ============================================================================

-- Helper: first-4 dish categories for cover rendering.
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

-- ============================================================================
-- Grants (per-function, matching lock-menu-queue-rpcs.sql pattern)
-- ============================================================================

-- Write RPCs: authenticated users + service_role only. Anon is locked out.
REVOKE EXECUTE ON FUNCTION create_user_playlist(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION create_user_playlist(TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION update_user_playlist(UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION update_user_playlist(UUID, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION delete_user_playlist(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION delete_user_playlist(UUID) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION add_dish_to_playlist(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION add_dish_to_playlist(UUID, UUID, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION remove_dish_from_playlist(UUID, UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION remove_dish_from_playlist(UUID, UUID) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION reorder_playlist_items(UUID, UUID[]) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION reorder_playlist_items(UUID, UUID[]) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION update_playlist_item_note(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION update_playlist_item_note(UUID, UUID, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION follow_playlist(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION follow_playlist(UUID) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION unfollow_playlist(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION unfollow_playlist(UUID) TO authenticated, service_role;

-- Read RPCs: SECURITY INVOKER, RLS filters private rows. Safe for anon.
GRANT EXECUTE ON FUNCTION get_playlist_detail(UUID)          TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_playlists(UUID)           TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_followed_playlists()           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_dish_playlist_membership(UUID) TO authenticated, service_role;

COMMIT;
