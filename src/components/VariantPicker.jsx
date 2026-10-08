import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dishesApi } from '../api/dishesApi'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getRatingColor } from '../utils/ranking'
import { logger } from '../utils/logger'

/**
 * VariantPicker - Shows expandable list of dish variants
 * Used when a parent dish has multiple flavor/style options
 */
export function VariantPicker({ parentDishId, parentDishName, onVariantSelect, initiallyExpanded = false }) {
  const navigate = useNavigate()
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(initiallyExpanded)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!parentDishId) return

    async function fetchVariants() {
      setLoading(true)
      setError(null)
      try {
        const data = await dishesApi.getVariants(parentDishId)
        setVariants(data)
      } catch (err) {
        logger.error('Error fetching variants:', err)
        setError('Unable to load variants')
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when expanded or initially expanded
    if (expanded || initiallyExpanded) {
      fetchVariants()
    }
  }, [parentDishId, expanded, initiallyExpanded])

  const handleExpand = (e) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const handleVariantClick = (e, variant) => {
    e.stopPropagation()
    if (onVariantSelect) {
      onVariantSelect(variant)
    } else {
      navigate(`/dish/${variant.dish_id}`)
    }
  }

  if (!parentDishId) return null

  return (
    <div className="mt-2">
      {/* Expand/Collapse Button */}
      <button
        onClick={handleExpand}
        className="flex items-center gap-1 text-xs transition-colors"
        style={{ color: 'var(--color-accent)', fontWeight: 700 }}
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {expanded ? 'Hide flavors' : 'Show all flavors'}
      </button>

      {/* Variant List */}
      {expanded && (
        <div
          className="mt-2 overflow-hidden"
          style={{ background: 'var(--color-card)', border: 'var(--border-default)', borderRadius: 'var(--radius-md)' }}
        >
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 animate-pulse" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-sm)' }} />
              ))}
            </div>
          ) : error ? (
            <div className="p-3 text-center text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
              {error}
            </div>
          ) : variants.length === 0 ? (
            <div className="p-3 text-center text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
              No variants found
            </div>
          ) : (
            <div>
              {variants.map((variant, i) => {
                const isRanked = (variant.total_votes || 0) >= MIN_VOTES_FOR_RANKING
                return (
                  <button
                    key={variant.dish_id}
                    onClick={(e) => handleVariantClick(e, variant)}
                    className="w-full flex items-center justify-between p-3 text-left active:scale-[0.99]"
                    style={{ borderTop: i > 0 ? '1px dashed var(--color-divider-strong)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                        {variant.dish_name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                        {variant.total_votes > 0
                          ? `${variant.total_votes} vote${variant.total_votes === 1 ? '' : 's'}`
                          : 'No votes yet'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {isRanked && variant.avg_rating && (
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '18px',
                            fontWeight: 500,
                            letterSpacing: '-0.01em',
                            lineHeight: 1,
                            color: getRatingColor(variant.avg_rating),
                          }}
                        >
                          {variant.avg_rating}
                        </span>
                      )}
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        style={{ color: 'var(--color-ink)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * VariantBadge - Compact badge showing variant count
 * Used in cards to indicate a dish has variants
 */
export function VariantBadge({ variantCount, bestVariantName, bestVariantRating, onClick }) {
  if (!variantCount || variantCount === 0) return null

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 transition-opacity hover:opacity-80"
      style={{
        background: 'var(--color-card)',
        color: 'var(--color-ink)',
        border: 'var(--border-subtle)',
        borderRadius: 'var(--radius-pill)',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      <span>{variantCount} flavor{variantCount === 1 ? '' : 's'}</span>
      {bestVariantName && (
        <>
          <span style={{ color: 'var(--color-text-tertiary)' }}>·</span>
          <span className="truncate max-w-[80px]" style={{ fontWeight: 600 }}>Best: {bestVariantName}</span>
          {bestVariantRating && (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: getRatingColor(bestVariantRating) }}>
              {bestVariantRating}
            </span>
          )}
        </>
      )}
    </button>
  )
}

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
        return (
          <button
            key={variant.dish_id}
            onClick={() => onSelect(variant)}
            className={`px-3 py-1.5 text-sm transition-all ${
              isActive ? '' : 'hover:opacity-80'
            }`}
            style={{
              borderRadius: 'var(--radius-pill)',
              background: isActive ? 'var(--color-highlight)' : 'var(--color-card)',
              color: isActive ? 'var(--color-ink)' : 'var(--color-text-secondary)',
              border: isActive ? 'var(--border-subtle)' : '1px solid var(--color-divider)',
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {variant.dish_name}
            {variant.avg_rating && (
              <span className="ml-1" style={{ fontWeight: 600, opacity: 0.8 }}>
                ({variant.avg_rating})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
