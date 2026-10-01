import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useMyLocalList } from '../hooks/useMyLocalList'
import { useDishSearch } from '../hooks/useDishSearch'
import { useUserVotes } from '../hooks/useUserVotes'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { ReviewFlow } from '../components/ReviewFlow'
import { EmptyState } from '../components/EmptyState'
import { DishRowSkeleton, DishAddRowSkeleton } from '../components/Skeleton'
import { DishListItem } from '../components/DishListItem'
import { DishAddRow } from '../components/DishAddRow'
import { getUserMessage, getUserFacingMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { AMATIC_TITLE, INPUT_CLASS, LABEL_CLASS, LABEL_STYLE, PAGE_INPUT_STYLE, PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE } from '../constants/styles'

var ICON_BUTTON = 'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95'

// Editable list entry: the fields DishListItem renders, plus the curator's note.
// No restaurant_id on purpose: DishListItem would turn the restaurant name into a
// link that navigates away without the unsaved-changes guard below.
function toListItem(dish, note) {
  return {
    dish_id: dish.dish_id || dish.id,
    dish_name: dish.dish_name || dish.name,
    restaurant_name: dish.restaurant_name,
    avg_rating: dish.avg_rating,
    total_votes: dish.total_votes,
    category: dish.category,
    note: note || '',
  }
}

export function MyList() {
  var navigate = useNavigate()
  var { user } = useAuth()
  // refetch: useMyLocalList returns it once the hook exposes React Query's refetch.
  var { listMeta, dishes, loading, error, refetch, saveList, saving } = useMyLocalList()

  // Rated-dish lookup — a curator can only put dishes they've given a number to
  // on their Top 10. Tapping an unrated dish opens an inline rate sheet first.
  var { votes, loading: votesLoading, refetch: refetchVotes } = useUserVotes(user && user.id)
  var ratedSet = {}
  votes.forEach(function (v) {
    if (v.rating_10 != null && v.dishes) ratedSet[v.dishes.id] = true
  })
  var [pendingRateDish, setPendingRateDish] = useState(null)
  var rateSheetRef = useFocusTrap(!!pendingRateDish, function () { setPendingRateDish(null) })

  // Local state for editing
  var [tagline, setTagline] = useState('')
  var [items, setItems] = useState([])
  var [searchQuery, setSearchQuery] = useState('')
  var [showSearch, setShowSearch] = useState(false)
  var [initialized, setInitialized] = useState(false)

  var { results: searchResults, loading: searchLoading, error: searchError } = useDishSearch(searchQuery, 20)

  // Initialize from server data (once). Runs for empty lists too, so a saved
  // tagline is seeded exactly once and never overwrites the curator's edits.
  useEffect(function () {
    if (initialized || loading || !listMeta) return
    setItems(dishes.map(function (d) { return toListItem(d, d.note) }))
    setTagline(listMeta.curatorTagline || '')
    setInitialized(true)
  }, [initialized, loading, listMeta, dishes])

  if (!loading && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4" style={{ background: 'var(--color-bg)' }}>
        <h1 className="sr-only">My Top 10</h1>
        <p role="alert" className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
          {error.message}
        </p>
        {refetch && (
          <button
            onClick={function () { refetch() }}
            className={PRIMARY_BUTTON_CLASS}
            style={PRIMARY_BUTTON_STYLE}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  // Not a curator — no list found
  if (!loading && !listMeta) {
    return (
      <div className="min-h-screen px-4" style={{ background: 'var(--color-bg)' }}>
        <h1 className="sr-only">My Top 10</h1>
        <EmptyState
          emoji="🔒"
          title="Local curators only"
          subtitle="You need an invite link to become a local curator."
          action={
            <button
              onClick={function () { navigate('/') }}
              className={PRIMARY_BUTTON_CLASS}
              style={PRIMARY_BUTTON_STYLE}
            >
              Go home
            </button>
          }
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="min-h-screen px-4 pt-5 animate-pulse"
        role="status"
        aria-label="Loading your list"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="rounded mb-2" style={{ width: 160, height: 32, background: 'var(--color-divider)' }} />
        <div className="rounded mb-6" style={{ width: 220, height: 13, background: 'var(--color-divider)' }} />
        {[0, 1, 2].map(function (i) { return <DishRowSkeleton key={i} /> })}
      </div>
    )
  }

  function addToItems(dish) {
    var dishId = dish.dish_id || dish.id
    setItems(function (prev) {
      if (prev.length >= 10) return prev
      if (prev.some(function (item) { return item.dish_id === dishId })) return prev
      return prev.concat([toListItem(dish, '')])
    })
    setSearchQuery('')
    setShowSearch(false)
  }

  function handleAddDish(dish) {
    // Votes still loading — the rated check would be wrong, so wait.
    if (votesLoading) return
    if (items.length >= 10) return
    var dishId = dish.dish_id || dish.id
    if (items.some(function (item) { return item.dish_id === dishId })) return

    // Gate: must have rated the dish first. Open the inline rate sheet and add
    // it automatically once a number is in.
    if (!ratedSet[dishId]) {
      setPendingRateDish(dish)
      return
    }
    addToItems(dish)
  }

  function handleRated() {
    if (pendingRateDish) addToItems(pendingRateDish)
    setPendingRateDish(null)
    if (refetchVotes) refetchVotes()
  }

  function handleRemoveDish(dishId) {
    setItems(function (prev) {
      return prev.filter(function (item) { return item.dish_id !== dishId })
    })
  }

  function handleMoveUp(index) {
    if (index === 0) return
    setItems(function (prev) {
      var copy = prev.slice()
      var temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  function handleMoveDown(index) {
    if (index >= items.length - 1) return
    setItems(function (prev) {
      var copy = prev.slice()
      var temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  function handleNoteChange(index, note) {
    setItems(function (prev) {
      var copy = prev.slice()
      copy[index] = Object.assign({}, copy[index], { note: note })
      return copy
    })
  }

  async function handleSave() {
    try {
      var payload = {
        tagline: tagline || null,
        items: items.map(function (item, i) {
          return {
            dish_id: item.dish_id,
            position: i + 1,
            note: item.note || null,
          }
        }),
      }
      var result = await saveList(payload)
      if (result && result.success) {
        toast.success(items.length > 0 ? 'Saved — your list is live' : 'Saved — list unpublished')
      } else {
        // The RPC returns readable strings in result.error
        toast.error((result && result.error) || 'Couldn’t save your list')
      }
    } catch (err) {
      logger.error('Save list error:', err)
      toast.error(getUserFacingMessage(err, 'saving your list'))
    }
  }

  // Unsaved edits live only in local state, so opening a dish would drop them
  var isDirty = initialized && (
    (tagline || '') !== ((listMeta && listMeta.curatorTagline) || '') ||
    items.length !== dishes.length ||
    items.some(function (item, i) {
      return item.dish_id !== dishes[i].dish_id || (item.note || '') !== (dishes[i].note || '')
    })
  )

  function handleOpenDish(dishId) {
    if (isDirty) {
      toast('Save your list first so your changes aren’t lost')
      return
    }
    navigate('/dish/' + dishId)
  }

  // Filter search results to exclude already-added dishes
  var addedIds = {}
  items.forEach(function (item) { addedIds[item.dish_id] = true })
  var filteredResults = searchResults.filter(function (dish) {
    return !addedIds[dish.dish_id || dish.id]
  })

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <h1 style={{ ...AMATIC_TITLE, fontSize: '32px' }}>
          My Top 10
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
          Pick up to 10 dishes visitors should try
        </p>
      </div>

      {/* Tagline */}
      <div className="px-4 mb-4">
        <label htmlFor="mylist-tagline" className={LABEL_CLASS} style={LABEL_STYLE}>
          Your tagline
        </label>
        <input
          id="mylist-tagline"
          type="text"
          value={tagline}
          onChange={function (e) { setTagline(e.target.value) }}
          placeholder="e.g. Manager at Nancy's, lifelong islander"
          maxLength={80}
          className={INPUT_CLASS}
          style={PAGE_INPUT_STYLE}
        />
        <p className="text-xs text-right mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {tagline.length}/80
        </p>
      </div>

      {/* Current items */}
      <div className="px-4">
        {items.length === 0 ? (
          <div
            className="rounded-xl text-center"
            style={{
              padding: '24px 16px',
              background: 'var(--color-surface-elevated)',
              border: '1px dashed var(--color-divider)',
            }}
          >
            <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
              No dishes yet — add your first pick below
            </p>
          </div>
        ) : (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map(function (item, i) {
              var isFirst = i === 0
              var isLastItem = i >= items.length - 1
              return (
                <li
                  key={item.dish_id}
                  style={{ borderBottom: isLastItem ? 'none' : '1px solid var(--color-divider)' }}
                >
                  <DishListItem
                    dish={item}
                    rank={i + 1}
                    hideVotes
                    isLast
                    onClick={function () { handleOpenDish(item.dish_id) }}
                  />

                  {/* Note + reorder / remove controls under the row */}
                  <div className="flex items-center gap-1" style={{ padding: '0 0 6px 10px' }}>
                    <input
                      type="text"
                      value={item.note}
                      onChange={function (e) { handleNoteChange(i, e.target.value) }}
                      placeholder="Add a quick note (optional)"
                      aria-label={'Note for ' + item.dish_name}
                      maxLength={120}
                      className="flex-1 min-w-0"
                      style={{
                        padding: '6px 8px',
                        fontSize: '12px',
                        fontStyle: item.note ? 'normal' : 'italic',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--color-divider)',
                        color: 'var(--color-text-secondary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={function () { handleMoveUp(i) }}
                      disabled={isFirst}
                      aria-label={'Move ' + item.dish_name + ' up'}
                      className={ICON_BUTTON}
                      style={{ color: isFirst ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)' }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={function () { handleMoveDown(i) }}
                      disabled={isLastItem}
                      aria-label={'Move ' + item.dish_name + ' down'}
                      className={ICON_BUTTON}
                      style={{ color: isLastItem ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)' }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={function () { handleRemoveDish(item.dish_id) }}
                      aria-label={'Remove ' + item.dish_name}
                      className={ICON_BUTTON}
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {/* Add dish section */}
      {items.length < 10 && (
        <div className="px-4 mt-4">
          {!showSearch ? (
            <button
              onClick={function () { setShowSearch(true) }}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-divider)',
                color: 'var(--color-text-primary)',
              }}
            >
              + Add a dish ({10 - items.length} remaining)
            </button>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-divider)',
              }}
            >
              <div className="flex items-center gap-2" style={{ padding: '4px 4px 4px 0', borderBottom: '1px solid var(--color-divider)' }}>
                <div className="relative flex-1">
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
                    type="search"
                    value={searchQuery}
                    onChange={function (e) { setSearchQuery(e.target.value) }}
                    placeholder="Search dishes…"
                    aria-label="Search dishes"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoFocus
                    className="w-full pl-10 pr-2 py-2.5 text-sm"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={function () { setShowSearch(false); setSearchQuery('') }}
                  className="inline-flex items-center min-h-[44px] px-3 text-sm font-semibold"
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>

              {/* Search results */}
              {searchQuery.trim().length >= 2 && (
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {searchLoading ? (
                    <DishAddRowSkeleton />
                  ) : searchError ? (
                    <p role="alert" className="text-sm px-4 py-3" style={{ color: 'var(--color-danger)' }}>
                      {getUserMessage(searchError, 'searching dishes')}
                    </p>
                  ) : filteredResults.length === 0 ? (
                    <p style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                      No dishes found
                    </p>
                  ) : (
                    filteredResults.slice(0, 8).map(function (dish) {
                      return (
                        <DishAddRow
                          key={dish.dish_id || dish.id}
                          dish={dish}
                          disabled={votesLoading}
                          onAdd={function () { handleAddDish(dish) }}
                        />
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save bar — floats above BottomNav like the Dish page action bar */}
      <div
        className="fixed left-0 right-0 px-3"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))', zIndex: 40 }}
      >
        <div
          className="flex gap-2 p-2 rounded-2xl"
          style={{
            background: 'var(--color-card)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15), 0 0 0 1px var(--color-divider)',
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className={'flex-1 ' + PRIMARY_BUTTON_CLASS}
            style={{ ...PRIMARY_BUTTON_STYLE, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : items.length > 0 ? 'Save & Publish' : 'Save (Unpublished)'}
          </button>
        </div>
      </div>

      {/* Rate-first sheet — a curator must give a dish a number before it can
          go on their Top 10. Once rated, it's added automatically. Portaled to
          body so it stacks above BottomNav. */}
      {pendingRateDish && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            aria-hidden="true"
            onClick={function () { setPendingRateDish(null) }}
          />
          <div
            ref={rateSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rate-sheet-title"
            className="relative w-full max-w-lg rounded-t-3xl overflow-y-auto overscroll-contain"
            style={{
              background: 'var(--color-surface-elevated)',
              maxHeight: '85vh',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-divider)' }} />
            </div>
            <div className="px-6 pb-4 border-b" style={{ borderColor: 'var(--color-divider)' }}>
              <h2 id="rate-sheet-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Rate it to add it
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {(pendingRateDish.dish_name || pendingRateDish.name)} &middot; {pendingRateDish.restaurant_name}
              </p>
            </div>
            <div className="px-6 pt-4">
              <ReviewFlow
                dishId={pendingRateDish.dish_id || pendingRateDish.id}
                dishName={pendingRateDish.dish_name || pendingRateDish.name}
                category={pendingRateDish.category}
                onVote={handleRated}
                onLoginRequired={function () { navigate('/login') }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
