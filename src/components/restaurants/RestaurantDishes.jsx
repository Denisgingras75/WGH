import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { DishListItem } from '../DishListItem'
import { SectionHeader } from '../SectionHeader'
import { EmptyState } from '../EmptyState'
import { DishRowSkeleton } from '../Skeleton'

const TOP_DISHES_COUNT = 5

// Restaurant dishes component - Job #2: "What should I order?"
export function RestaurantDishes({ dishes, loading, error, friendsVotesByDish = {}, onRetry }) {
  const [showAllDishes, setShowAllDishes] = useState(false)

  // Sort dishes
  const sortedDishes = useMemo(() => {
    if (!dishes?.length) return { top: [], rest: [] }

    const sorted = [...dishes].sort((a, b) => {
      const aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
      const bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
      // Ranked dishes first
      if (aRanked && !bRanked) return -1
      if (!aRanked && bRanked) return 1
      // Then by granular rating score (avg_rating)
      const aRating = a.avg_rating || 0
      const bRating = b.avg_rating || 0
      if (bRating !== aRating) return bRating - aRating
      // Tie-breaker: vote count, then alphabetical
      const voteDiff = (b.total_votes || 0) - (a.total_votes || 0)
      if (voteDiff !== 0) return voteDiff
      return (a.dish_name || '').localeCompare(b.dish_name || '')
    })

    return {
      top: sorted.slice(0, TOP_DISHES_COUNT),
      rest: sorted.slice(TOP_DISHES_COUNT),
    }
  }, [dishes])

  const rankedCount = dishes?.filter(d => (d.total_votes || 0) >= MIN_VOTES_FOR_RANKING).length || 0

  // Count unique friends who rated dishes here
  const uniqueFriends = useMemo(() => {
    const friendIds = new Set()
    Object.values(friendsVotesByDish).forEach(votes => {
      votes.forEach(v => friendIds.add(v.user_id))
    })
    return friendIds.size
  }, [friendsVotesByDish])

  if (loading) {
    return (
      <div className="px-4 py-6">
        <DishRowSkeleton count={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center">
        <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
          {error?.message || error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  if (!dishes?.length) {
    return (
      <div className="px-4 py-5">
        <EmptyState emoji="🍽️" title="No dishes here yet" subtitle="Check back soon." />
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      {/* Section Header */}
      <div className="mb-5">
        <SectionHeader
          title={rankedCount > 0 ? "What's Good Here" : 'Help decide what to order here'}
          subtitle={rankedCount > 0
            ? `Top picks based on ${rankedCount} rated ${rankedCount === 1 ? 'dish' : 'dishes'}`
            : 'Vote on dishes to shape the rankings'
          }
          level="h2"
        />
      </div>

      {/* Friends banner */}
      {uniqueFriends > 0 && (
        <div
          className="mb-4 pl-1.5 pr-3.5 py-1 rounded-xl flex items-center gap-2"
          style={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-divider)',
          }}
        >
          {/* Friend avatars: each link is a full 44px target (no overlap) around a 32px circle */}
          <div className="flex flex-shrink-0">
            {(() => {
              const seen = new Set()
              const friendList = []
              Object.values(friendsVotesByDish).forEach(votes => {
                votes.forEach(v => {
                  if (!seen.has(v.user_id)) {
                    seen.add(v.user_id)
                    friendList.push(v)
                  }
                })
              })
              return friendList.slice(0, 3).map((friend) => {
                const label = 'View ' + (friend.display_name || 'friend') + "'s profile"
                return (
                  <Link
                    key={friend.user_id}
                    to={`/user/${friend.user_id}`}
                    aria-label={label}
                    title={label}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
                  >
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'var(--color-primary)',
                        color: 'var(--color-text-on-primary)',
                      }}
                    >
                      {friend.display_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </Link>
                )
              })
            })()}
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {uniqueFriends} {uniqueFriends === 1 ? 'friend has' : 'friends have'} been here
          </p>
        </div>
      )}

      {/* Top Dishes */}
      <div>
        {sortedDishes.top.map((dish, index) => (
          <DishListItem
            key={dish.dish_id}
            dish={dish}
            rank={index + 1}
            showPhoto
            isLast={index === sortedDishes.top.length - 1}
          />
        ))}
      </div>

      {/* More Dishes */}
      {sortedDishes.rest.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowAllDishes(!showAllDishes)}
            aria-expanded={showAllDishes}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
            style={{
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
            }}
          >
            {showAllDishes ? 'Show less' : `See ${sortedDishes.rest.length} more dishes`}
            <svg
              className={`w-4 h-4 transition-transform ${showAllDishes ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAllDishes && (
            <div className="mt-4">
              {sortedDishes.rest.map((dish, index) => (
                <DishListItem
                  key={dish.dish_id}
                  dish={dish}
                  rank={TOP_DISHES_COUNT + index + 1}
                  showPhoto
                  isLast={index === sortedDishes.rest.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
