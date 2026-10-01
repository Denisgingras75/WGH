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
      <div style={{ width: '100%' }}>
        <div
          className="rounded-xl"
          aria-hidden="true"
          style={{
            width: '100%',
            aspectRatio: '1',
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          🔒
        </div>
        <div
          className="line-clamp-2"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            marginTop: 8,
            overflowWrap: 'anywhere',
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
    <Link to={`/playlist/${id}`} className="card-press block" style={{ width: '100%', textDecoration: 'none' }}>
      <PlaylistCover coverCategories={covers} size="fill" />
      <div
        className="line-clamp-2"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginTop: 8,
          overflowWrap: 'anywhere',
        }}
      >
        {playlist.title}
        {playlist.is_public === false && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            Private
          </span>
        )}
      </div>
      <div
        style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}
      >
        {playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
        {playlist.follower_count > 0 && ` · ${playlist.follower_count} ${playlist.follower_count === 1 ? 'follower' : 'followers'}`}
      </div>
    </Link>
  )
}
