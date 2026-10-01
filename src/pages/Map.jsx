import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useDishSearch } from '../hooks/useDishSearch'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { DishSearch } from '../components/DishSearch'
import { RadiusSheet } from '../components/LocationPicker'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ModeFAB } from '../components/ModeFAB'
import { HomeListMode, MapCategoryBar, RadiusChip } from '../components/home'
import { getSessionItem, setSessionItem, STORAGE_KEYS } from '../lib/storage'
import { logger } from '../utils/logger'

var RestaurantMap = lazy(function () {
  return import('../components/restaurants/RestaurantMap').then(function (m) {
    return { default: m.RestaurantMap }
  })
})

var SEARCH_LIMIT = 10

function hasCoords(d) {
  return d.restaurant_lat != null && d.restaurant_lng != null
}

export function Map() {
  var navigate = useNavigate()
  var routeLocation = useLocation()
  var { location, radius, setRadius, permissionState, requestLocation } = useLocationContext()

  var [mode, setMode] = useState(function () {
    return getSessionItem(STORAGE_KEYS.HOME_MODE) || 'list'
  })
  var [selectedCategory, setSelectedCategory] = useState(null)
  // Carousel category to restore when returning from map mode
  var [listReturnCategory, setListReturnCategory] = useState(null)
  var [radiusSheetOpen, setRadiusSheetOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState('')
  var [focusDishId, setFocusDishId] = useState(null)
  var [pinSelected, setPinSelected] = useState(false)
  var [mapCategory, setMapCategory] = useState(null)

  var mapRef = useRef(null)
  var listScrollRef = useRef(null)
  var scrollPositionRef = useRef(0)

  // Route state: "See on map" from dish detail
  var focusDishFromRoute = routeLocation.state?.focusDish || null

  useEffect(function () {
    if (focusDishFromRoute) {
      setMode('map')
      setSessionItem(STORAGE_KEYS.HOME_MODE, 'map')
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
      // Inherit active category from list mode, and remember it for the trip back
      setMapCategory(selectedCategory)
      setListReturnCategory(selectedCategory)
      setMode('map')
      setSessionItem(STORAGE_KEYS.HOME_MODE, 'map')
    } else {
      setMode('list')
      setSessionItem(STORAGE_KEYS.HOME_MODE, 'list')
    }
  }, [mode, selectedCategory])

  // Restore scroll position when switching back to list
  useEffect(function () {
    if (mode === 'list' && listScrollRef.current && scrollPositionRef.current > 0) {
      listScrollRef.current.scrollTop = scrollPositionRef.current
    }
  }, [mode])

  var handleRadiusSheetOpen = useCallback(function () {
    setRadiusSheetOpen(true)
  }, [])

  var handleSearchChange = useCallback(function (q) {
    setSearchQuery(q)
    if (q) {
      setSelectedCategory(null)
      setListReturnCategory(null)
    }
  }, [])

  // Search results (no town filter — shows whole island)
  var searchData = useDishSearch(searchQuery, SEARCH_LIMIT, {
    lat: location ? location.lat : null,
    lng: location ? location.lng : null,
    radiusMiles: radius,
    isUsingDefault: permissionState !== 'granted',
  })
  var searchResults = searchData.results
  var searchLoading = searchData.loading
  var searchError = searchData.error

  // Ranked dishes — single source of truth for both modes
  // Always fetch ALL dishes — carousel does client-side category filtering
  var rankedData = useDishes(location, radius, null, null, null)
  // Initial load only — a background refetch keeps the cached list on screen
  var rankedLoading = rankedData.loading
  var rankedErrorMessage = rankedData.error ? rankedData.error.message : null

  var allRanked = useMemo(function () {
    return rankedData.dishes || []
  }, [rankedData.dishes])
  var listDishes = useMemo(function () {
    return allRanked.slice(0, 10)
  }, [allRanked])

  // Map pins: filter by mapCategory (inherited from list or set via floating bar)
  var mapDishes = useMemo(function () {
    if (mapCategory) {
      return allRanked.filter(function (d) {
        return d.category && d.category.toLowerCase() === mapCategory.toLowerCase()
      }).slice(0, 10)
    }
    return allRanked.slice(0, 10)
  }, [allRanked, mapCategory])

  var dishesWithCoords = useMemo(function () {
    return mapDishes.filter(hasCoords)
  }, [mapDishes])

  var searchPins = useMemo(function () {
    return (searchResults || []).filter(hasCoords)
  }, [searchResults])

  var displayedOnMap = useMemo(function () {
    if (focusDishId) {
      return dishesWithCoords.filter(function (d) { return d.dish_id === focusDishId })
    }
    return searchQuery ? searchPins : dishesWithCoords
  }, [focusDishId, dishesWithCoords, searchQuery, searchPins])

  var activeDishes = useMemo(function () {
    return searchQuery ? searchResults : listDishes
  }, [searchQuery, searchResults, listDishes])

  // Build dish rank map for mini-card display — based on what's actually shown
  var dishRanks = useMemo(function () {
    var ranks = {}
    var list = searchQuery ? (searchResults || []) : (mapDishes || [])
    for (var i = 0; i < list.length; i++) {
      ranks[list[i].dish_id] = i + 1
    }
    return ranks
  }, [searchQuery, searchResults, mapDishes])

  // Editorial: top rated restaurant (highest avg across ranked dishes, min 2 dishes)
  var topRestaurant = useMemo(function () {
    if (!allRanked || allRanked.length === 0) return null
    var restaurants = {}
    allRanked.forEach(function (d) {
      if (!d.restaurant_name || !d.avg_rating) return
      if ((d.total_votes || 0) < MIN_VOTES_FOR_RANKING) return
      var rid = d.restaurant_id
      if (!restaurants[rid]) {
        restaurants[rid] = { name: d.restaurant_name, id: rid, ratings: [], count: 0 }
      }
      restaurants[rid].ratings.push(Number(d.avg_rating))
      restaurants[rid].count++
    })
    var best = null
    Object.keys(restaurants).forEach(function (rid) {
      var r = restaurants[rid]
      if (r.count < 2) return
      var avg = r.ratings.reduce(function (a, b) { return a + b }, 0) / r.ratings.length
      if (!best || avg > best.avg) {
        best = { name: r.name, id: r.id, avg: Math.round(avg * 10) / 10, count: r.count }
      }
    })
    return best
  }, [allRanked])

  // Editorial: most talked about dish (highest vote count)
  var mostVotedDish = useMemo(function () {
    if (!allRanked || allRanked.length === 0) return null
    var top = null
    allRanked.forEach(function (d) {
      if (!top || (d.total_votes || 0) > (top.total_votes || 0)) {
        top = d
      }
    })
    if (!top || !(top.total_votes > 0)) return null
    return top
  }, [allRanked])

  // Editorial: best meal under $15 (excludes desserts, coffee, sides, apps, fries)
  var bestValueMeal = useMemo(function () {
    if (!allRanked || allRanked.length === 0) return null
    var excludeCategories = new Set([
      'dessert', 'donuts', 'ice cream', 'coffee', 'sides', 'fries',
      'apps', 'onion rings', 'veggies', 'bakery',
    ])
    var candidates = allRanked.filter(function (d) {
      return d.price && Number(d.price) > 0 && Number(d.price) <= 15
        && (d.total_votes || 0) >= MIN_VOTES_FOR_RANKING
        && d.avg_rating
        && !excludeCategories.has((d.category || '').toLowerCase())
    })
    if (candidates.length === 0) return null
    var best = null
    candidates.forEach(function (d) {
      if (!best || Number(d.avg_rating || 0) > Number(best.avg_rating || 0)) {
        best = d
      }
    })
    return best
  }, [allRanked])

  // Editorial: best ice cream dish
  var bestIceCream = useMemo(function () {
    if (!allRanked || allRanked.length === 0) return null
    var candidates = allRanked.filter(function (d) {
      var name = (d.dish_name || d.name || '').toLowerCase()
      var cat = (d.category || '').toLowerCase()
      return (cat === 'ice cream' || name.indexOf('ice cream') !== -1
        || name.indexOf('gelato') !== -1 || name.indexOf('sundae') !== -1
        || name.indexOf('soft serve') !== -1 || name.indexOf('frappe') !== -1)
        && (d.total_votes || 0) >= MIN_VOTES_FOR_RANKING
    })
    if (candidates.length === 0) return null
    var best = null
    candidates.forEach(function (d) {
      if (!best || Number(d.avg_rating || 0) > Number(best.avg_rating || 0)) {
        best = d
      }
    })
    return best
  }, [allRanked])

  var [selectedDishLocation, setSelectedDishLocation] = useState(null)

  // Map pin tap: show mini-card, hide floating controls
  var handlePinTap = useCallback(function (dishId) {
    logger.debug('Pin tapped, dishId:', dishId)
    setPinSelected(true)
    // Find the dish's location for the "how far" button
    var dish = displayedOnMap.find(function (d) { return d.dish_id === dishId })
    if (dish && dish.restaurant_lat && dish.restaurant_lng) {
      setSelectedDishLocation({ lat: Number(dish.restaurant_lat), lng: Number(dish.restaurant_lng) })
    } else {
      setSelectedDishLocation(null)
    }
  }, [displayedOnMap])

  // Map background tap: dismiss mini-card, restore all pins, show controls
  var handleMapClick = useCallback(function () {
    setPinSelected(false)
    setFocusDishId(null)
    setSelectedDishLocation(null)
  }, [])

  // "How far?" — fit the user's GPS position and the selected dish in view
  var handleShowDistance = useCallback(function () {
    var map = mapRef.current
    if (!map || !location || !selectedDishLocation) return
    map.fitBounds([
      [location.lat, location.lng],
      [selectedDishLocation.lat, selectedDishLocation.lng],
    ], { padding: [60, 60], maxZoom: 15 })
  }, [location, selectedDishLocation])

  // Floating controls step aside while a pin's mini-card is open
  var controlsHidden = pinSelected

  return (
    <main id="main-content" className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <h1 className="sr-only">What's Good Here</h1>

      {/* LIST MODE */}
      {mode === 'list' && (
        <HomeListMode
          listScrollRef={listScrollRef}
          searchQuery={searchQuery}
          searchLoading={searchLoading}
          searchError={searchError}
          rankedLoading={rankedLoading}
          rankedErrorMessage={rankedErrorMessage}
          onRetry={rankedData.refetch}
          activeDishes={activeDishes}
          allRankedDishes={allRanked}
          initialCategory={listReturnCategory}
          topRestaurant={topRestaurant}
          mostVotedDish={mostVotedDish}
          bestValueMeal={bestValueMeal}
          bestIceCream={bestIceCream}
          radius={radius}
          permissionState={permissionState}
          requestLocation={requestLocation}
          onSearchChange={handleSearchChange}
          onRadiusSheetOpen={handleRadiusSheetOpen}
          onCategoryChange={setSelectedCategory}
        />
      )}

      {/* MAP MODE */}
      {mode === 'map' && (
        <>
          {/* Full-screen map */}
          <div className="fixed inset-0" style={{ zIndex: 1 }}>
            <ErrorBoundary>
              <Suspense fallback={
                <div
                  role="status"
                  aria-label="Loading map"
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'var(--color-bg)' }}
                >
                  <div
                    className="spinner"
                  />
                  <span className="sr-only">Loading map</span>
                </div>
              }>
                <RestaurantMap
                  dishes={displayedOnMap}
                  userLocation={location}
                  onSelectDish={handlePinTap}
                  permissionGranted={permissionState === 'granted'}
                  fullScreen
                  focusDishId={focusDishId}
                  mapRef={mapRef}
                  onMapClick={handleMapClick}
                  dishRanks={dishRanks}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Floating controls: search + category bar.
              Hidden (and removed from the tab order) while a pin's mini-card is open. */}
          <div
            className="fixed left-0 right-0"
            aria-hidden={controlsHidden || undefined}
            inert={controlsHidden}
            style={{
              top: 'env(safe-area-inset-top, 0px)',
              zIndex: 15,
              padding: '12px 12px 0',
              pointerEvents: 'none',
              opacity: controlsHidden ? 0 : 1,
              transition: 'opacity 200ms ease',
            }}
          >
            <div className="flex items-center gap-2" style={{ pointerEvents: controlsHidden ? 'none' : 'auto' }}>
              <div className="flex-1" style={{
                borderRadius: '14px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
              }}>
                <DishSearch
                  placeholder="What are you craving?"
                  onSearchChange={handleSearchChange}
                  initialQuery={searchQuery}
                  rightSlot={<RadiusChip radius={radius} onOpen={handleRadiusSheetOpen} inSearchBar />}
                />
              </div>
            </div>

            {/* Floating category bar */}
            <div className="mt-2" style={{ pointerEvents: controlsHidden ? 'none' : 'auto' }}>
              <MapCategoryBar activeCategory={mapCategory} onCategoryChange={setMapCategory} />
            </div>

            {searchQuery && !searchLoading && searchPins.length === 0 && (
              <p
                role="status"
                className="mt-2 inline-flex rounded-full px-4 py-2 text-sm"
                style={{
                  pointerEvents: 'auto',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-divider)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                No dishes match {'“'}{searchQuery}{'”'}
              </p>
            )}
          </div>
        </>
      )}

      {/* "How far?" button — appears above the FAB when a pin is selected and we have real GPS */}
      {mode === 'map' && pinSelected && selectedDishLocation && permissionState === 'granted' && (
        <button
          type="button"
          onClick={handleShowDistance}
          className="fixed z-40 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            right: '16px',
            bottom: 'calc(130px + env(safe-area-inset-bottom))',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-divider)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
            color: 'var(--color-text-primary)',
          }}
          aria-label="Show distance to dish"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
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

    </main>
  )
}
