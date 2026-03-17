import { useNavigate } from 'react-router-dom'
import { getRatingColor } from '../../utils/ranking'
import { CategoryIcon } from './CategoryIcons'

/**
 * Top10Scroll — horizontal card carousel for dishes #2-10.
 * Each card: rank, icon, dish name, restaurant, rating, votes.
 */
export function Top10Scroll({ dishes }) {
  var navigate = useNavigate()
  if (!dishes || dishes.length === 0) return null

  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-1"
      style={{
        padding: '0 14px 4px',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
      }}
    >
      {dishes.map(function (dish, i) {
        var rank = i + 2
        var rating = dish.avg_rating
        var votes = dish.total_votes || 0
        var medalColor = rank === 2 ? 'var(--color-medal-silver)'
          : rank === 3 ? 'var(--color-medal-bronze)'
          : 'var(--color-text-tertiary)'

        return (
          <button
            key={dish.dish_id}
            onClick={function () { navigate('/dish/' + dish.dish_id) }}
            className="flex-shrink-0 text-left active:scale-[0.97] transition-transform"
            style={{
              width: '140px',
              background: 'var(--color-card)',
              borderRadius: '16px',
              padding: '14px 12px 12px',
              border: '1.5px solid var(--color-divider)',
              scrollSnapAlign: 'start',
              position: 'relative',
            }}
          >
            {/* Rank badge */}
            <span style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '14px',
              fontWeight: 800,
              color: medalColor,
            }}>
              {rank}
            </span>

            {/* Icon */}
            <div
              className="mx-auto flex items-center justify-center rounded-xl"
              style={{
                width: '52px',
                height: '52px',
                background: 'var(--color-category-strip)',
                marginBottom: '8px',
              }}
            >
              <CategoryIcon categoryId={dish.category} dishName={dish.dish_name || dish.name} size={40} />
            </div>

            {/* Dish name */}
            <p
              className="text-center line-clamp-2"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                lineHeight: 1.25,
                marginBottom: '2px',
              }}
            >
              {dish.dish_name || dish.name}
            </p>

            {/* Restaurant */}
            <p
              className="text-center truncate"
              style={{
                fontSize: '10px',
                color: 'var(--color-accent-gold)',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              {dish.restaurant_name}
            </p>

            {/* Rating + votes */}
            <div className="flex justify-center items-baseline gap-1">
              <span style={{
                fontSize: '16px',
                fontWeight: 800,
                color: getRatingColor(rating),
              }}>
                {rating ? Number(rating).toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                {votes}v
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
