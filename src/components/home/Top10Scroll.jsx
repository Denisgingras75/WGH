import { useNavigate } from 'react-router-dom'
import { getRatingColor } from '../../utils/ranking'
import { CategoryIcon } from './CategoryIcons'

/**
 * Top10Scroll — horizontal card carousel for dishes #1-10.
 * #1 gets a gold border + subtle gold glow. All cards same size.
 */
export function Top10Scroll({ dishes }) {
  var navigate = useNavigate()
  if (!dishes || dishes.length === 0) return null

  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-1"
      style={{
        padding: '8px 0',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x proximity',
        scrollbarWidth: 'none',
      }}
    >
      <div className="flex-shrink-0" style={{ minWidth: '2px' }} />
      {dishes.map(function (dish, i) {
        var rank = i + 1
        var rating = dish.avg_rating
        var votes = dish.total_votes || 0
        var isChampion = rank === 1
        var medalColor = rank === 1 ? 'var(--color-medal-gold)'
          : rank === 2 ? 'var(--color-medal-silver)'
          : rank === 3 ? 'var(--color-medal-bronze)'
          : 'var(--color-text-primary)'

        return (
          <button
            key={dish.dish_id}
            onClick={function () { navigate('/dish/' + dish.dish_id) }}
            className="flex-shrink-0 text-left active:scale-[0.97] transition-transform"
            style={{
              width: '120px',
              background: isChampion
                ? 'linear-gradient(135deg, #FFFDF8 0%, #FFF9EE 100%)'
                : 'var(--color-card)',
              borderRadius: '16px',
              padding: '10px 8px 10px',
              border: isChampion
                ? '2.5px solid var(--color-medal-gold)'
                : '1.5px solid var(--color-divider)',
              boxShadow: isChampion
                ? '0 4px 16px rgba(196, 138, 18, 0.20)'
                : 'none',
              position: 'relative',
            }}
          >
            {/* Rank badge */}
            <span style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              fontSize: isChampion ? '16px' : '14px',
              fontWeight: 800,
              color: medalColor,
            }}>
              {rank}
            </span>

            {/* Icon */}
            <div
              className="mx-auto flex items-center justify-center"
              style={{ width: '72px', height: '72px', marginBottom: '4px' }}
            >
              <CategoryIcon categoryId={dish.category} dishName={dish.dish_name || dish.name} size={72} />
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
                marginBottom: '4px',
              }}
            >
              {dish.restaurant_name}
            </p>

            {/* Rating — BIG and bold */}
            <div className="flex flex-col items-center">
              <span style={{
                fontSize: '20px',
                fontWeight: 800,
                color: getRatingColor(rating),
                letterSpacing: '-0.02em',
              }}>
                {rating ? Number(rating).toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '-2px' }}>
                {votes} vote{votes === 1 ? '' : 's'}
              </span>
            </div>
          </button>
        )
      })}
      <div className="flex-shrink-0" style={{ minWidth: '2px' }} />
    </div>
  )
}
