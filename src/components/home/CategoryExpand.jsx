import { useState } from 'react'
import { useDishes } from '../../hooks/useDishes'
import { useLocationContext } from '../../context/LocationContext'
import { DishListItem } from '../DishListItem'
import { BROWSE_CATEGORIES } from '../../constants/categories'

/**
 * CategoryExpand — inline ranked list for a selected category.
 * Shows 10 initially, "Show more" expands all. No page navigation.
 */
export function CategoryExpand({ categoryId, onClose }) {
  var { location, radius } = useLocationContext()
  var [showAll, setShowAll] = useState(false)

  var categoryLabel = ''
  for (var i = 0; i < BROWSE_CATEGORIES.length; i++) {
    if (BROWSE_CATEGORIES[i].id === categoryId) {
      categoryLabel = BROWSE_CATEGORIES[i].label
      break
    }
  }

  var { dishes, loading } = useDishes(location, radius, categoryId, null, null)

  var allDishes = dishes || []
  var displayed = showAll ? allDishes : allDishes.slice(0, 10)
  var hasMore = allDishes.length > 10 && !showAll

  return (
    <div
      style={{
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
        maxHeight: showAll ? '4000px' : '1200px',
        opacity: 1,
      }}
    >
      <div className="px-3">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '6px 0 6px' }}>
          <h3 style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-primary)',
            lineHeight: 1,
          }}>
            Top {categoryLabel}
          </h3>
          <button
            onClick={onClose}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-text-tertiary)',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-6 text-center">
            <div className="animate-spin w-5 h-5 border-2 rounded-full mx-auto" style={{ borderColor: 'var(--color-divider)', borderTopColor: 'var(--color-primary)' }} />
          </div>
        )}

        {/* Dish list */}
        {!loading && displayed.length > 0 && (
          <div>
            {displayed.map(function (dish, idx) {
              return (
                <DishListItem
                  key={dish.dish_id}
                  dish={dish}
                  rank={idx + 1}
                  showDistance
                  isLast={idx === displayed.length - 1}
                />
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && allDishes.length === 0 && (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No {categoryLabel.toLowerCase()} rated yet
          </p>
        )}

        {/* Show more — expands inline, no page nav */}
        {!loading && hasMore && (
          <button
            onClick={function () { setShowAll(true) }}
            className="w-full py-3 mt-1 mb-2 text-center font-bold text-sm active:scale-[0.98] transition-transform"
            style={{
              color: 'var(--color-primary)',
              background: 'var(--color-primary-muted)',
              borderRadius: '12px',
            }}
          >
            Show all {allDishes.length} {categoryLabel} &rsaquo;
          </button>
        )}
      </div>
    </div>
  )
}
