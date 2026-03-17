import { useNavigate } from 'react-router-dom'
import { useDishes } from '../../hooks/useDishes'
import { useLocationContext } from '../../context/LocationContext'
import { DishListItem } from '../DishListItem'
import { BROWSE_CATEGORIES } from '../../constants/categories'

/**
 * CategoryExpand — inline top-10 list for a selected category.
 * Animated expand/collapse. "Show all" links to Browse page.
 */
export function CategoryExpand({ categoryId, onClose }) {
  var navigate = useNavigate()
  var { location, radius } = useLocationContext()

  var categoryLabel = ''
  for (var i = 0; i < BROWSE_CATEGORIES.length; i++) {
    if (BROWSE_CATEGORIES[i].id === categoryId) {
      categoryLabel = BROWSE_CATEGORIES[i].label
      break
    }
  }

  var { dishes, loading } = useDishes(location, radius, categoryId, null, null)

  var top10 = dishes ? dishes.slice(0, 10) : []

  return (
    <div
      style={{
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
        maxHeight: '1200px',
        opacity: 1,
      }}
    >
      <div className="px-3">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '12px 0 8px' }}>
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
        {!loading && top10.length > 0 && (
          <div>
            {top10.map(function (dish, idx) {
              return (
                <DishListItem
                  key={dish.dish_id}
                  dish={dish}
                  rank={idx + 1}
                  showDistance
                  isLast={idx === top10.length - 1}
                />
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && top10.length === 0 && (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No {categoryLabel.toLowerCase()} rated yet
          </p>
        )}

        {/* Show all link */}
        {!loading && top10.length > 0 && (
          <button
            onClick={function () { navigate('/browse?category=' + encodeURIComponent(categoryId)) }}
            className="w-full py-3 mt-1 mb-2 text-center font-bold text-sm active:scale-[0.98] transition-transform"
            style={{
              color: 'var(--color-primary)',
              background: 'var(--color-primary-muted)',
              borderRadius: '12px',
            }}
          >
            Show all {categoryLabel} &rsaquo;
          </button>
        )}
      </div>
    </div>
  )
}
