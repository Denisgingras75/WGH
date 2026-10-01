import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryIcon } from '../home/CategoryIcons'
import { TrustBadge } from '../jitter'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { getRatingColor, formatScore10 } from '../../utils/ranking'

/**
 * Dish hero section: photo, name, restaurant, price, score, jitter trust.
 * The "2-second verdict" a tourist needs.
 */
export function DishHero({ dish, featuredPhoto, allPhotos, isVariant, parentDish }) {
  const isRanked = dish.total_votes >= MIN_VOTES_FOR_RANKING

  // Best photo first: featured → any non-hidden community photo → the dish's own photo.
  const heroPhoto = featuredPhoto?.photo_url
    || allPhotos.find(p => p.status !== 'hidden')?.photo_url
    || dish.photo_url
    || null
  // Track the src that failed (not a boolean) so a new heroPhoto retries without a reset effect.
  const [failedSrc, setFailedSrc] = useState(null)
  const showHero = !!heroPhoto && failedSrc !== heroPhoto

  return (
    <>
      {/* Hero photo */}
      {showHero && (
        <div className="relative" style={{ height: '220px', overflow: 'hidden' }}>
          <img
            src={heroPhoto}
            alt={dish.dish_name}
            className="w-full h-full object-cover"
            onError={() => setFailedSrc(heroPhoto)}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5))' }}
          />
        </div>
      )}

      {/* Verdict Card */}
      <div
        className="mx-4 rounded-xl px-4 py-4"
        style={{
          background: 'var(--color-card)',
          border: '1.5px solid var(--color-divider)',
          marginTop: showHero ? '-24px' : '8px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Variant breadcrumb */}
        {isVariant && parentDish && (
          <Link
            to={'/dish/' + parentDish.id}
            className="inline-flex items-center gap-1 min-h-[44px] -mt-3 mb-1 text-xs font-semibold"
            style={{ color: 'var(--color-accent-gold)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {parentDish.name}
          </Link>
        )}

        {/* Name + Icon + Price */}
        <div className="flex items-center gap-2">
          {!showHero && (
            <div className="flex-shrink-0">
              <CategoryIcon categoryId={dish.category} dishName={dish.dish_name} size={88} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1
              style={{
                fontFamily: "'Amatic SC', cursive",
                fontWeight: 700,
                fontSize: '28px',
                letterSpacing: '0.02em',
                color: 'var(--color-text-primary)',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {dish.dish_name}
            </h1>
            <div className="flex items-center justify-between" style={{ marginTop: '2px' }}>
              <Link
                to={'/restaurants/' + dish.restaurant_id}
                className="inline-flex items-center gap-1 min-h-[44px] -my-3"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--color-accent-gold)',
                }}
              >
                {dish.restaurant_name}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {dish.restaurant_town && (
                  <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500, marginLeft: '4px' }}>
                    {dish.restaurant_town}
                  </span>
                )}
              </Link>
              {dish.price ? (
                <span className="flex-shrink-0" style={{ color: 'var(--color-text-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  ${Number(dish.price).toFixed(0)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Score Block */}
        {isRanked ? (
          dish.avg_rating != null ? (
            <div className="flex items-end justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
              <div className="flex items-baseline gap-2">
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '44px',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: getRatingColor(dish.avg_rating),
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatScore10(dish.avg_rating)}
                </span>
              </div>
              <div className="text-right" style={{ minWidth: '120px' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  {dish.total_votes} rating{dish.total_votes === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                {dish.total_votes} rating{dish.total_votes === 1 ? '' : 's'}
              </p>
            </div>
          )
        ) : dish.total_votes > 0 ? (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {dish.total_votes} rating{dish.total_votes === 1 ? '' : 's'} — needs {Math.max(0, MIN_VOTES_FOR_RANKING - dish.total_votes)} more to rank
            </p>
          </div>
        ) : null}

        {/* Jitter trust line */}
        {dish.total_votes > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
            <div className="flex items-center gap-2">
              <TrustBadge type="human_verified" size="sm" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Ratings verified by Jitter
              </span>
            </div>
            <Link
              to="/jitter"
              className="inline-flex items-center min-h-[44px] -my-3"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-accent-gold)',
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
