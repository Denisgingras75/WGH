import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useDishSearch } from '../hooks/useDishSearch'
import { BROWSE_CATEGORIES } from '../constants/categories'
import { BottomSheet } from '../components/BottomSheet'
import { DishSearch } from '../components/DishSearch'
import { RadiusSheet } from '../components/LocationPicker'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { DishListItem } from '../components/DishListItem'
import { CategoryChips } from '../components/CategoryChips'
import { EmptyState } from '../components/EmptyState'
import { logger } from '../utils/logger'

var RestaurantMap = lazy(function () {
  return import('../components/restaurants/RestaurantMap').then(function (m) {
    return { default: m.RestaurantMap }
  })
})

export function Map() {
  var navigate = useNavigate()
  var { location, radius, setRadius, permissionState } = useLocationContext()

  var [selectedCategory, setSelectedCategory] = useState(null)
  var [radiusSheetOpen, setRadiusSheetOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState('')
  var [searchLimit, setSearchLimit] = useState(10)
  var [sheetDetent, setSheetDetent] = useState('half')
  var [highlightedDishId, setHighlightedDishId] = useState(null)
  var [focusDishId, setFocusDishId] = useState(null)
  var [pinSelected, setPinSelected] = useState(false)

  var sheetRef = useRef(null)
  var highlightTimerRef = useRef(null)
  var mapRef = useRef(null)

  var handleSearchChange = useCallback(function (q) {
    setSearchQuery(q)
    setSearchLimit(10)
    if (q) setSelectedCategory(null)
  }, [])

  // Search results (no town filter — map shows whole island)
  var searchData = useDishSearch(searchQuery, searchLimit, null)
  var searchResults = searchData.results
  var searchLoading = searchData.loading

  // Ranked dishes — single source of truth for both list and map pins
  var rankedData = useDishes(location, radius, selectedCategory, null, null)
  var rankedDishes = rankedData.dishes

  var selectedCategoryLabel = selectedCategory
    ? BROWSE_CATEGORIES.find(function (c) { return c.id === selectedCategory })
    : null

  // ─── List item tap: collapse sheet + fly to pin ─────────
  var handleListItemTap = useCallback(function (dishId) {
    if (sheetRef.current) {
      sheetRef.current.setDetent('peek')
    }
    setFocusDishId(null)
    setTimeout(function () { setFocusDishId(dishId) }, 0)
    setHighlightedDishId(dishId)
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = setTimeout(function () {
      setHighlightedDishId(null)
    }, 2000)
  }, [])

  // ─── Map background tap: dismiss mini-card ─────────
  var handleMapClick = useCallback(function () {
    setPinSelected(false)
  }, [])

  // ─── Map pin tap: open sheet + scroll to dish ─────────
  var handlePinTap = useCallback(function (dishId) {
    logger.debug('Pin tapped, dishId:', dishId)
    setPinSelected(true)

    if (sheetRef.current) {
      sheetRef.current.setDetent('half')
    }

    setHighlightedDishId(dishId)

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }

    highlightTimerRef.current = setTimeout(function () {
      setHighlightedDishId(null)
    }, 1500)

    setTimeout(function () {
      var contentEl = sheetRef.current && sheetRef.current.getContentEl()
      if (!contentEl) return
      var dishEl = contentEl.querySelector('[data-dish-id="' + dishId + '"]')
      if (dishEl) {
        dishEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 350)
  }, [])

  useEffect(function () {
    return function () {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  var sortedDishes = rankedDishes ? rankedDishes.slice(0, 10) : []

  // Only show dishes with valid coordinates on the map
  var dishesWithCoords = sortedDishes.filter(function (d) {
    return d.restaurant_lat != null && d.restaurant_lng != null
  })

  var displayedOnMap = (searchQuery && searchResults && searchResults.length > 0)
    ? searchResults.filter(function (d) { return d.restaurant_lat != null && d.restaurant_lng != null })
    : dishesWithCoords

  var listTitle = searchQuery
    ? 'Results'
    : selectedCategoryLabel
      ? 'Best ' + selectedCategoryLabel.label + ' Nearby'
      : 'Top Rated Nearby'

  var activeDishes = searchQuery ? searchResults : sortedDishes

  // Build dish rank map for mini-card display
  var dishRanks = useMemo(function () {
    var ranks = {}
    var list = activeDishes || []
    for (var i = 0; i < list.length; i++) {
      ranks[list[i].dish_id] = i + 1
    }
    return ranks
  }, [activeDishes])

  // Ranking context label for the mini-card
  var rankingContext = useMemo(function () {
    var categoryLabel = selectedCategoryLabel ? selectedCategoryLabel.label : null
    if (categoryLabel) return categoryLabel + ' nearby'
    return 'nearby'
  }, [selectedCategoryLabel])

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--color-bg)' }}>
      <h1 className="sr-only">Dish Map</h1>

      {/* ─── Full-screen map ─── */}
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

      {/* ─── Floating controls (hidden when pin selected) ─── */}
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
        {/* Row: [+] [search] [-] with radius top-right */}
        <div className="flex items-center gap-2" style={{ pointerEvents: pinSelected ? 'none' : 'auto' }}>
          {/* Zoom in */}
          <MapZoomButton label="Zoom in" direction="in" mapRef={mapRef} />

          {/* Search bar */}
          <div className="flex-1" style={{
            borderRadius: '14px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          }}>
            <DishSearch
              loading={false}
              placeholder="What are you craving?"
              onSearchChange={handleSearchChange}
            />
          </div>

          {/* Zoom out */}
          <MapZoomButton label="Zoom out" direction="out" mapRef={mapRef} />
        </div>

        {/* Radius — tucked top-right below search row */}
        <div className="flex justify-end" style={{ marginTop: '8px', pointerEvents: pinSelected ? 'none' : 'auto' }}>
          <button
            onClick={function () { setRadiusSheetOpen(true) }}
            aria-label={'Search radius: ' + radius + ' miles'}
            className="flex items-center gap-1 px-3 py-2 rounded-xl font-bold"
            style={{
              fontSize: '13px',
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)',
              border: 'none',
              minHeight: '36px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            }}
          >
            {radius} mi
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Bottom sheet discovery panel ─── */}
      <BottomSheet ref={sheetRef} initialDetent={0.35} onDetentChange={setSheetDetent}>
        {/* Category chips */}
        <CategoryChips
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          sticky
          maxVisible={23}
        />

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
          {searchQuery && searchLoading ? (
            <MapListSkeleton />
          ) : activeDishes && activeDishes.length > 0 ? (
            <div className="flex flex-col" style={{ gap: '2px' }}>
              {activeDishes.map(function (dish, i) {
                return (
                  <DishListItem
                    key={dish.dish_id}
                    dish={dish}
                    rank={i + 1}
                    highlighted={highlightedDishId === dish.dish_id}
                    showDistance
                    onClick={function () { handleListItemTap(dish.dish_id) }}
                  />
                )
              })}
            </div>
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
      </BottomSheet>

      <RadiusSheet
        isOpen={radiusSheetOpen}
        onClose={function () { setRadiusSheetOpen(false) }}
        radius={radius}
        onRadiusChange={setRadius}
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

function MapListSkeleton() {
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
