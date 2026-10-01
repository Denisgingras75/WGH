import { Link } from 'react-router-dom'
import { getRatingColor, formatScore10 } from '../../utils/ranking'
import { CategoryIcon } from '../home/CategoryIcons'

/**
 * JournalCard — a single entry in the food journal feed.
 *
 * Each card represents one rated dish — the user's food journal entry.
 * Layout: [icon 56px] [dish name + restaurant + review snippet] [big rating number]
 */
export function JournalCard({ dish }) {
  var dishName = dish.dish_name || dish.name
  var restaurantName = dish.restaurant_name
  var dishId = dish.dish_id || dish.id
  var categoryId = dish.category
  var photoUrl = dish.photo_url
  var rating = dish.rating_10
  var reviewText = dish.review_text

  return (
    <Link
      to={'/dish/' + dishId}
      data-testid="journal-card"
      className="flex items-start gap-3 no-underline rounded-xl p-4 card-press"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-divider)',
        textDecoration: 'none',
      }}
    >
      {/* Icon area: 56x56, 12px border-radius, category-strip bg */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: 'var(--color-category-strip)',
          overflow: 'hidden',
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <CategoryIcon categoryId={categoryId} dishName={dishName} size={40} />
        )}
      </div>

      {/* Middle: dish name + restaurant + review */}
      <div className="flex-1 min-w-0">
        <div
          className="font-bold truncate"
          style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          {dishName}
        </div>
        <div
          className="truncate"
          style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 500, marginTop: '1px' }}
        >
          {restaurantName}
        </div>
        {reviewText && (
          <div
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontStyle: 'italic',
              marginTop: '6px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            &ldquo;{reviewText}&rdquo;
          </div>
        )}
      </div>

      {/* Right: big rating number */}
      {rating != null && (
        <div className="flex-shrink-0 flex flex-col items-end justify-center" style={{ minWidth: '36px' }}>
          <span
            data-testid="journal-card-rating"
            style={{
              color: getRatingColor(rating),
              fontSize: '28px',
              fontWeight: '800',
              lineHeight: '1',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatScore10(rating)}
          </span>
          <span
            style={{
              color: 'var(--color-text-tertiary)',
              fontSize: '11px',
              lineHeight: '1',
              marginTop: '2px',
            }}
          >
            /10
          </span>
        </div>
      )}
    </Link>
  )
}
