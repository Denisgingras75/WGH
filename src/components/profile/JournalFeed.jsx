import { useState, useEffect } from 'react'
import { JournalCard } from './JournalCard'

var PAGE_SIZE = 5

function getDateLabel(timestamp) {
  if (!timestamp) return ''
  var date = new Date(timestamp)
  var now = new Date()
  var diffMs = now - date
  var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return diffDays + ' days ago'
  if (diffDays < 14) return 'Last week'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * JournalFeed — reverse-chronological feed of food journal entries.
 *
 * Single "My Ratings" shelf (Worth-It/Avoid split retired with the binary vote).
 * Date group headers separate entries by recency.
 *
 * Props:
 *   ratings - array of rated dish entries (pre-sorted most-recent-first preferred)
 *   loading - show loading skeletons
 */
export function JournalFeed({ ratings = [], loading }) {
  var [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset to first page when the ratings source changes substantially.
  useEffect(function () {
    setVisibleCount(PAGE_SIZE)
  }, [ratings.length])

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2].map(function (i) {
          return (
            <div
              key={i}
              data-testid="journal-skeleton"
              className="h-24 rounded-xl animate-pulse"
              style={{ background: 'var(--color-surface-elevated)' }}
            />
          )
        })}
      </div>
    )
  }

  // Sort reverse chronological (idempotent if caller pre-sorted).
  var entries = (ratings || []).slice().sort(function (a, b) {
    return new Date(b.voted_at || 0) - new Date(a.voted_at || 0)
  })

  if (entries.length === 0) {
    return (
      <div className="p-4">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            background: 'var(--color-card)',
            borderColor: 'var(--color-divider)',
          }}
        >
          <p
            className="font-semibold"
            style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}
          >
            No dishes here yet
          </p>
          <p
            className="mt-1"
            style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}
          >
            Start rating dishes to build your food journal
          </p>
        </div>
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
                  color: 'var(--color-accent-gold)',
                  fontSize: '10px',
                  fontWeight: 700,
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
          onClick={function () { setVisibleCount(visibleCount + PAGE_SIZE) }}
          className="w-full py-3 rounded-xl font-semibold text-center transition-all active:scale-[0.98] mt-3"
          style={{
            fontSize: '14px',
            color: 'var(--color-accent-gold)',
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-divider)',
          }}
        >
          Show More ({remaining > PAGE_SIZE ? PAGE_SIZE : remaining} more)
        </button>
      )}
    </div>
  )
}
