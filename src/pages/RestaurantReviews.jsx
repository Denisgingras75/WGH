import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { votesApi } from '../api/votesApi'
import { restaurantsApi } from '../api/restaurantsApi'
import { logger } from '../utils/logger'
import { getRatingColor } from '../utils/ranking'

export function RestaurantReviews() {
  var { restaurantId } = useParams()
  var navigate = useNavigate()

  var [restaurant, setRestaurant] = useState(null)
  var [reviews, setReviews] = useState([])
  var [loading, setLoading] = useState(true)
  var [fetchError, setFetchError] = useState(null)

  useEffect(function () {
    if (!restaurantId) return
    var cancelled = false

    setLoading(true)
    setFetchError(null)

    Promise.all([
      restaurantsApi.getById(restaurantId),
      votesApi.getReviewsForRestaurant(restaurantId, { limit: 100, sort: 'newest' }),
    ])
      .then(function (results) {
        if (cancelled) return
        setRestaurant(results[0])
        setReviews(results[1])
      })
      .catch(function (err) {
        if (!cancelled) {
          logger.error('Failed to fetch restaurant reviews:', err)
          setFetchError(err)
        }
      })
      .finally(function () {
        if (!cancelled) setLoading(false)
      })

    return function () { cancelled = true }
  }, [restaurantId])

  function formatDate(dateStr) {
    if (!dateStr) return ''
    var d = new Date(dateStr)
    var now = new Date()
    var diffMs = now - d
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return diffDays + 'd ago'
    if (diffDays < 30) return Math.floor(diffDays / 7) + 'w ago'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="px-4 py-6 space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded" style={{ background: 'var(--color-surface-elevated)' }} />
          {[0, 1, 2, 3].map(function (i) {
            return <div key={i} className="h-24 rounded-xl" style={{ background: 'var(--color-card)' }} />
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-bg)' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 px-4 py-3"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={function () { window.history.length > 1 ? navigate(-1) : navigate('/restaurants/' + restaurantId) }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1
              className="font-bold truncate"
              style={{
                fontFamily: "'Amatic SC', cursive",
                color: 'var(--color-text-primary)',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Reviews
            </h1>
            {restaurant && (
              <p
                className="font-medium truncate"
                style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}
              >
                {restaurant.name} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="px-4 pt-8 text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
            {fetchError?.message || 'Failed to load reviews'}
          </p>
          <button
            onClick={function () { window.location.reload() }}
            className="px-5 py-2.5 text-sm font-bold rounded-lg"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Reviews list */}
      {!fetchError && <div className="px-4 pt-4 space-y-3">
        {reviews.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl"
            style={{
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-divider)',
            }}
          >
            <p className="font-bold" style={{ fontSize: '16px' }}>No written reviews yet</p>
            <p className="text-sm mt-2">Be the first to leave a review!</p>
          </div>
        ) : (
          reviews.map(function (review, i) {
            return (
              <button
                key={i}
                onClick={function () { if (review.dish_id) navigate('/dish/' + review.dish_id) }}
                className="w-full text-left rounded-xl transition-all active:scale-[0.98]"
                style={{
                  padding: '14px 16px',
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-divider)',
                }}
              >
                {/* Top row: dish name + rating */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p
                    className="font-bold truncate"
                    style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}
                  >
                    {review.dish_name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {review.rating != null && (
                      <span
                        className="font-bold"
                        style={{ fontSize: '16px', color: getRatingColor(review.rating) }}
                      >
                        {review.rating}
                      </span>
                    )}
                    {review.would_order_again != null && (
                      <span style={{ fontSize: '14px' }}>
                        {review.would_order_again ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review text */}
                <p style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  &ldquo;{review.review_text}&rdquo;
                </p>

                {/* Date */}
                <p style={{
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '8px',
                }}>
                  {formatDate(review.created_at)}
                </p>
              </button>
            )
          })
        )}
      </div>}
    </div>
  )
}
