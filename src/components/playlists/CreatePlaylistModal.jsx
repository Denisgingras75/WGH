import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { MIN_TITLE_LEN, MAX_TITLE_LEN } from '../../constants/playlists'
import { capture } from '../../lib/analytics'
import { logger } from '../../utils/logger'
import { LoginModal } from '../Auth/LoginModal'

/**
 * Quick-create playlist form. Title-only form; description + privacy can
 * be edited later via PlaylistOwnerMenu (Phase 7 follow-up). When called
 * from the AddToPlaylistSheet with a `seedDishId`, the newly created
 * playlist has that dish added immediately after creation.
 */
export function CreatePlaylistModal({ isOpen, onClose, onCreated, seedDishId }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const containerRef = useFocusTrap(isOpen, onClose)
  const { create, addDish } = usePlaylistMutations()

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setIsPublic(true)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  // §1.6: auth gate. Shouldn't normally be reachable without auth (the
  // profile route and AddToPlaylistSheet both require login), but defense
  // in depth — and useful in future entry points.
  if (!user) {
    return <LoginModal isOpen={true} onClose={onClose} pendingAction="create a playlist" />
  }

  const submit = async () => {
    setError(null)
    const t = title.trim()
    if (t.length < MIN_TITLE_LEN || t.length > MAX_TITLE_LEN) {
      return setError(`Title must be ${MIN_TITLE_LEN}\u2013${MAX_TITLE_LEN} characters`)
    }
    setSubmitting(true)
    try {
      // API layer validates via validateUserContent(); throws on blocked content.
      const playlist = await create.mutateAsync({ title: t, description: null, isPublic })
      capture('playlist_created', { playlist_id: playlist.id, is_public: isPublic })
      if (seedDishId) {
        try {
          await addDish.mutateAsync({ playlistId: playlist.id, dishId: seedDishId, note: null })
          capture('playlist_dish_added', {
            playlist_id: playlist.id,
            dish_id: seedDishId,
            from_sheet: 'dish_detail',
          })
        } catch (seedErr) {
          // Playlist exists but seeding failed — the user's intent was
          // specifically "create playlist + add this dish", so we surface
          // the partial failure instead of silently dismissing.
          logger.warn('Seed dish failed; playlist created:', seedErr)
          onCreated?.(playlist)
          setError(
            `Playlist created but we couldn't add the dish: ${seedErr?.message || 'unknown error'}. Try adding it from the playlist page.`
          )
          return
        }
      }
      onCreated?.(playlist)
      onClose()
    } catch (e) {
      setError(e?.message || 'Failed to create playlist')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'var(--color-backdrop)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="New playlist"
        className="w-full sm:max-w-md p-5"
        style={{
          background: 'var(--color-card)',
          border: 'var(--border-ink)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-hard-lg)',
        }}
      >
        <h2
          style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--color-text-primary)', marginBottom: 14 }}
        >
          New playlist
        </h2>
        {error && (
          <div
            className="px-4 py-3 text-sm mb-3"
            role="alert"
            style={{
              background: 'var(--color-danger-muted)',
              color: 'var(--color-danger)',
              border: '1.5px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Playlist name (e.g. Best Hangover Food)"
          maxLength={MAX_TITLE_LEN}
          className="w-full px-4 py-3 mb-3"
          style={{
            background: 'var(--color-surface-elevated)',
            border: 'var(--border-ink)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: '16px',
          }}
        />
        <label
          className="flex items-center gap-2 text-sm mb-4"
          style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
        >
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
          />
          Public (shareable link)
        </label>
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-ink w-full py-3"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            fontSize: 15,
            fontWeight: 800,
          }}
        >
          {submitting ? 'Creating\u2026' : 'Create playlist'}
        </button>
      </div>
    </div>
  )
}
