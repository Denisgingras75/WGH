import { useNavigate } from 'react-router-dom'
import { getRatingColor, getPercentColor } from '../../utils/ranking'
import { CategoryIcon } from './CategoryIcons'

/**
 * ChampionCard — dark hero card for the #1 ranked dish.
 * Always visible at top of homepage. Dark bg, gold accents.
 */
export function ChampionCard({ dish }) {
  var navigate = useNavigate()
  if (!dish) return null

  var rating = dish.avg_rating
  var votes = dish.total_votes || 0
  var pct = dish.percent_worth_it || (dish.yes_votes && votes ? Math.round((dish.yes_votes / votes) * 100) : 0)

  return (
    <button
      onClick={function () { navigate('/dish/' + dish.dish_id) }}
      className="w-full text-left active:scale-[0.98] transition-transform"
      style={{
        background: 'linear-gradient(140deg, #2A1F08 0%, #1A1A1A 40%, #1A1508 100%)',
        borderRadius: '20px',
        padding: '18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '140px',
        height: '140px',
        background: 'radial-gradient(circle, rgba(232,184,32,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Badge */}
      <div style={{
        fontSize: '10px',
        fontWeight: 800,
        color: 'var(--color-medal-gold)',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: '12px',
      }}>
        #1 on the Island
      </div>

      {/* Body */}
      <div className="flex items-center gap-3">
        {/* Big faded rank number */}
        <span style={{
          fontSize: '60px',
          fontWeight: 800,
          color: 'var(--color-medal-gold)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          opacity: 0.25,
          flexShrink: 0,
        }}>
          1
        </span>

        {/* Icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-2xl"
          style={{
            width: '72px',
            height: '72px',
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          <CategoryIcon categoryId={dish.category} dishName={dish.dish_name || dish.name} size={56} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p style={{
            fontSize: '19px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: '3px',
          }}>
            {dish.dish_name || dish.name}
          </p>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 500,
            marginBottom: '8px',
          }}>
            {dish.restaurant_name}
          </p>
          <div className="flex items-baseline gap-3">
            <span style={{
              fontSize: '26px',
              fontWeight: 800,
              color: getRatingColor(rating),
              letterSpacing: '-0.02em',
            }}>
              {rating ? Number(rating).toFixed(1) : '—'}
              <small style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginLeft: '2px' }}>/10</small>
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
              {votes} vote{votes === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Reorder bar */}
      {pct > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{
            height: '3px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: pct + '%',
              background: 'linear-gradient(90deg, var(--color-medal-gold), ' + getRatingColor(rating) + ')',
              borderRadius: '2px',
            }} />
          </div>
          <p style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '4px',
            textAlign: 'right',
          }}>
            {pct}% would reorder
          </p>
        </div>
      )}
    </button>
  )
}
