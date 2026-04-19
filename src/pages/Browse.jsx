import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useUserVotes } from '../hooks/useUserVotes'
import { useDishSearch } from '../hooks/useDishSearch'
import { useFavorites } from '../hooks/useFavorites'

import { getStorageItem, setStorageItem } from '../lib/storage'
import { BROWSE_CATEGORIES } from '../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getPendingVoteFromStorage } from '../lib/storage'
import { LoginModal } from '../components/Auth/LoginModal'
import { AddRestaurantModal } from '../components/AddRestaurantModal'
import { ImpactFeedback, getImpactMessage } from '../components/ImpactFeedback'
import { RadiusSheet } from '../components/LocationPicker'
import { DishSearch } from '../components/DishSearch'
import { DishListItemEditorial } from '../components/DishListItemEditorial'
import { CategoryChipStrip } from '../components/home/CategoryChipStrip'
import { LocationBanner } from '../components/LocationBanner'
import { getRelatedSuggestions } from '../constants/searchSuggestions'

var CATEGORIES = BROWSE_CATEGORIES

var SORT_OPTIONS = [
  { id: 'top_rated', label: 'Top' },
  { id: 'best_value', label: 'Value' },
  { id: 'most_voted', label: 'Voted' },
  { id: 'closest', label: 'Near' },
]

