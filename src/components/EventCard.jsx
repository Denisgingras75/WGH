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
      className="press w-full p-4 text-left"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
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
              className="px-2 py-0.5 rounded-full"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'var(--color-card)',
                border: 'var(--border-subtle)',
                color: 'var(--color-ink)',
              }}
            >
              {getEventTypeLabel(event_type)}
            </span>
            {promoted && (
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'var(--color-highlight)',
                  border: 'var(--border-subtle)',
                  color: 'var(--color-ink)',
                }}
              >
                Featured
              </span>
            )}
          </div>

          {/* Event Name */}
          <h3 style={{ fontSize: '18px', lineHeight: 1.15, color: 'var(--color-text-primary)' }}>
            {event_name}
          </h3>

          {/* Restaurant Name */}
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
            {restaurant?.name}
            {restaurant?.town && ` \u00b7 ${restaurant.town}`}
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

          {/* Date & Time with urgency badge */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs"
              style={{ color: 'var(--color-ink)', fontWeight: 600 }}
            >
              {formatDate(event_date)}
            </span>
            {timeDisplay && (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                {timeDisplay}
              </span>
            )}
            {(() => {
              const d = new Date(event_date + 'T00:00:00')
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              if (diffDays === 0) return (
                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 600, background: 'var(--color-highlight)', border: 'var(--border-subtle)', color: 'var(--color-ink)' }}>
                  Today
                </span>
              )
              if (diffDays === 1) return (
                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 600, background: 'var(--color-card)', border: 'var(--border-subtle)', color: 'var(--color-ink)' }}>
                  Tomorrow
                </span>
              )
              if (diffDays > 0 && diffDays <= 3) return (
                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 600, background: 'var(--color-surface)', border: '1px solid var(--color-divider)', color: 'var(--color-text-secondary)' }}>
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
