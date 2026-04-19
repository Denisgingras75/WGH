import { Link } from 'react-router-dom'
import { PlaylistCover } from './PlaylistCover'

/**
 * Larger card for the 2-column grids on the Playlists and Saved tabs.
 * `tombstone` renders a placeholder for privacy-flipped playlists that a
 * follower still has saved but can no longer open.
 */
export function PlaylistGridCard({ playlist, tombstone = false }) {
  const id = playlist.id ?? playlist.playlist_id
  const covers = playlist.cover_categories ?? []

  if (tombstone) {
    return (
      <div style={{ width: '100%', opacity: 0.5 }}>
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: 8,
            background: 'var(--color-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary)',
            fontSize: 32,
          }}
        >
          🔒
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginTop: 8,
          }}
        >
          {playlist.title}
        </div>
        <div
          style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}
        >
          No longer available
        </div>
      </div>
    )
  }

  return (
    <Link to={`/playlist/${id}`} style={{ width: '100%', textDecoration: 'none' }}>
      <div style={{ width: '100%', aspectRatio: '1' }}>
        <PlaylistCover coverCategories={covers} size={160} />
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginTop: 8,
        }}
      >
        {playlist.title}
        {playlist.is_public === false && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 9,
              background: 'var(--color-text-primary)',
              color: '#fff',
              padding: '1px 5px',
              borderRadius: 3,
              letterSpacing: 0.5,
            }}
          >
            PRIVATE
          </span>
        )}
      </div>
      <div
        style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}
      >
        {playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
        {playlist.follower_count > 0 && ` · ${playlist.follower_count} saves`}
      </div>
    </Link>
  )
}
