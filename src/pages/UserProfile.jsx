import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { getCompatColor } from '../utils/formatters'
import { getUserMessage } from '../utils/errorHandler'
import { shareOrCopy } from '../utils/share'
import { capture } from '../lib/analytics'
import { toast } from 'sonner'
import { followsApi } from '../api/followsApi'
import { votesApi } from '../api/votesApi'
import { FollowListModal } from '../components/FollowListModal'
import { ProfileSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { SectionHeader } from '../components/SectionHeader'
import { LoginModal } from '../components/Auth/LoginModal'
import { FoodMap, JournalFeed, LocalListCard } from '../components/profile'
import { useUserPlaylists } from '../hooks/useUserPlaylists'
import { PlaylistGridCard } from '../components/playlists/PlaylistGridCard'
import { useLocalListDetail } from '../hooks/useLocalListDetail'
import { TrustBadge, ProfileJitterCard } from '../components/jitter'
import { jitterApi } from '../api/jitterApi'
import { profileApi } from '../api/profileApi'
import { ReportModal } from '../components/ReportModal'
import { BlockUserModal } from '../components/BlockUserModal'
import { useBlockedUsers } from '../hooks/useBlockedUsers'
import { computeRatingStyle } from '../hooks/useUserVotes'
import { PageHeader } from '../components/PageHeader'
import { AMATIC_TITLE } from '../constants/styles'

// Known location display names for URL slugs
var LOCATION_NAMES = {
  'marthas-vineyard': "Martha's Vineyard",
  'nantucket': 'Nantucket',
  'cape-cod': 'Cape Cod',
}

function formatLocationName(slug) {
  if (LOCATION_NAMES[slug]) return LOCATION_NAMES[slug]
  // Title-case fallback: "oak-bluffs" → "Oak Bluffs"
  return slug.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase() })
}

var PROFILE_TABS = ['journal', 'playlists']

// Height of the sticky detail header: 44px row + py-3 (24px) + 1px divider.
// The sticky tab bar pins directly beneath it.
var HEADER_HEIGHT = 69

/**
 * Public User Profile Page
 * View another user's profile, stats, badges, and recent ratings.
 *
 * Keyed on userId so navigating /user/A → /user/B (e.g. from the follow list)
 * remounts with fresh per-user state instead of leaking A's badge, picks,
 * taste match or follow state onto B.
 */
export function UserProfile() {
  const { userId } = useParams()
  return <UserProfileContent key={userId} />
}

