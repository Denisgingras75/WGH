import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useDishSearch } from '../hooks/useDishSearch'
import { BROWSE_CATEGORIES } from '../constants/categories'
import { DishSearch } from '../components/DishSearch'
import { RadiusSheet } from '../components/LocationPicker'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { DishListItem } from '../components/DishListItem'
import { CategoryChips } from '../components/CategoryChips'
import { EmptyState } from '../components/EmptyState'
import { LocationBanner } from '../components/LocationBanner'
import { AddRestaurantModal } from '../components/AddRestaurantModal'
import { ModeFAB } from '../components/ModeFAB'
import { logger } from '../utils/logger'

var RestaurantMap = lazy(function () {
  return import('../components/restaurants/RestaurantMap').then(function (m) {
    return { default: m.RestaurantMap }
  })
})

export function Map() {
  var navigate = useNavigate()
  var routeLocation = useLocation()
  var { location, radius, setRadius, permissionState, requestLocation } = useLocationContext()

  var [mode, setMode] = useState('list')
  var [selectedCategory, setSelectedCategory] = useState(null)
  var [radiusSheetOpen, setRadiusSheetOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState('')
  var [searchLimit, setSearchLimit] = useState(10)
  var [focusDishId, setFocusDishId] = useState(null)
  var [highlightedDishId, setHighlightedDishId] = useState(null)
  var [pinSelected, setPinSelected] = useState(false)
  var [listLimit, setListLimit] = useState(10)
  var [addModalOpen, setAddModalOpen] = useState(false)
  var [addModalQuery, setAddModalQuery] = useState('')

  var mapRef = useRef(null)
  var listScrollRef = useRef(null)
  var scrollPositionRef = useRef(0)
  var highlightTimerRef = useRef(null)

  // Route state: "See on map" from dish detail
  var focusDishFromRoute = routeLocation.state?.focusDish || null

  useEffect(function () {
    if (focusDishFromRoute) {
      setMode('map')
      setFocusDishId(null)
      // Delay to let map component mount and restaurantGroups populate
      setTimeout(function () { setFocusDishId(focusDishFromRoute) }, 300)
      navigate('/', { replace: true, state: {} })
    }
  }, [focusDishFromRoute, navigate])

  // Mode toggle with scroll position save/restore
  var handleToggle = useCallback(function () {
    if (mode === 'list') {
      if (listScrollRef.current) {
        scrollPositionRef.current = listScrollRef.current.scrollTop
      }
      setMode('map')
    } else {
      setMode('list')
    }
  }, [mode])

  // Restore scroll position when switching back to list
  useEffect(function () {
    if (mode === 'list' && listScrollRef.current && scrollPositionRef.current > 0) {
      listScrollRef.current.scrollTop = scrollPositionRef.current
    }
  }, [mode])

  var handleSearchChange = useCallback(function (q) {
    setSearchQuery(q)
    setSearchLimit(10)
    if (q) setSelectedCategory(null)
  }, [])

  // Search results (no town filter — shows whole island)
  var searchData = useDishSearch(searchQuery, searchLimit, null)
  var searchResults = searchData.results
  var searchLoading = searchData.loading

  // Ranked dishes — single source of truth for both modes
  var rankedData = useDishes(location, radius, selectedCategory, null, null)
  var rankedDishes = rankedData.dishes
  var rankedLoading = rankedData.loading || rankedData.isFetching

  var selectedCategoryLabel = selectedCategory
    ? BROWSE_CATEGORIES.find(function (c) { return c.id === selectedCategory })
    : null

  var allRanked = rankedDishes || []
  var listDishes = selectedCategory ? allRanked.slice(0, listLimit) : allRanked.slice(0, 10)
  var mapDishes = allRanked.slice(0, 10)
  var hasMoreDishes = selectedCategory && allRanked.length > listLimit

  var dishesWithCoords = mapDishes.filter(function (d) {
    return d.restaurant_lat != null && d.restaurant_lng != null
  })

  var displayedOnMap = focusDishId
    ? dishesWithCoords.filter(function (d) { return d.dish_id === focusDishId })
    : (searchQuery && searchResults && searchResults.length > 0)
      ? searchResults.filter(function (d) { return d.restaurant_lat != null && d.restaurant_lng != null })
      : dishesWithCoords

  var listTitle = searchQuery
    ? 'Results'
    : selectedCategoryLabel
      ? 'Best ' + selectedCategoryLabel.label + ' Nearby'
      : 'Top Rated Nearby'

  var activeDishes = searchQuery ? searchResults : listDishes

  // Build dish rank map for mini-card display — based on what's actually shown
  var dishRanks = useMemo(function () {
    var ranks = {}
    var list = searchQuery ? (searchResults || []) : (mapDishes || [])
    for (var i = 0; i < list.length; i++) {
      ranks[list[i].dish_id] = i + 1
    }
    return ranks
  }, [searchQuery, searchResults, mapDishes])

  var rankingContext = useMemo(function () {
    if (searchQuery) return 'for \u201c' + searchQuery + '\u201d'
    var categoryLabel = selectedCategoryLabel ? selectedCategoryLabel.label : null
    if (categoryLabel) return categoryLabel + ' nearby'
    return 'nearby'
  }, [searchQuery, selectedCategoryLabel])

  // Map pin tap: show mini-card, hide floating controls
  var handlePinTap = useCallback(function (dishId) {
    logger.debug('Pin tapped, dishId:', dishId)
    setPinSelected(true)
    setHighlightedDishId(dishId)
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = setTimeout(function () {
      setHighlightedDishId(null)
    }, 1500)
  }, [])

  // Map background tap: dismiss mini-card, restore all pins, show controls
  var handleMapClick = useCallback(function () {
    setPinSelected(false)
    setFocusDishId(null)
  }, [])

  useEffect(function () {
    return function () {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <h1 className="sr-only">What's Good Here</h1>

      {/* LIST MODE */}
      {mode === 'list' && (
        <div
          className="fixed inset-0 flex flex-col"
          style={{
            background: 'var(--color-bg)',
            zIndex: 1,
          }}
        >
          {/* Fixed header: search + chips */}
          <div style={{ flexShrink: 0, background: 'var(--color-bg)', zIndex: 10 }}>
            {/* Search bar */}
            <div className="px-4 pt-3 pb-2" style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                borderRadius: '14px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
              }}>
                <DishSearch
                  loading={false}
                  placeholder="What are you craving?"
                  onSearchChange={handleSearchChange}
                  initialQuery={searchQuery}
                  rightSlot={
                    <button
                      onClick={function (e) { e.stopPropagation(); setRadiusSheetOpen(true) }}
                      aria-label={'Search radius: ' + radius + ' miles'}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold flex-shrink-0"
                      style={{
                        fontSize: '12px',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-divider)',
                        cursor: 'pointer',
                      }}
                    >
                      {radius} mi
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  }
                />
              </div>
            </div>

            {/* Location banner */}
            <div className="px-4">
              <LocationBanner
                permissionState={permissionState}
                requestLocation={requestLocation}
                message="Enable location to find the best food near you"
              />
            </div>

            {/* Category chips */}
            <CategoryChips
              selected={selectedCategory}
              onSelect={function (cat) { setSelectedCategory(cat); setSearchQuery(''); setListLimit(10) }}
              maxVisible={23}
            />
          </div>

          {/* Scrollable content */}
          <div
            ref={listScrollRef}
            className="flex-1 overflow-y-auto"
            style={{
              paddingBottom: '80px',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {/* Section title */}
            <div className="px-4 pt-2 pb-2">
              <h2 style={{
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
              }}>
                {listTitle}
              </h2>
            </div>

            {/* Dish list */}
            <div className="px-4 pb-4">
            {(searchQuery && searchLoading) || (!searchQuery && rankedLoading) ? (
              <ListSkeleton />
            ) : activeDishes && activeDishes.length > 0 ? (
              <>
                <div className="flex flex-col" style={{ gap: '2px' }}>
                  {activeDishes.map(function (dish, i) {
                    return (
                      <DishListItem
                        key={dish.dish_id}
                        dish={dish}
                        rank={i + 1}
                        showDistance
                        onClick={function () { navigate('/dish/' + dish.dish_id) }}
                      />
                    )
                  })}
                </div>
                {hasMoreDishes && !searchQuery && (
                  <button
                    onClick={function () { setListLimit(function (prev) { return prev + 5 }) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      marginTop: '8px',
                      background: 'none',
                      border: '1.5px solid var(--color-divider)',
                      borderRadius: '10px',
                      color: 'var(--color-accent-gold)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Show more
                  </button>
                )}
              </>
            ) : searchQuery ? (
              <EmptyState
                emoji="🔍"
                title={'No dishes found for \u201c' + searchQuery + '\u201d'}
              />
            ) : (
              <EmptyState
                emoji="🍽️"
                title="No dishes found nearby"
              />
            )}
          </div>
        </div>
        </div>
      )}

      {/* MAP MODE */}
      {mode === 'map' && (
        <>
          {/* Full-screen map */}
          <div className="fixed inset-0" style={{ zIndex: 1 }}>
            <ErrorBoundary>
              <Suspense fallback={
                <div className="w-full h-full" style={{ background: 'var(--color-bg)' }} />
              }>
                <RestaurantMap
                  mode="dish"
                  dishes={displayedOnMap}
                  userLocation={location}
                  onSelectDish={handlePinTap}
                  radiusMi={radius}
                  permissionGranted={permissionState === 'granted'}
                  fullScreen
                  focusDishId={focusDishId}
                  mapRef={mapRef}
                  onMapClick={handleMapClick}
                  dishRanks={dishRanks}
                  rankingContext={rankingContext}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Floating controls: search + zoom (hidden when pin selected) */}
          <div
            className="fixed left-0 right-0"
            style={{
              top: 'env(safe-area-inset-top, 0px)',
              zIndex: 15,
              padding: '12px 12px 0',
              pointerEvents: 'none',
              opacity: pinSelected ? 0 : 1,
              transition: 'opacity 200ms ease',
            }}
          >
            <div className="flex items-center gap-2" style={{ pointerEvents: pinSelected ? 'none' : 'auto' }}>
              <MapZoomButton label="Zoom in" direction="in" mapRef={mapRef} />
              <div className="flex-1" style={{
                borderRadius: '14px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
              }}>
                <DishSearch
                  loading={false}
                  placeholder="What are you craving?"
                  onSearchChange={handleSearchChange}
                  initialQuery={searchQuery}
                  rightSlot={
                    <button
                      onClick={function (e) { e.stopPropagation(); setRadiusSheetOpen(true) }}
                      aria-label={'Search radius: ' + radius + ' miles'}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold flex-shrink-0"
                      style={{
                        fontSize: '12px',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-divider)',
                        cursor: 'pointer',
                      }}
                    >
                      {radius} mi
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  }
                />
              </div>
              <MapZoomButton label="Zoom out" direction="out" mapRef={mapRef} />
            </div>
          </div>
        </>
      )}

      {/* Floating Check In button (list mode only) */}
      {mode === 'list' && (
        <button
          onClick={function () { setAddModalQuery(''); setAddModalOpen(true) }}
          className="fixed right-4 flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm active:scale-95 transition-all"
          style={{
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            zIndex: 40,
            background: 'var(--color-accent-gold)',
            color: 'var(--color-bg)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Check In
        </button>
      )}

      {/* Toggle FAB (both modes) */}
      <ModeFAB mode={mode} onToggle={handleToggle} />

      <RadiusSheet
        isOpen={radiusSheetOpen}
        onClose={function () { setRadiusSheetOpen(false) }}
        radius={radius}
        onRadiusChange={setRadius}
      />

      {/* Add Restaurant Modal */}
      <AddRestaurantModal
        isOpen={addModalOpen}
        onClose={function () { setAddModalOpen(false) }}
        initialQuery={addModalQuery}
      />
    </div>
  )
}

function MapZoomButton({ label, direction, mapRef }) {
  var handleClick = useCallback(function () {
    if (!mapRef.current) return
    if (direction === 'in') {
      mapRef.current.zoomIn()
    } else {
      mapRef.current.zoomOut()
    }
  }, [mapRef, direction])

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'var(--color-surface-elevated)',
        border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        fontSize: '20px',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
      }}
    >
      {direction === 'in' ? '+' : '\u2212'}
    </button>
  )
}

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      {[0, 1, 2, 3].map(function (i) {
        return (
          <div key={i} className="flex items-center gap-3 py-3 px-3">
            <div className="w-7 h-5 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="w-6 h-6 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="flex-1">
              <div className="h-4 w-28 rounded mb-1" style={{ background: 'var(--color-divider)' }} />
              <div className="h-3 w-20 rounded" style={{ background: 'var(--color-divider)' }} />
            </div>
            <div className="h-5 w-8 rounded" style={{ background: 'var(--color-divider)' }} />
          </div>
        )
      })}
    </div>
  )
}
