import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useDishSearch } from '../../hooks/useDishSearch'
import { useRestaurantSearch } from '../../hooks/useRestaurantSearch'
import { useDishes } from '../../hooks/useDishes'
import { useUserVotes } from '../../hooks/useUserVotes'
import { usePlaylistMutations } from '../../hooks/usePlaylistMutations'
import { useAuth } from '../../context/AuthContext'
import { useLocationContext } from '../../context/LocationContext'
import { calculateDistance } from '../../utils/distance'
import { MAX_ITEMS_PER_PLAYLIST } from '../../constants/playlists'
import { ReviewFlow } from '../ReviewFlow'
import { EmptyState } from '../EmptyState'
import { DishAddRowSkeleton } from '../Skeleton'
import { DishAddRow } from '../DishAddRow'
import { RestaurantAvatar } from '../RestaurantAvatar'
import { capture } from '../../lib/analytics'
import { getUserMessage, getUserFacingMessage } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { INPUT_FOCUS_CLASS } from '../../constants/styles'

var ICON_BUTTON = 'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95'
var BACK_PATH = 'M15.75 19.5 8.25 12l7.5-7.5'
var HINT_STYLE = { fontSize: 13, fontWeight: 500, color: 'var(--color-text-tertiary)' }

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={BACK_PATH} />
    </svg>
  )
}

/**
 * Two-mode search sheet for adding dishes to a playlist.
 *
 * "By Dish" — type a dish name, see results sorted by distance, tap to add.
 * "By Restaurant" — type a restaurant name, tap one, see its dishes, tap to add.
 *
 * A dish needs the owner's rating before it can go on a list: tapping an
 * unrated dish swaps the results for an inline rate view, and the dish is
 * added once the rating is in.
 *
 * Stays open for multi-add without closing between each.
 */
