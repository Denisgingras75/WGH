import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MIN_VOTES_FOR_RANKING, VALUE_BADGE_THRESHOLD } from '../constants/app'
import { getRatingColor } from '../utils/ranking'
import { DishThumb } from './DishThumb'
import { HearingIcon } from './HearingIcon'
import { sanitizeUrl } from '../utils/sanitize'
/**
 * DishListItem — the ONE component for showing a dish in any list.
 *
 * Props:
 *   dish        - dish data object
 *   rank        - optional rank number (1, 2, 3...)
 *   variant     - 'ranked' | 'voted' | 'compact' (default: 'ranked')
 *   showPhoto   - compact thumb size (restaurant detail); photos show automatically when a dish has one
 *   showDistance - show distance badge (default: false)
 *   sortBy      - sort mode for value badge display
 *   tab         - for voted variant: 'worth-it' | 'avoid' | 'saved'
 *   onUnsave    - callback for saved tab unsave action
 *   reviewText  - optional inline review text (voted variant)
 *   myRating    - current user's rating for comparison (voted other-profile)
 *   theirRating - the profile owner's rating (voted other-profile)
 *   voteVariant - 'own-profile' | 'other-profile' (voted variant)
 *   highlighted - gold background flash for map pin interactions
 *   onClick     - click handler (default: navigate to /dish/:id)
 *   isLast      - suppress bottom border on last item
 */
