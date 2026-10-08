import { Link, useNavigate } from 'react-router-dom'
import { TrustBadge } from '../jitter'
import { DishThumb } from '../DishThumb'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { getRatingColor, formatScore10 } from '../../utils/ranking'

/**
 * Dish hero section: photo, name, restaurant, price, score, jitter trust.
 * The "2-second verdict" a tourist needs.
 *
 * The image slot is always there: the best community photo when one exists,
 * the dish's icon on a quiet tile until then.
 */
export function DishHero({ dish, allPhotos, isVariant, parentDish }) {
  const navigate = useNavigate()
  const isRanked = dish.total_votes >= MIN_VOTES_FOR_RANKING

  var heroPhoto = allPhotos.length > 0 ? allPhotos[0].photo_url : (dish.photo_url || null)
  var thumbDish = Object.assign({}, dish, { featured_photo_url: heroPhoto })

  return (
    <section style={{ padding: '8px 16px 0' }}>
      {/* Image slot */}
      <div style={{ width: '100%', aspectRatio: '4 / 3', maxWidth: '100%' }}>
        <DishThumb dish={thumbDish} fill radius="var(--radius-lg)" iconScale={0.5} alt={dish.dish_name} />
      </div>

      <div style={{ padding: '20px 4px 0' }}>
        {/* Variant breadcrumb */}
        {isVariant && parentDish && (
          <button
            onClick={() => navigate('/dish/' + parentDish.id)}
            className="flex items-center gap-1 mb-3"
            style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {parentDish.name}
          </button>
        )}

        {dish.category && <p className="eyebrow">{dish.category}</p>}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: '32px',
            letterSpacing: '-0.015em',
            color: 'var(--color-text-primary)',
            lineHeight: 1.08,
            margin: '6px 0 0',
          }}
        >
          {dish.dish_name}
        </h1>

        <div className="flex items-center flex-wrap" style={{ marginTop: '8px', gap: '4px 6px', fontSize: '15px' }}>
          <button
            onClick={() => navigate('/restaurants/' + dish.restaurant_id)}
            className="flex items-center gap-1 text-left"
            style={{
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {dish.restaurant_name}
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {(dish.restaurant_town || dish.price) && (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {dish.restaurant_town}
              {dish.restaurant_town && dish.price ? ' · ' : ''}
              {dish.price ? '$' + Number(dish.price).toFixed(0) : ''}
            </span>
          )}
        </div>

        {/* Score */}
        {isRanked && dish.avg_rating ? (
          <div className="flex items-end justify-between" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-divider)' }}>
            <div className="flex items-baseline" style={{ gap: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '60px',
                  letterSpacing: '-0.03em',
                  lineHeight: 0.9,
                  color: getRatingColor(dish.avg_rating),
                  fontVariantNumeric: 'lining-nums tabular-nums',
                }}
              >
                {formatScore10(dish.avg_rating)}
              </span>
              <span style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }}>/ 10</span>
            </div>
            <div className="text-right">
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {dish.total_votes} rating{dish.total_votes === 1 ? '' : 's'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Would you order it again?</p>
            </div>
          </div>
        ) : dish.total_votes > 0 ? (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-divider)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {dish.total_votes} vote{dish.total_votes === 1 ? '' : 's'} — needs {MIN_VOTES_FOR_RANKING - dish.total_votes} more to rank
            </p>
          </div>
        ) : null}

        {/* Jitter trust line */}
        {dish.total_votes > 0 && (
          <div className="flex items-center justify-between" style={{ marginTop: '14px' }}>
            <div className="flex items-center gap-2">
              <TrustBadge type="human_verified" size="sm" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Ratings verified by Jitter
              </span>
            </div>
            <Link
              to="/jitter"
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              What's this?
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
