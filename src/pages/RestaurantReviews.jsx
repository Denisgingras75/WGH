import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { votesApi } from '../api/votesApi'
import { restaurantsApi } from '../api/restaurantsApi'
import { logger } from '../utils/logger'
import { getUserMessage } from '../utils/errorHandler'
import { useAuth } from '../context/AuthContext'
import { ReportModal } from '../components/ReportModal'
import { EmptyState } from '../components/EmptyState'
import { LoginModal } from '../components/Auth/LoginModal'
import { PageHeader } from '../components/PageHeader'

var SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest' },
  { key: 'lowest', label: 'Lowest' },
]

var REVIEWS_LIMIT = 100

// Sort by rating in the given direction, always keeping unrated reviews last
function compareRatings(dir) {
  return function (a, b) {
    if (a.rating == null && b.rating == null) return 0
    if (a.rating == null) return 1
    if (b.rating == null) return -1
    return dir * (a.rating - b.rating)
  }
}

export function RestaurantReviews() {
  var { restaurantId } = useParams()
  var navigate = useNavigate()

  var [sortBy, setSortBy] = useState('newest')
  var [reportTarget, setReportTarget] = useState(null)
  var [loginOpen, setLoginOpen] = useState(false)
  var { user } = useAuth()

  // Restaurant (cache shared with RestaurantDetail + RateYourMeal)
  var restaurantQuery = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: function () { return restaurantsApi.getById(restaurantId) },
    enabled: !!restaurantId,
  })

  var reviewsQuery = useQuery({
    queryKey: ['restaurantReviews', restaurantId, REVIEWS_LIMIT, 'newest'],
    queryFn: function () {
      return votesApi.getReviewsForRestaurant(restaurantId, { limit: REVIEWS_LIMIT, sort: 'newest' })
    },
    enabled: !!restaurantId,
  })

  var restaurant = restaurantQuery.data || null
  var reviews = useMemo(function () { return reviewsQuery.data || [] }, [reviewsQuery.data])
  var loading = restaurantQuery.isLoading || reviewsQuery.isLoading
  var fetchError = restaurantQuery.error || reviewsQuery.error

  useEffect(function () {
    if (fetchError) logger.error('Failed to fetch restaurant reviews:', fetchError)
  }, [fetchError])

  var sortedReviews = useMemo(function () {
    var sorted = reviews.slice()
    if (sortBy === 'highest') {
      sorted.sort(compareRatings(-1))
    } else if (sortBy === 'lowest') {
      sorted.sort(compareRatings(1))
    }
    // 'newest' is the default fetch order, no re-sort needed
    return sorted
  }, [reviews, sortBy])

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

  var header = (
    <PageHeader
      title="Reviews"
      backTo={'/restaurants/' + restaurantId}
      meta={restaurant ? restaurant.name + (reviewsQuery.data ? ' · ' + (reviews.length >= REVIEWS_LIMIT
        ? REVIEWS_LIMIT + '+ reviews'
        : reviews.length + ' review' + (reviews.length !== 1 ? 's' : '')) : '') : null}
    />
  )

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        {header}
        <div className="px-4 pt-4 space-y-3 animate-pulse" role="status" aria-label="Loading reviews">
          {[0, 1, 2, 3].map(function (i) {
            return <div key={i} className="h-24 rounded-xl" style={{ background: 'var(--color-divider)' }} />
          })}
        </div>
      </div>
    )
  }

  if (!fetchError && !restaurant) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        {header}
        <div className="px-4">
          <EmptyState
            emoji="🍽️"
            title="Restaurant not found"
            subtitle="It may have closed or been removed."
            action={
              <button
                onClick={function () { navigate('/restaurants') }}
                className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                Back to Restaurants
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {header}

      {/* Sort pills */}
      {!fetchError && reviews.length > 0 && (
        <div className="flex gap-2 px-4 pt-3" role="group" aria-label="Sort reviews">
          {SORT_OPTIONS.map(function (opt) {
            var isActive = sortBy === opt.key
            return (
              <button
                key={opt.key}
                onClick={function () { setSortBy(opt.key) }}
                aria-pressed={isActive}
                className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px] transition-all"
                style={{
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                  border: isActive ? 'none' : '1.5px solid var(--color-divider)',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="px-4 pt-8 text-center">
          <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
            {getUserMessage(fetchError, 'loading reviews')}
          </p>
          <button
            onClick={function () {
              restaurantQuery.refetch()
              reviewsQuery.refetch()
            }}
            className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Reviews list */}
      {!fetchError && <div className="px-4 pt-4 space-y-3">
        {sortedReviews.length === 0 ? (
          <EmptyState
            emoji="💬"
            title="No written reviews yet"
            subtitle="Be the first to leave a review!"
            action={
              <button
                onClick={function () {
                  if (!user) {
                    setLoginOpen(true)
                    return
                  }
                  navigate('/restaurants/' + restaurantId + '/rate')
                }}
                className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                Rate Your Meal
              </button>
            }
          />
        ) : (
          sortedReviews.map(function (review, i) {
            var canReport = user && review.id && review.user_id && review.user_id !== user.id
            return (
              <div key={review.id || i} className="relative">
                <button
                  onClick={function () { if (review.dish_id) navigate('/dish/' + review.dish_id) }}
                  className="w-full text-left rounded-xl transition-all active:scale-[0.98]"
                  style={{
                    padding: '14px 16px',
                    paddingRight: canReport ? '44px' : '16px',
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
                          style={{
                            fontSize: '16px',
                            color: 'var(--color-rating)',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {review.rating}
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
                {canReport && (
                  <button
                    type="button"
                    onClick={function (e) {
                      e.stopPropagation()
                      setReportTarget({ type: 'review', id: review.id })
                    }}
                    className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center rounded-full"
                    aria-label="Report review"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>}
      <ReportModal
        isOpen={!!reportTarget}
        onClose={function () { setReportTarget(null) }}
        target={reportTarget}
      />
      <LoginModal isOpen={loginOpen} onClose={function () { setLoginOpen(false) }} />
    </div>
  )
}
