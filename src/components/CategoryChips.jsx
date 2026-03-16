import { useRef, useEffect } from 'react'
import { BROWSE_CATEGORIES } from '../constants/categories'

/**
 * CategoryChips — horizontal scrollable category filter.
 * Uses emoji icons for clean, universal rendering on any theme.
 */
export function CategoryChips({
  categories = BROWSE_CATEGORIES,
  selected = null,
  onSelect,
  showAll = true,
  sticky = false,
  maxVisible = 12,
  townPicker = null,
  townPickerOpen = false,
}) {
  var visibleCategories = categories.slice(0, maxVisible)
  var scrollRef = useRef(null)

  useEffect(function () {
    if (!townPickerOpen && scrollRef.current) {
      scrollRef.current.scrollLeft = 0
    }
  }, [townPickerOpen])

  return (
    <div
      className={sticky ? 'sticky top-0 z-10' : ''}
      style={sticky ? { background: 'var(--color-bg)' } : undefined}
    >
      <div
        ref={scrollRef}
        className="flex px-4 overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          minHeight: '68px',
          touchAction: 'pan-x pan-y',
          gap: '8px',
        }}
      >
        {townPicker && (
          <div className="flex-shrink-0 self-center">
            {townPicker}
          </div>
        )}
        {!townPickerOpen && visibleCategories.map(function (cat) {
          var isActive = selected === cat.id
          return (
            <button
              key={cat.id}
              onClick={function () { onSelect(isActive ? null : cat.id) }}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                padding: '6px 12px',
                borderRadius: '2px',
                background: isActive ? 'var(--color-text-primary)' : 'transparent',
                border: isActive ? '1.5px solid var(--color-text-primary)' : '1.5px solid var(--color-divider)',
                color: isActive ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                opacity: selected && !isActive ? 0.4 : 1,
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryChips
