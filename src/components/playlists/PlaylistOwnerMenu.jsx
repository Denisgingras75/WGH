import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { MIN_TITLE_LEN, MAX_TITLE_LEN, MAX_DESC_LEN } from '../../constants/playlists'
import { capture } from '../../lib/analytics'
import { logger } from '../../utils/logger'
import { getUserMessage, getUserFacingMessage } from '../../utils/errorHandler'
import { INPUT_CLASS, INPUT_STYLE, LABEL_CLASS } from '../../constants/styles'

var MENU_ITEM = 'w-full text-left min-h-[44px] px-4 text-sm font-semibold'
var MODAL_BUTTON = 'flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]'
var CANCEL_STYLE = {
  fontSize: 15,
  background: 'transparent',
  border: '1px solid var(--color-divider)',
  color: 'var(--color-text-primary)',
}

export function PlaylistOwnerMenu({ playlist }) {
  var [open, setOpen] = useState(false)
  var [editing, setEditing] = useState(false)
  var [confirmDelete, setConfirmDelete] = useState(false)
  var [title, setTitle] = useState(playlist.title)
  var [description, setDescription] = useState(playlist.description || '')
  var [saving, setSaving] = useState(false)
  var { update, remove } = usePlaylistMutations()
  var navigate = useNavigate()
  var menuRef = useRef(null)
  var triggerRef = useRef(null)
  var editRef = useFocusTrap(editing, function () { setEditing(false) })
  var confirmRef = useFocusTrap(confirmDelete, function () { setConfirmDelete(false) })

  var id = playlist.playlist_id || playlist.id

  // Close the menu on an outside tap or Escape
  useEffect(function () {
    if (!open) return
    var onDown = function (e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    var onKey = function (e) {
      if (e.key === 'Escape') {
        setOpen(false)
        if (triggerRef.current) triggerRef.current.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return function () {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Park focus on the trigger before opening a dialog, so the dialog's focus
  // trap restores it there (the menu item that opened it is about to unmount).
  var focusTrigger = function () {
    if (triggerRef.current) triggerRef.current.focus()
  }

  var togglePrivacy = function () {
    var next = !playlist.is_public
    setOpen(false)
    update.mutateAsync({ id: id, isPublic: next })
      .then(function () {
        capture('playlist_privacy_toggled', { playlist_id: id, to: next ? 'public' : 'private' })
        toast.success(next ? 'Playlist is now public' : 'Playlist is now private')
      })
      .catch(function (err) {
        logger.error('togglePrivacy failed:', err)
        toast.error(getUserMessage(err, 'updating privacy'))
      })
  }

  var startEdit = function () {
    focusTrigger()
    setTitle(playlist.title)
    setDescription(playlist.description || '')
    setEditing(true)
    setOpen(false)
  }

  var save = function () {
    var t = title.trim()
    if (t.length < MIN_TITLE_LEN || t.length > MAX_TITLE_LEN) {
      toast.error('Title must be ' + MIN_TITLE_LEN + '–' + MAX_TITLE_LEN + ' characters')
      return
    }
    setSaving(true)
    // Empty string (not null) explicitly clears the description server-side.
    update.mutateAsync({ id: id, title: t, description: description.trim() })
      .then(function () {
        setEditing(false)
        toast.success('Playlist updated')
      })
      .catch(function (err) {
        logger.error('save playlist failed:', err)
        toast.error(getUserFacingMessage(err, 'saving your playlist'))
      })
      .finally(function () { setSaving(false) })
  }

  var askDelete = function () {
    focusTrigger()
    setConfirmDelete(true)
    setOpen(false)
  }

  var onDelete = function () {
    remove.mutateAsync(id)
      .then(function () {
        toast.success('Playlist deleted')
        navigate('/profile')
      })
      .catch(function (err) {
        logger.error('delete playlist failed:', err)
        toast.error(getUserMessage(err, 'deleting your playlist'))
      })
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        onClick={function () { setOpen(!open) }}
        aria-label="Playlist options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-divider)',
          color: 'var(--color-text-primary)',
        }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Playlist options"
          className="rounded-xl shadow-lg"
          style={{
            position: 'absolute',
            top: 50,
            right: 0,
            minWidth: 180,
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-divider)',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <button
            role="menuitem"
            onClick={startEdit}
            className={MENU_ITEM}
            style={{ display: 'block', background: 'transparent', border: 'none', color: 'var(--color-text-primary)' }}
          >
            Edit details
          </button>
          <button
            role="menuitem"
            onClick={togglePrivacy}
            className={MENU_ITEM}
            style={{ display: 'block', background: 'transparent', border: 'none', borderTop: '1px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
          >
            {playlist.is_public ? 'Make private' : 'Make public'}
          </button>
          <button
            role="menuitem"
            onClick={askDelete}
            className={MENU_ITEM}
            style={{ display: 'block', background: 'transparent', border: 'none', borderTop: '1px solid var(--color-divider)', color: 'var(--color-danger)' }}
          >
            Delete playlist
          </button>
        </div>
      )}

      {/* Edit sheet */}
      {editing && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            aria-hidden="true"
            onClick={function () { setEditing(false) }}
          />
          <div
            ref={editRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-playlist-title"
            className="relative w-full max-w-lg rounded-t-3xl"
            style={{
              background: 'var(--color-surface-elevated)',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-divider)' }} />
            </div>
            <div className="px-6 pb-4 border-b" style={{ borderColor: 'var(--color-divider)' }}>
              <h2 id="edit-playlist-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Edit playlist
              </h2>
            </div>
            <form className="px-6 pt-4" onSubmit={function (e) { e.preventDefault(); save() }}>
              <label htmlFor="edit-title" className={LABEL_CLASS} style={{ color: 'var(--color-text-secondary)' }}>
                Name
              </label>
              <input
                id="edit-title"
                value={title}
                onChange={function (e) { setTitle(e.target.value) }}
                maxLength={MAX_TITLE_LEN}
                autoComplete="off"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
              <label htmlFor="edit-desc" className={LABEL_CLASS + ' mt-4'} style={{ color: 'var(--color-text-secondary)' }}>
                Description
              </label>
              <textarea
                id="edit-desc"
                value={description}
                onChange={function (e) { setDescription(e.target.value) }}
                maxLength={MAX_DESC_LEN}
                rows={2}
                placeholder="Optional"
                className={INPUT_CLASS + ' resize-none'}
                style={INPUT_STYLE}
              />
              <p className="text-xs text-right mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {description.length}/{MAX_DESC_LEN}
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={function () { setEditing(false) }}
                  className={MODAL_BUTTON}
                  style={CANCEL_STYLE}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={MODAL_BUTTON}
                  style={{
                    fontSize: 15,
                    background: 'var(--color-primary)',
                    color: 'var(--color-text-on-primary)',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            aria-hidden="true"
            onClick={function () { setConfirmDelete(false) }}
          />
          <div
            ref={confirmRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-playlist-title"
            aria-describedby="delete-playlist-desc"
            className="relative rounded-3xl max-w-md w-full overflow-hidden shadow-xl p-6"
            style={{ background: 'var(--color-surface-elevated)' }}
          >
            <h2 id="delete-playlist-title" className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Delete playlist?
            </h2>
            <p
              id="delete-playlist-desc"
              className="text-sm leading-relaxed mt-2 mb-6"
              style={{ color: 'var(--color-text-secondary)', overflowWrap: 'anywhere' }}
            >
              &ldquo;{playlist.title}&rdquo; will be gone for you and anyone who saved it. This can&rsquo;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={function () { setConfirmDelete(false) }}
                className={MODAL_BUTTON}
                style={CANCEL_STYLE}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={remove.isPending}
                className={MODAL_BUTTON}
                style={{
                  fontSize: 15,
                  background: 'var(--color-danger)',
                  color: 'var(--color-text-on-primary)',
                  opacity: remove.isPending ? 0.7 : 1,
                }}
              >
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
