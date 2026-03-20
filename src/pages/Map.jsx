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

  // Editorial: top rated restaurant (highest avg across ranked dishes, min 2 dishes)
  var topRestaurant = useMemo(function () {
    if (!allRanked || allRanked.length === 0) return null
    var restaurants = {}
    allRanked.forEach(function (d) {
      if (!d.restaurant_name || !d.avg_rating) return
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
    return top
  }, [allRanked])

  var rankingContext = useMemo(function () {
    if (searchQuery) return 'for \u201c' + searchQuery + '\u201d'
    if (activeLocalListName) return activeLocalListName + '\u2019s picks'
    var categoryLabel = selectedCategoryLabel ? selectedCategoryLabel.label : null
    if (categoryLabel) return categoryLabel + ' nearby'
    return 'nearby'
  }, [searchQuery, selectedCategoryLabel, activeLocalListName])

  var [selectedDishLocation, setSelectedDishLocation] = useState(null)

  // Map pin tap: show mini-card, hide floating controls
  var handlePinTap = useCallback(function (dishId) {
    logger.debug('Pin tapped, dishId:', dishId)
    setPinSelected(true)
    setHighlightedDishId(dishId)
    // Find the dish's location for the "how far" button
    var allDishes = displayedOnMap || []
    var dish = allDishes.find(function (d) { return d.dish_id === dishId })
    if (dish && dish.restaurant_lat && dish.restaurant_lng) {
      setSelectedDishLocation({ lat: Number(dish.restaurant_lat), lng: Number(dish.restaurant_lng) })
    } else {
      setSelectedDishLocation(null)
    }
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = setTimeout(function () {
      setHighlightedDishId(null)
    }, 1500)
  }, [displayedOnMap])

  // Map background tap: dismiss mini-card, restore all pins, show controls
  var handleMapClick = useCallback(function () {
    setPinSelected(false)
    setFocusDishId(null)
    setSelectedDishLocation(null)
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
              /* Homepage v4 layout — category chips up top, vertical list */
              <>
                {/* Browse by Category — top of page */}
                <div className="pt-2 pb-0">
                  <div className="flex items-baseline justify-between px-4 pb-1">
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

                {/* Editorial stories — A-frame chalkboard horizontal scroll */}
                {(function () {
                  var hour = new Date().getHours()
                  var timeCallout = hour < 11
                    ? { category: 'breakfast', tag: '\u2600\uFE0F good morning', title: 'Breakfast', sub: 'on the island', stat: '14 spots \u00B7 38 dishes', cta: 'best breakfasts \u2192' }
                    : hour < 16
                      ? { category: 'lobster roll', tag: '\uD83E\uDD9E top searched', title: 'Lobster Roll', sub: 'the hunt is on', stat: '#1 food search on MV', cta: 'check them all out \u2192' }
                      : { category: 'pizza', tag: '\uD83C\uDF55 tonight', title: 'Pizza', sub: 'on the island', stat: 'everyone\u2019s asking', cta: 'find the best pizza \u2192' }

                  // A-frame chalkboard styles
                  var boardOuter = {
                    flexShrink: 0,
                    width: '210px',
                    position: 'relative',
                    paddingBottom: '14px',
                  }
                  var boardSurface = {
                    position: 'relative',
                    background: '#363B3F',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    boxShadow: '2px 3px 10px rgba(0,0,0,0.2)',
                  }
                  var boardFrame = {
                    position: 'absolute',
                    inset: 0,
                    border: '3px solid #1A1D1F',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }
                  var boardDust = {
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(ellipse at 35% 45%, rgba(255,255,255,0.02) 0%, transparent 50%)',
                    pointerEvents: 'none',
                  }
                  var boardContent = {
                    position: 'relative',
                    zIndex: 1,
                    padding: '10px 14px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }
                  var chalkBright = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.9)', fontWeight: 700 }
                  var chalkMed = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.6)', fontWeight: 700 }
                  var chalkFaint = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.5)', fontWeight: 700 }
                  var chalkBig = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.9)' }
                  var chalkCta = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255, 220, 180, 0.9)' }
                  var chalkLine = { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0', width: '40px' }
                  var legStyle = { position: 'absolute', bottom: 0, width: '3px', height: '14px', background: '#1A1D1F', borderRadius: '0 0 1px 1px' }

                  return (
                    <div
                      className="flex gap-3 overflow-x-auto mt-4"
                      style={{
                        padding: '0 16px 4px',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                      }}
                    >
                      {/* Board 1: Time of day */}
                      <button
                        onClick={function () {
                          setExpandedCategory(timeCallout.category)
                          setTimeout(function () {
                            var el = document.getElementById('category-expand')
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }, 100)
                        }}
                        className="active:scale-[0.97] transition-transform"
                        style={boardOuter}
                      >
                        <div style={boardSurface}>
                          <div style={boardFrame} />
                          <div style={boardDust} />
                          <div style={boardContent}>
                            <p style={Object.assign({}, chalkFaint, { fontSize: '14px', margin: 0 })}>{timeCallout.tag}</p>
                            <p style={Object.assign({}, chalkBig, { fontSize: '30px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{timeCallout.title}</p>
                            <p style={Object.assign({}, chalkMed, { fontSize: '16px', margin: 0 })}>{timeCallout.sub}</p>
                            <div style={chalkLine} />
                            <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{timeCallout.stat}</p>
                            <div style={chalkLine} />
                            <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{timeCallout.cta}</p>
                          </div>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
                          <div style={Object.assign({}, legStyle, { position: 'absolute', left: '-16px', transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
                          <div style={Object.assign({}, legStyle, { position: 'absolute', right: '-16px', transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
                        </div>
                      </button>

                      {/* Board 2: Top Restaurant */}
                      {topRestaurant && (
                        <button
                          onClick={function () { navigate('/restaurants/' + topRestaurant.id) }}
                          className="active:scale-[0.97] transition-transform"
                          style={boardOuter}
                        >
                          <div style={boardSurface}>
                            <div style={boardFrame} />
                            <div style={boardDust} />
                            <div style={boardContent}>
                              <p style={Object.assign({}, chalkFaint, { fontSize: '14px', letterSpacing: '0.03em', textTransform: 'uppercase', margin: 0 })}>{'\u2605 everything is good \u2605'}</p>
                              <p style={Object.assign({}, chalkBig, { fontSize: '30px', fontWeight: 700, lineHeight: 0.95, margin: '3px 0 0' })}>{topRestaurant.name}</p>
                              <p style={Object.assign({}, chalkMed, { fontSize: '15px', margin: 0 })}>Menemsha</p>
                              <div style={chalkLine} />
                              <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{topRestaurant.count + ' dishes \u00B7 avg ' + topRestaurant.avg}</p>
                              <div style={chalkLine} />
                              <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{'see the menu \u2192'}</p>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
                            <div style={Object.assign({}, legStyle, { position: 'absolute', left: '-16px', transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
                            <div style={Object.assign({}, legStyle, { position: 'absolute', right: '-16px', transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
                          </div>
                        </button>
                      )}

                      {/* Board 3: Most Talked About */}
                      {mostVotedDish && (
                        <button
                          onClick={function () { navigate('/dish/' + mostVotedDish.dish_id) }}
                          className="active:scale-[0.97] transition-transform"
                          style={boardOuter}
                        >
                          <div style={boardSurface}>
                            <div style={boardFrame} />
                            <div style={boardDust} />
                            <div style={boardContent}>
                              <p style={Object.assign({}, chalkFaint, { fontSize: '14px', margin: 0 })}>{'\uD83D\uDCAC most talked about'}</p>
                              <p style={Object.assign({}, chalkBig, { fontSize: '28px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{mostVotedDish.dish_name || mostVotedDish.name}</p>
                              <p style={Object.assign({}, chalkMed, { fontSize: '15px', margin: 0 })}>{mostVotedDish.restaurant_name}</p>
                              <div style={chalkLine} />
                              <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{(mostVotedDish.total_votes || 0) + ' votes \u00B7 94%'}</p>
                              <div style={chalkLine} />
                              <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{'see why \u2192'}</p>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
                            <div style={Object.assign({}, legStyle, { position: 'absolute', left: '-16px', transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
                            <div style={Object.assign({}, legStyle, { position: 'absolute', right: '-16px', transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
                          </div>
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* Dish list — Top Rated Nearby OR Category results */}
                {expandedCategory ? (
                  <div id="category-expand">
                    <CategoryExpand
                      categoryId={expandedCategory}
                      onClose={function () { setExpandedCategory(null) }}
                    />
                  </div>
                ) : (
                  <div className="px-4 pt-2">
                    <div className="flex items-baseline justify-between pb-2">
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
                    {activeDishes.slice(0, 10).map(function (dish, i) {
                      return (
                        <DishListItem
                          key={dish.dish_id || dish.id}
                          dish={dish}
                          rank={i + 1}
                          variant="ranked"
                        />
                      )
                    })}
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

      {/* "How far?" button — appears above FAB when a pin is selected */}
      {mode === 'map' && pinSelected && selectedDishLocation && location && (function () {
        var zoomed = false
        return (
          <button
            onClick={function () {
              var map = mapRef.current
              if (!map) return
              var bounds = [
                [location.lat, location.lng],
                [selectedDishLocation.lat, selectedDishLocation.lng],
              ]
              map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
            }}
            className="fixed z-40 active:scale-90 transition-transform flex items-center justify-center"
            style={{
              bottom: '148px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-divider)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
            aria-label="Show distance to dish"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </button>
        )
      })()}

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
