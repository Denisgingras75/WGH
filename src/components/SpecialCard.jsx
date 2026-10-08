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
      className="sticker-press w-full p-4 text-left"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-ink)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: promoted ? 'var(--shadow-hard-lg)' : 'var(--shadow-hard)',
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
              className="mb-1.5 inline-block px-2 py-0.5 rounded-full"
              style={{
                fontSize: '11px',
                fontWeight: 800,
                background: 'var(--color-butter)',
                border: 'var(--border-ink-thin)',
                color: 'var(--color-ink)',
              }}
            >
              Featured
            </span>
          )}

          {/* Deal Name */}
          <h3 style={{ fontSize: '18px', lineHeight: 1.15, color: 'var(--color-text-primary)' }}>
            {deal_name}
          </h3>

          {/* Restaurant Name */}
          <p
            className="eyebrow mt-1"
          >
            {restaurant?.name}
            {restaurant?.town && ` \u00B7 ${restaurant.town}`}
          </p>

          {/* Description */}
          {description && (
            <p
              className="text-sm mt-2 line-clamp-2"
              style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}
            >
              {description}
            </p>
          )}

          {/* Price */}
          {price && (
            <div className="mt-2">
              <span
                className="inline-block px-2.5 py-0.5"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'var(--color-butter)',
                  border: 'var(--border-ink-thin)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-ink)',
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
