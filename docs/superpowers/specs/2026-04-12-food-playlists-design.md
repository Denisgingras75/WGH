# Food Playlists — Design Spec

**Date:** 2026-04-12
**Status:** Design approved, awaiting implementation plan
**Target launch:** Before Memorial Day 2026 (May 25), ideally earlier

## Problem

The profile page today is a vote journal — useful evidence, but passive. Users want to express *taste*, not just log it. A dish journal says "I've rated 142 dishes." A playlist says "here are the 10 dishes I send every friend for a hangover." That framing turns a database of ratings into an identity.

The existing `local_lists` table solves an editorial, curator-invite-only version of this (one list per curator, 10-item cap). What we need is the user-generated, any-signed-in-user version — and it's a different model that shouldn't be forced to share a table.

## Solution

User-created "food playlists" in the Spotify mental model:

- Any signed-in user creates one or more playlists
- Any dish can be added (no rating-required friction)
- Public by default with a private toggle
- Shareable via a public URL — `/playlist/:id`
- Followable — other users save a playlist, it appears in their "Saved" tab
- Lives on profile as a first-class surface alongside the existing journal

Editorial `local_lists` stay as-is. The two systems are deliberately separate — curator top-10s have different constraints than user playlists and trying to unify them makes both worse.

## Scope

