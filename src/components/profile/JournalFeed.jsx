import { useState, useEffect } from 'react'
import { JournalCard } from './JournalCard'
import { EmptyState } from '../EmptyState'

var PAGE_SIZE = 5

function getDateLabel(timestamp) {
  if (!timestamp) return ''
  var date = new Date(timestamp)
  var now = new Date()
  // Calendar-day buckets (not rolling 24h windows); Math.round absorbs DST 23/25h days
  var startOf = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
  var diffDays = Math.round((startOf(now) - startOf(date)) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return diffDays + ' days ago'
  if (diffDays < 14) return 'Last week'
  var opts = { month: 'short', day: 'numeric' }
  if (date.getFullYear() !== now.getFullYear()) opts.year = 'numeric'
  return date.toLocaleDateString('en-US', opts)
}

/**
 * JournalFeed — reverse-chronological feed of food journal entries.
 *
 * Single "My Ratings" shelf (Worth-It/Avoid split retired with the binary vote).
 * Date group headers separate entries by recency.
 *
 * Props:
 *   ratings       - array of rated dish entries (pre-sorted most-recent-first preferred)
 *   loading       - show loading skeletons
 *   error         - optional { message } — shows an error state instead of a false empty state
 *   onRetry       - optional retry callback for the error state
 *   emptySubtitle - empty-state subtitle (defaults to neutral copy for other people's profiles)
 *   emptyAction   - optional empty-state CTA element
 */
export function JournalFeed({
  ratings = [],
  loading,
  error,
  onRetry,
  emptySubtitle = 'No rated dishes yet',
  emptyAction,
}) {
  var [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset to first page when the ratings source changes substantially.
  useEffect(function () {
    setVisibleCount(PAGE_SIZE)
  }, [ratings.length])

  if (loading) {
    return (
      <div role="status" aria-label="Loading your journal" className="space-y-3 p-4 animate-pulse">
        {[0, 1, 2].map(function (i) {
          return (
            <div
              key={i}
              data-testid="journal-skeleton"
              className="rounded-xl p-4 flex gap-3"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-divider)' }}
            >
              <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: 'var(--color-divider)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded" style={{ background: 'var(--color-divider)' }} />
                <div className="h-3 w-1/2 rounded" style={{ background: 'var(--color-divider)' }} />
              </div>
              <div className="h-7 w-8 rounded flex-shrink-0" style={{ background: 'var(--color-divider)' }} />
            </div>
          )
        })}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>
          {error.message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={function () { onRetry() }}
            className="mt-3 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  // Sort reverse chronological (idempotent if caller pre-sorted).
  var entries = (ratings || []).slice().sort(function (a, b) {
    return new Date(b.voted_at || 0) - new Date(a.voted_at || 0)
  })

  if (entries.length === 0) {
    return (
      <div className="px-4">
        <EmptyState
          emoji="🍽️"
          title="No dishes here yet"
          subtitle={emptySubtitle}
          action={emptyAction}
        />
      </div>
    )
  }

  var visibleEntries = entries.slice(0, visibleCount)
  var hasMore = entries.length > visibleCount
  var remaining = entries.length - visibleCount

  // Build render list with date group headers inserted between label changes
  var renderItems = []
  var lastLabel = null
  for (var i = 0; i < visibleEntries.length; i++) {
    var dish = visibleEntries[i]
    var label = getDateLabel(dish.voted_at)
    if (label && label !== lastLabel) {
      renderItems.push({ type: 'header', label: label, key: 'header-' + label + '-' + i })
      lastLabel = label
    }
    renderItems.push({ type: 'entry', dish: dish, key: 'entry-' + (dish.dish_id || dish.id || i) })
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        {renderItems.map(function (item) {
          if (item.type === 'header') {
            return (
              <div
                key={item.key}
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  paddingTop: '4px',
                  paddingBottom: '2px',
                }}
              >
                {item.label}
              </div>
            )
          }
          return (
            <JournalCard
              key={item.key}
              dish={item.dish}
            />
          )
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={function () { setVisibleCount(visibleCount + PAGE_SIZE) }}
          className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
          style={{
            color: 'var(--color-text-primary)',
            background: 'var(--color-card)',
            border: '1px solid var(--color-divider)',
          }}
        >
          Show More ({remaining > PAGE_SIZE ? PAGE_SIZE : remaining} more)
        </button>
      )}
    </div>
  )
}
