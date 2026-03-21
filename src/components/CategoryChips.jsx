import { useRef, useEffect } from 'react'
import { BROWSE_CATEGORIES } from '../constants/categories'
import { CategoryIcon } from './home/CategoryIcons'

/**
 * CategoryChips — horizontal scrollable category filter.
 *
 * Props:
 *   categories      - array of { id, label, emoji } (default: BROWSE_CATEGORIES)
 *   selected        - currently selected category id (null = "All")
 *   onSelect        - callback(categoryId | null)
 *   showAll         - show "All" chip (default: true)
 *   sticky          - add sticky positioning (default: false)
 *   maxVisible      - max categories to show (default: 12)
 *   townPicker      - optional ReactNode rendered as first item
 *   townPickerOpen  - when true, hides category chips (town pills take over the row)
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

  // Scroll back to start when town picker closes
  useEffect(function () {
    if (!townPickerOpen && scrollRef.current) {
      scrollRef.current.scrollLeft = 0
    }
  }, [townPickerOpen])

  return (
    <div
      className={sticky ? 'sticky top-0 z-10' : ''}
      style={Object.assign(
        { position: 'relative' },
        sticky ? { background: 'var(--color-bg)' } : {}
      )}
    >
      <div
        ref={scrollRef}
        className="flex px-3 overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          minHeight: '68px',
          touchAction: 'pan-x pan-y',
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
              className="flex-shrink-0 flex flex-col items-center justify-center"
              style={{
                padding: '4px 0px',
                minWidth: '48px',
                fontSize: '11px',
                background: 'transparent',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              <CategoryIcon categoryId={cat.id} size={88} />
              <span style={{ marginTop: '2px', lineHeight: 1.2 }}>{cat.label}</span>
            </button>
          )
        })}
      </div>
      {/* Right fade mask — signals carousel continues */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '32px',
          background: 'linear-gradient(to right, transparent, var(--color-bg))',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </div>
  )
}

export default CategoryChips
