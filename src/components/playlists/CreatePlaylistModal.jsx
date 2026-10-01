import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { MIN_TITLE_LEN, MAX_TITLE_LEN } from '../../constants/playlists'
import { capture } from '../../lib/analytics'
import { logger } from '../../utils/logger'
import { getUserFacingMessage } from '../../utils/errorHandler'
import { LoginModal } from '../Auth/LoginModal'
import { INPUT_FOCUS_CLASS } from '../../constants/styles'

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
      return setError(`Title must be ${MIN_TITLE_LEN}–${MAX_TITLE_LEN} characters`)
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
          // Playlist exists but seeding failed. The modal closes either way,
          // so the partial failure is surfaced as a toast that outlives it.
          logger.warn('Seed dish failed; playlist created:', seedErr)
          toast.error("Playlist created, but we couldn't add the dish. Add it from the playlist page.")
          onCreated?.(playlist)
          onClose()
          return
        }
      }
      toast.success(seedDishId ? 'Playlist created and dish added' : 'Playlist created')
      onCreated?.(playlist)
      onClose()
    } catch (e) {
      // Blocklist + RAISE EXCEPTION messages (cap, blocklist) are shown as-is
      setError(getUserFacingMessage(e, 'creating your playlist'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-playlist-title"
        className="relative rounded-3xl max-w-md w-full overflow-hidden shadow-xl p-6"
        style={{ background: 'var(--color-surface-elevated)' }}
      >
        <h2
          id="create-playlist-title"
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          New playlist
        </h2>
        {error && (
          <p role="alert" className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
        <form onSubmit={(e) => { e.preventDefault(); submit() }}>
          <label
            htmlFor="playlist-title"
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Name
          </label>
          <input
            id="playlist-title"
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Best Hangover Food"
            maxLength={MAX_TITLE_LEN}
            enterKeyHint="done"
            autoComplete="off"
            className={'w-full px-4 py-3 rounded-xl text-sm ' + INPUT_FOCUS_CLASS}
            style={{
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
            }}
          />
          <p className="text-xs text-right mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {title.length}/{MAX_TITLE_LEN}
          </p>
          <label
            className="flex items-center gap-3 min-h-[44px] text-sm mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', width: 20, height: 20 }}
            />
            Public (shareable link)
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
              style={{
                fontSize: 15,
                background: 'transparent',
                border: '1px solid var(--color-divider)',
                color: 'var(--color-text-primary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
              style={{
                fontSize: 15,
                background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
