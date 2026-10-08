import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { MAX_TITLE_LEN, MAX_DESC_LEN } from '../../constants/playlists'
import { capture } from '../../lib/analytics'
import { logger } from '../../utils/logger'

export function PlaylistOwnerMenu({ playlist }) {
  var [open, setOpen] = useState(false)
  var [editing, setEditing] = useState(false)
  var [title, setTitle] = useState(playlist.title)
  var [description, setDescription] = useState(playlist.description || '')
  var [saving, setSaving] = useState(false)
  var { update, remove } = usePlaylistMutations()
  var navigate = useNavigate()

  var id = playlist.playlist_id || playlist.id

  var [error, setError] = useState(null)

  var togglePrivacy = function () {
    var next = !playlist.is_public
    setOpen(false)
    setError(null)
    update.mutateAsync({ id: id, isPublic: next })
      .then(function () {
        capture('playlist_privacy_toggled', { playlist_id: id, to: next ? 'public' : 'private' })
      })
      .catch(function (err) {
        logger.error('togglePrivacy failed:', err)
        setError('Failed to update privacy. Try again.')
      })
  }

  var save = function () {
    setSaving(true)
    setError(null)
    update.mutateAsync({ id: id, title: title.trim(), description: description.trim() || null })
      .then(function () { setEditing(false) })
      .catch(function (err) {
        logger.error('save playlist failed:', err)
        setError(err?.message || 'Failed to save. Try again.')
      })
      .finally(function () { setSaving(false) })
  }

  var onDelete = function () {
    if (!window.confirm('Delete "' + playlist.title + '"? This can\'t be undone.')) return
    setError(null)
    remove.mutateAsync(id)
      .then(function () { navigate('/profile') })
      .catch(function (err) {
        logger.error('delete playlist failed:', err)
        setError('Failed to delete. Try again.')
      })
  }

  if (editing) {
    return (
      <div style={{ padding: 16, background: 'var(--color-card)', border: 'var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', margin: 16 }}>
        <input
          value={title}
          onChange={function (e) { setTitle(e.target.value) }}
          maxLength={MAX_TITLE_LEN}
          className="w-full px-3 py-2 mb-2"
          style={{ border: 'var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', fontSize: '16px' }}
        />
        <textarea
          value={description}
          onChange={function (e) { setDescription(e.target.value) }}
          maxLength={MAX_DESC_LEN}
          rows={2}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 mb-2"
          style={{ border: 'var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', fontSize: '16px', resize: 'none' }}
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="btn flex-1 py-2 text-sm"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            {saving ? 'Saving\u2026' : 'Save'}
          </button>
          <button
            onClick={function () { setEditing(false) }}
            className="btn flex-1 py-2 text-sm"
            style={{ background: 'var(--color-card)', color: 'var(--color-ink)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {error && (
        <div style={{ position: 'absolute', bottom: 48, right: 0, minWidth: 200, padding: '8px 10px', background: 'var(--color-card)', color: 'var(--color-danger)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, zIndex: 20 }}>
          {error}
        </div>
      )}
      <button
        onClick={function () { setOpen(!open); setError(null) }}
        aria-label="Playlist menu"
        className="btn"
        style={{
          width: 42,
          height: 42,
          background: 'var(--color-card)',
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--color-ink)',
        }}
      >
        &#x22EF;
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 50,
            right: 0,
            minWidth: 180,
            background: 'var(--color-card)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-float)',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={function () { setEditing(true); setOpen(false) }}
            className="w-full text-left"
            style={{ display: 'block', padding: 12, background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 700 }}
          >
            Edit details
          </button>
          <button
            onClick={togglePrivacy}
            className="w-full text-left"
            style={{ display: 'block', padding: 12, background: 'transparent', border: 'none', borderTop: '1px solid var(--color-divider)', color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 700 }}
          >
            {playlist.is_public ? 'Make private' : 'Make public'}
          </button>
          <button
            onClick={onDelete}
            className="w-full text-left"
            style={{ display: 'block', padding: 12, background: 'transparent', border: 'none', borderTop: '1px solid var(--color-divider)', color: 'var(--color-danger)', fontSize: 14, fontWeight: 700 }}
          >
            Delete playlist
          </button>
        </div>
      )}
    </div>
  )
}
