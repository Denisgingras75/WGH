import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RestaurantAvatar } from './RestaurantAvatar'
import { getEventTypeLabel } from '../constants/eventTypes'

/**
 * Card displaying a restaurant event
 */
export const EventCard = memo(function EventCard({ event, promoted }) {
  const navigate = useNavigate()
  const {
    event_name,
    description,
    event_date,
    start_time,
    end_time,
    event_type,
    restaurants: restaurant,
  } = event

  const handleClick = () => {
    if (restaurant?.id) {
      navigate(`/restaurants/${restaurant.id}`)
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'

    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return null
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return m === '00' ? `${hour12}${ampm}` : `${hour12}:${m}${ampm}`
  }

  const timeDisplay = start_time
    ? end_time
      ? `${formatTime(start_time)} - ${formatTime(end_time)}`
      : formatTime(start_time)
    : null

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-xl p-4 text-left transition-all hover:shadow-lg active:scale-[0.99]"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-divider)',
        borderLeft: promoted ? '3px solid var(--color-accent-gold)' : '1px solid var(--color-divider)',
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
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(var(--color-primary-rgb), 0.2)',
                color: 'var(--color-primary)',
              }}
            >
              {getEventTypeLabel(event_type)}
            </span>
            {promoted && (
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-accent-gold)' }}
              >
                Featured
              </span>
            )}
          </div>

          {/* Event Name */}
          <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
            {event_name}
          </h3>

          {/* Restaurant Name */}
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-accent-gold)' }}>
            {restaurant?.name}
            {restaurant?.town && ` \u00b7 ${restaurant.town}`}
          </p>

          {/* Description */}
          {description && (
            <p
              className="text-sm mt-2 line-clamp-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description}
            </p>
          )}

          {/* Date & Time with urgency badge */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {formatDate(event_date)}
            </span>
            {timeDisplay && (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {timeDisplay}
              </span>
            )}
            {(() => {
              const d = new Date(event_date + 'T00:00:00')
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              if (diffDays === 0) return (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                  Today
                </span>
              )
              if (diffDays === 1) return (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-accent-gold-muted)', color: 'var(--color-accent-gold)' }}>
                  Tomorrow
                </span>
              )
              if (diffDays > 0 && diffDays <= 3) return (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}>
                  This week
                </span>
              )
              return null
            })()}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="w-5 h-5 flex-shrink-0 mt-1"
          style={{ color: 'var(--color-text-tertiary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
})