function UserProfileContent() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const currentUserId = currentUser?.id
  const locationFilter = searchParams.get('location')

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followListModal, setFollowListModal] = useState(null) // 'followers' | 'following' | null
  const [userReviews, setUserReviews] = useState([])
  const [tasteCompat, setTasteCompat] = useState(null)
  const [ratingBias, setRatingBias] = useState(null)
  const [standoutPicks, setStandoutPicks] = useState({})
  const [jitterBadgeType, setJitterBadgeType] = useState(null)
  const [jitterBadgeData, setJitterBadgeData] = useState(null)
  const [activeTab, setActiveTab] = useState('journal')
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const {
    playlists: userPlaylists,
    loading: playlistsLoading,
    error: playlistsError,
    refetch: refetchPlaylists,
  } = useUserPlaylists(userId)
  const { isBlocked, unblockUser, unblocking, loading: blocksLoading } = useBlockedUsers()

  var localList = useLocalListDetail(userId)
  const actionsMenuRef = useRef(null)
  const moreBtnRef = useRef(null)

  // Check if viewing own profile
  const isOwnProfile = currentUserId === userId
  const viewerHasBlocked = !!currentUser && !isOwnProfile && isBlocked(userId)

  // Close actions menu on outside click or Escape
  useEffect(() => {
    if (!showActionsMenu) return
    const handleClickOutside = (e) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
        setShowActionsMenu(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowActionsMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showActionsMenu])

  // Redirect to /profile if viewing own profile
  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile', { replace: true })
    }
  }, [isOwnProfile, navigate])

  // Fetch all independent data in parallel.
  // Depends on the viewer's id (not the user object) so auth token refreshes
  // and tab-refocus SIGNED_IN events don't blank the page with a skeleton.
  useEffect(() => {
    // Own profile redirects to /profile — skip the fetches; the skeleton
    // stays up until the redirect lands.
    if (!userId || isOwnProfile) return
    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      setError(null)
      setNotFound(false)

      // Build the list of parallel fetches
      const fetches = [
        // 0: profile (always)
        followsApi.getUserProfile(userId),
        // 1: follow status (only if logged in)
        currentUserId
          ? followsApi.isFollowing(userId)
          : Promise.resolve(null),
        // 2: taste compatibility (only if logged in)
        currentUserId
          ? followsApi.getTasteCompatibility(userId)
          : Promise.resolve(null),
        // 3: rating bias
        profileApi.getRatingBias(userId),
        // 4: jitter badge
        jitterApi.getJitterBadges([userId]),
        // 5: reviews (matches the 50-vote window the journal is built from)
        votesApi.getReviewsForUser(userId, { limit: 50 }),
      ]

      const results = await Promise.allSettled(fetches)
      if (cancelled) return

      // 0: Profile
      if (results[0].status === 'fulfilled') {
        const data = results[0].value
        if (!data) {
          setNotFound(true)
        } else {
          setProfile(data)
        }
      } else {
        logger.error('Failed to fetch profile:', results[0].reason)
        setError(results[0].reason)
      }

      // 1: Follow status
      if (results[1].status === 'fulfilled' && results[1].value !== null) {
        setIsFollowing(results[1].value)
      } else if (results[1].status === 'rejected') {
        logger.error('Failed to check follow status:', results[1].reason)
      }

      // 2: Taste compatibility
      if (results[2].status === 'fulfilled' && results[2].value !== null) {
        setTasteCompat(results[2].value)
      } else if (results[2].status === 'rejected') {
        logger.error('Failed to fetch taste compatibility:', results[2].reason)
      }

      // 3: Rating bias
      if (results[3].status === 'fulfilled') {
        setRatingBias(results[3].value)
      } else {
        logger.error('Failed to fetch rating bias:', results[3].reason)
      }

      // 4: Jitter badge
      if (results[4].status === 'fulfilled') {
        const badges = results[4].value
        if (badges && badges.length > 0) {
          setJitterBadgeType(jitterApi.getTrustBadgeType(badges[0]))
          setJitterBadgeData(badges[0])
        }
      } else {
        logger.error('Failed to fetch jitter badge:', results[4].reason)
      }

      // 5: Reviews
      if (results[5].status === 'fulfilled') {
        setUserReviews(results[5].value || [])
      } else {
        logger.error('Failed to fetch reviews:', results[5].reason)
      }

      setLoading(false)
    }

    fetchAll()
    return () => { cancelled = true }
  }, [userId, currentUserId, isOwnProfile, reloadKey])

  // Dependent fetch: standout picks need profile.recent_votes + community averages
  useEffect(() => {
    if (!profile?.recent_votes?.length) return
    let cancelled = false

    async function fetchStandoutPicks() {
      const ratedVotes = profile.recent_votes.filter(v => v.rating != null)
      const dishIds = ratedVotes.map(v => v.dish?.id).filter(Boolean)
      if (dishIds.length === 0) return

      let communityAvgs
      try {
        communityAvgs = await votesApi.getCommunityAvgsForDishes(dishIds)
      } catch (err) {
        logger.error('Failed to fetch community averages:', err)
        return
      }
      if (cancelled) return

      try {
        const MIN_COMMUNITY = 3
        const picks = {}

        const comparisons = ratedVotes
          .filter(v => v.dish?.id && communityAvgs[v.dish.id]?.count >= MIN_COMMUNITY)
          .map(v => ({
            dish_name: v.dish.name,
            restaurant_name: v.dish.restaurant_name,
            userRating: v.rating,
            communityAvg: communityAvgs[v.dish.id].avg,
            diff: v.rating - communityAvgs[v.dish.id].avg,
          }))

        if (comparisons.length > 0) {
          // Best find: highest user rating, tie-break by positive diff
          const best = comparisons.slice().sort((a, b) => {
            if (b.userRating !== a.userRating) return b.userRating - a.userRating
            return b.diff - a.diff
          })
          picks.bestFind = best[0]

          // Hottest take: biggest negative diff (user rates much lower than community), min -1.0
          const harsh = comparisons.slice().sort((a, b) => a.diff - b.diff)
          if (harsh[0] && harsh[0].diff <= -1.0) {
            picks.harshestTake = harsh[0]
          }

          setStandoutPicks(picks)
        }
      } catch (err) {
        logger.error('Failed to compute standout picks:', err)
      }
    }

    fetchStandoutPicks()
    return () => { cancelled = true }
  }, [profile?.recent_votes])

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  // Handle follow/unfollow — optimistic with rollback
  const handleFollowToggle = async () => {
    if (!currentUser) {
      setLoginModalOpen(true)
      return
    }
    if (followLoading) return

    const was = isFollowing
    setFollowLoading(true)
    setIsFollowing(!was)
    setProfile(p => p ? {
      ...p,
      follower_count: Math.max(0, (p.follower_count || 0) + (was ? -1 : 1)),
    } : p)
    try {
      await (was ? followsApi.unfollow(userId) : followsApi.follow(userId))
    } catch (error) {
      logger.error('Failed to toggle follow:', error)
      setIsFollowing(was)
      setProfile(p => p ? {
        ...p,
        follower_count: Math.max(0, (p.follower_count || 0) + (was ? 1 : -1)),
      } : p)
      toast.error(getUserMessage(error, was ? 'unfollowing' : 'following'))
    } finally {
      setFollowLoading(false)
    }
  }

  // Handle share profile
  const handleShare = async () => {
    const result = await shareOrCopy({
      url: window.location.href,
      title: `${profile.display_name} on What's Good Here`,
    })

    capture('profile_shared', {
      user_id: userId,
      context: 'user_profile',
      method: result.method,
      success: result.success,
    })

    if (result.success && result.method !== 'native') {
      toast.success('Link copied!', { duration: 2000 })
    } else if (!result.success && result.method !== 'native') {
      toast.error("Couldn't copy the link. Try again.")
    }
  }

  // Unblock from the blocked screen, then refetch the follow state, counts,
  // reviews and taste match that were filtered while the block was in place.
  const handleUnblock = async () => {
    if (unblocking) return
    const { error: unblockError } = await unblockUser(userId)
    if (!unblockError) setReloadKey(k => k + 1)
  }

  // Return focus to the More button after a safety modal closes (the menu
  // item that opened it has already unmounted).
  const restoreMoreFocus = () => {
    requestAnimationFrame(() => moreBtnRef.current?.focus())
  }

  const handleTabKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const idx = PROFILE_TABS.indexOf(activeTab)
    const step = e.key === 'ArrowRight' ? 1 : -1
    const next = PROFILE_TABS[(idx + step + PROFILE_TABS.length) % PROFILE_TABS.length]
    setActiveTab(next)
    requestAnimationFrame(() => {
      document.getElementById('user-tab-' + next)?.focus()
    })
  }

  // Compute stats from recent votes — single "My Ratings" shelf, sorted by recency.
  const { foodMapStats, ratingStyle } = useMemo(() => {
    const recentVotes = profile?.recent_votes || []
    const totalVotes = profile?.stats?.total_votes ?? recentVotes.length
    if (!recentVotes.length) {
      return { foodMapStats: { totalVotes, uniqueRestaurants: 0, categoryCounts: {} }, ratingStyle: null }
    }
    const restaurantNames = new Set()
    const catCounts = {}
    const ratings = []
    recentVotes.forEach(vote => {
      if (vote.dish?.restaurant_name) {
        restaurantNames.add(vote.dish.restaurant_name)
      }
      if (vote.dish?.category) {
        catCounts[vote.dish.category] = (catCounts[vote.dish.category] || 0) + 1
      }
      if (vote.rating != null) {
        ratings.push(vote.rating)
      }
    })

    // Compute rating style from average
    let style = null
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      const variance = ratings.length > 1
        ? Math.sqrt(ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length)
        : 0
      style = computeRatingStyle(avgRating, variance)
      if (style) style.avgRating = avgRating
    }

    return {
      foodMapStats: {
        totalVotes,
        uniqueRestaurants: restaurantNames.size,
        categoryCounts: catCounts,
      },
      ratingStyle: style,
    }
  }, [profile?.recent_votes, profile?.stats?.total_votes])

  // Transform votes into JournalFeed shape — one shelf, sorted most-recent-first.
  var journalRatings = (profile?.recent_votes || [])
    .slice()
    .sort(function (a, b) {
      return new Date(b.voted_at || 0).getTime() - new Date(a.voted_at || 0).getTime()
    })
    .map(function (vote) {
      var review = userReviews.find(function (r) { return r.dish_id === (vote.dish && vote.dish.id) })
      return {
        dish_id: vote.dish && vote.dish.id,
        dish_name: vote.dish && vote.dish.name,
        restaurant_name: vote.dish && vote.dish.restaurant_name,
        restaurant_town: vote.dish && vote.dish.restaurant_town,
        category: vote.dish && vote.dish.category,
        photo_url: vote.dish && vote.dish.photo_url,
        rating_10: vote.rating,
        community_avg: vote.dish && vote.dish.avg_rating,
        voted_at: vote.voted_at,
        review_text: review && review.review_text,
      }
    })

  // Apply location filter if present in URL
  if (locationFilter) {
    var locLower = locationFilter.toLowerCase().replace(/-/g, ' ')
    journalRatings = journalRatings.filter(function (d) {
      var town = (d.restaurant_town || '').toLowerCase()
      return town.indexOf(locLower) !== -1 || locLower.indexOf(town) !== -1
    })
  }

  if (loading || (currentUser && blocksLoading)) {
    return <ProfileSkeleton />
  }

  if (error || notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: 'var(--color-bg)' }}>
        {error ? (
          <>
            <h1 className="sr-only">Profile</h1>
            <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
              {getUserMessage(error, 'loading this profile')}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey(k => k + 1)}
              className="py-3 px-4 rounded-xl font-bold text-sm min-h-[44px] transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <img src="/search-not-found.webp" alt="" className="w-16 h-16 mx-auto mb-4 rounded-full object-cover" />
            <h1 className="mb-2" style={{ ...AMATIC_TITLE, fontSize: '28px' }}>
              User not found
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              This profile doesn't exist or may have been removed.
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-4 rounded-xl font-bold text-sm min-h-[44px] transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Go Back
            </button>
          </>
        )}
      </div>
    )
  }

  const totalVotes = foodMapStats.totalVotes

  if (viewerHasBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--color-bg)' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-5"
          style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-tertiary)' }}
          aria-hidden="true"
        >
          {profile.display_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <h1 className="mb-2" style={{ ...AMATIC_TITLE, fontSize: '28px' }}>
          You blocked {profile.display_name}
        </h1>
        <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
          You won't see their reviews, photos, or activity. Unblock to restore their profile.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="py-3 px-5 min-h-[44px] rounded-xl font-semibold transition-all active:scale-[0.98]"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
            }}
          >
            Go back
          </button>
          <button
            type="button"
            onClick={handleUnblock}
            disabled={unblocking}
            className="py-3 px-5 min-h-[44px] rounded-xl font-semibold transition-all active:scale-[0.98]"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-on-primary)',
              fontSize: '14px',
              opacity: unblocking ? 0.7 : 1,
            }}
          >
            {unblocking ? 'Unblocking…' : 'Unblock'}
          </button>
        </div>
      </div>
    )
  }

  const secondaryButtonStyle = {
    background: 'var(--color-surface-elevated)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-divider)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Sticky detail header: back + name */}
      <PageHeader
        title={profile.display_name || 'Anonymous'}
        titleAside={jitterBadgeType ? <TrustBadge type={jitterBadgeType} size="md" /> : null}
        onBack={handleBack}
      />

      {/* Hero */}
      <div
        className="relative px-4 pt-5 pb-6"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        {/* Avatar + follow stats row */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
                boxShadow: '0 0 0 3px var(--color-primary-muted)',
              }}
              aria-hidden="true"
            >
              {profile.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Follow Stats */}
            <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => setFollowListModal('followers')}
                className="inline-flex items-center min-h-[44px] hover:underline"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span className="font-bold mr-1" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.follower_count || 0}
                </span>
                followers
              </button>
              <span style={{ color: 'var(--color-text-tertiary)' }} aria-hidden="true">&middot;</span>
              <button
                type="button"
                onClick={() => setFollowListModal('following')}
                className="inline-flex items-center min-h-[44px] hover:underline"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span className="font-bold mr-1" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.following_count || 0}
                </span>
                following
              </button>
            </div>
          </div>
        </div>

        {/* Taste Compatibility */}
        {tasteCompat && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-divider)',
            }}
          >
            {tasteCompat.compatibility_pct != null ? (
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: getCompatColor(tasteCompat.compatibility_pct) }}
                />
                <span
                  className="text-2xl"
                  style={{
                    color: 'var(--color-text-primary)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {tasteCompat.compatibility_pct}%
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    taste match
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Based on {tasteCompat.shared_dishes} shared {tasteCompat.shared_dishes === 1 ? 'dish' : 'dishes'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                {tasteCompat.shared_dishes > 0
                  ? `${tasteCompat.shared_dishes} shared ${tasteCompat.shared_dishes === 1 ? 'dish' : 'dishes'} — rate ${3 - tasteCompat.shared_dishes} more to see your taste match`
                  : 'Rate the same dishes to see your taste match'
                }
              </p>
            )}
          </div>
        )}

        {/* Rating Style + Deviation Score */}
        {(ratingStyle || (ratingBias && ratingBias.votesWithConsensus > 0)) && (
          <div className="mt-4 flex gap-2.5">
            {ratingStyle && (
              <div
                className="flex-1 rounded-xl p-4"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-divider)',
                }}
              >
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {ratingStyle.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  avg {ratingStyle.avgRating.toFixed(1)}/10
                </p>
              </div>
            )}
            {ratingBias && ratingBias.votesWithConsensus > 0 && (
              <div
                className="flex-1 rounded-xl p-4"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-divider)',
                }}
              >
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {ratingBias.biasLabel}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {ratingBias.ratingBias.toFixed(1)} pts from crowd
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleFollowToggle}
            disabled={followLoading}
            className={`flex-1 py-3 min-h-[44px] rounded-xl text-sm transition-all active:scale-[0.98] ${isFollowing ? 'font-semibold' : 'font-bold'}`}
            style={isFollowing ? {
              ...secondaryButtonStyle,
              opacity: followLoading ? 0.7 : 1,
            } : {
              background: 'var(--color-primary)',
              color: 'var(--color-text-on-primary)',
              border: '1px solid transparent',
              opacity: followLoading ? 0.7 : 1,
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={secondaryButtonStyle}
          >
            Share
          </button>
          {currentUser && (
            <div className="relative" ref={actionsMenuRef}>
              <button
                ref={moreBtnRef}
                type="button"
                onClick={() => setShowActionsMenu((v) => !v)}
                aria-label="More actions"
                aria-expanded={showActionsMenu}
                aria-controls="user-actions-menu"
                className="w-11 h-full min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-[0.98]"
                style={secondaryButtonStyle}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              {showActionsMenu && (
                <div
                  id="user-actions-menu"
                  className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-40"
                  style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-divider)' }}
                >
                  <button
                    type="button"
                    onClick={() => { setShowActionsMenu(false); setShowReportModal(true) }}
                    className="w-full px-4 py-3 text-left text-sm font-medium transition-colors border-b"
                    style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-divider)' }}
                  >
                    Report user
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowActionsMenu(false); setShowBlockModal(true) }}
                    className="w-full px-4 py-3 text-left text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Block user
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Food Map */}
      {totalVotes > 0 && (
        <div className="px-4 pt-4">
          <FoodMap stats={foodMapStats} title={`${profile.display_name}'s Food Map`} />
        </div>
      )}

      {/* Local List */}
      {localList.items.length > 0 && (
        <LocalListCard items={localList.items} />
      )}

      {/* Standout Picks */}
      {totalVotes >= 3 && Object.keys(standoutPicks).length > 0 && (
        <div className="px-4 pt-3 flex flex-col gap-2.5">
          {standoutPicks.bestFind && (
            <div
              className="rounded-xl border px-3.5 py-3 flex items-center gap-3"
              style={{
                background: 'var(--color-card)',
                borderColor: 'var(--color-divider)',
              }}
            >
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                {'⭐'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                  Top pick
                </p>
                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {standoutPicks.bestFind.dish_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {standoutPicks.bestFind.restaurant_name} &middot; {standoutPicks.bestFind.userRating}/10
                </p>
              </div>
            </div>
          )}

          {standoutPicks.harshestTake && (
            <div
              className="rounded-xl border px-3.5 py-3 flex items-center gap-3"
              style={{
                background: 'var(--color-card)',
                borderColor: 'var(--color-divider)',
              }}
            >
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                {'🌶️'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                  Hottest take
                </p>
                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {standoutPicks.harshestTake.dish_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {standoutPicks.harshestTake.restaurant_name} &middot; {standoutPicks.harshestTake.userRating}/10 vs {standoutPicks.harshestTake.communityAvg.toFixed(1)} crowd
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Fingerprint — public view */}
      {jitterBadgeData && jitterBadgeType && (
        <div className="px-4 pt-3">
          <ProfileJitterCard
            profile={jitterBadgeData}
            displayName={profile.display_name}
            isPublic
          />
        </div>
      )}

      {/* Location Filter Banner */}
      {locationFilter && (
        <div
          className="mx-4 mt-3 pl-4 pr-2 py-1 rounded-xl flex items-center justify-between"
          style={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            Showing picks in <strong style={{ color: 'var(--color-text-primary)' }}>{formatLocationName(locationFilter)}</strong>
          </span>
          <button
            type="button"
            onClick={function () { setSearchParams({}) }}
            className="inline-flex items-center min-h-[44px] px-2 font-semibold"
            style={{ color: 'var(--color-primary)', fontSize: '13px' }}
          >
            Show all
          </button>
        </div>
      )}

      {/* Tabs: Journal / Playlists (no Saved — that's personal) */}
      <div
        role="tablist"
        aria-label="Profile sections"
        onKeyDown={handleTabKeyDown}
        className="flex"
        style={{
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-bg)',
          position: 'sticky',
          top: HEADER_HEIGHT,
          zIndex: 10,
        }}
      >
        {PROFILE_TABS.map(function (tab) {
          var selected = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={'user-tab-' + tab}
              aria-selected={selected}
              aria-controls={'user-panel-' + tab}
              tabIndex={selected ? 0 : -1}
              onClick={function () { setActiveTab(tab) }}
              className="flex-1 py-3 text-xs font-semibold text-center"
              style={{
                color: selected ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: selected ? 'var(--color-primary)' : 'transparent',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        })}
      </div>

      {/* --- Journal tab --- */}
      {activeTab === 'journal' && (
        <div role="tabpanel" id="user-panel-journal" aria-labelledby="user-tab-journal">
          {/* Ratings shelf title */}
          <div className="px-4 pt-5 pb-1">
            <SectionHeader title={profile.display_name + "'s Ratings"} />
          </div>

          {/* Journal Feed — single chronological shelf */}
          {journalRatings.length === 0 ? (
            <EmptyState
              emoji="🍽️"
              title={(profile.display_name || 'This user') + " hasn't rated any dishes yet"}
            />
          ) : (
            <JournalFeed ratings={journalRatings} />
          )}
        </div>
      )}

      {/* --- Playlists tab --- */}
      {activeTab === 'playlists' && (
        <div
          role="tabpanel"
          id="user-panel-playlists"
          aria-labelledby="user-tab-playlists"
          className="px-4 pt-4 pb-6"
        >
          {playlistsLoading ? (
            <div className="grid grid-cols-2 gap-3 animate-pulse" role="status" aria-label="Loading playlists">
              {[0, 1, 2, 3].map(function (i) {
                return <div key={i} className="rounded-xl aspect-square" style={{ background: 'var(--color-divider)' }} />
              })}
            </div>
          ) : playlistsError ? (
            <div className="py-10 text-center">
              <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
                {playlistsError.message}
              </p>
              <button
                type="button"
                onClick={function () { refetchPlaylists() }}
                className="py-3 px-4 rounded-xl font-bold text-sm min-h-[44px] transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                Try again
              </button>
            </div>
          ) : userPlaylists.length === 0 ? (
            <EmptyState emoji="🎵" title="No playlists yet" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userPlaylists.map(function (p) { return <PlaylistGridCard key={p.id} playlist={p} /> })}
            </div>
          )}
        </div>
      )}

      {/* Signup CTA for visitors */}
      {!currentUser && (
        <div
          className="mx-4 mt-6 mb-4 rounded-2xl px-5 py-5 text-center"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <p className="font-bold" style={{ color: 'var(--color-text-primary)', fontSize: '16px' }}>
            Find the best dishes on Martha's Vineyard
          </p>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            Save your favorites, rate dishes, and see how your taste compares.
          </p>
          <div className="flex gap-3 mt-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center py-3 px-5 min-h-[44px] rounded-xl font-semibold transition-all active:scale-[0.98]"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
                fontSize: '14px',
              }}
            >
              Explore the Map
            </Link>
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="py-3 px-5 min-h-[44px] rounded-xl font-semibold transition-all active:scale-[0.98]"
              style={{
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-divider)',
                fontSize: '14px',
              }}
            >
              Sign Up Free
            </button>
          </div>
        </div>
      )}

      {/* Follow List Modal */}
      {followListModal && (
        <FollowListModal
          userId={userId}
          type={followListModal}
          onClose={() => setFollowListModal(null)}
        />
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); restoreMoreFocus() }}
        target={{ type: 'user', id: userId, label: profile.display_name }}
      />
      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => { setShowBlockModal(false); restoreMoreFocus() }}
        user={{ id: userId, displayName: profile.display_name }}
      />
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  )
}

export default UserProfile
