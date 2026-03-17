import { Link } from 'react-router-dom'
import { formatScore10 } from '../../utils/ranking'

/**
 * JournalCard — a single entry in the food journal feed.
 * Styled as a flat diary entry: dish name (Playfair bold) + restaurant (italic)
 * + relative date, with big rating number on the right.
 *
 * Props:
 *   dish     - dish data object
 *   variant  - 'good-here' | 'not-good-here' | 'heard'
 *   onTriedIt - callback for heard variant CTA
 */
export function JournalCard({ dish, variant = 'good-here', onTriedIt }) {
  var dishName = dish.dish_name || dish.name
  var restaurantName = dish.restaurant_name
  var dishId = dish.dish_id || dish.id

  // Timestamp formatting
  var timestamp = dish.voted_at || dish.saved_at
  var timeLabel = ''
  if (timestamp) {
    var date = new Date(timestamp)
    var now = new Date()
    var diffMs = now - date
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      timeLabel = 'Today'
    } else if (diffDays === 1) {
      timeLabel = 'Yesterday'
    } else if (diffDays < 7) {
      timeLabel = diffDays + ' days ago'
    } else {
      timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Heard variant — flat entry with CTA
  if (variant === 'heard') {
    return (
      <div
        data-testid="journal-card"
        className="flex items-start justify-between gap-3"
        style={{
          padding: '12px 0',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className="truncate"
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              fontSize: '15px',
              lineHeight: 1.3,
            }}
          >
            {dishName}
          </div>
          <div
            className="truncate"
            style={{
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              marginTop: '2px',
            }}
          >
            {restaurantName}
          </div>
          {timeLabel && (
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', marginTop: '2px' }}>
              {timeLabel}
            </div>
          )}
          <button
            onClick={function (e) {
              e.stopPropagation()
              if (onTriedIt) onTriedIt(dish)
            }}
            className="mt-2 px-4 py-1.5 rounded-full font-semibold text-sm"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-on-primary)',
              fontSize: '13px',
            }}
          >
            Tried it?
          </button>
        </div>
      </div>
    )
  }

  // Good Here / Not Good Here variants
  var isMuted = variant === 'not-good-here'
  var rating = dish.rating_10
  var reviewText = dish.review_text

  // Rating color: var(--color-rating) for 7+, var(--color-primary) for under 7
  var ratingColorVar = rating != null && rating >= 7 ? 'var(--color-rating)' : 'var(--color-primary)'

  return (
    <Link
      to={'/dish/' + dishId}
      data-testid="journal-card"
      className="flex items-start justify-between gap-3 no-underline"
      style={{
        padding: '12px 0',
        borderBottom: '1px solid var(--color-divider)',
        opacity: isMuted ? '0.7' : '1',
        display: 'flex',
        textDecoration: 'none',
      }}
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            fontFamily: 'var(--font-headline)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontSize: '15px',
            lineHeight: 1.3,
          }}
        >
          {dishName}
        </div>
        <div className="flex items-baseline gap-1.5" style={{ marginTop: '2px' }}>
          <span
            className="truncate"
            style={{
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
            }}
          >
            {restaurantName}
          </span>
          {timeLabel && (
            <>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>&middot;</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', flexShrink: 0 }}>
                {timeLabel}
              </span>
            </>
          )}
        </div>
        {reviewText && (
          <div
            style={{
              marginTop: '6px',
              paddingLeft: '10px',
              borderLeft: '2px solid var(--color-divider)',
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {reviewText}
          </div>
        )}
      </div>

      {/* Big rating number */}
      {rating != null && (
        <div className="flex-shrink-0 flex items-center" style={{ paddingTop: '2px' }}>
          <span
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '26px',
              fontWeight: 900,
              color: ratingColorVar,
              lineHeight: 1,
            }}
          >
            {formatScore10(rating)}
          </span>
        </div>
      )}
    </Link>
  )
}