export function Browse() {
  var [searchParams, setSearchParams] = useSearchParams()
  var navigate = useNavigate()
  var { user } = useAuth()
  var [selectedCategory, setSelectedCategory] = useState(null)
  var [searchQuery, setSearchQuery] = useState('')
  var [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  var [loginModalOpen, setLoginModalOpen] = useState(false)
  var [addRestaurantQuery, setAddRestaurantQuery] = useState(null)
  var [impactFeedback, setImpactFeedback] = useState(null)
  var [pendingVoteData, setPendingVoteData] = useState(null)
  var [sortBy, setSortBy] = useState(function () { return getStorageItem('browse_sort') || 'top_rated' })

  var { location, radius, setRadius, permissionState, requestLocation, isUsingDefault } = useLocationContext()
  var [showRadiusSheet, setShowRadiusSheet] = useState(false)
  var userVotesData = useUserVotes(user ? user.id : null)

  // Search results from API using React Query hook
  var dishSearchData = useDishSearch(debouncedSearchQuery, 50, {
    lat: location ? location.lat : null,
    lng: location ? location.lng : null,
    radiusMiles: radius,
    isUsingDefault: isUsingDefault,
  })
  var searchResults = dishSearchData.results
  var searchLoading = dishSearchData.loading

  var beforeVoteRef = useRef(null)
  var votingDishId = new URLSearchParams(window.location.search).get('votingDish')

  // Handle category and search query from URL params (when coming from home page)
  useEffect(function () {
    var categoryFromUrl = searchParams.get('category')
    var queryFromUrl = searchParams.get('q')

    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
      setSearchQuery('')
      setDebouncedSearchQuery('')
    } else if (queryFromUrl) {
      setSearchQuery(queryFromUrl)
      setDebouncedSearchQuery(queryFromUrl)
      setSelectedCategory(null)
    } else {
      setSelectedCategory(null)
      setSearchQuery('')
      setDebouncedSearchQuery('')
    }
  }, [searchParams, navigate])

  // Debounce search query by 300ms
  useEffect(function () {
    if (!selectedCategory && !debouncedSearchQuery) {
      return
    }
    var timer = setTimeout(function () {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return function () { clearTimeout(timer) }
  }, [searchQuery, selectedCategory, debouncedSearchQuery])

  // Handle sort change
  var handleSortChange = function (sortId) {
    setSortBy(sortId)
    setStorageItem('browse_sort', sortId)
  }

  // Only fetch from useDishes when browsing by category (NOT when text searching)
  var shouldFetchFromUseDishes = selectedCategory && !debouncedSearchQuery.trim()

  var dishesData = useDishes(
    shouldFetchFromUseDishes ? location : null,
    radius,
    selectedCategory,
    null
  )
  var dishes = dishesData.dishes
  var loading = dishesData.loading
  var error = dishesData.error

  var favoritesData = useFavorites(user ? user.id : null)
  var isFavorite = favoritesData.isFavorite
  var toggleFavorite = favoritesData.toggleFavorite

  // Helper to find dish rank in current list
  var getDishRank = useCallback(function (dishId, dishList) {
    var ranked = (dishList || []).filter(function (d) { return (d.total_votes || 0) >= MIN_VOTES_FOR_RANKING })
    var index = ranked.findIndex(function (d) { return d.dish_id === dishId })
    return index === -1 ? 999 : index + 1
  }, [])

  // Navigate to full dish page
  var openDishPage = useCallback(function (dish) {
    navigate('/dish/' + dish.dish_id)
  }, [navigate])

  // Auto-navigate to dish page after OAuth/magic link login if there's a pending vote
  useEffect(function () {
    if (!user || !dishes || !dishes.length) return

    var pending = getPendingVoteFromStorage()
    var dishIdToOpen = votingDishId || (pending && pending.dishId)

    if (!dishIdToOpen) return

    var dish = dishes.find(function (d) { return d.dish_id === dishIdToOpen })
    if (!dish) return

    if (votingDishId) {
      var newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('votingDish')
      window.history.replaceState({}, '', newUrl.pathname + newUrl.search)
    }

    openDishPage(dish)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dishes, openDishPage])

  // Calculate impact when dishes update after voting
  useEffect(function () {
    if (!pendingVoteData || !dishes || !dishes.length) return

    var after = dishes.find(function (d) { return d.dish_id === pendingVoteData.dish_id })
    if (!after) return

    if (after.total_votes > pendingVoteData.total_votes) {
      var afterRank = getDishRank(pendingVoteData.dish_id, dishes)
      var impact = getImpactMessage(
        pendingVoteData, after, pendingVoteData.rank, afterRank
      )
      setImpactFeedback(impact)
      setPendingVoteData(null)
    }
  }, [dishes, pendingVoteData, setImpactFeedback, getDishRank])

  var handleToggleFavorite = async function (dishId) {
    if (!user) {
      setLoginModalOpen(true)
      return
    }
    try {
      await toggleFavorite(dishId)
    } catch (err) {
      logger.error('Failed to toggle favorite:', err)
    }
  }

  var handleCategoryChange = function (categoryId) {
    setSelectedCategory(categoryId)
    setSearchQuery('')
    setDebouncedSearchQuery('')
    if (categoryId) {
      setSearchParams({ category: categoryId })
    } else {
      setSearchParams({})
    }
  }

  // Go back to Home page
  var handleBackToCategories = function () {
    navigate('/')
  }

  // Filter and sort dishes
  var filteredDishes = useMemo(function () {
    var source = debouncedSearchQuery.trim() ? searchResults : dishes
    var result = (Array.isArray(source) ? source : []).filter(function (d) { return d && d.dish_id })

    switch (sortBy) {
      case 'best_value':
        result = result.slice().sort(function (a, b) {
          var aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          var bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          if (aRanked && !bRanked) return -1
          if (!aRanked && bRanked) return 1
          var aVal = a.value_percentile != null ? Number(a.value_percentile) : -1
          var bVal = b.value_percentile != null ? Number(b.value_percentile) : -1
          if (bVal !== aVal) return bVal - aVal
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        })
        break
      case 'most_voted':
        result = result.slice().sort(function (a, b) {
          return (b.total_votes || 0) - (a.total_votes || 0)
        })
        break
      case 'closest':
        result = result.slice().sort(function (a, b) {
          var aDist = a.distance_miles != null ? Number(a.distance_miles) : 9999
          var bDist = b.distance_miles != null ? Number(b.distance_miles) : 9999
          if (aDist !== bDist) return aDist - bDist
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        })
        break
      case 'top_rated':
      default:
        result = result.slice().sort(function (a, b) {
          var aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          var bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          if (aRanked && !bRanked) return -1
          if (!aRanked && bRanked) return 1
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        })
        break
    }

    return result
  }, [dishes, debouncedSearchQuery, sortBy, searchResults])

  // Handle search input change (from DishSearch)
  var handleSearchChange = useCallback(function (q) {
    setSearchQuery(q)
    if (q && q.trim().length >= 2) {
      setSelectedCategory(null)
      setDebouncedSearchQuery(q.trim())
      setSearchParams({ q: q.trim() })
    } else if (!q) {
      setDebouncedSearchQuery('')
      if (!selectedCategory) setSearchParams({})
    }
  }, [setSearchParams, selectedCategory])

  // Handle search suggestion click from empty state
  var handleSearchSuggestionClick = useCallback(function (suggestion) {
    setSearchQuery(suggestion)
    setDebouncedSearchQuery(suggestion)
    setSearchParams({ q: suggestion })
  }, [setSearchParams])

  var handleBookmark = function (dish) {
    handleToggleFavorite(dish.dish_id)
  }

  // Editorial headline based on state
  var kicker = debouncedSearchQuery.trim()
    ? 'Search · results'
    : selectedCategory
      ? 'Rank · ' + (CATEGORIES.find(function (c) { return c.id === selectedCategory }) || {}).label
      : 'Rank · Martha\u2019s Vineyard'

  var headline = debouncedSearchQuery.trim()
    ? '\u201C' + debouncedSearchQuery.trim() + '\u201D'
    : selectedCategory
      ? 'The week\u2019s ranking'
      : 'What locals actually order'

  var isLoading = loading || searchLoading
  var showEmpty = !isLoading && !error && filteredDishes.length === 0
  var showList = !isLoading && !error && filteredDishes.length > 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <h1 className="sr-only">Browse Dishes</h1>

      {/* Header with back + search */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={function () { navigate('/') }}
          aria-label="Back to home"
          className="press"
          style={{
            border: '1px solid var(--rule)',
            background: 'var(--card, var(--paper-2))',
            borderRadius: 10,
            padding: 8,
            display: 'inline-flex',
            cursor: 'pointer',
            color: 'var(--ink-2)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <DishSearch
            loading={false}
            placeholder="Search a dish, restaurant, or 'lobster roll'…"
            onSearchChange={handleSearchChange}
            initialQuery={searchQuery}
          />
        </div>
      </div>

      {/* Category chip strip */}
      <CategoryChipStrip
        active={selectedCategory}
        onSelect={handleCategoryChange}
      />

      {/* Editorial section header — kicker + Fraunces italic */}
      <div style={{ padding: '8px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
            {kicker}
          </div>
          <h2 className="serif" style={{ margin: '4px 0 0', fontWeight: 900, fontStyle: 'italic', fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--ink)' }}>
            {headline}
          </h2>
        </div>
        <button
          onClick={function () { setShowRadiusSheet(true) }}
          aria-label={'Search radius: ' + radius + ' miles. Tap to change'}
          className="chip press"
          style={{ cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {radius === 0 ? 'All' : radius + ' mi'}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Sort seg control */}
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div className="seg" role="tablist" aria-label="Sort dishes">
          {SORT_OPTIONS.map(function (opt) {
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={sortBy === opt.id}
                className={sortBy === opt.id ? 'on' : ''}
                onClick={function () { handleSortChange(opt.id) }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
          {isLoading ? 'loading\u2026' : (filteredDishes.length + (filteredDishes.length === 1 ? ' dish' : ' dishes'))}
        </span>
      </div>

      {/* Location banner */}
      <div style={{ padding: '0 20px' }}>
        <LocationBanner
          permissionState={permissionState}
          requestLocation={requestLocation}
        />
      </div>

      {/* Results */}
      <div style={{ padding: '0 6px 80px' }}>
        {isLoading ? (
          <div className="animate-pulse">
            {[0, 1, 2, 3, 4].map(function (i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px', borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ width: 38, height: 32, borderRadius: 4, background: 'var(--paper-2)' }} />
                  <div style={{ width: 68, height: 68, borderRadius: 10, background: 'var(--paper-2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '60%', borderRadius: 4, background: 'var(--paper-2)', marginBottom: 6 }} />
                    <div style={{ height: 10, width: '40%', borderRadius: 4, background: 'var(--paper-2)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : error ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
              Error
            </div>
            <p role="alert" className="serif" style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--tomato)', margin: 0 }}>
              {(error && error.message) || 'Something went wrong'}
            </p>
            <button
              onClick={function () { window.location.reload() }}
              className="press"
              style={{
                marginTop: 16,
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid var(--rule)',
                background: 'var(--ink)',
                color: 'var(--paper)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : showEmpty ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
              No results
            </div>
            <p className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 800, color: 'var(--ink)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
              {debouncedSearchQuery
                ? 'Nothing found for \u201C' + debouncedSearchQuery + '\u201D'
                : 'No dishes in this category yet'}
            </p>
            {debouncedSearchQuery ? (
              <>
                <p className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 12px' }}>
                  Try instead
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  {getRelatedSuggestions(debouncedSearchQuery).map(function (s) {
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={function () { handleSearchSuggestionClick(s) }}
                        className="chip press"
                        style={{ cursor: 'pointer' }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}
            <button
              onClick={handleBackToCategories}
              className="press"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: 0,
                background: 'var(--tomato)',
                color: 'var(--paper)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Browse categories
            </button>
          </div>
        ) : showList ? (
          <div>
            {filteredDishes.slice(0, 10).map(function (dish, i, arr) {
              return (
                <DishListItemEditorial
                  key={dish.dish_id}
                  dish={dish}
                  rank={i + 1}
                  bookmarked={isFavorite ? isFavorite(dish.dish_id) : false}
                  onBookmark={handleBookmark}
                  isLast={i === Math.min(arr.length, 10) - 1 && filteredDishes.length <= 10}
                />
              )
            })}

            {filteredDishes.length > 10 ? (
              <details style={{ marginTop: 14, padding: '0 14px' }}>
                <summary
                  className="mono press"
                  style={{
                    cursor: 'pointer',
                    padding: '12px 14px',
                    textAlign: 'center',
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--rule)',
                    borderRadius: 10,
                    listStyle: 'none',
                  }}
                >
                  Show {filteredDishes.length - 10} more
                </summary>
                <div style={{ marginTop: 8 }}>
                  {filteredDishes.slice(10).map(function (dish, i, arr) {
                    return (
                      <DishListItemEditorial
                        key={dish.dish_id}
                        dish={dish}
                        rank={i + 11}
                        bookmarked={isFavorite ? isFavorite(dish.dish_id) : false}
                        onBookmark={handleBookmark}
                        isLast={i === arr.length - 1}
                      />
                    )
                  })}
                </div>
              </details>
            ) : null}
          </div>
        ) : null}

        {showList ? (
          <div style={{ marginTop: 32, padding: '20px 20px 0', textAlign: 'center', borderTop: '1px solid var(--rule)' }}>
            <p className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: 0 }}>
              {filteredDishes.length + ' ' + (filteredDishes.length === 1 ? 'dish' : 'dishes') + ' \u00B7 end'}
            </p>
          </div>
        ) : null}
      </div>

      <RadiusSheet
        isOpen={showRadiusSheet}
        onClose={function () { setShowRadiusSheet(false) }}
        radius={radius}
        onRadiusChange={setRadius}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={function () { setLoginModalOpen(false) }}
      />

      <AddRestaurantModal
        isOpen={addRestaurantQuery !== null}
        onClose={function () { setAddRestaurantQuery(null) }}
        initialQuery={addRestaurantQuery || ''}
      />

      <ImpactFeedback
        impact={impactFeedback}
        onClose={function () { setImpactFeedback(null) }}
      />
    </div>
  )
}