export function AddDishSearchSheet({ isOpen, onClose, playlistId, existingDishIds }) {
  var [mode, setMode] = useState('dish') // 'dish' | 'restaurant'
  var [query, setQuery] = useState('')
  var inputRef = useRef(null)
  var { user } = useAuth()
  var { location, isUsingDefault } = useLocationContext()
  var { addDish } = usePlaylistMutations()

  // --- Rated-dish gate ---
  var { votes, loading: votesLoading, refetch: refetchVotes } = useUserVotes(isOpen && user ? user.id : null)
  var ratedSet = useMemo(function () {
    var set = {}
    votes.forEach(function (v) {
      if (v.rating_10 != null && v.dishes) set[v.dishes.id] = true
    })
    return set
  }, [votes])
  var [rateDish, setRateDish] = useState(null)

  // --- Dish search ---
  var { results: dishResults, loading: dishLoading, error: dishError } = useDishSearch(query, 20)
  var sortedDishResults = useMemo(function () {
    if (!dishResults || !dishResults.length) return dishResults
    if (!location || !location.lat || !location.lng || isUsingDefault) return dishResults
    return dishResults.slice().sort(function (a, b) {
      var distA = (a.restaurant_lat != null && a.restaurant_lng != null)
        ? calculateDistance(location.lat, location.lng, a.restaurant_lat, a.restaurant_lng)
        : 9999
      var distB = (b.restaurant_lat != null && b.restaurant_lng != null)
        ? calculateDistance(location.lat, location.lng, b.restaurant_lat, b.restaurant_lng)
        : 9999
      return distA - distB
    })
  }, [dishResults, location, isUsingDefault])

  // --- Restaurant search (local DB only — Places results aren't used here) ---
  var { localResults: restResults, loading: restLoading } = useRestaurantSearch(
    query, null, null, mode === 'restaurant' && isOpen, null, true
  )

  // --- Restaurant drill-down ---
  var [selectedRestaurant, setSelectedRestaurant] = useState(null)
  var [dishFilter, setDishFilter] = useState('')
  var {
    dishes: restaurantDishes,
    loading: restaurantDishesLoading,
    error: restaurantDishesError,
    refetch: refetchRestaurantDishes,
  } = useDishes(null, null, null, selectedRestaurant ? selectedRestaurant.id : null)

  var filteredRestaurantDishes = useMemo(function () {
    if (!dishFilter.trim()) return restaurantDishes
    var q = dishFilter.trim().toLowerCase()
    return restaurantDishes.filter(function (d) {
      return (d.dish_name || d.name || '').toLowerCase().includes(q) ||
             (d.category || '').toLowerCase().includes(q)
    })
  }, [restaurantDishes, dishFilter])

  var selectRestaurant = function (restaurant) {
    setSelectedRestaurant(restaurant)
    setDishFilter('')
  }

  // --- Shared add state ---
  var [addedIds, setAddedIds] = useState({})
  var [pendingIds, setPendingIds] = useState({})

  useEffect(function () {
    if (!isOpen) return
    setMode('dish')
    setQuery('')
    setSelectedRestaurant(null)
    setDishFilter('')
    setRateDish(null)
    var existing = {}
    if (existingDishIds) existingDishIds.forEach(function (d) { existing[d] = true })
    setAddedIds(existing)
    setPendingIds({})
    var t = setTimeout(function () { if (inputRef.current) inputRef.current.focus() }, 100)
    return function () { clearTimeout(t) }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps -- seed only on open

  var handleAdd = useCallback(function (dishId, dishName) {
    if (addedIds[dishId] || pendingIds[dishId]) return
    // addedIds is seeded with the playlist's existing dishes
    if (Object.keys(addedIds).length >= MAX_ITEMS_PER_PLAYLIST) {
      toast.error('Playlists can hold up to ' + MAX_ITEMS_PER_PLAYLIST + ' dishes')
      return
    }
    setPendingIds(function (prev) {
      return { ...prev, [dishId]: true }
    })
    setAddedIds(function (prev) {
      return { ...prev, [dishId]: true }
    })
    addDish.mutateAsync({ playlistId: playlistId, dishId: dishId, note: null })
      .then(function () {
        capture('playlist_dish_added', {
          playlist_id: playlistId,
          dish_id: dishId,
          from_sheet: mode === 'restaurant' ? 'playlist_restaurant_search' : 'playlist_search',
        })
      })
      .catch(function (err) {
        logger.error('Add dish failed:', err)
        toast.error(getUserFacingMessage(err, 'adding ' + (dishName || 'the dish')))
        setAddedIds(function (prev) {
          var next = { ...prev }; delete next[dishId]; return next
        })
      })
      .finally(function () {
        setPendingIds(function (prev) {
          var next = { ...prev }; delete next[dishId]; return next
        })
      })
  }, [addedIds, pendingIds, addDish, playlistId, mode])

  var containerRef = useFocusTrap(isOpen, onClose)

  if (!isOpen) return null

  var placeholderText = selectedRestaurant ? 'Filter dishes…' : mode === 'dish' ? 'Search dishes…' : 'Search restaurants…'

  var switchMode = function (next) {
    setMode(next)
    setQuery('')
  }

  // --- Shared dish row renderer (same DishAddRow as My Top 10 search) ---
  var renderDishRow = function (dish) {
    var id = dish.dish_id || dish.id
    var name = dish.dish_name || dish.name
    return (
      <DishAddRow
        key={id}
        dish={dish}
        added={!!addedIds[id]}
        disabled={!!pendingIds[id]}
        onAdd={function () {
          if (votesLoading) return
          if (!ratedSet[id]) { setRateDish(dish); return }
          handleAdd(id, name)
        }}
      />
    )
  }

  var renderNoResults = function (title, term) {
    return <EmptyState emoji="🔍" title={title} subtitle={'Nothing matches “' + term.trim() + '”'} />
  }

  var renderResults = function () {
    // --- Restaurant drill-down: show dishes ---
    if (selectedRestaurant) {
      if (restaurantDishesLoading) return <DishAddRowSkeleton label="Searching" />
      if (restaurantDishesError) {
        return (
          <div className="px-6 py-4">
            <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {getUserMessage(restaurantDishesError, 'loading dishes')}
            </p>
            <button
              onClick={function () { refetchRestaurantDishes() }}
              className="mt-3 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Try again
            </button>
          </div>
        )
      }
      if (filteredRestaurantDishes.length === 0) {
        return dishFilter.trim()
          ? renderNoResults('No dishes found', dishFilter)
          : <EmptyState emoji="🍽️" title="No dishes listed yet" />
      }
      return filteredRestaurantDishes.map(renderDishRow)
    }

    // --- Dish mode ---
    if (mode === 'dish') {
      if (dishError) {
        return (
          <p role="alert" className="text-sm px-6 py-4" style={{ color: 'var(--color-danger)' }}>
            {getUserMessage(dishError, 'searching dishes')}
          </p>
        )
      }
      if (query.trim().length < 2) {
        return <p className="px-6 py-10 text-center" style={HINT_STYLE}>Type a dish name to search</p>
      }
      if (dishLoading) return <DishAddRowSkeleton label="Searching" />
      if (sortedDishResults.length === 0) return renderNoResults('No dishes found', query)
      return sortedDishResults.map(renderDishRow)
    }

    // --- Restaurant mode ---
    if (query.trim().length < 2) {
      return <p className="px-6 py-10 text-center" style={HINT_STYLE}>Type a restaurant name to search</p>
    }
    if (restLoading) return <DishAddRowSkeleton label="Searching" />
    if (restResults.length === 0) return renderNoResults('No restaurants found', query)
    return restResults.map(function (r) {
      return (
        <button
          key={r.id}
          onClick={function () { selectRestaurant(r) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', width: '100%',
            background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--color-divider)',
            textAlign: 'left',
          }}
        >
          <RestaurantAvatar name={r.name} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {r.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              {r.address || ''}
            </div>
          </div>
          <svg style={{ width: 16, height: 16, color: 'var(--color-text-tertiary)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )
    })
  }

  var rateDishId = rateDish ? (rateDish.dish_id || rateDish.id) : null
  var rateDishName = rateDish ? (rateDish.dish_name || rateDish.name) : null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-dish-title"
        className="relative w-full max-w-lg rounded-t-3xl flex flex-col"
        style={{ background: 'var(--color-surface-elevated)', maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-divider)' }} />
        </div>

        {rateDish ? (
          <>
            {/* Rate-first view — replaces search until the dish has a number */}
            <div className="flex items-center gap-2 px-4 pb-3" style={{ borderBottom: '1px solid var(--color-divider)' }}>
              <button
                onClick={function () { setRateDish(null) }}
                aria-label="Back to search"
                className={ICON_BUTTON}
                style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
              >
                <BackIcon />
              </button>
              <div className="flex-1 min-w-0">
                <h2 id="add-dish-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Rate it to add it
                </h2>
                <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {rateDishName}{rateDish.restaurant_name ? ' · ' + rateDish.restaurant_name : ''}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 overflow-y-auto overscroll-contain" style={{ flex: 1, minHeight: 0 }}>
              <ReviewFlow
                dishId={rateDishId}
                dishName={rateDishName}
                category={rateDish.category}
                onVote={function () {
                  handleAdd(rateDishId, rateDishName)
                  setRateDish(null)
                  if (refetchVotes) refetchVotes()
                }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Title + mode tabs — only when NOT drilled into a restaurant */}
            {!selectedRestaurant && (
              <>
                <div className="px-6 pb-4">
                  <h2 id="add-dish-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Add dishes
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Tap a dish to add it
                  </p>
                </div>
                <div
                  role="tablist"
                  aria-label="Search by"
                  className="flex rounded-xl p-1 mx-4 mb-2"
                  style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-divider)' }}
                >
                  {['dish', 'restaurant'].map(function (m) {
                    var active = mode === m
                    return (
                      <button
                        key={m}
                        role="tab"
                        id={'add-tab-' + m}
                        aria-selected={active}
                        aria-controls="add-dish-results"
                        tabIndex={active ? 0 : -1}
                        onClick={function () { switchMode(m) }}
                        onKeyDown={function (e) {
                          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                            e.preventDefault()
                            var next = m === 'dish' ? 'restaurant' : 'dish'
                            switchMode(next)
                            var nextTab = document.getElementById('add-tab-' + next)
                            if (nextTab) nextTab.focus()
                          }
                        }}
                        className="flex-1 py-2.5 text-sm font-semibold rounded-lg"
                        style={{
                          background: active ? 'var(--color-primary)' : 'transparent',
                          color: active ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {m === 'dish' ? 'By Dish' : 'By Restaurant'}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Restaurant drill-down header */}
            {selectedRestaurant && (
              <div className="flex items-center gap-2 px-4 pb-2" style={{ borderBottom: '1px solid var(--color-divider)' }}>
                <button
                  onClick={function () { setSelectedRestaurant(null) }}
                  aria-label="Back to restaurant search"
                  className={ICON_BUTTON}
                  style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
                >
                  <BackIcon />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 id="add-dish-title" className="truncate" style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {selectedRestaurant.name}
                  </h2>
                  {selectedRestaurant.address && (
                    <p className="truncate" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                      {selectedRestaurant.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Search input */}
            <div className="px-4 py-2" style={{ borderBottom: selectedRestaurant ? 'none' : '1px solid var(--color-divider)' }}>
              <div className="relative">
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  ref={inputRef}
                  type="search"
                  enterKeyHint="search"
                  value={selectedRestaurant ? dishFilter : query}
                  onChange={function (e) {
                    if (selectedRestaurant) { setDishFilter(e.target.value) }
                    else { setQuery(e.target.value) }
                  }}
                  aria-label={placeholderText}
                  placeholder={placeholderText}
                  autoComplete="off"
                  className={'w-full pl-10 pr-4 py-3 rounded-xl text-sm ' + INPUT_FOCUS_CLASS}
                  style={{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Results area */}
            <div
              id="add-dish-results"
              role={selectedRestaurant ? undefined : 'tabpanel'}
              aria-labelledby={selectedRestaurant ? undefined : 'add-tab-' + mode}
              style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}
            >
              {renderResults()}
            </div>
          </>
        )}

        {/* Done button */}
        <div style={{ padding: '12px 24px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--color-divider)' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
