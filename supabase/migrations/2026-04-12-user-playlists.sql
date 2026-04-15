-- Migration: User playlists (Spotify-style user-generated food playlists)
-- Date: 2026-04-12
-- Spec: docs/superpowers/specs/2026-04-12-food-playlists-design.md
--
-- Tables are client-read-only. All writes through SECURITY DEFINER RPCs.
-- Read RPCs are SECURITY INVOKER so RLS applies naturally.

-- Safety: allow re-running by dropping existing objects in dev. For prod,
-- remove the DROP block before applying.

BEGIN;
