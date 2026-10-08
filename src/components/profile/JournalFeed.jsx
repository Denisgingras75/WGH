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
              className="h-24 animate-pulse"
              style={{ background: 'var(--color-surface)', border: '2px solid var(--color-divider)', borderRadius: 'var(--radius-lg)' }}
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
          className="p-8 text-center"
          style={{
            background: 'var(--color-surface)',
            border: '2px dashed var(--color-text-tertiary)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <p
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            No dishes here yet
          </p>
          <p
            className="mt-1"
            style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500 }}
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
                className="eyebrow"
                style={{
                  paddingTop: '6px',
                  paddingBottom: '0',
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
          className="btn-ink w-full py-3 mt-4"
          style={{
            fontSize: '14px',
            color: 'var(--color-ink)',
            background: 'var(--color-card)',
          }}
        >
          Show More ({remaining > PAGE_SIZE ? PAGE_SIZE : remaining} more)
        </button>
      )}
    </div>
  )
}
