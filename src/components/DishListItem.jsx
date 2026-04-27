import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MIN_VOTES_FOR_RANKING, VALUE_BADGE_THRESHOLD } from '../constants/app'
import { getRatingColor } from '../utils/ranking'
import { getCategoryNeonImage, getCategoryEmoji, getDishNameIcon } from '../constants/categories'
import { RestaurantAvatar } from './RestaurantAvatar'
import { HearingIcon } from './HearingIcon'
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
  const category = dish.category

  var handleClick = onClick || function () { navigate('/dish/' + dishId) }

  if (variant === 'voted') {
    return renderVotedCard()
  }

  // --- RANKED VARIANT ---
  // Editorial row: rank-num | photo/emoji | dish + restaurant + vote-pill | price/value
  var isPodium = rank != null && rank <= 3
  var ratingNum = avgRating != null ? Number(avgRating) : null
  var ratingTone = ratingNum == null ? 'neutral' : ratingNum >= 7 ? 'yes' : ratingNum >= 5 ? 'neutral' : 'no'
  var rankLabel = rank != null ? String(rank).padStart(2, '0') : null
  var hasValueBadge = valuePercentile != null && valuePercentile >= VALUE_BADGE_THRESHOLD

  return (
    <div
      data-dish-id={dishId}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e) } }}
      className={'press row-dish' + (highlighted ? ' row-dish--highlighted' : '')}
      style={{
        display: 'grid',
        gridTemplateColumns: rank != null
          ? (isPodium ? '52px 64px 1fr auto' : '34px 64px 1fr auto')
          : '64px 1fr auto',
        gap: 12,
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        background: highlighted ? 'var(--ochre-soft)' : 'transparent',
        cursor: 'pointer',
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--rule)',
        transition: 'background 1s ease-out',
      }}
    >
      {rank != null && (
        <div
          className="rank-num"
          style={{
            fontSize: isPodium ? 56 : 36,
            textAlign: 'center',
            color: isPodium ? 'var(--tomato)' : 'var(--ink-2)',
          }}
        >
          {rankLabel}
        </div>
      )}

      {/* Photo or emoji square */}
      <div
        className={photoUrl && showPhoto ? '' : 'stripe-ph'}
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          background: photoUrl && showPhoto ? 'var(--paper-2)' : undefined,
        }}
      >
        {photoUrl && showPhoto ? (
          <img
            src={photoUrl}
            alt={dishName}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            {getCategoryEmoji(category) || '🍽️'}
          </div>
        )}
      </div>

      {/* Dish name + restaurant + vote pill */}
      <div style={{ minWidth: 0 }}>
        <div
          className="t-h3"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {dishName}
        </div>
        <div
          className="t-body-sm"
          style={{
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
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
              style={{
                color: 'var(--ink)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
                textDecorationColor: 'var(--rule-2)',
              }}
            >
              {restaurantName}
            </span>
          ) : restaurantName}
          {restaurantTown && (
            <span style={{ color: 'var(--ink-3)' }}> {'·'} {restaurantTown}</span>
          )}
        </div>
        {!hideVotes && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {isRanked && ratingNum != null ? (
              <span className={'vote-pill ' + ratingTone}>
                {ratingNum.toFixed(1)}
                <span style={{ opacity: 0.55, fontWeight: 500 }}>/10</span>
              </span>
            ) : (
              <span className="vote-pill no">{totalVotes ? 'EARLY' : 'NEW'}</span>
            )}
            <span className="t-mono-micro">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              {showDistance && distanceMiles != null && ' · ' + Number(distanceMiles).toFixed(1) + ' mi'}
            </span>
          </div>
        )}
      </div>

      {/* Right column: price + value badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {price != null && (
          <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.04em' }}>
            ${Number(price).toFixed(0)}
          </span>
        )}
        {hasValueBadge && (
          <span
            className="t-mono-micro"
            style={{
              color: 'var(--moss)',
              border: '1px solid var(--rule)',
              padding: '2px 5px',
              borderRadius: 4,
              background: 'var(--card-paper)',
              letterSpacing: '0.16em',
            }}
          >
            Value
          </span>
        )}
      </div>
    </div>
  )

  // --- VOTED CARD RENDERER (untouched — profile pages still use legacy tokens) ---
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
        className={'rounded-xl border overflow-hidden' + (isOtherProfile ? ' w-full text-left hover:shadow-md transition-all active:scale-[0.99]' : ' transition-all')}
        style={{ background: 'var(--color-card)', borderColor: 'var(--color-divider)' }}
      >
        <div className="flex">
          <div
            className="relative w-24 h-24 rounded-l-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--color-surface-elevated)' }}
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

          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <div>
              <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {restaurantId ? (
                  <span
                    role="link"
                    onClick={function (e) { e.stopPropagation(); navigate('/restaurants/' + restaurantId) }}
                    style={{ color: 'var(--color-accent-gold)' }}
                  >
                    {restaurantName}
                  </span>
                ) : restaurantName}
              </h3>
              <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {dishName}
              </p>
            </div>

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
                      {'·'} avg {dish.community_avg.toFixed(1)}
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
                      {'·'} you: <span style={{ color: getRatingColor(myRatingNum) }}>
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
                ) : null}
              </div>
            )}
          </div>
        </div>

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