export const DishListItem = memo(function DishListItem({
  dish,
  rank,
  variant = 'ranked',
  showPhoto = false,
  showDistance = false,
  sortBy,
  tab,
  onUnsave,
  reviewText,
  myRating,
  theirRating,
  voteVariant = 'own-profile',
  highlighted = false,
  onClick,
  isLast = false,
  hideVotes = false,
}) {
  const navigate = useNavigate()

  // Normalize data shapes between different sources
  const dishName = dish.dish_name || dish.name
  const restaurantName = dish.restaurant_name || (dish.restaurants && dish.restaurants.name)
  const restaurantId = dish.restaurant_id || (dish.restaurants && dish.restaurants.id)
  const dishId = dish.dish_id || dish.id
  const avgRating = dish.avg_rating
  const totalVotes = dish.total_votes || 0
  const isRanked = totalVotes >= MIN_VOTES_FOR_RANKING
  const distanceMiles = dish.distance_miles
  const price = dish.price
  const valuePercentile = dish.value_percentile
  const valueScore = dish.value_score
  const valueRating = valueScore != null ? Math.min(10, Math.round(valueScore / 15 * 10) / 10) : null
  const toastSlug = dish.toast_slug
  const orderUrl = dish.order_url
  const restaurantLat = dish.restaurant_lat || dish.lat
  const restaurantLng = dish.restaurant_lng || dish.lng

  var handleClick = onClick || function () { navigate('/dish/' + dishId) }

  // --- VOTED VARIANT (profile pages) ---
  if (variant === 'voted') {
    return renderVotedCard()
  }

  // --- RANKED VARIANT (home, browse, restaurant detail) ---
  // Quiet row: rank · thumb (photo or icon) · dish / restaurant · rating
  var isTopThree = rank != null && rank <= 3

  return (
    <div
      data-dish-id={dishId}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e) } }}
      className="w-full text-left press"
      style={{
        background: highlighted ? 'var(--color-highlight)' : 'transparent',
        padding: '12px 4px',
        cursor: 'pointer',
        transition: 'background 1s ease-out',
        borderBottom: isLast ? 'none' : '1px solid var(--color-divider)',
      }}
    >
      <div className="flex items-center" style={{ gap: '12px' }}>
      {rank != null && (
        <span
          className="flex-shrink-0"
          style={{
            width: '22px',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 400,
            fontVariantNumeric: 'lining-nums tabular-nums',
            color: isTopThree ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          }}
        >
          {rank}
        </span>
      )}

      <DishThumb dish={dish} size={isTopThree && !showPhoto ? 64 : 56} />

      {/* Name + restaurant + distance */}
      <div className="flex-1 min-w-0">
        <p
          className="line-clamp-2"
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
          }}
        >
          {dishName}
        </p>
        <div className="flex items-center gap-1.5" style={{ marginTop: '2px' }}>
          <p
            className="truncate"
            style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {restaurantId ? (
              <span
                role="link"
                tabIndex={0}
                onClick={function (e) { e.stopPropagation(); navigate('/restaurants/' + restaurantId) }}
                onKeyDown={function (e) {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); e.stopPropagation();
                    navigate('/restaurants/' + restaurantId)
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {restaurantName}
              </span>
            ) : restaurantName}
            {sortBy === 'best_value' && price != null && ' \u00b7 $' + Number(price).toFixed(0)}
            {showDistance && distanceMiles != null && ' \u00b7 ' + Number(distanceMiles).toFixed(1) + ' mi'}
          </p>
          {valuePercentile != null && valuePercentile >= VALUE_BADGE_THRESHOLD && (
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-divider-strong)',
                padding: '0 5px',
                borderRadius: 'var(--radius-pill)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            >
              GREAT VALUE
            </span>
          )}
        </div>
        {/* Action links — Order / Directions */}
        {(toastSlug || sanitizeUrl(orderUrl) || restaurantLat) && (
          <div className="flex items-center gap-3" style={{ marginTop: '4px' }}>
            {(toastSlug || sanitizeUrl(orderUrl)) && (
              <a
                href={toastSlug ? 'https://order.toasttab.com/online/' + toastSlug : sanitizeUrl(orderUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={function (e) { e.stopPropagation() }}
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Order
              </a>
            )}
            {restaurantLat && restaurantLng && (
              <a
                href={'https://www.google.com/maps/dir/?api=1&destination=' + restaurantLat + ',' + restaurantLng}
                target="_blank"
                rel="noopener noreferrer"
                onClick={function (e) { e.stopPropagation() }}
                style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
              >
                Directions
              </a>
            )}
          </div>
        )}
      </div>

      {/* Rating + value + votes */}
      <div className="flex-shrink-0 text-right">
        {isRanked ? (
          <>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 500,
                lineHeight: 1,
                fontVariantNumeric: 'lining-nums tabular-nums',
                color: getRatingColor(avgRating),
              }}
            >
              {avgRating}
            </span>
            {!hideVotes && (
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                marginTop: '4px',
              }}>
                {totalVotes} vote{totalVotes === 1 ? '' : 's'}
                {valueRating != null && (
                  <span title="WGH Value Rating">{' \u00b7 ' + valueRating.toFixed(1) + 'v'}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {totalVotes ? totalVotes + ' vote' + (totalVotes === 1 ? '' : 's') : 'New'}
          </span>
        )}
      </div>
      </div>

    </div>
  )

  // --- VOTED CARD RENDERER ---
  function renderVotedCard() {
    var isOtherProfile = voteVariant === 'other-profile'
    var hasOwnComparison = !isOtherProfile && dish.rating_10 && dish.community_avg && totalVotes >= 2
    var ownRatingDiff = hasOwnComparison ? dish.rating_10 - dish.community_avg : null
    var theirRatingNum = Number(theirRating) || 0
    var myRatingNum = Number(myRating) || 0
    var hasMyRating = myRating !== undefined && myRating !== null && myRatingNum >= 1 && myRatingNum <= 10
    var communityAvg = avgRating ? Number(avgRating) : null

    var CardTag = isOtherProfile ? 'button' : 'div'
    var cardProps = isOtherProfile ? { onClick: handleClick } : {}

    return (
      <CardTag
        {...cardProps}
        className={'overflow-hidden' + (isOtherProfile ? ' w-full text-left press' : '')}
        style={{
          background: 'var(--color-card)',
          border: 'var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div className="flex">
          {/* Image — photo when available, icon tile otherwise */}
          <div className="w-24 h-24 flex-shrink-0">
            <DishThumb dish={dish} fill radius="0" iconScale={0.6} />
          </div>

          {/* Info */}
          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <div>
              <h3 className="truncate" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, letterSpacing: 0 }}>
                {restaurantId ? (
                  <span
                    role="link"
                    onClick={function (e) { e.stopPropagation(); navigate('/restaurants/' + restaurantId) }}
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {restaurantName}
                  </span>
                ) : restaurantName}
              </h3>
              <p className="truncate" style={{ color: 'var(--color-text-primary)', fontSize: '15px', fontWeight: 700 }}>
                {dishName}
              </p>
            </div>

            {/* Own Profile Rating */}
            {!isOtherProfile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {dish.rating_10 && (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, lineHeight: 1, color: getRatingColor(dish.rating_10) }}>
                      {dish.rating_10 % 1 === 0 ? dish.rating_10 : dish.rating_10.toFixed(1)}
                    </span>
                  )}
                  {hasOwnComparison && (
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      · avg {dish.community_avg.toFixed(1)}
                      {ownRatingDiff !== 0 && (
                        <span style={{ color: ownRatingDiff > 0 ? 'var(--color-emerald)' : 'var(--color-red)' }}>
                          {' '}({ownRatingDiff > 0 ? '+' : ''}{ownRatingDiff.toFixed(1)})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {tab === 'saved' && onUnsave && (
                  <button
                    onClick={function (e) { e.stopPropagation(); onUnsave() }}
                    className="transition-colors"
                  >
                    <HearingIcon size={24} active={true} />
                  </button>
                )}
              </div>
            )}

            {/* Other Profile Rating */}
            {isOtherProfile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theirRatingNum >= 1 && (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, lineHeight: 1, color: getRatingColor(theirRatingNum) }}>
                      {theirRatingNum % 1 === 0 ? theirRatingNum : theirRatingNum.toFixed(1)}
                    </span>
                  )}
                  {hasMyRating && (
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      · you: <span style={{ color: getRatingColor(myRatingNum) }}>
                        {myRatingNum % 1 === 0 ? myRatingNum : myRatingNum.toFixed(1)}
                      </span>
                    </span>
                  )}
                </div>
                {communityAvg ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, lineHeight: 1, color: getRatingColor(communityAvg) }}>
                      {communityAvg.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>avg</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Inline Review (own-profile only) */}
        {!isOtherProfile && reviewText && (
          <div className="px-3 pb-3 pt-0">
            <p
              className="line-clamp-2 italic"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
                lineHeight: '1.5',
              }}
            >
              &ldquo;{reviewText}&rdquo;
            </p>
          </div>
        )}
      </CardTag>
    )
  }
})

export default DishListItem
