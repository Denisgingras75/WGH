import { useRef, useState } from 'react'
import { EmptyState } from '../EmptyState'
import { buildDishSections } from '../../utils/menuSections'
import { getCategoryById } from '../../constants/categories'
import { RATE_LIMITS } from '../../lib/rateLimiter'
import { PageHeader } from '../PageHeader'
import { AMATIC_TITLE, INPUT_FOCUS_CLASS, PAGE_INPUT_STYLE } from '../../constants/styles'

var MAX_DISHES_PER_MEAL = RATE_LIMITS.vote.maxAttempts

function CheckCircle({ checked }) {
  return (
    <span
      aria-hidden="true"
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: checked ? 'var(--color-primary)' : 'transparent',
        border: checked ? 'none' : '1.5px solid var(--color-divider)',
        color: 'var(--color-text-on-primary)',
      }}
    >
      {checked ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : null}
    </span>
  )
}

export function DishSelector({
  dishes,
  menuSectionOrder,
  searchQuery,
  onSearchQueryChange,
  selectedDishIds,
  specialDishEnabled,
  specialDishName,
  specialDishError,
  onToggleDish,
  onSpecialToggle,
  onSpecialDishNameChange,
  onBack,
  onContinue,
  continuing,
}) {
  var [activeSection, setActiveSection] = useState(null)
  var [specialFocused, setSpecialFocused] = useState(false)
  var tabRefs = useRef([])
  var sections = buildDishSections(dishes, menuSectionOrder, searchQuery)
  var selectedCount = Object.keys(selectedDishIds || {}).length + (specialDishEnabled && specialDishName.trim() ? 1 : 0)
  var atCap = selectedCount >= MAX_DISHES_PER_MEAL
  var overCap = selectedCount > MAX_DISHES_PER_MEAL
  var isSearching = !!(searchQuery || '').trim()
  var canContinue = selectedCount > 0 && !overCap && !continuing

  var activeSectionData = sections.find(function (section) {
    return section.name === activeSection
  }) || sections[0] || null
  var activeIndex = activeSectionData ? sections.indexOf(activeSectionData) : -1

  function handleTabKeyDown(event, index) {
    var nextIndex = null
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % sections.length
    else if (event.key === 'ArrowUp') nextIndex = (index - 1 + sections.length) % sections.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = sections.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    setActiveSection(sections[nextIndex].name)
    if (tabRefs.current[nextIndex]) tabRefs.current[nextIndex].focus()
  }

  function renderDishRow(dish, index, list, sectionName) {
    var isSelected = !!selectedDishIds[dish.dish_id]
    var isDisabled = atCap && !isSelected
    var votes = dish.total_votes || 0
    return (
      <button
        key={dish.dish_id}
        type="button"
        aria-pressed={isSelected}
        disabled={isDisabled}
        onClick={function () { onToggleDish(dish) }}
        className="w-full text-left px-2 py-3 rounded-xl transition-all active:scale-[0.98]"
        style={{
          borderBottom: index < list.length - 1 ? '1px solid var(--color-divider)' : 'none',
          background: isSelected ? 'var(--color-primary-muted)' : 'transparent',
        }}
      >
        <span className="flex items-start gap-3">
          <span className="mt-0.5">
            <CheckCircle checked={isSelected} />
          </span>

          <span className="min-w-0 flex-1 flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span
                className="block font-semibold"
                style={{ color: isDisabled ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', fontSize: '14px' }}
              >
                {dish.dish_name}
              </span>
              <span className="block text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {getCategoryById(dish.category)?.label || dish.category || sectionName}
              </span>
            </span>
            <span className="text-right flex-shrink-0">
              <span
                className="block text-xs font-semibold"
                style={{ color: isDisabled ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)' }}
              >
                {dish.price ? '$' + Number(dish.price).toFixed(0) : '--'}
              </span>
              <span className="block text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {votes > 0 ? votes + (votes === 1 ? ' vote' : ' votes') : 'No votes'}
              </span>
            </span>
          </span>
        </span>
      </button>
    )
  }

  var sectionHeadingStyle = { ...AMATIC_TITLE, fontSize: '22px' }

  var specialDisabled = atCap && !specialDishEnabled

  var continueStyle
  if (continuing) {
    continueStyle = { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: 0.7 }
  } else if (canContinue) {
    continueStyle = { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }
  } else {
    continueStyle = { background: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }
  }

  var continueLabel
  if (continuing) continueLabel = 'Loading…'
  else if (selectedCount === 0) continueLabel = 'Tap dishes you ate'
  else continueLabel = 'Rate ' + selectedCount + ' Dish' + (selectedCount === 1 ? '' : 'es') + ' →'

  var specialBorderColor = 'var(--color-divider)'
  if (specialDishError) specialBorderColor = 'var(--color-danger)'
  else if (specialFocused) specialBorderColor = 'var(--color-primary)'

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Rate Your Meal"
        meta="Pick every dish you ate"
        onBack={onBack}
        below={
          <div className="relative mt-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              stroke="currentColor"
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-tertiary)' }}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.95 7.95 0 1 0 5.4 5.4a7.95 7.95 0 0 0 11.25 11.25Z" />
            </svg>
            <input
              type="search"
              aria-label="Search dishes"
              autoComplete="off"
              enterKeyHint="search"
              value={searchQuery}
              onChange={function (event) { onSearchQueryChange(event.target.value) }}
              placeholder="Search dishes or sections"
              className={'w-full pl-10 pr-4 py-3 rounded-xl text-sm ' + INPUT_FOCUS_CLASS}
              style={PAGE_INPUT_STYLE}
            />
          </div>
        }
      />

      {sections.length === 0 && (
        <div className="px-4">
          <EmptyState
            emoji="🔍"
            title={searchQuery ? 'No dishes match that search' : 'No menu items yet'}
            subtitle="You can still add a special dish below."
            action={searchQuery ? (
              <button
                type="button"
                onClick={function () { onSearchQueryChange('') }}
                className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                Clear search
              </button>
            ) : null}
          />
        </div>
      )}

      {sections.length > 0 && isSearching && (
        <div
          className="mx-3 my-4 rounded-2xl px-3 pb-2"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
          }}
        >
          {sections.map(function (section) {
            return (
              <div key={section.name}>
                <h2 className="px-1 pt-4 pb-1" style={sectionHeadingStyle}>
                  {section.name}
                </h2>
                {section.dishes.map(function (dish, index) {
                  return renderDishRow(dish, index, section.dishes, section.name)
                })}
              </div>
            )
          })}
        </div>
      )}

      {sections.length > 0 && !isSearching && (
        <div
          className="flex mx-3 my-4 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
            height: 'calc(100dvh - 330px)',
            minHeight: 320,
          }}
        >
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Menu sections"
            className="flex-shrink-0 overflow-y-auto overscroll-contain py-3 scrollbar-hide"
            style={{
              width: '33%',
              background: 'var(--color-bg)',
              borderRight: '1px solid var(--color-divider)',
            }}
          >
            {sections.map(function (section, i) {
              var isActive = i === activeIndex
              return (
                <button
                  key={section.name}
                  ref={function (el) { tabRefs.current[i] = el }}
                  type="button"
                  role="tab"
                  id={'sec-tab-' + i}
                  aria-selected={isActive}
                  aria-controls="sec-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={function () { setActiveSection(section.name) }}
                  onKeyDown={function (event) { handleTabKeyDown(event, i) }}
                  className="w-full text-left px-3.5 py-3 transition-all relative"
                  style={{
                    background: isActive ? 'var(--color-primary-muted)' : 'transparent',
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full"
                      style={{
                        height: '60%',
                        background: 'var(--color-primary)',
                      }}
                    />
                  )}
                  <span
                    className="block font-semibold leading-tight"
                    style={{
                      fontSize: '14px',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
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
          </div>

          <div
            role="tabpanel"
            id="sec-panel"
            aria-labelledby={'sec-tab-' + activeIndex}
            className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
          >
            <div
              className="sticky top-0 z-10 px-4 py-3"
              style={{
                background: 'linear-gradient(180deg, var(--color-surface) 85%, transparent)',
                borderBottom: '1px solid var(--color-divider)',
              }}
            >
              <h2 style={sectionHeadingStyle}>
                {activeSectionData?.name}
              </h2>
            </div>

            <div className="px-3 pb-4">
              {activeSectionData?.dishes.map(function (dish, index) {
                return renderDishRow(dish, index, activeSectionData.dishes, activeSectionData.name)
              })}
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        <button
          type="button"
          aria-pressed={specialDishEnabled}
          disabled={specialDisabled}
          onClick={onSpecialToggle}
          className="w-full rounded-2xl px-4 py-4 text-left transition-all active:scale-[0.99]"
          style={{
            background: specialDishEnabled ? 'var(--color-primary-muted)' : 'var(--color-surface)',
            border: specialDishEnabled ? '1px solid var(--color-primary)' : '1px solid var(--color-divider)',
          }}
        >
          <span className="flex items-center justify-between gap-3">
            <span>
              <span
                className="block font-semibold"
                style={{ color: specialDisabled ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
              >
                Special
              </span>
              <span className="block text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Add a dish that wasn't on the menu
              </span>
            </span>
            <CheckCircle checked={specialDishEnabled} />
          </span>
        </button>

        {specialDishEnabled && (
          <div
            className="mt-3 rounded-2xl px-4 py-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
            }}
          >
            <label
              htmlFor="special-dish-name"
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              What was it?
            </label>
            <input
              id="special-dish-name"
              type="text"
              autoFocus
              autoCapitalize="words"
              autoComplete="off"
              enterKeyHint="done"
              maxLength={80}
              value={specialDishName}
              onChange={function (event) { onSpecialDishNameChange(event.target.value) }}
              onFocus={function () { setSpecialFocused(true) }}
              onBlur={function () { setSpecialFocused(false) }}
              aria-invalid={!!specialDishError}
              aria-describedby={specialDishError ? 'special-dish-error' : undefined}
              placeholder="Lobster special, chef's burger, secret pie..."
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--color-bg)',
                border: '2px solid ' + specialBorderColor,
                color: 'var(--color-text-primary)',
              }}
            />
            {specialDishError && (
              <p id="special-dish-error" role="alert" className="text-sm mt-1.5" style={{ color: 'var(--color-danger)' }}>
                {specialDishError}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        className="fixed left-0 right-0 z-30 px-3 pt-3 pb-3"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          background: 'var(--color-bg)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {atCap ? (
          <p
            className="text-center mb-2"
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-tertiary)' }}
          >
            Up to {MAX_DISHES_PER_MEAL} dishes per meal
          </p>
        ) : selectedCount > 0 && (
          <p
            className="text-center font-semibold mb-2"
            style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
          >
            {selectedCount} dish{selectedCount === 1 ? '' : 'es'} selected — ready to rate!
          </p>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
          style={continueStyle}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
