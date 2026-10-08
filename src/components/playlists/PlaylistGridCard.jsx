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
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-divider-strong)',
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
            fontFamily: 'var(--font-display)',
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            color: 'var(--color-text-primary)',
            marginTop: 10,
          }}
        >
          {playlist.title}
        </div>
        <div
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: 2 }}
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
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          color: 'var(--color-text-primary)',
          marginTop: 10,
        }}
      >
        {playlist.title}
        {playlist.is_public === false && (
          <span
            style={{
              marginLeft: 6,
              fontFamily: 'var(--font-body)',
              fontSize: 9,
              fontWeight: 600,
              background: 'var(--color-ink)',
              color: 'var(--color-bg)',
              border: 'var(--border-subtle)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: '0.08em',
              verticalAlign: 'middle',
            }}
          >
            PRIVATE
          </span>
        )}
      </div>
      <div
        style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: 2 }}
      >
        {playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
        {playlist.follower_count > 0 && ` · ${playlist.follower_count} saves`}
      </div>
    </Link>
  )
}
