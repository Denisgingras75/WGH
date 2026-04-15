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

