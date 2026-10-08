import { useEffect, useState } from 'react'

function sortDishes(arr) {
  return arr.slice().sort(function (a, b) {
    var aRating = a.avg_rating || 0
    var bRating = b.avg_rating || 0
    if (bRating !== aRating) return bRating - aRating

    var aVotes = a.total_votes || 0
    var bVotes = b.total_votes || 0
    if (bVotes !== aVotes) return bVotes - aVotes

    return (a.dish_name || '').localeCompare(b.dish_name || '')
  })
}

export function buildDishSections(dishes, menuSectionOrder, searchQuery) {
  var normalizedQuery = (searchQuery || '').toLowerCase().trim()
  var filteredDishes = (dishes || []).filter(function (dish) {
    if (!normalizedQuery) return true

    return (
      (dish.dish_name || '').toLowerCase().includes(normalizedQuery) ||
      (dish.category || '').toLowerCase().includes(normalizedQuery) ||
      (dish.menu_section || '').toLowerCase().includes(normalizedQuery)
    )
  })

  var groups = {}
  var uncategorized = []

  filteredDishes.forEach(function (dish) {
    var sectionName = dish.menu_section

    if (!sectionName) {
      uncategorized.push(dish)
      return
    }

    if (!groups[sectionName]) {
      groups[sectionName] = []
    }

    groups[sectionName].push(dish)
  })

  var orderedSectionNames = Object.keys(groups).slice().sort(function (a, b) {
    var aIndex = menuSectionOrder.indexOf(a)
    var bIndex = menuSectionOrder.indexOf(b)

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    return a.localeCompare(b)
  })

  var sections = orderedSectionNames.map(function (sectionName) {
    return {
      name: sectionName,
      dishes: sortDishes(groups[sectionName]),
    }
  })

  if (uncategorized.length > 0) {
    sections.push({
      name: 'Other',
      dishes: sortDishes(uncategorized),
    })
  }

  return sections
}

