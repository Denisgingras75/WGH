import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { formatScore10 } from '../utils/ranking'

/**
 * VariantSelector - Horizontal pill selector for variants
 * Used on dish detail page to switch between variants
 */
export function VariantSelector({ variants, currentDishId, onSelect }) {
  if (!variants || variants.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => {
        const isActive = variant.dish_id === currentDishId
        const showScore = (variant.total_votes || 0) >= MIN_VOTES_FOR_RANKING && variant.avg_rating != null
        return (
          <button
            key={variant.dish_id}
            type="button"
            onClick={() => { if (!isActive) onSelect(variant) }}
            aria-pressed={isActive}
            className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px] transition-all"
            style={isActive ? {
              background: 'var(--color-primary)',
              color: 'var(--color-text-on-primary)',
              border: 'none',
            } : {
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1.5px solid var(--color-divider)',
            }}
          >
            {variant.dish_name}
            {showScore && (
              <span className="ml-1 opacity-80">
                ({formatScore10(variant.avg_rating)})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
