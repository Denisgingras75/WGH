// Playlist feature constants. Mirror DB-enforced limits in
// supabase/migrations/2026-04-12-user-playlists.sql so the client can
// gate inputs before the RPC round-trip.

export const MAX_PLAYLISTS_PER_USER = 50
export const MAX_ITEMS_PER_PLAYLIST = 100
export const MIN_TITLE_LEN = 3
export const MAX_TITLE_LEN = 60
export const MAX_DESC_LEN = 200
export const MAX_NOTE_LEN = 140
