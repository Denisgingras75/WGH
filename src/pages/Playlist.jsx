import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePlaylistDetail } from '../hooks/usePlaylistDetail'
import { usePlaylistMutations } from '../hooks/usePlaylistMutations'
import { useAuth } from '../context/AuthContext'
import { PlaylistCover } from '../components/playlists/PlaylistCover'
import { PlaylistOwnerMenu } from '../components/playlists/PlaylistOwnerMenu'
import { AddDishSearchSheet } from '../components/playlists/AddDishSearchSheet'
import { DishListItem } from '../components/DishListItem'
import { EmptyState } from '../components/EmptyState'
import { DishRowSkeleton } from '../components/Skeleton'
import { LoginModal } from '../components/Auth/LoginModal'
import { capture } from '../lib/analytics'
import { shareOrCopy } from '../utils/share'
import { getUserMessage } from '../utils/errorHandler'
import { BackButton } from '../components/PageHeader'
import { PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE } from '../constants/styles'

const PILL = 'rounded-full px-4 py-3 min-h-[44px] font-semibold text-sm transition-all active:scale-[0.98]'
const SECONDARY_PILL_STYLE = {
  background: 'var(--color-surface-elevated)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-divider)',
}

export function Playlist() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playlist, loading, error, refetch } = usePlaylistDetail(id)
  const { follow, unfollow, removeDish } = usePlaylistMutations()
  const [searchSheetOpen, setSearchSheetOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const items = useMemo(() => playlist?.items || [], [playlist?.items])
  const existingDishIds = useMemo(() => items.map((i) => i.dish_id), [items])

  const loadedId = playlist?.playlist_id
  const isOwner = playlist?.is_owner
  useEffect(() => {
    if (!loadedId) return
    capture('playlist_detail_viewed', {
      playlist_id: id,
      is_owner: isOwner,
      from_share_url: !document.referrer || !document.referrer.includes(window.location.host),
    })
  }, [id, loadedId, isOwner])

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  if (loading) {
    return (
      <div className="min-h-screen animate-pulse" role="status" aria-label="Loading playlist" style={{ background: 'var(--color-bg)' }}>
        <div className="px-4 py-5 flex flex-col items-center">
          <div className="rounded-lg" style={{ width: 240, height: 240, background: 'var(--color-divider)' }} />
          <div className="rounded mt-4" style={{ width: 180, height: 32, background: 'var(--color-divider)' }} />
          <div className="rounded mt-2" style={{ width: 140, height: 14, background: 'var(--color-divider)' }} />
        </div>
        <div className="px-4">
          {[0, 1, 2, 3].map((i) => <DishRowSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div aria-hidden="true" style={{ fontSize: 64 }}>⚠️</div>
        <h1 style={{ fontFamily: "'Amatic SC', cursive", fontSize: 32, fontWeight: 700, lineHeight: 1.1, marginTop: 12, color: 'var(--color-text-primary)' }}>
          Something went wrong
        </h1>
        <p role="alert" className="text-sm text-center mt-2" style={{ color: 'var(--color-danger)' }}>
          {error.message}
        </p>
        <button onClick={() => refetch()} className={'mt-4 ' + PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
          Try again
        </button>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen px-4" style={{ background: 'var(--color-bg)' }}>
        <h1 className="sr-only">Playlist not found</h1>
        <EmptyState
          emoji="🔒"
          title="Playlist not found"
          subtitle="This playlist may be private or no longer exists."
          action={
            <button onClick={goBack} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
              Back
            </button>
          }
        />
      </div>
    )
  }

  var covers = (playlist.cover_categories || []).slice(0, 4)
  var coverPhotos = items.slice(0, 4).map(function (item) { return item.photo_url || null })
  var followPending = follow.isPending || unfollow.isPending

  var toggleFollow = function () {
    if (!user) { setLoginOpen(true); return }
    if (playlist.is_followed) {
      unfollow.mutate(id, {
        onError: (err) => toast.error(getUserMessage(err, 'unfollowing this playlist')),
      })
    } else {
      follow.mutate(id, {
        onError: (err) => toast.error(getUserMessage(err, 'following this playlist')),
      })
      capture('playlist_followed', { playlist_id: id, creator_id: playlist.owner_id })
    }
  }

  var handleShare = async function () {
    const result = await shareOrCopy({
      url: window.location.href,
      title: playlist.title,
      text: playlist.title + ' — a food playlist on What\'s Good Here',
    })
    capture('playlist_shared', { playlist_id: id, method: result.method, success: result.success })
    if (result.success && result.method !== 'native') toast.success('Link copied!', { duration: 2000 })
    if (result.success && playlist.is_owner && !playlist.is_public) {
      toast('This playlist is private — only you can open the link')
    }
  }

  var handleRemove = function (item) {
    removeDish.mutate({ playlistId: id, dishId: item.dish_id }, {
      onSuccess: () => toast.success('Removed ' + item.dish_name),
      onError: (err) => toast.error(getUserMessage(err, 'removing the dish')),
    })
  }

  var addDishesButton = (
    <button
      onClick={function () { setSearchSheetOpen(true) }}
      className={PRIMARY_BUTTON_CLASS}
      style={PRIMARY_BUTTON_STYLE}
    >
      Add dishes
    </button>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header with cover gradient */}
      <div
        className="relative px-4 py-5"
        style={{ background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-bg) 100%)' }}
      >
        <BackButton onClick={goBack} className="absolute top-4 left-4" />
        <div className="flex justify-center">
          <PlaylistCover coverCategories={covers} coverPhotos={coverPhotos} size={240} />
        </div>
        <h1
          style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            marginTop: 16,
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            overflowWrap: 'anywhere',
          }}
        >
          {playlist.title}
        </h1>
        {playlist.description && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 8, fontSize: 14, overflowWrap: 'anywhere' }}>
            {playlist.description}
          </p>
        )}
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8, textAlign: 'center' }}>
          by{' '}
          <Link to={`/user/${playlist.owner_id}`} style={{ fontWeight: 600, color: 'var(--color-accent-gold)', textDecoration: 'none' }}>
            {playlist.owner_display_name || 'Unknown'}
          </Link>
          {' · '}{playlist.item_count} {playlist.item_count === 1 ? 'dish' : 'dishes'}
          {playlist.follower_count > 0 && ` · ${playlist.follower_count} ${playlist.follower_count === 1 ? 'follower' : 'followers'}`}
        </div>
        <div className="flex justify-center items-center gap-3" style={{ marginTop: 16 }}>
          {!playlist.is_owner && (
            <button
              onClick={toggleFollow}
              disabled={followPending}
              className={PILL}
              style={{
                ...(playlist.is_followed
                  ? SECONDARY_PILL_STYLE
                  : { ...PRIMARY_BUTTON_STYLE, border: 'none' }),
                opacity: followPending ? 0.7 : 1,
              }}
            >
              {playlist.is_followed ? 'Following' : 'Follow'}
            </button>
          )}
          <button onClick={handleShare} className={PILL} style={SECONDARY_PILL_STYLE}>
            Share
          </button>
          {playlist.is_owner && <PlaylistOwnerMenu playlist={playlist} />}
        </div>
      </div>

      {/* Owner: Add dishes button (the empty state carries its own) */}
      {playlist.is_owner && items.length > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={function () { setSearchSheetOpen(true) }}
            className={'w-full ' + PRIMARY_BUTTON_CLASS}
            style={PRIMARY_BUTTON_STYLE}
          >
            Add dishes
          </button>
        </div>
      )}

      {/* Dish list */}
      {items.length === 0 ? (
        <EmptyState
          emoji="🥄"
          title="No dishes yet"
          action={playlist.is_owner ? addDishesButton : null}
        />
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map(function (item, i) {
            const removing = removeDish.isPending && removeDish.variables?.dishId === item.dish_id
            return (
              <li
                key={item.dish_id}
                className="flex items-start px-4"
                style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-divider)' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <DishListItem dish={item} isLast />
                  {item.note && (
                    <p
                      className="text-xs italic"
                      style={{
                        color: 'var(--color-text-secondary)',
                        borderLeft: '2px solid var(--color-primary)',
                        paddingLeft: 8,
                        margin: '0 10px 8px',
                      }}
                    >
                      {item.note}
                    </p>
                  )}
                </div>
                {playlist.is_owner && (
                  <button
                    onClick={function () { handleRemove(item) }}
                    disabled={removing}
                    aria-label={'Remove ' + item.dish_name}
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
                    style={{
                      background: 'transparent',
                      color: 'var(--color-text-tertiary)',
                      opacity: removing ? 0.7 : 1,
                      // Vertically centre against the 80px DishListItem row
                      marginTop: 18,
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
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
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        pendingAction="follow this playlist"
      />
    </div>
  )
}
