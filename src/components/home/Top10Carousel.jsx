import { useState, useRef, useCallback, useEffect, useLayoutEffect, forwardRef, useImperativeHandle } from 'react'
import { BROWSE_CATEGORIES, getCategoryEmoji } from '../../constants/categories'
import { DishListItem } from '../DishListItem'
import { EmptyState } from '../EmptyState'
import { CategoryIcon } from './CategoryIcons'

var CAROUSEL_TABS = [{ id: 'nearby', label: 'Near You' }].concat(
  BROWSE_CATEGORIES.map(function (c) { return { id: c.id, label: c.label } })
)

var INITIAL_LIMIT = 10
var LOAD_MORE_COUNT = 5

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Top10Carousel — horizontally swipeable set of vertical top-10 lists.
 * "Near You" is the first page, then one page per BROWSE_CATEGORY.
 * All filtering is client-side from the full ranked dishes array.
 *
 * Props:
 *   dishes          - full ranked dishes array
 *   initialCategory - category id to open on mount (null = Near You)
 *   onCategoryChange - callback(categoryId | null) when active tab changes (for map sync)
 */
export var Top10Carousel = forwardRef(function Top10Carousel({ dishes, initialCategory = null, onCategoryChange }, ref) {
  var [initialIndex] = useState(function () {
    var idx = CAROUSEL_TABS.findIndex(function (t) { return t.id === initialCategory })
    return idx >= 0 ? idx : 0
  })
  var [activeIndex, setActiveIndex] = useState(initialIndex)
  var [limits, setLimits] = useState({}) // { tabId: visibleCount }
  var scrollRef = useRef(null)
  var tabsRef = useRef(null)

  // Open on the restored page before paint (runs before the parent's
  // vertical scroll restore, so both land on the same content)
  useLayoutEffect(function () {
    if (initialIndex > 0 && scrollRef.current) {
      scrollRef.current.scrollLeft = initialIndex * scrollRef.current.offsetWidth
    }
  }, [initialIndex])

  // Expose scrollToCategory for external navigation (chips, chalkboard cards)
  useImperativeHandle(ref, function () {
    return {
      scrollToCategory: function (categoryId) {
        var idx = -1
        for (var i = 0; i < CAROUSEL_TABS.length; i++) {
          if (CAROUSEL_TABS[i].id === categoryId) { idx = i; break }
        }
        if (idx >= 0 && scrollRef.current) {
          var pageWidth = scrollRef.current.offsetWidth
          // Jump (don't animate) across many pages — a long smooth scroll flashes every page in between
          var behavior = (prefersReducedMotion() || Math.abs(idx - activeIndex) > 1) ? 'auto' : 'smooth'
          scrollRef.current.scrollTo({ left: idx * pageWidth, behavior: behavior })
        }
      }
    }
  })

  // Update active tab on scroll
  var handleScroll = useCallback(function () {
    if (!scrollRef.current) return
    var pageWidth = scrollRef.current.offsetWidth
    if (pageWidth === 0) return
    var scrollLeft = scrollRef.current.scrollLeft
    var newIndex = Math.round(scrollLeft / pageWidth)
    if (newIndex >= 0 && newIndex < CAROUSEL_TABS.length) {
      setActiveIndex(newIndex)
    }
  }, [])

  // Notify parent when active category changes (for map sync)
  useEffect(function () {
    if (onCategoryChange) {
      var tab = CAROUSEL_TABS[activeIndex]
      onCategoryChange(tab && tab.id !== 'nearby' ? tab.id : null)
    }
  }, [activeIndex, onCategoryChange])

  // Auto-scroll tab bar to keep active tab centered.
  // Horizontal only — scrollIntoView would also scroll the vertical list.
  useEffect(function () {
    var strip = tabsRef.current
    if (!strip) return
    var activeTab = strip.children[activeIndex]
    if (activeTab) {
      strip.scrollTo({
        left: activeTab.offsetLeft - (strip.clientWidth - activeTab.offsetWidth) / 2,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    }
  }, [activeIndex])

  // Get all dishes for a tab (unsliced)
  function getAllDishesForTab(tab) {
    if (tab.id === 'nearby') return dishes || []
    return (dishes || []).filter(function (d) {
      return d.category && d.category.toLowerCase() === tab.id.toLowerCase()
    })
  }

  // Get visible limit for a tab
  function getLimit(tabId) {
    return limits[tabId] || INITIAL_LIMIT
  }

  // Show more for a specific tab
  function handleShowMore(tabId) {
    setLimits(function (prev) {
      var newLimits = Object.assign({}, prev)
      newLimits[tabId] = (prev[tabId] || INITIAL_LIMIT) + LOAD_MORE_COUNT
      return newLimits
    })
  }

  // Tab click → scroll carousel to that page
  function handleTabClick(index) {
    if (!scrollRef.current) return
    var pageWidth = scrollRef.current.offsetWidth
    scrollRef.current.scrollTo({ left: index * pageWidth, behavior: 'smooth' })
  }

  // Arrow keys move between tabs (roving tabindex)
  function handleTabKeyDown(e, index) {
    var next
    if (e.key === 'ArrowRight') next = Math.min(index + 1, CAROUSEL_TABS.length - 1)
    else if (e.key === 'ArrowLeft') next = Math.max(index - 1, 0)
    else return
    e.preventDefault()
    if (next === index) return
    handleTabClick(next)
    if (tabsRef.current && tabsRef.current.children[next]) {
      tabsRef.current.children[next].focus()
    }
  }

  var activeTab = CAROUSEL_TABS[activeIndex] || CAROUSEL_TABS[0]
  var allActiveTabDishes = getAllDishesForTab(activeTab)
  var activeLimit = getLimit(activeTab.id)
  var visibleCount = Math.min(allActiveTabDishes.length, activeLimit)

  return (
    <div className="pt-1">
      {/* Divider */}
      <div className="mx-4 mb-2" style={{
        height: '2px',
        background: 'linear-gradient(90deg, var(--color-text-primary), var(--color-text-primary) 30%, transparent)',
        opacity: 0.12,
      }} />

      {/* Category icons — food icons as carousel navigation */}
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Top 10 categories"
        className="relative flex overflow-x-auto px-3 pb-1 scrollbar-hide"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        }}
      >
        {CAROUSEL_TABS.map(function (tab, i) {
          var isActive = i === activeIndex
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={'top10-tab-' + i}
              aria-selected={isActive}
              aria-controls={'top10-panel-' + i}
              tabIndex={isActive ? 0 : -1}
              onClick={function () { handleTabClick(i) }}
              onKeyDown={function (e) { handleTabKeyDown(e, i) }}
              className="flex-shrink-0 flex flex-col items-center justify-center active:scale-[0.94] transition-transform"
              style={{
                padding: '0',
                minWidth: '64px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                className="flex items-center justify-center"
                style={{ opacity: isActive ? 1 : 0.45, transition: 'opacity 0.15s' }}
              >
                {tab.id === 'nearby' ? (
                  <span aria-hidden="true" style={{
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    📍
                  </span>
                ) : (
                  <CategoryIcon categoryId={tab.id} size={56} />
                )}
              </span>
              <span style={{
                marginTop: '1px',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                lineHeight: 1.2,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Section header — updates with active tab */}
      <div className="px-4 flex items-baseline justify-between mb-1">
        <h2 style={{
          fontFamily: "'Amatic SC', cursive",
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          letterSpacing: '0.02em',
          lineHeight: 1.1,
        }}>
          {activeTab.id === 'nearby' ? 'Top Rated Nearby' : 'Top ' + activeTab.label}
        </h2>
        <span style={{
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {visibleCount}{allActiveTabDishes.length > activeLimit ? '+' : ''} {visibleCount === 1 ? 'dish' : 'dishes'}
        </span>
      </div>

      {/* Snap-scroll carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
        }}
      >
        {CAROUSEL_TABS.map(function (tab, tabIndex) {
          // Only render content for active page ± 1 neighbor (lazy rendering)
          var isNearActive = Math.abs(tabIndex - activeIndex) <= 1
          var allTabDishes = isNearActive ? getAllDishesForTab(tab) : []
          var tabLimit = getLimit(tab.id)
          var visibleDishes = allTabDishes.slice(0, tabLimit)
          var hasMore = allTabDishes.length > tabLimit
          var remaining = allTabDishes.length - tabLimit

          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={'top10-panel-' + tabIndex}
              aria-labelledby={'top10-tab-' + tabIndex}
              style={{
                width: '100%',
                minWidth: '100%',
                scrollSnapAlign: 'start',
                flexShrink: 0,
                padding: '0 16px',
                boxSizing: 'border-box',
              }}
            >
              {!isNearActive ? (
                <div style={{ minHeight: '200px' }} />
              ) : visibleDishes.length > 0 ? (
                <>
                  {visibleDishes.map(function (dish, i) {
                    return (
                      <DishListItem
                        key={dish.dish_id || dish.id}
                        dish={dish}
                        rank={i + 1}
                        variant="ranked"
                        isLast={!hasMore && i === visibleDishes.length - 1}
                      />
                    )
                  })}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={function () { handleShowMore(tab.id) }}
                      className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all active:scale-[0.98]"
                      style={{
                        background: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-divider)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      Show {remaining > LOAD_MORE_COUNT ? LOAD_MORE_COUNT : remaining} more
                    </button>
                  )}
                </>
              ) : (
                <EmptyState
                  emoji={getCategoryEmoji(tab.id)}
                  title={'No ' + tab.label.toLowerCase() + ' rated yet'}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
