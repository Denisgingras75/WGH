import { Link } from 'react-router-dom'
import { PlaylistCover } from './PlaylistCover'

/**
 * Compact card rendered in the horizontal playlist strip on the Journal
 * tab of a profile page. Fixed narrow width so many fit in a scroll.
 */
export function PlaylistStripCard({ playlist }) {
  const id = playlist.id ?? playlist.playlist_id
  const covers = playlist.cover_categories ?? []
  return (
    <Link
      to={`/playlist/${id}`}
      style={{ flexShrink: 0, width: 110, textDecoration: 'none' }}
    >
      <PlaylistCover coverCategories={covers} size={110} />
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--color-text-primary)',
          marginTop: 8,
          lineHeight: 1.2,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {playlist.title}
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--color-text-tertiary)',
          marginTop: 2,
        }}
      >
        {playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
        {playlist.follower_count > 0 && ` · ${playlist.follower_count} saves`}
      </div>
    </Link>
  )
}
