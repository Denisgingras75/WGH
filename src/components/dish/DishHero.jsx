import { Link, useNavigate } from 'react-router-dom'
import { CategoryIcon } from '../home/CategoryIcons'
import { TrustBadge } from '../jitter'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { getRatingColor, formatScore10 } from '../../utils/ranking'

/**
 * Dish hero section: photo, name, restaurant, price, score, jitter trust.
 * The "2-second verdict" a tourist needs.
 */
export function DishHero({ dish, allPhotos, isVariant, parentDish }) {
  const navigate = useNavigate()
  const isRanked = dish.total_votes >= MIN_VOTES_FOR_RANKING

  var heroPhoto = allPhotos.length > 0 ? allPhotos[0].photo_url : (dish.photo_url || null)

  return (
    <>
      {/* Hero photo */}
      {heroPhoto && (
        <div className="relative" style={{ height: '220px', overflow: 'hidden' }}>
          <img
            src={heroPhoto}
            alt={dish.dish_name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5))' }}
          />
        </div>
      )}

      {/* Verdict Card */}
      <div
        className="mx-4 px-4 py-4"
        style={{
          background: 'var(--color-card)',
          border: 'var(--border-ink)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hard-lg)',
          marginTop: heroPhoto ? '-28px' : '16px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Price tag sticker */}
        {dish.price ? (
          <span
            style={{
              position: 'absolute',
              top: '-14px',
              right: '14px',
              padding: '3px 10px',
              background: 'var(--color-butter)',
              border: 'var(--border-ink)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-hard-sm)',
              transform: 'rotate(4deg)',
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--color-ink)',
              lineHeight: 1.1,
            }}
          >
            ${Number(dish.price).toFixed(0)}
          </span>
        ) : null}
        {/* Variant breadcrumb */}
        {isVariant && parentDish && (
          <button
            onClick={() => navigate('/dish/' + parentDish.id)}
            className="flex items-center gap-1 text-xs font-bold mb-3"
            style={{ color: 'var(--color-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {parentDish.name}
          </button>
        )}

        {/* Name + Icon + Price */}
        <div className="flex items-center gap-3">
          {!allPhotos.length && !dish.photo_url && (
            <div className="flex-shrink-0">
              <CategoryIcon categoryId={dish.category} dishName={dish.dish_name} size={80} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '27px',
                fontStretch: '90%',
                letterSpacing: '-0.025em',
                color: 'var(--color-text-primary)',
                lineHeight: 1.0,
                margin: 0,
                paddingRight: dish.price ? '36px' : 0,
              }}
            >
              {dish.dish_name}
            </h1>
            <button
              onClick={() => navigate('/restaurants/' + dish.restaurant_id)}
              className="flex items-center gap-1 text-left"
              style={{
                marginTop: '6px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-accent)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {dish.restaurant_name}
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {dish.restaurant_town && (
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: '1px' }}>
                {dish.restaurant_town}
              </p>
            )}
          </div>
        </div>

        {/* Score Block */}
        {isRanked && dish.avg_rating ? (
          <div className="flex items-end justify-between mt-4 pt-3" style={{ borderTop: 'var(--border-ink)' }}>
            <div className="flex items-baseline gap-1">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '60px',
                  letterSpacing: '-0.04em',
                  lineHeight: 0.9,
                  color: getRatingColor(dish.avg_rating),
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatScore10(dish.avg_rating)}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--color-text-tertiary)' }}>/10</span>
            </div>
            <div className="text-right" style={{ minWidth: '120px' }}>
              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {dish.total_votes} rating{dish.total_votes === 1 ? '' : 's'}
              </p>
              <p className="eyebrow" style={{ fontSize: '9.5px', marginTop: '2px' }}>would order again?</p>
            </div>
          </div>
        ) : dish.total_votes > 0 ? (
          <div className="mt-3 pt-3" style={{ borderTop: 'var(--border-ink)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {dish.total_votes} vote{dish.total_votes === 1 ? '' : 's'} — needs {MIN_VOTES_FOR_RANKING - dish.total_votes} more to rank
            </p>
          </div>
        ) : null}

        {/* Jitter trust line */}
        {dish.total_votes > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1.5px dashed var(--color-divider)' }}>
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
                fontWeight: 700,
                color: 'var(--color-accent)',
              }}
            >
              What's this?
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