### In
- Create / rename / delete playlists (CRUD via owner-only RPCs)
- Add / remove / reorder dishes in a playlist (drag-to-reorder)
- Per-item optional note, 140 char max ("try the green salsa")
- Public / private toggle per playlist
- Share URL `/playlist/:id` with generated OG image
- Follow / unfollow a playlist (saved to your profile's "Saved" tab)
- Profile surface: horizontal strip on Journal tab, full grid on Playlists tab, followed grid on Saved tab
- Bottom-sheet playlist picker from dish detail page
- Auto-generated 4-emoji cover grid (category icons from first 4 items)

### Out (defer to 1.1)
- Central discovery surface on Browse (no popular-playlists strip)
- Custom cover image uploads
- Comments or activity feed on playlists
- Collaborative (multi-editor) playlists
- Suggested playlists based on taste graph
- Playlist search

## Why This Works

- **Fits the brand voice.** "Best hangover food" is editorial, opinionated, warm — matches WGH's Amatic SC + coral palette better than a spreadsheet of ratings.
- **Post-vote organization, not pre-vote friction.** Any dish can be added; you don't need to rate it first.
- **Ships without infrastructure investment.** No new auth model, no new storage bucket, no new extraction pipeline. Two new tables + one small follow table. Mostly frontend work.
- **Viral loop doesn't depend on a discovery surface.** A share URL with a good OG image is the distribution channel. Browse-page discovery is a 1.1 feature, informed by which playlists actually get shared.
- **Orthogonal to Jitter / badges / maps.** Doesn't block or entangle Denis's ongoing backend work.

## Data Model

### New table: `user_playlists`

Named `user_playlists` (not `playlists`) so future developers never confuse it with editorial `local_lists`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | |
| `user_id` | UUID FK → auth.users ON DELETE CASCADE | Creator |
| `title` | TEXT NOT NULL | 3-60 chars, `validateUserContent()`, CHECK constraint |
| `description` | TEXT | Optional, max 200 chars, `validateUserContent()`, CHECK constraint |
| `is_public` | BOOLEAN NOT NULL DEFAULT true | Can flip; see privacy flip below |
| `slug` | TEXT NOT NULL | Decorative only, never used for lookup. Generated from title, unique per user (not global). |
| `cover_mode` | TEXT NOT NULL DEFAULT 'auto' | `'auto'` = first 4 dish emojis. Reserved for future `'upload'`. |
| `follower_count` | INT NOT NULL DEFAULT 0 CHECK (follower_count >= 0) | Denormalized; trigger-maintained. Table is client-write-locked (see Access Control) so no column-level revoke needed. |
| `item_count` | INT NOT NULL DEFAULT 0 CHECK (item_count >= 0) | Same |
| `created_at` | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| **CHECK** | `char_length(title) BETWEEN 3 AND 60` | |
| **CHECK** | `description IS NULL OR char_length(description) <= 200` | |
| **UNIQUE** | `(user_id, slug)` | Per-user slug uniqueness; no global collision headaches |

### New table: `user_playlist_items`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | |
| `playlist_id` | UUID FK → user_playlists ON DELETE CASCADE | |
| `dish_id` | UUID FK → dishes ON DELETE CASCADE | |
| `position` | INT NOT NULL CHECK (position BETWEEN 1 AND 100) | |
| `note` | TEXT | Optional, max 140 chars, `validateUserContent()`, CHECK constraint |
| `added_at` | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| **UNIQUE** | `(playlist_id, dish_id)` | No duplicates |
| **UNIQUE** | `(playlist_id, position) DEFERRABLE INITIALLY DEFERRED` | Deferred so reorder swaps don't trip the constraint mid-transaction |

### New table: `user_playlist_follows`

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID FK → auth.users ON DELETE CASCADE | |
| `playlist_id` | UUID FK → user_playlists ON DELETE CASCADE | |
| `followed_at` | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| **PRIMARY KEY** | `(user_id, playlist_id)` | |

### Indexes (hot paths)

```sql
-- Profile: list a specific user's playlists, newest first
CREATE INDEX idx_user_playlists_user_id ON user_playlists (user_id, created_at DESC);

-- Public view of a user's playlists (rendered on other people's profiles)
CREATE INDEX idx_user_playlists_user_public ON user_playlists (user_id, created_at DESC)
  WHERE is_public;

-- Load items in position order for a playlist detail page
CREATE INDEX idx_user_playlist_items_playlist_position ON user_playlist_items (playlist_id, position);

-- Reverse lookup: "what playlists is this dish in?" (future, but cheap now)
CREATE INDEX idx_user_playlist_items_dish_id ON user_playlist_items (dish_id);

-- "Saved" tab: caller's follows, newest first
CREATE INDEX idx_user_playlist_follows_user_id ON user_playlist_follows (user_id, followed_at DESC);

-- Count/list followers of a playlist (cheap to keep; may be useful for abuse review)
CREATE INDEX idx_user_playlist_follows_playlist_id ON user_playlist_follows (playlist_id);
```

Dropped from earlier draft: the bare `(is_public)` partial index — low cardinality and misaligned with real queries.

### Triggers

- `tr_user_playlist_items_count` — AFTER INSERT / DELETE on `user_playlist_items`: `UPDATE user_playlists SET item_count = item_count ± 1 WHERE id = NEW.playlist_id`
- `tr_user_playlist_follows_count` — same pattern for `follower_count`
- `tr_user_playlists_updated_at` — touch `updated_at` on UPDATE

### Access control — client-read-only tables, RPC-only writes

All three tables have RLS enabled with SELECT policies only. Direct `INSERT / UPDATE / DELETE` from client roles is revoked outright — all mutations must go through the `SECURITY DEFINER` RPCs listed below. This is non-negotiable because every cap, rate limit, moderation check, and privacy-oracle defense in this spec lives inside RPCs; leaving direct writes open would bypass all of it.

```sql
REVOKE INSERT, UPDATE, DELETE ON user_playlists, user_playlist_items, user_playlist_follows FROM PUBLIC, anon, authenticated;
-- service_role retains full access by convention for cron / admin flows.
```

**SELECT RLS policies:**

- `user_playlists` SELECT: `is_public OR user_id = auth.uid()`
- `user_playlist_items` SELECT: exists a visible parent — `EXISTS (SELECT 1 FROM user_playlists p WHERE p.id = playlist_id AND (p.is_public OR p.user_id = auth.uid()))`
- `user_playlist_follows` SELECT: `user_id = auth.uid()` (own follows only)

Because SELECT alone is exposed, owners cannot update their own rows via direct SQL from a client context — the owner-verified `update_user_playlist` RPC is the only mutation path. This closes:
- Owner-mutated counters (triggers are the only writer to `follower_count` / `item_count`)
- Cross-playlist item moves by swapping `playlist_id`
- Bypass of blocklist / rate-limit / cap checks

### Privacy flip behavior (public → private)

When a creator flips `is_public` from true to false:
- Existing follower rows in `user_playlist_follows` **stay intact** (the follow row references the playlist_id; the playlist still exists).
- `user_playlists` SELECT RLS now returns the playlist only to the owner, so `get_playlist_detail` returns NOT FOUND to non-owners. The public `/playlist/:id` route renders a generic "not available" state.
- In the follower's "Saved" tab, `get_followed_playlists` returns the follow row with `visibility: 'unavailable'`, which renders as a tombstone card.
- If the creator flips back to public, the tombstone becomes the playlist again.
- Follower counts are not mutated on privacy flip — the relationships aren't destroyed, just hidden.

### Cascades and item-position integrity

- Creator deletes account → `user_playlists` cascades → items and followers cascade too. **Followers lose their saved relationship silently** — there's no follow row left to show a tombstone for. This is consistent with Spotify-style "account deleted" behavior. The "tombstone" pattern applies ONLY to privacy-flipped playlists, not deleted ones.
- Follower deletes account → their own follow rows cascade; other users are unaffected.
- Dish deleted → a specific item cascades out. Positions in that playlist now have a gap (e.g., `1, 2, 4`). A trigger on `user_playlist_items DELETE` immediately compacts positions for the affected playlist via `ROW_NUMBER()`, so `MAX(position)` and `item_count` stay in lock-step for the next `add_dish_to_playlist` call.

## RPCs

All RPCs are `SECURITY DEFINER`, `SET search_path = public`, with explicit owner/visibility guards inside each body. Because SECURITY DEFINER bypasses RLS, every function re-checks the privacy invariants that SELECT RLS would have enforced — there is no "RLS will catch it" fallback.

### Visibility-oracle discipline

For any RPC that touches a specific playlist by ID, the error for **private-not-yours** and **does-not-exist** MUST be identical (same message, same SQLSTATE). Codex flagged this — a distinguishable "private" response turns the endpoint into an existence oracle. Standard on all get/follow RPCs.

### RPC list

- `create_user_playlist(p_title TEXT, p_description TEXT, p_is_public BOOLEAN)` → new row.
  - Rate limit: 5 creates / hour per user (shaping, via existing `check_*_rate_limit` pattern; this is a throttle, not the cap enforcement)
  - Hard cap (50 per user) is enforced by a `BEFORE INSERT` trigger that first `SELECT ... FOR UPDATE`s the caller's `profiles` row to serialize concurrent creates; this closes the TOCTOU race.
  - Title + description moderation: `validateUserContent()` client-side AND a DB-side blocklist check inside the RPC
- `update_user_playlist(p_id UUID, p_title TEXT, p_description TEXT, p_is_public BOOLEAN)` — owner-only. When `is_public` flips from true to false, cache invalidation for OG (see OG section).
- `delete_user_playlist(p_id UUID)` — owner-only. Cascades to items and follow rows; follow loss is silent (see Privacy section).
- `add_dish_to_playlist(p_playlist_id UUID, p_dish_id UUID, p_note TEXT)` — owner-only. Locks the parent playlist row `FOR UPDATE`. Computes `position = COALESCE(MAX(position), 0) + 1` (never `item_count + 1` — cascade deletes can leave `item_count` out of sync with max-position). Respects 100-item cap (trigger-enforced under the same lock).
- `remove_dish_from_playlist(p_playlist_id UUID, p_dish_id UUID)` — owner-only. Single-transaction: delete the item, then compact positions via a `ROW_NUMBER() OVER (ORDER BY position)` pass inside the deferred-unique envelope.
- `reorder_playlist_items(p_playlist_id UUID, p_ordered_dish_ids UUID[])` — owner-only.
  - **Exact-permutation validation**: the input array length MUST equal the current item count, and the set of dish IDs MUST exactly match. Partial reorders are rejected — no deferred-unique surprises, no dropped items, no ambiguity.
  - Single-transaction reorder using the deferred unique constraint: update all positions in one statement.
- `update_playlist_item_note(p_playlist_id UUID, p_dish_id UUID, p_note TEXT)` — owner-only. Moderates note via blocklist. Added because the inline add-from-dish flow doesn't collect a note and users need a way to add one later.
- `follow_playlist(p_playlist_id UUID)` — any authenticated user. Inside the RPC:
  - `IF NOT EXISTS (SELECT 1 FROM user_playlists WHERE id = p_playlist_id AND (is_public OR user_id = auth.uid()) AND user_id <> auth.uid()) THEN RAISE EXCEPTION 'Playlist not found' USING ERRCODE = 'P0002'`
  - The predicate kills: non-existent ID, private-not-yours, self-follow. All three return the identical error.
- `unfollow_playlist(p_playlist_id UUID)` — any authenticated user, own follow only. Idempotent (removing a non-existent follow is a no-op, not an error).
- `get_playlist_detail(p_playlist_id UUID)` — returns playlist + items + creator handle + `is_followed` boolean + `is_owner` boolean. Private-not-yours and nonexistent both return the identical `NOT FOUND` shape.
- `get_user_playlists(p_user_id UUID)` — returns visible playlists for that user (public only unless caller is that user).
- `get_followed_playlists()` — authenticated caller's saved playlists. Entries whose parent playlist has flipped private surface as `{ ...fields, visibility: 'unavailable' }` so the tombstone UI can render; privacy flip does NOT remove the follow row (see Privacy flip behavior).

### Grants (exact statements — single source of truth)

```sql
-- Execute grants
DO $$ BEGIN
  EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f) FROM unnest(ARRAY[
    'create_user_playlist(TEXT, TEXT, BOOLEAN)',
    'update_user_playlist(UUID, TEXT, TEXT, BOOLEAN)',
    'delete_user_playlist(UUID)',
    'add_dish_to_playlist(UUID, UUID, TEXT)',
    'remove_dish_from_playlist(UUID, UUID)',
    'reorder_playlist_items(UUID, UUID[])',
    'update_playlist_item_note(UUID, UUID, TEXT)',
    'follow_playlist(UUID)',
    'unfollow_playlist(UUID)'
  ]) AS f;
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f) FROM unnest(ARRAY[
    -- same list
  ]) AS f;
END $$;

-- Read-only RPCs may be called by anon on public pages (e.g., /playlist/:id
-- loaded in an incognito browser)
GRANT EXECUTE ON FUNCTION get_playlist_detail(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_playlists(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_followed_playlists() TO authenticated, service_role;
```

(The implementation plan will turn this sketch into actual statements — the exact list above is the contract.)

## URL Structure

- Canonical public URL: `/playlist/:id` (UUID only).
- Share URLs (e.g. link previews, OG scraping) hit the same route. No slug-based routes — renames never break links.
- The slug is still stored, but purely for display ("/best-hangover-food" shown in social share preview text). If we ever want a pretty path it'd be `/playlist/:id-:slug` where the id is the source of truth.

## OG Image

Server-rendered at `/api/playlist-og?id=:uuid` as a Vercel serverless function (Node runtime, `@vercel/og`).

### Privacy discipline

- **Query using the anon key, not the service role.** RLS naturally filters private playlists from anon reads, so if the query returns nothing, the playlist is either private or nonexistent. Indistinguishable by design.
- **Return a single generic "Playlist not found" image for both private and nonexistent.** No private-specific image — a distinguishable response is an existence oracle.
- **Same 200 OK status** for found / private / nonexistent, so response-code probing also doesn't leak.

### Cache strategy (short TTL, not long)

OG images are privacy-sensitive. Long CDN caching creates a window where a playlist flipped to private is still served the pre-flip public image by Vercel's edge cache to any scraper.

- `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`
- Cache key includes playlist `id` and the Vercel deployment hash (so a deploy invalidates too).
- Accept the cost: OG scrapers sometimes see a 1-minute-stale image. That's dramatically better than a multi-hour leak after a privacy flip.
- Post-v1, if abuse happens: add explicit cache purge on privacy flip via Vercel's purge API triggered by an `update_user_playlist` Edge Function hook.

### Template

- 1200 × 630
- Background: `--color-surface` (warm stone)
- Top-left: app logo + "What's Good Here" brand lockup
- Center: 4-emoji cover grid (same as in-app cover)
- Below grid: playlist title in Amatic SC display
- Byline: "by @username · N dishes · M followers"

## UI Surfaces

### Profile — Journal tab (default)
- `HeroIdentityCard` (existing)
- Food Story chalkboard (existing)
- **NEW:** Horizontal playlist strip, "Your Playlists" title in Amatic SC with "See all ▸" link to the Playlists tab. First tile is a dashed-outline "+ New" create affordance. Subsequent tiles are playlist cards (cover + title + dish count + follower count).
- Existing "Recently Rated" journal feed below.

### Profile — Playlists tab
- 2-column grid of the user's playlists, with cover + title + stats.
- Private playlists visible only to the owner, marked with a small PRIVATE badge.
- "+ New playlist" tile at the top of the grid.

### Profile — Saved tab
- 2-column grid of playlists the user follows.
- Tombstone card for a followed playlist that has been flipped to private (follow row still exists, parent is hidden).
- Followed playlists whose creator deleted the account disappear silently — the follow row cascaded out, nothing to tombstone.

### Playlist detail page (`/playlist/:id`)
- Cover-first layout (the "Spotify-ish" mockup from design).
- Cover grid (or photo if we ever ship uploads) + title + "by @username · N dishes · M followers".
- Primary action: "Follow" button (for non-owners). Owner sees "Edit" instead.
- Dishes listed as compact rows: position · dish name · restaurant · rating.
- Per-item note shown below row when present, italicized, 140-char max.
- Overflow menu: Share, Report (for non-owners); Edit, Delete, Toggle Privacy (for owner).

### Dish detail page
- Existing heart button stays exactly as-is (one-tap favorite).
- **NEW:** Square "+" button next to the heart. Tap opens a bottom sheet:
  - Header: "Add to a playlist" + dish name subhead
  - "+ Create new playlist" row at top
  - List of the user's playlists with cover + title + dish count + check indicator. Tap toggles membership (optimistic update, rollback on error).
- Closing the sheet dismisses with no save unless changes were made.
- "Create new playlist" opens a minimal inline form (title only, required), creates, and immediately adds the current dish. Description/privacy can be edited later.

## Content Safety

All three UGC text fields — `title`, `description`, `note` — go through `validateUserContent()` client-side AND get a DB-side blocklist check inside the RPC. This matches CLAUDE.md §1.9.

## Rate Limiting & Abuse

**Hard ceilings are enforced by DB triggers with row locks, not by rate-limit counters.** The existing `check_*_rate_limit` RPCs are count-then-insert — under concurrency they're soft and can be exceeded. Treat them as throttles / abuse shaping, not as the actual cap.

- **Per-user cap of 50 playlists**: `BEFORE INSERT` trigger on `user_playlists` does `PERFORM 1 FROM profiles WHERE user_id = NEW.user_id FOR UPDATE` to serialize concurrent creators, then `SELECT COUNT(*) ... WHERE user_id = NEW.user_id` — rejects if ≥ 50. The lock on `profiles` is the critical piece; without it, two parallel inserts at count=49 can both succeed.
- **Per-playlist cap of 100 items**: `BEFORE INSERT` trigger on `user_playlist_items` does `PERFORM 1 FROM user_playlists WHERE id = NEW.playlist_id FOR UPDATE`, then counts. Same locking story.
- Rate-limit shaping (non-authoritative): `playlist_create` 5 / hour, `playlist_item_add` 60 / hour, `playlist_follow` 120 / hour. Soft ceilings that return "slow down" messages; real caps enforce.
- Follows-spike abuse signal (non-enforced, logged for review): if a single playlist gains > 200 follows from accounts < 24 hrs old in < 10 minutes, flag. Deferred to 1.1 — schema supports the query without schema changes.

## Testing

### Unit (Vitest)
- `menuImportApi.test.js`-style tests for a new `userPlaylistsApi.js`: each RPC wrapped with happy path + error classification.
- `follow/unfollow` optimistic update with rollback.
- Reorder: input array validation client-side.

### Integration / RLS / DB-level (Supabase test framework, pgTAP where useful)

**Access control:**
- Anon cannot SELECT private playlist rows or items.
- Anon CAN SELECT public playlists and their items (needed for incognito-browser share URL).
- **Direct table writes are denied for both anon AND authenticated.** `INSERT INTO user_playlists ...` as authenticated must return permission denied.
- Anon cannot call any of the write RPCs (permission denied).
- Authenticated user A cannot mutate user B's playlist via any RPC.

**Privacy-oracle regression (Codex-flagged, must pass):**
- `get_playlist_detail(p_id)` returns identical error for private-not-yours and nonexistent IDs.
- `follow_playlist(p_id)` returns identical error for private-not-yours, nonexistent, and self-follow attempts.
- `/api/playlist-og?id=X` returns the same generic image for private and nonexistent. Same HTTP status.

**Concurrency:**
- Two parallel `create_user_playlist` calls for a user at count=49 — exactly one succeeds, the other hits the cap.
- Two parallel `add_dish_to_playlist` calls for a playlist at item_count=99 — exactly one succeeds.
- Reorder that swaps position 1 and 2 in a single transaction commits without deferred-unique violation.
- Reorder rejects input arrays that aren't an exact permutation of current items.

**Integrity after cascade:**
- Delete a dish that's in a playlist at position 2 (out of 3). After cascade, positions are compacted to `1, 2`. Next `add_dish_to_playlist` goes to position 3.
- Delete the creator's auth.users row — playlist, items, and follow rows all cascade. No orphans.

**Privacy flip + cache:**
- Create public playlist, fetch its OG image (cached). Flip to private. Within the `s-maxage` window the cached image may serve, but within `s-maxage + 30s` it's refreshed to the generic "not found" image. (Asserted by timestamps, not by brittle cache probing.)
- Followers of a flipped playlist see the tombstone card in their Saved tab.

**Column-level grants (if kept despite RPC-only mutations):**
- The revoke-all-direct-writes policy makes column-level grants redundant, but re-asserting `anon` / `authenticated` cannot UPDATE any column is still worth a test.

### E2E (Playwright, pioneer persona)
- Create a playlist from the profile strip; appears in grid.
- Add a dish to that playlist from dish detail page; sheet shows updated check.
- Reorder by drag; persists after refresh.
- Share the playlist URL in a new incognito session; the OG page loads.
- Flip a playlist to private; followers from a second browser see the tombstone.

## Analytics

PostHog events:
- `playlist_created` — { playlist_id, is_public }
- `playlist_dish_added` — { playlist_id, dish_id, from_sheet: 'dish_detail' | 'favorites' | 'other' }
- `playlist_followed` — { playlist_id, creator_id }
- `playlist_shared` — { playlist_id, share_target } (on share button click)
- `playlist_privacy_toggled` — { playlist_id, to: 'public' | 'private' }
- `playlist_detail_viewed` — { playlist_id, is_owner, from_share_url }

## Migration

Single migration file, run in SQL Editor:
`supabase/migrations/user-playlists.sql`

No data backfill needed (new tables, no existing rows to migrate).

`supabase/schema.sql` gets updated with the new tables, indexes, triggers, RLS, RPCs, and grants as part of the same PR.

## Open Questions (resolve during implementation, not blocking)

1. **Cover emoji selection** — when a dish has no clear category emoji, what fallback? (Pull from `DEFAULT_CATEGORY_EMOJI` constant; design day one.)
2. **Empty playlist state** — what does a freshly-created playlist with 0 dishes look like on the detail page? Illustration + CTA "Add your first dish"?
3. **Analytics for privacy oracle attempts** — do we log failed follow attempts? (Probably yes, low priority.)

These don't require new product decisions. Pin them during implementation.
