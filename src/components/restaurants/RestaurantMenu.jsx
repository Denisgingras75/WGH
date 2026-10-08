import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { getRatingColor } from '../../utils/ranking'

// Split-pane restaurant menu: section nav on left, dishes on right
export function RestaurantMenu({ dishes, loading, error, searchQuery = '', menuSectionOrder = [] }) {
  const [activeSection, setActiveSection] = useState(null)
  const navigate = useNavigate()

  // Group dishes by menu_section, ordered by restaurant's menu_section_order
  const sectionGroups = useMemo(() => {
    if (!dishes?.length) return { sections: [], uncategorized: [] }

    // Filter by search query if provided
    let filteredDishes = dishes
    const query = searchQuery.toLowerCase().trim()
    if (query) {
      filteredDishes = dishes.filter(d =>
        (d.dish_name || '').toLowerCase().includes(query) ||
        (d.category || '').toLowerCase().includes(query) ||
        (d.menu_section || '').toLowerCase().includes(query)
      )
    }

    // Split into sectioned and uncategorized
    const groups = {}
    const uncategorized = []
    filteredDishes.forEach(dish => {
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
  }, [dishes, searchQuery, menuSectionOrder])

  // All sections including uncategorized
  const allSections = useMemo(() => {
    const result = sectionGroups.sections.slice()
    if (sectionGroups.uncategorized.length > 0) {
      result.push({ name: 'Other', dishes: sectionGroups.uncategorized })
    }
    return result
  }, [sectionGroups])

  // Auto-select first section
  useEffect(() => {
    if (allSections.length > 0 && !activeSection) {
      setActiveSection(allSections[0].name)
    }
  }, [allSections, activeSection])

  // Reset active section when search changes
  useEffect(() => {
    if (allSections.length > 0) {
      setActiveSection(allSections[0].name)
    } else {
      setActiveSection(null)
    }
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeDishes = useMemo(() => {
    const section = allSections.find(s => s.name === activeSection)
    return section ? section.dishes : []
  }, [allSections, activeSection])

  if (loading) {
    return (
      <div className="px-4 py-6" role="status" aria-label="Loading menu">
        <div className="flex gap-4">
          <div className="space-y-3" style={{ width: '33%' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 animate-pulse" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-sm)' }} aria-hidden="true" />
            ))}
          </div>
          <div className="flex-1 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-sm)' }} aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{error?.message || error}</p>
      </div>
    )
  }

  if (allSections.length === 0) {
    return (
      <div className="px-4 py-5">
        <div
          className="py-10 text-center"
          style={{
            background: 'var(--color-surface)',
            border: '2px dashed var(--color-text-tertiary)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <p style={{ color: 'var(--color-text-primary)', fontSize: '15px', fontWeight: 700 }}>
            {searchQuery
              ? `No dishes matching "${searchQuery}"`
              : 'Menu not set up yet'
            }
          </p>
          {!searchQuery && (
            <p className="mt-1.5" style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', fontWeight: 600 }}>
              Check back soon
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex mx-4 my-4 overflow-hidden"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-ink)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-hard)',
        minHeight: '420px',
      }}
    >
      {/* Left: Section Navigation */}
      <nav
        className="flex-shrink-0 overflow-y-auto"
        style={{
          width: '33%',
          background: 'var(--color-surface)',
          borderRight: 'var(--border-ink)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        role="tablist"
        aria-label="Menu sections"
      >
        {allSections.map((section) => {
          const isActive = section.name === activeSection
          return (
            <button
              key={section.name}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSection(section.name)}
              className="w-full text-left px-3 py-3 relative"
              style={{
                background: isActive ? 'var(--color-butter)' : 'transparent',
                borderBottom: isActive ? 'var(--border-ink)' : '2px solid var(--color-divider)',
                borderTop: isActive ? 'var(--border-ink)' : '2px solid transparent',
                marginTop: '-2px',
                transition: 'background 0.15s ease',
              }}
            >
              <span
                className="block leading-tight"
                style={{
                  fontSize: '14px',
                  fontWeight: isActive ? 800 : 700,
                  color: isActive ? 'var(--color-ink)' : 'var(--color-text-secondary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {section.name}
              </span>
              <span
                className="block mt-0.5"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isActive ? 'var(--color-ink)' : 'var(--color-text-tertiary)',
                }}
              >
                {section.dishes.length} {section.dishes.length === 1 ? 'item' : 'items'}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Right: Dish List */}
      <div className="flex-1 min-w-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Section title */}
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{
            background: 'var(--color-card)',
            borderBottom: 'var(--border-ink)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-primary)',
              fontSize: '19px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {activeSection}
          </h3>
        </div>

        {/* Dish rows */}
        <div className="px-3 pb-4">
          {activeDishes.map((dish, i) => {
            const isRanked = (dish.total_votes || 0) >= MIN_VOTES_FOR_RANKING
            const votes = dish.total_votes || 0
            const displayRating = (dish.has_variants && dish.best_variant_rating)
              ? dish.best_variant_rating
              : dish.avg_rating

            return (
              <button
                key={dish.dish_id}
                onClick={() => navigate(`/dish/${dish.dish_id}`)}
                className="w-full text-left py-3 px-1 active:scale-[0.98]"
                style={{
                  transition: 'transform 0.08s ease',
                  borderBottom: i < activeDishes.length - 1
                    ? '1.5px dashed var(--color-divider)'
                    : 'none',
                }}
              >
                {/* Row: Name · dotted leader · Price */}
                <div className="flex items-baseline gap-1.5">
                  <span className="min-w-0" style={{ flex: '0 1 auto' }}>
                    <span
                      style={{
                        color: 'var(--color-text-primary)',
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        lineHeight: '1.3',
                      }}
                    >
                      {dish.dish_name}
                    </span>
                    {dish.tags?.includes('lunch-only') && (
                      <span
                        className="inline-block align-middle"
                        style={{
                          marginLeft: '5px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 800,
                          background: 'var(--color-butter)',
                          border: 'var(--border-ink-thin)',
                          borderRadius: 'var(--radius-pill)',
                          color: 'var(--color-ink)',
                          lineHeight: '1.2',
                        }}
                      >
                        L
                      </span>
                    )}
                    {dish.tags?.includes('dinner-only') && (
                      <span
                        className="inline-block align-middle"
                        style={{
                          marginLeft: '5px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 800,
                          background: 'var(--color-ink)',
                          border: 'var(--border-ink-thin)',
                          borderRadius: 'var(--radius-pill)',
                          color: 'var(--color-bg)',
                          lineHeight: '1.2',
                        }}
                      >
                        D
                      </span>
                    )}
                  </span>

                  {/* Dotted leader + price */}
                  <span
                    aria-hidden="true"
                    style={{
                      flex: '1 1 12px',
                      minWidth: '12px',
                      borderBottom: '2px dotted var(--color-divider)',
                      alignSelf: 'baseline',
                    }}
                  />
                  {dish.price ? (
                    <span
                      className="flex-shrink-0"
                      style={{
                        color: 'var(--color-ink)',
                        fontSize: '14px',
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ${Number(dish.price).toFixed(0)}
                    </span>
                  ) : (
                    <span className="flex-shrink-0" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 700 }}>
                      --
                    </span>
                  )}
                </div>

                {/* Rating row */}
                <div className="flex items-baseline gap-1.5 mt-1">
                  {isRanked ? (
                    <>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          letterSpacing: '-0.03em',
                          lineHeight: 1,
                          color: getRatingColor(displayRating),
                          fontSize: '17px',
                        }}
                      >
                        {displayRating}
                      </span>
                      <span
                        style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 600 }}
                      >
                        {votes} rating{votes === 1 ? '' : 's'}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 600 }}
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
