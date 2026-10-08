import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MIN_VOTES_FOR_RANKING, VALUE_BADGE_THRESHOLD } from '../constants/app'
import { getRatingColor } from '../utils/ranking'
import { getCategoryNeonImage, getCategoryEmoji, getDishNameIcon } from '../constants/categories'
import { RestaurantAvatar } from './RestaurantAvatar'
import { HearingIcon } from './HearingIcon'
import { sanitizeUrl } from '../utils/sanitize'
/**
 * DishListItem — the ONE component for showing a dish in any list.
 *
 * Props:
 *   dish        - dish data object
 *   rank        - optional rank number (1, 2, 3...)
 *   variant     - 'ranked' | 'voted' | 'compact' (default: 'ranked')
 *   showPhoto   - show photo thumbnail (default: false)
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
  const restaurantTown = dish.restaurant_town || (dish.restaurants && dish.restaurants.town)
  const dishId = dish.dish_id || dish.id
  const avgRating = dish.avg_rating
  const totalVotes = dish.total_votes || 0
  const isRanked = totalVotes >= MIN_VOTES_FOR_RANKING
  const distanceMiles = dish.distance_miles
  const price = dish.price
  const photoUrl = dish.photo_url
  const valuePercentile = dish.value_percentile
  const valueScore = dish.value_score
  const valueRating = valueScore != null ? Math.min(10, Math.round(valueScore / 15 * 10) / 10) : null
  const category = dish.category
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
  // Scoreboard layout: rank · dish name / restaurant · rating / votes
  var isPodium = rank != null && rank <= 3

  return (
    <div
      data-dish-id={dishId}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e) } }}
      className={'w-full text-left' + (isPodium ? ' sticker-press' : ' active:scale-[0.99]')}
      style={{
        background: highlighted
          ? 'var(--color-butter-muted)'
          : isPodium
            ? 'var(--color-card)'
            : 'transparent',
        padding: isPodium ? '10px 12px 10px 10px' : '8px 10px',
        marginBottom: isPodium ? '10px' : 0,
        border: isPodium ? 'var(--border-ink)' : 'none',
        borderRadius: isPodium ? 'var(--radius-lg)' : 0,
        boxShadow: isPodium ? 'var(--shadow-hard)' : 'none',
        cursor: 'pointer',
        transition: 'background 1s ease-out',
        borderBottom: !isPodium && !isLast ? '1.5px solid var(--color-divider)' : (isPodium ? 'var(--border-ink)' : 'none'),
      }}
    >
      <div className="flex items-center">
      {/* Rank — medal sticker for the podium, plain numeral after */}
      {rank != null && (
        isPodium ? (
          <span
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'var(--border-ink)',
              background: rank === 1
                ? 'var(--color-medal-gold)'
                : rank === 2
                  ? 'var(--color-medal-silver)'
                  : 'var(--color-medal-bronze)',
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--color-ink)',
              lineHeight: 1,
            }}
          >
            {rank}
          </span>
        ) : (
          <span
            className="flex-shrink-0"
            style={{
              width: '32px',
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {rank}
          </span>
        )
      )}

      {/* Category icon (when no photo thumbnail) */}
      {!showPhoto && (
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ width: isPodium ? '64px' : '56px', height: isPodium ? '64px' : '56px', marginLeft: '6px' }}
        >
          {(getDishNameIcon(dishName) || getCategoryNeonImage(category)) ? (
            <img
              src={getDishNameIcon(dishName) || getCategoryNeonImage(category)}
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <span style={{ fontSize: isPodium ? '18px' : '14px' }}>{getCategoryEmoji(category)}</span>
          )}
        </div>
      )}

      {/* Photo thumbnail (restaurant detail only) */}
      {showPhoto && photoUrl && (
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden"
          style={{ width: '48px', height: '48px', marginLeft: '6px', background: 'var(--color-surface)' }}
        >
          <img src={photoUrl} alt={dishName} loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      {showPhoto && !photoUrl && (
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden relative"
          style={{ width: '48px', height: '48px', marginLeft: '6px' }}
        >
          <RestaurantAvatar name={restaurantName} town={restaurantTown} dishCategory={category} fill />
        </div>
      )}

      {/* Name + restaurant + distance */}
      <div className="flex-1 min-w-0" style={{ marginLeft: showPhoto ? '6px' : (isPodium ? '8px' : '6px') }}>
        <p
          className="font-bold line-clamp-2"
          style={{
            fontSize: isPodium ? '16px' : '15px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {dishName}
        </p>
        <div className="flex items-center gap-1.5" style={{ marginTop: '2px' }}>
          <p
            className="truncate"
            style={{
              fontSize: '12.5px',
              color: 'var(--color-text-tertiary)',
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
                style={{ color: 'var(--color-accent)', fontWeight: 700, cursor: 'pointer' }}
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
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: 'var(--color-ink)',
                background: 'var(--color-butter)',
                border: '1.5px solid var(--color-ink)',
                padding: '0 5px',
                borderRadius: 'var(--radius-pill)',
                marginTop: '2px',
                display: 'inline-block',
                flexShrink: 0,
              }}
            >
              GREAT VALUE
            </span>
          )}
        </div>
        {/* Action buttons — Order / Directions */}
        {(toastSlug || sanitizeUrl(orderUrl) || restaurantLat) && (
          <div className="flex items-center gap-2" style={{ marginTop: '4px' }}>
            {(toastSlug || sanitizeUrl(orderUrl)) && (
              <a
                href={toastSlug ? 'https://order.toasttab.com/online/' + toastSlug : sanitizeUrl(orderUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={function (e) { e.stopPropagation() }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-on-primary)',
                  border: '1.5px solid var(--color-ink)',
                  fontSize: '10.5px',
                  fontWeight: 800,
                }}
              >
                Order Now
              </a>
            )}
            {restaurantLat && restaurantLng && (
              <a
                href={'https://www.google.com/maps/dir/?api=1&destination=' + restaurantLat + ',' + restaurantLng}
                target="_blank"
                rel="noopener noreferrer"
                onClick={function (e) { e.stopPropagation() }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  border: '1.5px solid var(--color-divider)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                }}
              >
                Directions
              </a>
            )}
          </div>
        )}
      </div>

      {/* Rating + value + votes */}
      <div className="flex-shrink-0 text-right" style={{ marginLeft: '8px' }}>
        {isRanked ? (
          <>
            <div className="flex items-baseline gap-1.5" style={{ justifyContent: 'flex-end' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isPodium ? '26px' : '21px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: getRatingColor(avgRating),
                }}
              >
                {avgRating}
              </span>
              {valueRating != null && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--color-text-secondary)',
                  }}
                  title="WGH Value Rating"
                >
                  {valueRating.toFixed(1)}v
                </span>
              )}
            </div>
            {!hideVotes && (
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                fontWeight: 600,
                marginTop: '3px',
              }}>
                {totalVotes} vote{totalVotes === 1 ? '' : 's'}
              </div>
            )}
          </>
        ) : (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              fontWeight: 500,
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
        className={'overflow-hidden' + (isOtherProfile ? ' w-full text-left sticker-press' : '')}
        style={{
          background: 'var(--color-card)',
          border: 'var(--border-ink)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div className="flex">
          {/* Image */}
          <div
            className="relative w-24 h-24 flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--color-category-strip)', borderRight: 'var(--border-ink)' }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={dishName} loading="lazy" className="w-full h-full object-cover" />
            ) : (getDishNameIcon(dishName) || getCategoryNeonImage(category)) ? (
              <img
                src={getDishNameIcon(dishName) || getCategoryNeonImage(category)}
                alt=""
                className="object-contain"
                style={{ width: '56px', height: '56px' }}
                loading="lazy"
              />
            ) : (
              <RestaurantAvatar name={restaurantName} town={restaurantTown} dishCategory={category} fill className="absolute inset-0" />
            )}
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
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, lineHeight: 1, color: getRatingColor(dish.rating_10) }}>
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
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, lineHeight: 1, color: getRatingColor(theirRatingNum) }}>
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
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, lineHeight: 1, color: getRatingColor(communityAvg) }}>
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
