import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getRatingColor } from '../utils/ranking'
import { RestaurantAvatar } from './RestaurantAvatar'
import { ThumbsUpIcon } from './ThumbsUpIcon'
import { ThumbsDownIcon } from './ThumbsDownIcon'
import { HearingIcon } from './HearingIcon'
import { ValueBadge } from './browse/ValueBadge'

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
 *   wouldOrderAgain - the user's would_order_again boolean (voted other-profile)
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
  wouldOrderAgain,
  theirRating,
  voteVariant = 'own-profile',
  highlighted = false,
  onClick,
  isLast = false,
}) {
  const navigate = useNavigate()

  // Normalize data shapes between different sources
  const dishName = dish.dish_name || dish.name
  const restaurantName = dish.restaurant_name || (dish.restaurants && dish.restaurants.name)
  const restaurantTown = dish.restaurant_town || (dish.restaurants && dish.restaurants.town)
  const dishId = dish.dish_id || dish.id
  const avgRating = dish.avg_rating
  const totalVotes = dish.total_votes || 0
  const isRanked = totalVotes >= MIN_VOTES_FOR_RANKING
  const distanceMiles = dish.distance_miles
  const price = dish.price
  const photoUrl = dish.photo_url
  const valuePercentile = dish.value_percentile
  const category = dish.category
  const restaurantPhone = dish.restaurant_phone || (dish.restaurants && dish.restaurants.phone)
  const restaurantLat = dish.restaurant_lat || (dish.restaurants && dish.restaurants.lat)
  const restaurantLng = dish.restaurant_lng || (dish.restaurants && dish.restaurants.lng)

  var handleClick = onClick || function () { navigate('/dish/' + dishId) }

  // --- VOTED VARIANT (profile pages) ---
  if (variant === 'voted') {
    return renderVotedCard()
  }

  // --- RANKED VARIANT (home, browse, restaurant detail) ---
  var isPodium = rank != null && rank <= 3
  var isHero = rank === 1
  var isSupporting = rank === 2 || rank === 3

  // --- PODIUM CARDS (ranks 1-3): Night Market spotlight cards ---
  if (isPodium) {
    var medalColor = isHero ? 'var(--color-medal-gold)' : rank === 2 ? 'var(--color-medal-silver)' : 'var(--color-medal-bronze)'

    return (
      <button
        data-dish-id={dishId}
        onClick={handleClick}
        className="w-full text-left active:opacity-85"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: highlighted ? 'var(--color-accent-gold-muted)' : 'var(--color-card)',
          border: isHero ? '2.5px solid var(--color-text-primary)' : '1.5px solid var(--color-divider)',
          borderRadius: '4px',
          boxShadow: 'none',
          padding: isHero ? '24px' : '18px',
          minHeight: isHero ? '160px' : '110px',
          cursor: 'pointer',
          transition: 'background 1s ease-out',
        }}
      >
        {/* Background photo (right side, fading in) */}
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: isHero ? '55%' : '45%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              maskImage: 'linear-gradient(to right, transparent 0%, black 45%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 45%)',
            }}
          />
        )}

        {/* Content layer (above photo) */}
        <div className="flex flex-col justify-between" style={{ position: 'relative', zIndex: 1, minHeight: isHero ? '112px' : '74px' }}>
          {/* Rank badge — bold graphic */}
          <div className="flex items-start justify-between">
            <div style={{ maxWidth: '65%' }}>
              {/* Rank — chalk style */}
              <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                <span style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: isHero ? '28px' : '24px',
                  fontWeight: 700,
                  color: medalColor,
                  lineHeight: 1,
                }}>
                  {'#' + rank}
                </span>
              </div>
              {/* Dish name */}
              <p style={{
                fontFamily: 'var(--font-headline)',
                fontSize: isHero ? '24px' : '19px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)',
                lineHeight: 1.2,
              }}>
                {dishName}
              </p>
              <p style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isHero ? '13px' : '12px',
                fontWeight: 500,
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
                marginTop: '6px',
                letterSpacing: '0.01em',
              }}>
                {restaurantName}
                {sortBy === 'best_value' && price != null && ' \u00b7 $' + Number(price).toFixed(0)}
                {showDistance && distanceMiles != null && ' \u00b7 ' + Number(distanceMiles).toFixed(1) + ' mi'}
              </p>
              {valuePercentile != null && (
                <div style={{ marginTop: '6px' }}>
                  <ValueBadge valuePercentile={valuePercentile} />
                </div>
              )}
            </div>

            {/* Rating — top right, bold */}
            <div className="text-right flex-shrink-0">
              {isRanked ? (
                <div>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: isHero ? '32px' : '24px',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: getRatingColor(avgRating),
                    lineHeight: 1,
                  }}>
                    {avgRating}
                  </span>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--color-text-tertiary)',
                    fontWeight: 600,
                    marginTop: '2px',
                    letterSpacing: '0.05em',
                  }}>
                    {totalVotes} vote{totalVotes === 1 ? '' : 's'}
                  </div>
                </div>
              ) : (
                <span style={{
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  fontWeight: 600,
                }}>
                  {totalVotes ? totalVotes + ' vote' + (totalVotes === 1 ? '' : 's') : 'New'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons — Browser money path */}
        <div className="flex gap-1.5" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-divider)', position: 'relative', zIndex: 1 }}>
          {/* Order/Phone — primary action, shown conditionally */}
          {dish.order_url || dish.toast_slug ? (
            <a
              href={dish.toast_slug ? 'https://order.toasttab.com/online/' + dish.toast_slug : dish.order_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={function(e) { e.stopPropagation() }}
              className="flex items-center justify-center gap-1 flex-1"
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
              }}
            >
              🛒 Order Now
            </a>
          ) : restaurantPhone ? (
            <a
              href={'tel:' + restaurantPhone}
              onClick={function(e) { e.stopPropagation() }}
              className="flex items-center justify-center gap-1 flex-1"
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
              }}
            >
              📞 Call
            </a>
          ) : (
            <button
              onClick={function(e) { e.stopPropagation(); window.location.href = '/restaurants/' + dish.restaurant_id }}
              className="flex items-center justify-center gap-1 flex-1"
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
              }}
            >
              🌐 Menu
            </button>
          )}
          {/* Distance — secondary action */}
          {restaurantLat && restaurantLng && (
            <a
              href={'https://www.google.com/maps/dir/?api=1&destination=' + restaurantLat + ',' + restaurantLng}
              target="_blank"
              rel="noopener noreferrer"
              onClick={function(e) { e.stopPropagation() }}
              className="flex items-center justify-center gap-1 flex-1"
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                border: '1px solid var(--color-divider)',
                color: 'var(--color-text-secondary)',
              }}
            >
              📍 {distanceMiles != null ? (Number(distanceMiles) < 1 ? Number(distanceMiles).toFixed(1) + ' mi' : Math.round(Number(distanceMiles)) + ' mi') : 'Directions'}
            </a>
          )}
        </div>
      </button>
    )
  }

  // --- RANKS 4+ (Compact Rows) ---
  return (
    <button
      data-dish-id={dishId}
      onClick={handleClick}
      className="w-full text-left active:opacity-85"
      style={{
        background: highlighted ? 'var(--color-accent-gold-muted)' : 'transparent',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'background 1s ease-out',
        borderLeft: 'none',
        borderBottom: !isLast ? '1px solid var(--color-divider)' : 'none',
      }}
    >
      <div className="flex items-center">
      {/* Rank number */}
      {rank != null && (
        <span
          className="flex-shrink-0 font-bold"
          style={{
            width: '32px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {rank}
        </span>
      )}

      {/* Photo thumbnail (restaurant detail only, or rank 4+ inline) */}
      {showPhoto && photoUrl && (
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: '48px', height: '48px', marginLeft: '6px', borderRadius: '3px', background: 'var(--color-surface)' }}
        >
          <img src={photoUrl} alt={dishName} loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      {showPhoto && !photoUrl && (
        <div
          className="flex-shrink-0 overflow-hidden relative"
          style={{ width: '48px', height: '48px', marginLeft: '6px', borderRadius: '3px' }}
        >
          <RestaurantAvatar name={restaurantName} town={restaurantTown} fill />
        </div>
      )}

      {/* Name + restaurant + distance */}
      <div className="flex-1 min-w-0" style={{ marginLeft: showPhoto ? '6px' : '6px' }}>
        <p
          className="font-bold truncate"
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {dishName}
        </p>
        <div className="flex items-center gap-1.5" style={{ marginTop: '2px' }}>
          <p
            className="truncate"
            style={{
              fontSize: '12px',
              fontStyle: 'italic',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {restaurantName}
            {sortBy === 'best_value' && price != null && ' \u00b7 $' + Number(price).toFixed(0)}
            {showDistance && distanceMiles != null && ' \u00b7 ' + Number(distanceMiles).toFixed(1) + ' mi'}
          </p>
          {valuePercentile != null && <ValueBadge valuePercentile={valuePercentile} />}
        </div>
      </div>

      {/* Small photo thumbnail for rank 4+ (before rating) */}
      {!showPhoto && photoUrl && (
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{
            width: '40px',
            height: '40px',
            marginLeft: '8px',
            borderRadius: '3px',
            background: 'var(--color-surface)',
          }}
        >
          <img
            src={photoUrl}
            alt={dishName}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 20%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%)',
            }}
          />
        </div>
      )}

      {/* Rating + votes */}
      <div className="flex-shrink-0 text-right" style={{ marginLeft: '8px' }}>
        {isRanked ? (
          <>
            <span
              className="font-bold"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: getRatingColor(avgRating),
              }}
            >
              {avgRating}
            </span>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              fontWeight: 500,
              marginTop: '1px',
            }}>
              {totalVotes} vote{totalVotes === 1 ? '' : 's'}
            </div>
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

      {/* Compact action row — Order/Phone first, Distance second */}
      <div className="flex gap-1" style={{ marginTop: '4px', marginLeft: rank != null ? '38px' : '0' }}>
        {restaurantPhone && (
          <a
            href={'tel:' + restaurantPhone}
            onClick={function(e) { e.stopPropagation() }}
            style={{
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              fontWeight: 600,
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            📞 Call
          </a>
        )}
        {restaurantLat && restaurantLng && (
          <a
            href={'https://www.google.com/maps/dir/?api=1&destination=' + restaurantLat + ',' + restaurantLng}
            target="_blank"
            rel="noopener noreferrer"
            onClick={function(e) { e.stopPropagation() }}
            style={{
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              fontWeight: 600,
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            📞
          </a>
        )}
      </div>
    </button>
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
        className={'border overflow-hidden' + (isOtherProfile ? ' w-full text-left transition-all active:scale-[0.99]' : ' transition-all')}
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-divider)',
          borderRadius: '4px',
          boxShadow: 'none',
        }}
      >
        <div className="flex">
          {/* Image */}
          <div
            className="relative w-24 h-24 flex-shrink-0 overflow-hidden"
            style={{ background: 'var(--color-surface-elevated)', borderRadius: '3px 0 0 3px' }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={dishName} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <RestaurantAvatar name={restaurantName} town={restaurantTown} fill className="absolute inset-0" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <div>
              <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)', fontStyle: 'italic' }}>
                {restaurantName}
              </h3>
              <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {dishName}
              </p>
            </div>

            {/* Own Profile Rating */}
            {!isOtherProfile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {dish.rating_10 && (
                    <span className="text-sm font-semibold" style={{ color: getRatingColor(dish.rating_10) }}>
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
                {tab === 'worth-it' && <ThumbsUpIcon size={28} />}
                {tab === 'avoid' && <ThumbsDownIcon size={28} />}
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
                    <span className="text-sm font-semibold" style={{ color: getRatingColor(theirRatingNum) }}>
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
                    <span className="text-sm font-bold" style={{ color: getRatingColor(communityAvg) }}>
                      {communityAvg.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>avg</span>
                  </div>
                ) : (
                  wouldOrderAgain ? <ThumbsUpIcon size={28} /> : <ThumbsDownIcon size={28} />
                )}
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
