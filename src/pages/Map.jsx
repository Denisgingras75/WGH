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
import { ModeFAB } from '../components/ModeFAB'
import { LocalListsSection, Top10Scroll, CategoryExpand, CategoryIcon } from '../components/home'
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

  var [mode, setMode] = useState(function () {
    try {
      return sessionStorage.getItem('wgh_home_mode') || 'list'
    } catch (e) { return 'list' }
  })
  var [selectedCategory, setSelectedCategory] = useState(null)
  var [radiusSheetOpen, setRadiusSheetOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState('')
  var [searchLimit, setSearchLimit] = useState(10)
  var [focusDishId, setFocusDishId] = useState(null)
  var [highlightedDishId, setHighlightedDishId] = useState(null)
  var [pinSelected, setPinSelected] = useState(false)
  var [listLimit, setListLimit] = useState(10)
  var [expandedCategory, setExpandedCategory] = useState(null)
  var [activeLocalList, setActiveLocalList] = useState(null)
  var [activeLocalListName, setActiveLocalListName] = useState(null)

  var mapRef = useRef(null)
  var listScrollRef = useRef(null)
  var scrollPositionRef = useRef(0)
  var highlightTimerRef = useRef(null)

  // Route state: "See on map" from dish detail
  var focusDishFromRoute = routeLocation.state?.focusDish || null

  useEffect(function () {
    if (focusDishFromRoute) {
      setMode('map')
      try { sessionStorage.setItem('wgh_home_mode', 'map') } catch (e) {}
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
      try { sessionStorage.setItem('wgh_home_mode', 'map') } catch (e) {}
    } else {
      setMode('list')
      try { sessionStorage.setItem('wgh_home_mode', 'list') } catch (e) {}
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

  var handleLocalListExpanded = useCallback(function (items, name) {
    if (items) {
      setActiveLocalList(items.map(function (item) {
        return {
          dish_id: item.dish_id,
          dish_name: item.dish_name,
          restaurant_name: item.restaurant_name,
          restaurant_id: item.restaurant_id,
          avg_rating: item.avg_rating,
          total_votes: item.total_votes,
          category: item.category,
          restaurant_lat: item.restaurant_lat,
          restaurant_lng: item.restaurant_lng,
        }
      }))
      setActiveLocalListName(name)
    } else {
      setActiveLocalList(null)
      setActiveLocalListName(null)
    }
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

  // Expanded category dishes for map — uses same data source as CategoryExpand
  var expandedCategoryData = useDishes(
    location, radius,
    expandedCategory || '__none__',
    null, null
  )
  var expandedDishes = expandedCategory ? (expandedCategoryData.dishes || []) : []

  var dishesWithCoords = mapDishes.filter(function (d) {
    return d.restaurant_lat != null && d.restaurant_lng != null
  })

  var localListWithCoords = activeLocalList
    ? activeLocalList.filter(function (d) { return d.restaurant_lat != null && d.restaurant_lng != null })
    : []

  var displayedOnMap = focusDishId
    ? dishesWithCoords.filter(function (d) { return d.dish_id === focusDishId })
    : (searchQuery && searchResults && searchResults.length > 0)
      ? searchResults.filter(function (d) { return d.restaurant_lat != null && d.restaurant_lng != null })
      : activeLocalList && localListWithCoords.length > 0
        ? localListWithCoords
        : expandedCategory && expandedDishes.length > 0
          ? expandedDishes.filter(function (d) { return d.restaurant_lat != null && d.restaurant_lng != null })
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
    if (activeLocalListName) return activeLocalListName + '\u2019s picks'
    var categoryLabel = selectedCategoryLabel ? selectedCategoryLabel.label : null
    if (categoryLabel) return categoryLabel + ' nearby'
    return 'nearby'
  }, [searchQuery, selectedCategoryLabel, activeLocalListName])

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
          {/* Fixed header: brand + search + chips */}
          <div style={{ flexShrink: 0, background: 'var(--color-bg)', zIndex: 10 }}>
            {/* Brand header */}
            <div className="text-center pt-4 pb-1">
              <h2 style={{
                fontFamily: "'Amatic SC', cursive",
                fontSize: '42px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '0.04em',
                lineHeight: 1,
                margin: 0,
              }}>
                What's <span style={{ color: 'var(--color-primary)' }}>Good</span> Here
              </h2>
              <p style={{
                fontFamily: "'Amatic SC', cursive",
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: '2px 0 0',
              }}>
                Martha's Vineyard
              </p>
            </div>
            {/* Search bar */}
            <div className="px-4 pt-2 pb-2" style={{
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
            {(searchQuery && searchLoading) || (!searchQuery && rankedLoading) ? (
              <div className="px-4 pt-4"><ListSkeleton /></div>
            ) : searchQuery ? (
              /* Search results — flat list */
              <div className="px-4 pt-2 pb-4">
                <h2 style={{
                  fontFamily: "'Amatic SC', cursive",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '0.02em',
                  marginBottom: '8px',
                }}>
                  Results
                </h2>
                {activeDishes && activeDishes.length > 0 ? (
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
                ) : (
                  <EmptyState emoji="🔍" title={'No dishes found for \u201c' + searchQuery + '\u201d'} />
                )}
              </div>
            ) : activeDishes && activeDishes.length > 0 ? (
              /* Homepage v3 layout */
              <>
                {/* Top 10 Nearby — unified horizontal scroll */}
                <div className="flex items-baseline justify-between px-4 pt-3 pb-2">
                  <h2 style={{
                    fontFamily: "'Amatic SC', cursive",
                    fontSize: '26px',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}>
                    Top Rated Nearby
                  </h2>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                    #1 – {Math.min(activeDishes.length, 10)}
                  </span>
                </div>
                <Top10Scroll dishes={activeDishes.slice(0, 10)} />

                {/* Editorial callout — rotates by time of day */}
                {(function () {
                  var hour = new Date().getHours()
                  var callout = hour < 11
                    ? { category: 'breakfast', tag: 'Good Morning, MV', headline: 'The island runs on breakfast. Here\u2019s where to start your day.', cta: 'See the best breakfasts' }
                    : hour < 16
                      ? { category: 'lobster roll', tag: 'Top Searched', headline: 'The #1 food search on Martha\u2019s Vineyard? Best lobster roll.', cta: 'Check them all out' }
                      : { category: 'pizza', tag: 'Tonight', headline: 'Everyone\u2019s asking the same thing tonight: where\u2019s the best pizza?', cta: 'Find the best pizza' }

                  return (
                    <button
                      onClick={function () {
                        setExpandedCategory(callout.category)
                        setTimeout(function () {
                          var el = document.getElementById('category-expand')
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 100)
                      }}
                      className="mx-4 mt-4 text-left active:scale-[0.98] transition-transform"
                      style={{
                        background: 'linear-gradient(135deg, #FFF9EE 0%, #FEF3E2 100%)',
                        border: '1.5px solid rgba(196, 138, 18, 0.25)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        width: 'calc(100% - 32px)',
                      }}
                    >
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--color-accent-gold)',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                          <polyline points="16 7 22 7 22 13" />
                        </svg>
                        {callout.tag}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <CategoryIcon categoryId={callout.category} size={56} />
                        </div>
                        <p style={{
                          fontFamily: "'Amatic SC', cursive",
                          fontSize: '24px',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.15,
                        }}>
                          {callout.headline} <span style={{ color: 'var(--color-primary)', fontSize: '20px' }}>{callout.cta} &rarr;</span>
                        </p>
                      </div>
                    </button>
                  )
                })()}

                {/* Category pills with expand */}
                <div className="pt-4 pb-2">
                  <div className="flex items-baseline justify-between px-4 pb-2">
                    <h2 style={{
                      fontFamily: "'Amatic SC', cursive",
                      fontSize: '26px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                    }}>
                      Browse by Category
                    </h2>
                  </div>
                  <CategoryChips
                    categories={BROWSE_CATEGORIES.filter(function (c) {
                      var hour = new Date().getHours()
                      var hideId = hour < 11 ? 'breakfast' : hour < 16 ? 'lobster roll' : 'pizza'
                      return c.id !== hideId
                    })}
                    selected={expandedCategory}
                    onSelect={function (cat) {
                      setExpandedCategory(function (prev) { return prev === cat ? null : cat })
                    }}
                    maxVisible={22}
                  />
                </div>

                {/* Category Expand — inline top 10 */}
                {expandedCategory && (
                  <div id="category-expand">
                  <CategoryExpand
                    categoryId={expandedCategory}
                    onClose={function () { setExpandedCategory(null) }}
                  />
                  </div>
                )}

                {/* Local Lists */}
                <LocalListsSection onListExpanded={handleLocalListExpanded} />
              </>
            ) : (
              <div className="px-4 pt-4">
                <EmptyState emoji="🍽️" title="No dishes found nearby" />
              </div>
            )}
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
            </div>
          </div>
        </>
      )}

      {/* Toggle FAB (both modes) */}
      <ModeFAB mode={mode} onToggle={handleToggle} />

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