export function DishSelector({
  dishes,
  loading,
  error,
  menuSectionOrder,
  searchQuery,
  onSearchQueryChange,
  selectedDishIds,
  specialDishEnabled,
  specialDishName,
  onToggleDish,
  onSpecialToggle,
  onSpecialDishNameChange,
  onBack,
  onContinue,
}) {
  var [activeSection, setActiveSection] = useState(null)
  var sections = buildDishSections(dishes, menuSectionOrder, searchQuery)
  var selectedCount = Object.keys(selectedDishIds || {}).length + (specialDishEnabled && specialDishName.trim() ? 1 : 0)

  useEffect(function () {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].name)
      return
    }

    if (sections.length === 0) {
      setActiveSection(null)
      return
    }

    var stillExists = sections.some(function (section) { return section.name === activeSection })
    if (!stillExists) {
      setActiveSection(sections[0].name)
    }
  }, [sections, activeSection])

  var activeSectionData = sections.find(function (section) {
    return section.name === activeSection
  }) || sections[0] || null

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--color-bg)' }}>
      <div
        className="sticky top-0 z-20 px-4 py-3"
        style={{
          background: 'var(--color-bg)',
          borderBottom: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-ink)', border: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}
            aria-label="Back to restaurant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontSize: '26px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
              }}
            >
              Rate Your Meal
            </h1>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
              Pick every dish you ate
            </p>
          </div>
        </div>

        <div className="mt-3 relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink)' }} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={function (event) { onSearchQueryChange(event.target.value) }}
            placeholder="Search dishes or sections"
            className="w-full pl-11 pr-4 py-3 outline-none"
            style={{
              background: 'var(--color-surface-elevated)',
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-card)',
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              fontWeight: 500,
            }}
          />
        </div>
      </div>

      {loading && (
        <div className="px-4 py-6 space-y-4">
          <div className="h-40 animate-pulse" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-lg)' }} />
          <div className="h-40 animate-pulse" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-lg)' }} />
        </div>
      )}

      {!loading && error && (
        <div className="px-4 pt-8 text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
            {error?.message || error}
          </p>
        </div>
      )}

      {!loading && !error && sections.length === 0 && (
        <div className="px-4 pt-8">
          <div
            className="px-5 py-8 text-center"
            style={{
              background: 'var(--color-surface)',
              border: '1px dashed var(--color-divider-strong)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              {searchQuery ? 'No dishes match that search' : 'No menu items yet'}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              You can still add a special dish below.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && sections.length > 0 && (
        <div
          className="flex mx-4 my-4 overflow-hidden"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            minHeight: '420px',
          }}
        >
          <nav
            className="flex-shrink-0 overflow-y-auto"
            style={{
              width: '33%',
              background: 'var(--color-surface)',
              borderRight: 'var(--border-default)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            aria-label="Menu sections"
          >
            {sections.map(function (section) {
              var isActive = section.name === activeSectionData?.name
              return (
                <button
                  key={section.name}
                  onClick={function () { setActiveSection(section.name) }}
                  className="w-full text-left px-3 py-3 relative"
                  style={{
                    background: isActive ? 'var(--color-highlight)' : 'transparent',
                    borderBottom: isActive ? 'var(--border-default)' : '1px solid var(--color-divider)',
                    borderTop: isActive ? 'var(--border-default)' : '2px solid transparent',
                    marginTop: '-2px',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span
                    className="block leading-tight"
                    style={{
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
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

          <div className="flex-1 min-w-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div
              className="sticky top-0 z-10 px-4 py-3"
              style={{
                background: 'var(--color-card)',
                borderBottom: 'var(--border-default)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text-primary)',
                  fontSize: '21px',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                }}
              >
                {activeSectionData?.name}
              </h2>
            </div>

            <div className="px-2 py-1.5">
              {activeSectionData?.dishes.map(function (dish, index) {
                var isSelected = !!selectedDishIds[dish.dish_id]
                return (
                  <button
                    key={dish.dish_id}
                    onClick={function () { onToggleDish(dish) }}
                    className="w-full text-left px-2 py-3 active:scale-[0.98]"
                    style={{
                      transition: 'transform 0.08s ease, background 0.15s ease',
                      borderBottom: index < activeSectionData.dishes.length - 1 ? '1px dashed var(--color-divider-strong)' : 'none',
                      background: isSelected ? 'var(--color-highlight-muted)' : 'transparent',
                      borderRadius: isSelected ? 'var(--radius-sm)' : 0,
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isSelected ? 'var(--color-primary)' : 'var(--color-card)',
                          border: 'var(--border-default)',
                          boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                          color: 'var(--color-text-on-primary)',
                        }}
                      >
                        {isSelected ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                              {dish.dish_name}
                            </p>
                            <p className="mt-0.5" style={{ color: 'var(--color-text-tertiary)', fontSize: '11.5px', fontWeight: 600 }}>
                              {dish.category || activeSectionData.name}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p style={{ color: 'var(--color-ink)', fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
                              {dish.price ? '$' + Number(dish.price).toFixed(0) : '--'}
                            </p>
                            <p className="mt-0.5" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 600 }}>
                              {(dish.total_votes || 0) > 0 ? (dish.total_votes || 0) + ' votes' : 'No votes'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-24">
        <button
          onClick={onSpecialToggle}
          className="w-full px-4 py-4 text-left press"
          style={{
            background: specialDishEnabled ? 'var(--color-highlight-muted)' : 'var(--color-card)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', fontSize: '19px', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                Special
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Add a dish that wasn't on the menu
              </p>
            </div>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: specialDishEnabled ? 'var(--color-primary)' : 'var(--color-card)',
                border: 'var(--border-default)',
                boxShadow: specialDishEnabled ? 'var(--shadow-card)' : 'none',
                color: 'var(--color-text-on-primary)',
              }}
            >
              {specialDishEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : null}
            </div>
          </div>
        </button>

        {specialDishEnabled && (
          <div
            className="mt-3 px-4 py-4"
            style={{
              background: 'var(--color-card)',
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              What was it?
            </label>
            <input
              type="text"
              value={specialDishName}
              onChange={function (event) { onSpecialDishNameChange(event.target.value) }}
              placeholder="Lobster special, chef's burger, secret pie..."
              className="w-full px-3 py-3 outline-none"
              style={{
                background: 'var(--color-surface-elevated)',
                border: 'var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: '16px',
              }}
            />
          </div>
        )}
      </div>

      <div
        className="fixed left-0 right-0 z-30 px-4 pt-3 pb-3"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          background: 'var(--color-bg)',
          borderTop: 'var(--border-default)',
        }}
      >
        {selectedCount > 0 && (
          <p
            className="text-center mb-2"
            style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)' }}
          >
            {selectedCount} dish{selectedCount === 1 ? '' : 'es'} selected — ready to rate!
          </p>
        )}
        <button
          onClick={onContinue}
          disabled={selectedCount === 0}
          className="btn w-full py-3.5"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          {selectedCount === 0
            ? 'Tap dishes you ate'
            : 'Rate ' + selectedCount + ' Dish' + (selectedCount === 1 ? '' : 'es') + ' →'}
        </button>
      </div>
    </div>
  )
}
