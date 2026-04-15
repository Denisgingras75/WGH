import { useState, useEffect } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { MIN_TITLE_LEN, MAX_TITLE_LEN } from '../../constants/playlists'
import { capture } from '../../lib/analytics'
import { logger } from '../../utils/logger'

/**
 * Quick-create playlist form. Title-only form; description + privacy can
 * be edited later via PlaylistOwnerMenu (Phase 7 follow-up). When called
 * from the AddToPlaylistSheet with a `seedDishId`, the newly created
 * playlist has that dish added immediately after creation.
 */
export function CreatePlaylistModal({ isOpen, onClose, onCreated, seedDishId }) {
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
          // Playlist was created; seeding failed. Surface the error but don't
          // unwind the create — user can retry adding from the playlist page.
          logger.warn('Seed dish failed; playlist created:', seedErr)
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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="New playlist"
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-divider)',
        }}
      >
        <h2
          className="font-bold text-lg"
          style={{ color: 'var(--color-text-primary)', marginBottom: 12 }}
        >
          New playlist
        </h2>
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm mb-3"
            role="alert"
            style={{
              background: 'var(--color-primary-muted)',
              color: 'var(--color-primary)',
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
          className="w-full px-4 py-3 rounded-xl text-sm mb-3"
          style={{
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-divider)',
            color: 'var(--color-text-primary)',
          }}
        />
        <label
          className="flex items-center gap-2 text-sm mb-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public (shareable link)
        </label>
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Creating\u2026' : 'Create playlist'}
        </button>
      </div>
    </div>
  )
}
