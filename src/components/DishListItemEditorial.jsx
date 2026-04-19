import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategoryEmoji } from '../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'

/**
 * Editorial row — exact Claude Design prototype `DishRow` pattern.
 * Grid: rank numeral (Fraunces italic) · emoji plate · dish + restaurant + vote pill · price + bookmark
 * Used in Home list mode. Keep DishListItem.ranked for other surfaces until ported.
 */

function YesIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="m2 6 3 3 5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function UpIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M5 2l4 5H1z" fill="currentColor" />
    </svg>
  )
}

function BookmarkIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  )
}

export var DishListItemEditorial = memo(function DishListItemEditorial({ dish, rank, bookmarked, onBookmark, onClick, isLast }) {
  var navigate = useNavigate()
  var dishId = dish.dish_id || dish.id
  var dishName = dish.dish_name || dish.name
  var restaurantName = dish.restaurant_name || (dish.restaurants && dish.restaurants.name) || ''
  var restaurantTown = dish.restaurant_town || (dish.restaurants && dish.restaurants.town) || ''
  var category = dish.category || ''
  var totalVotes = Number(dish.total_votes) || 0
  var isRanked = totalVotes >= MIN_VOTES_FOR_RANKING
  var avgRating = Number(dish.avg_rating) || 0
  var yesPct = avgRating > 0 ? Math.round(avgRating * 10) : 0 // 0-10 rating → percentage feel
  var price = dish.price
  var emoji = getCategoryEmoji(category) || '🍽️'
  var trend = totalVotes >= 10 && avgRating >= 8 ? 'up' : null

  var handleClick = onClick || function () { navigate('/dish/' + dishId) }
  var handleBookmark = function (e) {
    e.stopPropagation()
    if (onBookmark) onBookmark(dish)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      className="press row-dish"
      style={{
        display: 'grid',
        gridTemplateColumns: '38px 68px 1fr auto',
        gap: 14,
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 0,
        padding: '14px 14px',
        cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid var(--rule)',
      }}
    >
      {rank != null ? (
        <div
          className="rank-num"
          style={{
            fontSize: 44,
            textAlign: 'center',
            color: rank <= 3 ? 'var(--tomato)' : 'var(--ink-2)',
          }}
        >
          {String(rank).padStart(2, '0')}
        </div>
      ) : <div />}

      <div
        className="stripe-ph"
        style={{
          width: 68,
          height: 68,
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}>
          {emoji}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div className="serif" style={{
          fontWeight: 700,
          fontSize: 17,
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {dishName}
        </div>
        <div style={{
          font: "500 12px/1.3 Inter, system-ui, sans-serif",
          color: 'var(--ink-2)',
          marginTop: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {restaurantName}
          {restaurantTown ? <span style={{ color: 'var(--ink-3)' }}> · {restaurantTown}</span> : null}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 7 }}>
          {isRanked ? (
            <span className="vote-pill yes">
              <YesIcon />{yesPct}%
            </span>
          ) : (
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>Early</span>
          )}
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
          {trend === 'up' ? (
            <span style={{
              color: 'var(--moss)',
              display: 'inline-flex',
              gap: 3,
              alignItems: 'center',
              fontSize: 11,
              fontWeight: 600,
            }}>
              <UpIcon />rising
            </span>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {price ? (
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
            ${typeof price === 'number' ? price.toFixed(2).replace(/\.00$/, '') : price}
          </div>
        ) : null}
        {onBookmark ? (
          <span
            onClick={handleBookmark}
            role="button"
            tabIndex={0}
            aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
            style={{
              border: 0,
              background: 'transparent',
              color: bookmarked ? 'var(--tomato)' : 'var(--ink-3)',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
            }}
          >
            <BookmarkIcon filled={bookmarked} />
          </span>
        ) : null}
      </div>
    </div>
  )
})
