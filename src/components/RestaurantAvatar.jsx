import { memo } from 'react'
import { getCategoryNeonImage } from '../constants/categories'

/**
 * Map restaurant cuisine to category icon.
 * Falls back to the restaurant's most common dish category,
 * then to a generic initial letter.
 */
var CUISINE_TO_CATEGORY = {
  'seafood': 'seafood',
  'pizza': 'pizza',
  'sushi': 'sushi',
  'japanese': 'sushi',
  'mexican': 'tacos',
  'italian': 'pasta',
  'chinese': 'asian',
  'asian': 'asian',
  'thai': 'asian',
  'indian': 'curry',
  'breakfast': 'breakfast',
  'bakery': 'bakery',
  'burgers': 'burger',
  'american': 'burger',
  'bbq': 'steak',
  'steakhouse': 'steak',
}

function getCuisineIcon(cuisine, dishCategory) {
  // Try cuisine first
  if (cuisine) {
    var key = cuisine.toLowerCase().trim()
    var mapped = CUISINE_TO_CATEGORY[key]
    if (mapped) {
      var src = getCategoryNeonImage(mapped)
      if (src) return src
    }
  }
  // Fall back to dish category
  if (dishCategory) {
    var src2 = getCategoryNeonImage(dishCategory)
    if (src2) return src2
  }
  return null
}

/**
 * RestaurantAvatar - Shows food category icon for the restaurant
 * Replaces the old town-colored initial circles
 */
export var RestaurantAvatar = memo(function RestaurantAvatar({
  name,
  town,
  cuisine,
  dishCategory,
  size = 48,
  fill = false,
  className = ''
}) {
  var iconSrc = getCuisineIcon(cuisine, dishCategory)

  // Fallback: show first letter if no icon found
  if (!iconSrc) {
    var initial = name ? name.charAt(0).toUpperCase() : '?'
    return (
      <div
        className={fill ? '' : 'rounded-lg flex items-center justify-center flex-shrink-0 ' + className}
        style={fill
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: (size * 0.4) + 'px', fontWeight: 700 }
          : { width: size, height: size, background: 'var(--color-surface)', color: 'var(--color-text-tertiary)', fontSize: (size * 0.4) + 'px', fontWeight: 700 }
        }
        aria-label={(name || 'Restaurant') + ' icon'}
      >
        {initial}
      </div>
    )
  }

  return (
    <div
      className={fill ? '' : 'rounded-lg flex items-center justify-center flex-shrink-0 ' + className}
      style={fill
        ? { position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
        : { width: size, height: size, background: 'var(--color-surface)' }
      }
      aria-label={(name || 'Restaurant') + ' icon'}
    >
      <img
        src={iconSrc}
        alt=""
        style={{
          width: size * 0.7,
          height: size * 0.7,
          objectFit: 'contain',
        }}
      />
    </div>
  )
})

// Keep getTownStyle export for backwards compat (used by EventCard, SpecialCard)
export function getTownStyle(town) {
  return { bg: 'var(--color-surface)', text: 'var(--color-text-tertiary)', isGradient: false }
}
