import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePlaylistDetail } from '../hooks/usePlaylistDetail'
import { usePlaylistMutations } from '../hooks/usePlaylistMutations'
import { useAuth } from '../context/AuthContext'
import { PlaylistCover } from '../components/playlists/PlaylistCover'
import { PlaylistOwnerMenu } from '../components/playlists/PlaylistOwnerMenu'
import { getCategoryNeonImage, categoryEmojiFor } from '../constants/categories'
import { getRatingColor } from '../utils/ranking'
import { AddDishSearchSheet } from '../components/playlists/AddDishSearchSheet'
import { capture } from '../lib/analytics'
import { shareOrCopy } from '../utils/share'

export function Playlist() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playlist, loading, error } = usePlaylistDetail(id)
  const { follow, unfollow, removeDish } = usePlaylistMutations()
  const [searchSheetOpen, setSearchSheetOpen] = useState(false)

  const items = playlist?.items || []
  const existingDishIds = useMemo(() => items.map((i) => i.dish_id), [items])

  useEffect(() => {
    if (playlist) {
      capture('playlist_detail_viewed', {
        playlist_id: id,
        is_owner: playlist.is_owner,
        from_share_url: !document.referrer || !document.referrer.includes(window.location.host),
      })
    }
  }, [id, playlist?.playlist_id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="animate-spin w-7 h-7 rounded-full" style={{ border: '3px solid var(--color-divider)', borderTopColor: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--color-bg)' }}>
        <div style={{ fontSize: 64 }}>⚠️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.05, marginTop: 12, color: 'var(--color-text-primary)' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8, textAlign: 'center', fontWeight: 500 }}>
          {error.message || 'Could not load this playlist. Please try again.'}
        </p>
        <button
          onClick={function () { window.location.reload() }}
          className="btn"
          style={{ marginTop: 16, padding: '10px 22px', fontSize: 14, background: 'var(--color-card)', color: 'var(--color-ink)' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--color-bg)' }}>
        <div style={{ fontSize: 64 }}>🔒</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.05, marginTop: 12, color: 'var(--color-text-primary)' }}>
          Playlist not found
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8, textAlign: 'center', fontWeight: 500 }}>
          This playlist may be private or no longer exists.
        </p>
        <Link
          to="/"
          className="btn"
          style={{ marginTop: 16, padding: '10px 22px', fontSize: 14, background: 'var(--color-card)', color: 'var(--color-ink)', textDecoration: 'none' }}
        >
          Go home
        </Link>
      </div>
    )
  }

  var covers = (playlist.cover_categories || []).slice(0, 4)
  var coverPhotos = items.slice(0, 4).map(function (item) { return item.photo_url || null })

  var toggleFollow = function () {
    if (!user) { navigate('/login'); return }
    if (playlist.is_followed) {
      unfollow.mutate(id)
    } else {
      follow.mutate(id)
      capture('playlist_followed', { playlist_id: id, creator_id: playlist.owner_id })
    }
  }

  var handleShare = function () {
    shareOrCopy({
      url: window.location.href,
      title: playlist.title,
      text: playlist.title + ' — a food playlist on What\'s Good Here',
    })
    capture('playlist_shared', { playlist_id: id, share_target: 'native_or_clipboard' })
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80, background: 'var(--color-bg)' }}>
      {/* Header — cover on paper, hairline below */}
      <div style={{ padding: '24px 20px 20px', background: 'var(--color-bg)', borderBottom: 'var(--border-default)' }}>
        <div className="flex justify-center">
          <PlaylistCover coverCategories={covers} coverPhotos={coverPhotos} size={240} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            marginTop: 20,
            color: 'var(--color-text-primary)',
            textAlign: 'center',
          }}
        >
          {playlist.title}
        </h1>
        {playlist.description && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 8, fontSize: 14, fontWeight: 500, lineHeight: 1.45 }}>
            {playlist.description}
          </p>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: 8, textAlign: 'center' }}>
          by{' '}
          <Link to={`/user/${playlist.owner_id}`} style={{ fontWeight: 700, color: 'var(--color-accent)', textDecoration: 'none' }}>
            {playlist.owner_display_name || 'Unknown'}
          </Link>
          {' · '}{playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
          {playlist.follower_count > 0 && ` · ${playlist.follower_count} followers`}
        </div>
        <div className="flex justify-center gap-3" style={{ marginTop: 16 }}>
          {!playlist.is_owner && (
            <button
              onClick={toggleFollow}
              disabled={follow.isPending || unfollow.isPending}
              className="btn"
              style={{
                padding: '10px 24px',
                background: playlist.is_followed ? 'var(--color-card)' : 'var(--color-accent)',
                color: playlist.is_followed ? 'var(--color-ink)' : 'var(--color-text-on-primary)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {playlist.is_followed ? 'Following' : 'Follow'}
            </button>
          )}
          <button
            onClick={handleShare}
            className="btn"
            style={{
              padding: '10px 24px',
              background: 'var(--color-card)',
              color: 'var(--color-ink)',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Share
          </button>
          {playlist.is_owner && <PlaylistOwnerMenu playlist={playlist} />}
        </div>
      </div>

      {/* Owner: Add dishes button */}
      {playlist.is_owner && (
        <div style={{ padding: '16px 16px 4px' }}>
          <button
            onClick={function () { setSearchSheetOpen(true) }}
            className="w-full py-3 text-sm flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              border: '1px dashed var(--color-divider-strong)',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1 }}>+</span> Add dishes
          </button>
        </div>
      )}

      {/* Dish list */}
      {items.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🥄</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--color-text-primary)', marginTop: 8 }}>No dishes yet</p>
          {playlist.is_owner && (
            <button
              onClick={function () { setSearchSheetOpen(true) }}
              style={{ color: 'var(--color-accent)', marginTop: 8, background: 'none', border: 'none', fontWeight: 700 }}
            >
              Search for dishes to add
            </button>
          )}
        </div>
      ) : (
        <ol style={{ listStyle: 'none', padding: '4px 0 0', margin: 0 }}>
          {items.map(function (item) {
            return (
              <li
                key={item.dish_id}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <div style={{ width: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', flexShrink: 0 }}>
                  {item.position}
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-category-strip)', border: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                  {item.photo_url ? (
                    <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : getCategoryNeonImage(item.category) ? (
                    <img src={getCategoryNeonImage(item.category)} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                  ) : (
                    categoryEmojiFor(item.category)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={'/dish/' + item.dish_id} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25, color: 'var(--color-text-primary)' }}>
                      {item.dish_name}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-accent)', marginTop: 2 }}>
                      {item.restaurant_name}
                    </div>
                  </Link>
                  {item.note && (
                    <div style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      color: 'var(--color-text-secondary)',
                      marginTop: 6,
                      borderLeft: '3px solid var(--color-highlight)',
                      paddingLeft: 8,
                    }}>
                      {item.note}
                    </div>
                  )}
                </div>
                {item.avg_rating != null && (
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1, color: getRatingColor(item.avg_rating), flexShrink: 0 }}>
                    {Number(item.avg_rating).toFixed(1)}
                  </div>
                )}
                {playlist.is_owner && (
                  <button
                    onClick={function (e) {
                      e.stopPropagation()
                      removeDish.mutate({ playlistId: id, dishId: item.dish_id })
                    }}
                    aria-label={'Remove ' + item.dish_name}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--color-card)', border: 'var(--border-subtle)',
                      color: 'var(--color-ink)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, lineHeight: 1, flexShrink: 0, marginLeft: 4,
                    }}
                  >
                    &times;
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      )}

      <AddDishSearchSheet
        isOpen={searchSheetOpen}
        onClose={function () { setSearchSheetOpen(false) }}
        playlistId={id}
        existingDishIds={existingDishIds}
      />
    </div>
  )
}
