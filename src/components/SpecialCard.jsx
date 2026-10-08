import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RestaurantAvatar } from './RestaurantAvatar'

/**
 * Card displaying a restaurant special/deal
 */
export const SpecialCard = memo(function SpecialCard({ special, promoted }) {
  const navigate = useNavigate()
  const {
    deal_name,
    description,
    price,
    restaurants: restaurant
  } = special

  const handleClick = () => {
    if (restaurant?.id) {
      navigate(`/restaurants/${restaurant.id}`)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-xl p-4 text-left card-press"
      style={{
        background: 'var(--color-surface-elevated)',
        border: '2px solid var(--color-card-border)',
        boxShadow: '2px 2px 0px var(--color-card-border)',
      }}
    >
      <div className="flex gap-3">
        {/* Restaurant Avatar */}
        <RestaurantAvatar
          name={restaurant?.name}
          town={restaurant?.town}
          size={48}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Featured badge */}
          {promoted && (
            <span
              className="text-xs font-medium mb-1 inline-block"
              style={{ color: 'var(--color-accent)' }}
            >
              Featured
            </span>
          )}

          {/* Deal Name */}
          <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
            {deal_name}
          </h3>

          {/* Restaurant Name */}
          <p
            className="text-xs mt-0.5 font-medium"
            style={{
              color: 'var(--color-text-tertiary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {restaurant?.name}
            {restaurant?.town && ` \u00B7 ${restaurant.town}`}
          </p>

          {/* Description */}
          {description && (
            <p
              className="text-sm mt-2 line-clamp-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {description}
            </p>
          )}

          {/* Price */}
          {price && (
            <div className="mt-2">
              <span
                className="inline-block px-2 py-1 rounded-md text-sm font-bold"
                style={{
                  background: 'var(--color-primary-muted)',
                  color: 'var(--color-primary)',
                }}
              >
                ${Number(price).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
})
