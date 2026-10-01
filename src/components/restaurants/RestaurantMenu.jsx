import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { getRatingColor } from '../../utils/ranking'
import { EmptyState } from '../EmptyState'

// Split-pane restaurant menu: section nav on left, dishes on right
export function RestaurantMenu({ dishes, loading, error, menuSectionOrder = [], onRetry }) {
  const [activeSection, setActiveSection] = useState(null)
  const navigate = useNavigate()
  const rightRef = useRef(null)

  // Group dishes by menu_section, ordered by restaurant's menu_section_order
  const sectionGroups = useMemo(() => {
    if (!dishes?.length) return { sections: [], uncategorized: [] }

    // Split into sectioned and uncategorized
    const groups = {}
    const uncategorized = []
    dishes.forEach(dish => {
      const section = dish.menu_section
      if (!section) {
        uncategorized.push(dish)
        return
      }
      if (!groups[section]) {
        groups[section] = []
      }
      groups[section].push(dish)
    })

    // Sort dishes within each group by rating (highest first)
    const sortDishes = (arr) => {
      arr.sort((a, b) => {
        const aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
        const bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
        if (aRanked && !bRanked) return -1
        if (!aRanked && bRanked) return 1
        const aRating = a.avg_rating || 0
        const bRating = b.avg_rating || 0
        if (bRating !== aRating) return bRating - aRating
        return (b.total_votes || 0) - (a.total_votes || 0)
      })
    }

    Object.values(groups).forEach(sortDishes)
    sortDishes(uncategorized)

    // Order sections by menu_section_order, then alphabetical
    const sectionKeys = Object.keys(groups)
    sectionKeys.sort((a, b) => {
      const aIndex = menuSectionOrder.indexOf(a)
      const bIndex = menuSectionOrder.indexOf(b)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.localeCompare(b)
    })

    return {
      sections: sectionKeys.map(key => ({
        name: key,
        dishes: groups[key],
      })),
      uncategorized,
    }
  }, [dishes, menuSectionOrder])

  // All sections including uncategorized
  const allSections = useMemo(() => {
    const result = sectionGroups.sections.slice()
    if (sectionGroups.uncategorized.length > 0) {
      result.push({ name: 'Other', dishes: sectionGroups.uncategorized })
    }
    return result
  }, [sectionGroups])

  // Auto-select first section (and recover if the active one disappears after a refetch)
  useEffect(() => {
    if (allSections.length && !allSections.some(s => s.name === activeSection)) {
      setActiveSection(allSections[0].name)
    }
  }, [allSections, activeSection])

  // Start each section's dish list at the top
  useEffect(() => {
    if (rightRef.current) rightRef.current.scrollTop = 0
  }, [activeSection])

  const activeDishes = useMemo(() => {
    const section = allSections.find(s => s.name === activeSection)
    return section ? section.dishes : []
  }, [allSections, activeSection])

  const activeIndex = allSections.findIndex(s => s.name === activeSection)

  if (loading) {
    return (
      <div className="px-4 py-6" role="status" aria-label="Loading menu">
        <div className="flex gap-4">
          <div className="space-y-3" style={{ width: '33%' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'var(--color-divider)' }} aria-hidden="true" />
            ))}
          </div>
          <div className="flex-1 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--color-divider)' }} aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center">
        <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>{error?.message || error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  if (allSections.length === 0) {
    return (
      <div className="px-4 py-5">
        <EmptyState emoji="📋" title="Menu not set up yet" subtitle="Check back soon." />
      </div>
    )
  }

  return (
    <div
      className="flex mx-4 my-4 rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-divider)',
        minHeight: '420px',
        maxHeight: '70vh',
      }}
    >
      {/* Left: Section Navigation */}
      <nav
        className="flex-shrink-0 overflow-y-auto py-3 scrollbar-hide"
        style={{
          width: '33%',
          background: 'var(--color-bg)',
          borderRight: '1px solid var(--color-divider)',
        }}
        role="tablist"
        aria-label="Menu sections"
        aria-orientation="vertical"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
          e.preventDefault()
          const current = activeIndex === -1 ? 0 : activeIndex
          const delta = e.key === 'ArrowDown' ? 1 : -1
          const nextIndex = (current + delta + allSections.length) % allSections.length
          setActiveSection(allSections[nextIndex].name)
          requestAnimationFrame(() => {
            document.getElementById('menu-section-tab-' + nextIndex)?.focus()
          })
        }}
      >
        {allSections.map((section, index) => {
          const isActive = section.name === activeSection
          return (
            <button
              key={section.name}
              role="tab"
              id={'menu-section-tab-' + index}
              aria-selected={isActive}
              aria-controls="menu-section-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveSection(section.name)}
              className="w-full text-left px-3.5 py-3 transition-all relative"
              style={{
                background: isActive
                  ? 'var(--color-primary-muted)'
                  : 'transparent',
              }}
            >
              {/* Gold accent bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full"
                  style={{
                    height: '60%',
                    background: 'var(--color-primary)',
                    boxShadow: 'none',
                  }}
                />
              )}
              <span
                className="block font-semibold leading-tight"
                style={{
                  fontSize: '14px',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {section.name}
              </span>
              <span
                className="block mt-0.5 font-medium"
                style={{
                  fontSize: '11px',
                  color: isActive ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                }}
              >
                {section.dishes.length} {section.dishes.length === 1 ? 'item' : 'items'}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Right: Dish List */}
      <div
        ref={rightRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
        role="tabpanel"
        id="menu-section-panel"
        aria-labelledby={activeIndex >= 0 ? 'menu-section-tab-' + activeIndex : undefined}
      >
        {/* Section title */}
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{
            background: 'linear-gradient(180deg, var(--color-surface) 85%, transparent)',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <h2
            className="font-bold"
            style={{
              fontFamily: "'Amatic SC', cursive",
              color: 'var(--color-text-primary)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {activeSection}
          </h2>
        </div>

        {/* Dish rows */}
        <div className="px-3 pb-4">
          {activeDishes.map((dish, i) => {
            const isRanked = (dish.total_votes || 0) >= MIN_VOTES_FOR_RANKING
            const votes = dish.total_votes || 0
            const priceNum = Number(dish.price)
            const priceLabel = '$' + (Number.isInteger(priceNum) ? priceNum : priceNum.toFixed(2))

            return (
              <button
                key={dish.dish_id}
                onClick={() => navigate(`/dish/${dish.dish_id}`)}
                className="w-full text-left py-3 px-2 transition-all active:scale-[0.98] rounded-lg"
                style={{
                  borderBottom: i < activeDishes.length - 1
                    ? '1px solid var(--color-divider)'
                    : 'none',
                }}
              >
                {/* Row: Name + Price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        style={{
                          color: 'var(--color-text-primary)',
                          fontSize: '14px',
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.3,
                        }}
                      >
                        {dish.dish_name}
                      </span>
                      {dish.tags?.includes('lunch-only') && (
                        <span
                          className="flex-shrink-0 px-1 py-0.5 rounded font-bold"
                          title="Lunch only"
                          style={{
                            fontSize: '10px',
                            background: 'var(--color-accent-gold-muted)',
                            color: 'var(--color-accent-gold)',
                            lineHeight: '1',
                          }}
                        >
                          <span aria-hidden="true">L</span>
                          <span className="sr-only">Lunch only</span>
                        </span>
                      )}
                      {dish.tags?.includes('dinner-only') && (
                        <span
                          className="flex-shrink-0 px-1 py-0.5 rounded font-bold"
                          title="Dinner only"
                          style={{
                            fontSize: '10px',
                            background: 'var(--color-primary-muted)',
                            color: 'var(--color-primary)',
                            lineHeight: '1',
                          }}
                        >
                          <span aria-hidden="true">D</span>
                          <span className="sr-only">Dinner only</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Dotted leader + price */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                    <div
                      className="w-8"
                      style={{
                        borderBottom: '1px dotted var(--color-divider)',
                        marginBottom: '3px',
                      }}
                    />
                    {dish.price ? (
                      <span
                        className="font-semibold"
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: '13px',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {priceLabel}
                      </span>
                    ) : (
                      <span aria-hidden="true" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                        —
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating row */}
                <div className="flex items-center gap-2 mt-1.5">
                  {isRanked ? (
                    <>
                      <span
                        style={{
                          color: getRatingColor(dish.avg_rating),
                          fontSize: '13px',
                          fontWeight: 800,
                          letterSpacing: '-0.02em',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {dish.avg_rating}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}
                      >
                        {votes} vote{votes === 1 ? '' : 's'}
                      </span>
                    </>
                  ) : (
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}
                    >
                      {votes > 0
                        ? `${votes} vote${votes === 1 ? '' : 's'} so far`
                        : 'No votes yet'
                      }
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
