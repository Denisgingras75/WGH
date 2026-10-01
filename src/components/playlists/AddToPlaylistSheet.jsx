import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useDishPlaylistMembership } from '../../hooks/useDishPlaylistMembership'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { CreatePlaylistModal } from './CreatePlaylistModal'
import { PlaylistCover } from './PlaylistCover'
import { EmptyState } from '../EmptyState'
import { capture } from '../../lib/analytics'
import { getUserMessage } from '../../utils/errorHandler'

var SKELETON_BLOCK = { background: 'var(--color-divider)' }

export function AddToPlaylistSheet({ isOpen, onClose, dishId, dishName, restaurantName }) {
  var { entries, loading, error, refetch } = useDishPlaylistMembership(dishId, isOpen)
  var { addDish, removeDish } = usePlaylistMutations()
  var [createOpen, setCreateOpen] = useState(false)
  // Set of playlist IDs currently mid-mutation — prevents double-tap races.
  var [busyIds, setBusyIds] = useState({})

  // Optimistic local override per CLAUDE.md §1.5: snap the check state
  // immediately; revert on error. A confirmed override is kept until the
  // sheet closes, so the check never flickers back to the pre-refetch value.
  var [optimistic, setOptimistic] = useState({})
  var isChecked = function (entry) {
    return optimistic[entry.playlist_id] != null ? optimistic[entry.playlist_id] : entry.contains_dish
  }

  useEffect(function () {
    if (!isOpen) setOptimistic({})
  }, [isOpen])

  // Gated on !createOpen so one Escape closes only the create modal on top.
  var panelRef = useFocusTrap(isOpen && !createOpen, onClose)

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
      })
      .catch(function (err) {
        setOptimistic(function (prev) { return { ...prev, [entry.playlist_id]: wasChecked } })
        toast.error(getUserMessage(err, wasChecked ? 'removing from the playlist' : 'adding to the playlist'))
      })
      .finally(function () { setBusyIds(function (prev) { var n = { ...prev }; delete n[entry.playlist_id]; return n }) })
  }

  if (!isOpen) return null

  var renderList = function () {
    if (loading) {
      return (
        <div className="animate-pulse px-6" role="status" aria-label="Loading your playlists">
          {[0, 1, 2].map(function (i) {
            return (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="rounded-lg flex-shrink-0" style={{ width: 36, height: 36, ...SKELETON_BLOCK }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/3 rounded" style={SKELETON_BLOCK} />
                  <div className="h-2.5 w-1/4 rounded" style={SKELETON_BLOCK} />
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    if (error) {
      return (
        <div className="px-6 py-4">
          <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>{error.message}</p>
          <button
            onClick={function () { refetch() }}
            className="mt-3 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Try again
          </button>
        </div>
      )
    }
    if (entries.length === 0) {
      return <EmptyState emoji="🎵" title="No playlists yet" subtitle="Create one above" />
    }
    return entries.map(function (e) {
      var checked = isChecked(e)
      var busy = !!busyIds[e.playlist_id]
      return (
        <button
          key={e.playlist_id}
          role="checkbox"
          aria-checked={checked}
          onClick={function () { toggle(e) }}
          disabled={busy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--color-divider)',
            textAlign: 'left',
            opacity: busy ? 0.7 : 1,
          }}
        >
          <PlaylistCover coverCategories={e.cover_categories || []} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {e.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              {e.item_count} {e.item_count === 1 ? 'dish' : 'dishes'}
            </div>
          </div>
          <div aria-hidden="true" style={{
            width: 22, height: 22, borderRadius: '50%',
            border: '2px solid ' + (checked ? 'var(--color-primary)' : 'var(--color-divider)'),
            background: checked ? 'var(--color-primary)' : 'transparent',
            color: 'var(--color-text-on-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {checked ? '✓' : ''}
          </div>
        </button>
      )
    })
  }

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            aria-hidden="true"
            onClick={onClose}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-to-playlist-title"
            className="relative w-full max-w-lg rounded-t-3xl overflow-y-auto overscroll-contain"
            style={{
              background: 'var(--color-surface-elevated)',
              maxHeight: '80vh',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-divider)' }} />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b" style={{ borderColor: 'var(--color-divider)' }}>
              <h2 id="add-to-playlist-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Add to a playlist
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {dishName} &middot; {restaurantName}
              </p>
            </div>

            {/* Create new */}
            <button
              onClick={function () { setCreateOpen(true) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 24px',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: 13,
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span aria-hidden="true" style={{
                width: 36, height: 36,
                border: '1.5px dashed var(--color-primary)',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>+</span>
              Create new playlist
            </button>

            {/* Playlist list */}
            {renderList()}
          </div>
        </div>,
        document.body
      )}
      <CreatePlaylistModal
        isOpen={createOpen}
        onClose={function () { setCreateOpen(false) }}
        seedDishId={dishId}
        onCreated={function () { setCreateOpen(false) }}
      />
    </>
  )
}
