import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useDishSearch } from '../../hooks/useDishSearch'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { useLocationContext } from '../../context/LocationContext'
import { calculateDistance } from '../../utils/distance'
import { categoryEmojiFor } from '../../constants/categories'
import { capture } from '../../lib/analytics'
import { logger } from '../../utils/logger'
import { toast } from 'sonner'

/**
 * Search-first sheet for adding dishes to a playlist. Opened from the
 * playlist detail page (owner-only). The user types a dish name, results
 * stream in, tap to add. Stays open for multi-add without closing.
 *
 * Design rationale: when someone is building "Best Hangover Food" they
 * already know what they want. Search is the primary interface, not
 * browse-then-add.
 */
export function AddDishSearchSheet({ isOpen, onClose, playlistId, existingDishIds }) {
  var [query, setQuery] = useState('')
  var inputRef = useRef(null)
  var { results, loading, error: searchError } = useDishSearch(query, 20)
  var { addDish } = usePlaylistMutations()
  var { location, isUsingDefault } = useLocationContext()

  // Sort results by distance to user — nearest first. Only when we have REAL
  // GPS, not the MV default. When the app expands beyond MV, default-location
  // sort would rank everything from MV center which is wrong for other regions.
  var sortedResults = useMemo(function () {
    if (!results || !results.length) return results
    if (!location || !location.lat || !location.lng || isUsingDefault) return results
    return results.slice().sort(function (a, b) {
      var distA = (a.restaurant_lat != null && a.restaurant_lng != null)
        ? calculateDistance(location.lat, location.lng, a.restaurant_lat, a.restaurant_lng)
        : 9999
      var distB = (b.restaurant_lat != null && b.restaurant_lng != null)
        ? calculateDistance(location.lat, location.lng, b.restaurant_lat, b.restaurant_lng)
        : 9999
      return distA - distB
    })
  }, [results, location])

  // Track which dishes we've added in this session (optimistic UI).
  // Seeded from existingDishIds so already-in-playlist dishes show as added.
  var [addedIds, setAddedIds] = useState({})
  // Per-dish in-flight guard prevents double-tap races.
  var [pendingIds, setPendingIds] = useState({})
  // Track previous isOpen to only re-seed on open transition, NOT on every
  // existingDishIds change (which happens after each successful add via
  // React Query invalidation). Without this, query resets mid-session.
  var prevOpen = useRef(false)

  useEffect(function () {
    if (isOpen && !prevOpen.current) {
      // Just opened — seed state
      setQuery('')
      var existing = {}
      if (existingDishIds) {
        for (var i = 0; i < existingDishIds.length; i++) {
          existing[existingDishIds[i]] = true
        }
      }
      setAddedIds(existing)
      setPendingIds({})
      setTimeout(function () { if (inputRef.current) inputRef.current.focus() }, 100)
    }
    prevOpen.current = isOpen
  }, [isOpen])

  var handleAdd = useCallback(function (dish) {
    if (addedIds[dish.dish_id] || pendingIds[dish.dish_id]) return
    // Mark in-flight
    setPendingIds(function (prev) {
      var next = {}; for (var k in prev) next[k] = prev[k]; next[dish.dish_id] = true; return next
    })
    // Optimistic
    setAddedIds(function (prev) {
      var next = {}; for (var k in prev) next[k] = prev[k]; next[dish.dish_id] = true; return next
    })
    addDish.mutateAsync({ playlistId: playlistId, dishId: dish.dish_id, note: null })
      .then(function () {
        capture('playlist_dish_added', {
          playlist_id: playlistId,
          dish_id: dish.dish_id,
          from_sheet: 'playlist_search',
        })
      })
      .catch(function (err) {
        logger.error('AddDishSearchSheet add failed:', err)
        toast(err?.message || 'Failed to add dish')
        // Rollback
        setAddedIds(function (prev) {
          var next = {}; for (var k in prev) { if (k !== dish.dish_id) next[k] = prev[k] }; return next
        })
      })
      .finally(function () {
        setPendingIds(function (prev) {
          var next = {}; for (var k in prev) { if (k !== dish.dish_id) next[k] = prev[k] }; return next
        })
      })
  }, [addedIds, pendingIds, addDish, playlistId])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={function (e) { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={function (e) { if (e.key === 'Escape') onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search dishes to add"
        className="w-full rounded-t-2xl flex flex-col"
        style={{
          background: 'var(--color-surface)',
          maxHeight: '85vh',
        }}
      >
        {/* Grabber */}
        <div style={{ width: 40, height: 4, background: 'var(--color-divider)', borderRadius: 2, margin: '8px auto 0' }} />

        {/* Search input — sticky at top */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-divider)' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="Search dishes to add..."
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
          {searchError ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-danger)', fontSize: 14 }}>
              {searchError.message || 'Could not load dishes. Try again.'}
            </div>
          ) : query.trim().length < 2 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
              Type a dish name to search
            </div>
          ) : loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div className="animate-spin w-5 h-5 border-2 rounded-full mx-auto" style={{ borderColor: 'var(--color-divider)', borderTopColor: 'var(--color-primary)' }} />
            </div>
          ) : sortedResults.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
              No dishes found for &ldquo;{query.trim()}&rdquo;
            </div>
          ) : (
            sortedResults.map(function (dish) {
              var isAdded = !!addedIds[dish.dish_id]
              return (
                <button
                  key={dish.dish_id}
                  onClick={function () { handleAdd(dish) }}
                  disabled={isAdded || !!pendingIds[dish.dish_id]}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-divider)',
                    textAlign: 'left',
                    opacity: isAdded ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: 'var(--color-category-strip)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {categoryEmojiFor(dish.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {dish.dish_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                      {dish.restaurant_name}
                      {dish.restaurant_town && (
                        <span> &middot; {dish.restaurant_town}</span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '2px solid ' + (isAdded ? 'var(--color-rating)' : 'var(--color-divider)'),
                      background: isAdded ? 'var(--color-rating)' : 'transparent',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isAdded ? '\u2713' : '+'}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Done button */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-divider)' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
