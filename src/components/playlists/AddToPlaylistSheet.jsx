import { useState } from 'react'
import { useDishPlaylistMembership } from '../../hooks/useDishPlaylistMembership'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { CreatePlaylistModal } from './CreatePlaylistModal'
import { PlaylistCover } from './PlaylistCover'
import { capture } from '../../lib/analytics'

export function AddToPlaylistSheet({ isOpen, onClose, dishId, dishName, restaurantName }) {
  var { entries, loading } = useDishPlaylistMembership(dishId, isOpen)
  var { addDish, removeDish } = usePlaylistMutations()
  var [createOpen, setCreateOpen] = useState(false)
  // Set of playlist IDs currently mid-mutation — prevents double-tap races.
  var [busyIds, setBusyIds] = useState({})

  // Optimistic local override per CLAUDE.md §1.5: snap the check state
  // immediately; revert on error.
  var [optimistic, setOptimistic] = useState({})
  var isChecked = function (entry) {
    return optimistic[entry.playlist_id] != null ? optimistic[entry.playlist_id] : entry.contains_dish
  }

  var toggle = function (entry) {
    if (busyIds[entry.playlist_id]) return // already in-flight
    var wasChecked = isChecked(entry)
    setBusyIds(function (prev) { return { ...prev, [entry.playlist_id]: true } })
    setOptimistic(function (prev) { return { ...prev, [entry.playlist_id]: !wasChecked } })
    var promise = wasChecked
      ? removeDish.mutateAsync({ playlistId: entry.playlist_id, dishId: dishId })
      : addDish.mutateAsync({ playlistId: entry.playlist_id, dishId: dishId, note: null })

    promise
      .then(function () {
        if (!wasChecked) {
          capture('playlist_dish_added', {
            playlist_id: entry.playlist_id,
            dish_id: dishId,
            from_sheet: 'dish_detail',
          })
        }
        setOptimistic(function (prev) { var n = { ...prev }; delete n[entry.playlist_id]; return n })
      })
      .catch(function () {
        setOptimistic(function (prev) { return { ...prev, [entry.playlist_id]: wasChecked } })
      })
      .finally(function () { setBusyIds(function (prev) { var n = { ...prev }; delete n[entry.playlist_id]; return n }) })
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-end"
        style={{ background: 'var(--color-backdrop)' }}
        onClick={function (e) { if (e.target === e.currentTarget) onClose() }}
        onKeyDown={function (e) { if (e.key === 'Escape') onClose() }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add to a playlist"
          className="w-full"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-ink)',
            borderBottom: 'none',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            padding: '8px 0 20px',
            maxHeight: '80vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
          {/* Grabber */}
          <div style={{ width: 40, height: 6, background: 'var(--color-ink)', opacity: 0.25, borderRadius: 'var(--radius-pill)', margin: '6px auto 12px' }} />

          {/* Header */}
          <div style={{ padding: '0 20px 14px', borderBottom: '1.5px solid var(--color-divider)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--color-text-primary)' }}>
              Add to a playlist
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {dishName} &middot; {restaurantName}
            </div>
          </div>

          {/* Create new */}
          <button
            onClick={function () { setCreateOpen(true) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 20px',
              color: 'var(--color-primary)',
              fontWeight: 800,
              fontSize: 14,
              background: 'transparent',
              border: 'none',
              borderBottom: '1.5px solid var(--color-divider)',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span style={{
              width: 40, height: 40,
              border: '2px dashed var(--color-text-tertiary)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, lineHeight: 1, flexShrink: 0,
            }}>+</span>
            Create new playlist
          </button>

          {/* Playlist list */}
          {loading ? (
            <div style={{ padding: 20, color: 'var(--color-text-tertiary)', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
              Loading&hellip;
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--color-text-tertiary)', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
              No playlists yet &mdash; create one above
            </div>
          ) : (
            entries.map(function (e) {
              var checked = isChecked(e)
              return (
                <button
                  key={e.playlist_id}
                  onClick={function () { toggle(e) }}
                  disabled={!!busyIds[e.playlist_id]}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    width: '100%',
                    background: checked ? 'var(--color-butter-muted)' : 'transparent',
                    border: 'none',
                    borderBottom: '1.5px solid var(--color-divider)',
                    textAlign: 'left',
                  }}
                >
                  <PlaylistCover coverCategories={e.cover_categories || []} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {e.title}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                      {e.item_count} {e.item_count === 1 ? 'dish' : 'dishes'}
                    </div>
                  </div>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: 'var(--border-ink)',
                    background: checked ? 'var(--color-primary)' : 'var(--color-card)',
                    boxShadow: checked ? 'var(--shadow-hard-sm)' : 'none',
                    color: 'var(--color-text-on-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                  }}>
                    {checked ? '\u2713' : ''}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
      <CreatePlaylistModal
        isOpen={createOpen}
        onClose={function () { setCreateOpen(false) }}
        seedDishId={dishId}
        onCreated={function () { setCreateOpen(false) }}
      />
    </>
  )
}
