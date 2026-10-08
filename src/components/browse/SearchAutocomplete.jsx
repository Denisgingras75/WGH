import { forwardRef } from 'react'
import { PoweredByGoogle } from '../PoweredByGoogle'

// Autocomplete dropdown for search suggestions
export const SearchAutocomplete = forwardRef(function SearchAutocomplete({
  suggestions,
  isOpen,
  activeIndex,
  onSelect,
}, ref) {
  if (!isOpen || suggestions.length === 0) return null

  // Google Places policy requires attribution whenever Places results are
  // shown. Suggestions with type 'place' come from Google Places Autocomplete.
  const showGoogleAttribution = suggestions.some((s) => s.type === 'place')

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden z-50"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-ink)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-hard)',
      }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.type}-${suggestion.id}`}
          onClick={() => onSelect(suggestion)}
          className="w-full px-3 py-2.5 text-left flex items-center gap-2 transition-colors"
          style={{
            background: index === activeIndex ? 'var(--color-butter-muted)' : 'transparent',
            borderTop: index > 0 ? '1.5px solid var(--color-divider)' : 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-card-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = index === activeIndex ? 'var(--color-butter-muted)' : 'transparent'}
        >
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              {suggestion.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              {suggestion.type === 'dish' ? `at ${suggestion.subtitle}` : suggestion.subtitle}
            </p>
          </div>

          {/* Type badge */}
          <span
            className="px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              fontSize: '10px',
              fontWeight: 800,
              border: 'var(--border-ink-thin)',
              background:
                suggestion.type === 'dish' ? 'var(--color-butter)'
                : 'var(--color-card)',
              color:
                suggestion.type === 'restaurant' ? 'var(--color-accent)'
                : 'var(--color-ink)'
            }}
          >
            {suggestion.type === 'dish' ? 'Dish' : suggestion.type === 'place' ? 'Google Maps' : 'Spot'}
          </span>
        </button>
      ))}

      {showGoogleAttribution && (
        <div
          className="px-3 py-2"
          style={{ borderTop: '1.5px solid var(--color-divider)', background: 'var(--color-surface)' }}
        >
          <PoweredByGoogle align="right" />
        </div>
      )}
    </div>
  )
})
