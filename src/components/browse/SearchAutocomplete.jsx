import { forwardRef } from 'react'
import { PoweredByGoogle } from '../PoweredByGoogle'

const BADGES = {
  dish: { label: 'Dish', color: 'var(--color-primary)', background: 'var(--color-primary-muted)' },
  restaurant: { label: 'Spot', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' },
  // Google Places result — selecting it opens AddRestaurantModal
  place: { label: '+ Add', color: 'var(--color-accent-gold)', background: 'var(--color-accent-gold-muted)' },
}

// Autocomplete listbox for the Browse search combobox.
// `id` is the listbox id; options get `${id}-option-${index}` for aria-activedescendant.
export const SearchAutocomplete = forwardRef(function SearchAutocomplete({
  id,
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
      className="absolute bottom-full left-0 right-0 mb-1 rounded-xl shadow-lg overflow-hidden z-50"
      style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-divider)' }}
    >
      <div
        id={id}
        role="listbox"
        aria-label="Search suggestions"
        className="max-h-[40vh] overflow-y-auto overscroll-contain"
      >
        {suggestions.map((suggestion, index) => {
          const isActive = index === activeIndex
          const badge = BADGES[suggestion.type] || BADGES.restaurant
          const subtitle = suggestion.type === 'dish'
            ? (suggestion.subtitle ? 'at ' + suggestion.subtitle : '')
            : suggestion.subtitle

          return (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              type="button"
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={isActive}
              tabIndex={-1}
              onClick={() => onSelect(suggestion)}
              className="w-full min-h-[44px] px-3 py-2.5 text-left flex items-center gap-2 transition-colors"
              style={{ background: isActive ? 'var(--color-primary-muted)' : 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
              onMouseLeave={(e) => e.currentTarget.style.background = isActive ? 'var(--color-primary-muted)' : 'transparent'}
            >
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {suggestion.name}
                </p>
                {subtitle && (
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Type badge */}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ color: badge.color, background: badge.background }}
              >
                {badge.label}
              </span>
            </button>
          )
        })}
      </div>

      {showGoogleAttribution && (
        <div className="px-3 py-2" style={{ borderTop: '1px solid var(--color-divider)' }}>
          <PoweredByGoogle align="right" />
        </div>
      )}
    </div>
  )
})
