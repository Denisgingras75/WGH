import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { authApi } from '../api/authApi'
import { followsApi } from '../api/followsApi'
import { votesApi } from '../api/votesApi'
import { useProfile } from '../hooks/useProfile'
import { useUserVotes } from '../hooks/useUserVotes'
import { useUnratedDishes } from '../hooks/useUnratedDishes'
import { DishModal } from '../components/DishModal'
import { LoginModal } from '../components/Auth/LoginModal'
import { FollowListModal } from '../components/FollowListModal'
import { ProfileSkeleton } from '../components/Skeleton'
import { CameraIcon } from '../components/CameraIcon'
import {
  HeroIdentityCard,
  JournalFeed,
} from '../components/profile'
import { jitterApi } from '../api/jitterApi'

// SECURITY: Email is NOT persisted to storage to prevent XSS exposure of PII

export function Profile() {
  const { user, loading } = useAuth()
  const [authLoading, setAuthLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameStatus, setNameStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'same'

  const { profile, updateProfile } = useProfile(user?.id)
  const { worthItDishes, avoidDishes, stats, loading: votesLoading, refetch: refetchVotes } = useUserVotes(user?.id)
  const { dishes: unratedDishes, count: unratedCount, refetch: refetchUnrated } = useUnratedDishes(user?.id)

  const [jitterProfile, setJitterProfile] = useState(null)

  // Fetch jitter typing identity profile
  useEffect(() => {
    if (!user) {
      setJitterProfile(null)
      return
    }
    jitterApi.getMyProfile()
      .then(setJitterProfile)
      .catch((error) => {
        logger.error('Failed to fetch jitter profile:', error)
      })
  }, [user])

  const [selectedDish, setSelectedDish] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { data: followCounts = { followers: 0, following: 0 } } = useQuery({
    queryKey: ['followCounts', user?.id],
    queryFn: () => followsApi.getFollowCounts(user.id),
    enabled: !!user,
  })
  const [followListModal, setFollowListModal] = useState(null) // 'followers' | 'following' | null


  // Set initial name for editing
  useEffect(() => {
    if (profile?.display_name) {
      setNewName(profile.display_name)
    }
  }, [profile])

  // Check username availability when editing name
  useEffect(() => {
    if (!editingName || !newName || newName.length < 2) {
      setNameStatus(null)
      return
    }

    // If name is same as current, no need to check
    if (newName.trim().toLowerCase() === profile?.display_name?.toLowerCase()) {
      setNameStatus('same')
      return
    }

    setNameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await authApi.isUsernameAvailable(newName.trim())
        setNameStatus(available ? 'available' : 'taken')
      } catch (error) {
        logger.error('Profile: username check failed', error)
        setNameStatus(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [newName, editingName, profile?.display_name])

  const { data: userReviews = [] } = useQuery({
    queryKey: ['userReviews', user?.id],
    queryFn: () => votesApi.getReviewsForUser(user.id),
    enabled: !!user,
  })

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      await authApi.signInWithGoogle(window.location.href)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setAuthLoading(false)
    }
  }

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      // Use current page URL so user returns to the same place after login
      await authApi.signInWithMagicLink(email, window.location.href)
      setMessage({ type: 'success', text: 'Check your email for a magic link!' })
      // Don't clear email - keep it visible so they know where to check
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSaveName = async () => {
    // Don't save if name is taken
    if (nameStatus === 'taken') {
      return
    }

    try {
      if (newName.trim()) {
        await updateProfile({ display_name: newName.trim() })
      }
      setEditingName(false)
      setNameStatus(null)
    } catch (error) {
      logger.error('Profile: failed to save display name', error)
    }
  }

  // Enrich worthIt/avoid dishes with review text for journal cards
  const enrichedWorthIt = useMemo(function () {
    return worthItDishes.map(function (dish) {
      var review = userReviews.find(function (r) { return r.dish_id === dish.dish_id })
      return review ? Object.assign({}, dish, { review_text: review.review_text }) : dish
    })
  }, [worthItDishes, userReviews])
  const enrichedAvoid = useMemo(function () {
    return avoidDishes.map(function (dish) {
      var review = userReviews.find(function (r) { return r.dish_id === dish.dish_id })
      return review ? Object.assign({}, dish, { review_text: review.review_text }) : dish
    })
  }, [avoidDishes, userReviews])

  // Handle vote from unrated dish
  const handleVote = async () => {
    setSelectedDish(null)
    try {
      await Promise.all([refetchUnrated(), refetchVotes()])
    } catch (error) {
      logger.error('Failed to refresh after vote:', error)
    }
  }

  // Handle clicking an unrated dish to rate it
  const handleUnratedDishClick = (dish) => {
    // Transform to the format expected by DishModal
    setSelectedDish({
      dish_id: dish.dish_id,
      dish_name: dish.dish_name,
      restaurant_name: dish.restaurant_name,
      restaurant_id: dish.restaurant_id,
      category: dish.category,
      price: dish.price,
      photo_url: dish.photo_url,
      total_votes: 0,
      yes_votes: 0,
    })
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <h1 className="sr-only">Your Profile</h1>

      {user ? (
        <>
          {/* Hero Identity Card */}
          <HeroIdentityCard
            user={user}
            profile={profile}
            stats={stats}
            followCounts={followCounts}
            editingName={editingName}
            newName={newName}
            nameStatus={nameStatus}
            setEditingName={setEditingName}
            setNewName={setNewName}
            setNameStatus={setNameStatus}
            handleSaveName={handleSaveName}
            setFollowListModal={setFollowListModal}
            jitterProfile={jitterProfile}
          />

          {/* Unrated Photos Banner - shown when user has photos to rate */}
          {unratedCount > 0 && (
            <div className="px-4 py-4" style={{ background: 'var(--color-surface)' }}>
              <button
                onClick={() => {
                  // Open the first unrated dish
                  if (unratedDishes.length > 0) {
                    handleUnratedDishClick(unratedDishes[0])
                  }
                }}
                className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[0.99] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-orange) 100%)',
                  boxShadow: 'none',
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <CameraIcon size={28} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold" style={{ fontSize: '17px', letterSpacing: '-0.01em', color: 'var(--color-text-on-primary)' }}>
                    {unratedCount} photo{unratedCount === 1 ? '' : 's'} to rate
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-on-primary-muted, rgba(255, 255, 255, 0.7))' }}>
                    Tap to rate your dishes
                  </p>
                </div>
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-on-primary-muted, rgba(255, 255, 255, 0.6))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Your Journal title */}
          <div className="px-4 pt-5 pb-1">
            <h2
              style={{
                fontFamily: "'Amatic SC', cursive",
                color: 'var(--color-text-primary)',
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Your Journal
            </h2>
          </div>

          {/* Journal Feed */}
          <JournalFeed
            worthIt={enrichedWorthIt}
            avoid={enrichedAvoid}
            heard={[]}
            activeShelf="all"
            onTriedIt={null}
            loading={votesLoading}
          />

          {/* Dish Modal for rating unrated dishes */}
          {selectedDish && (
            <DishModal
              dish={selectedDish}
              onClose={() => setSelectedDish(null)}
              onVote={handleVote}
              onLoginRequired={() => setShowLoginModal(true)}
            />
          )}

          {/* Login Modal */}
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

          {/* Follow List Modal */}
          {followListModal && (
            <FollowListModal
              userId={user.id}
              type={followListModal}
              onClose={() => setFollowListModal(null)}
            />
          )}

        </>
      ) : (
        /* Sign In Card */
        <div className="p-5 pt-8">
          <div
            className="rounded-2xl border p-7"
            style={{
              background: 'var(--color-card)',
              borderColor: 'var(--color-divider)',
              boxShadow: 'none',
            }}
          >
            <div className="text-center mb-7">
              <img
                src="/logo.webp"
                alt="What's Good Here"
                className="w-40 h-auto mx-auto mb-5"
              />
              <h2
                className="font-bold"
                style={{
                  fontFamily: "'Amatic SC', cursive",
                  color: 'var(--color-text-primary)',
                  fontSize: '32px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                Sign in <span style={{ color: 'var(--color-accent-gold)' }}>to vote</span>
              </h2>
              <p
                className="mt-2 font-medium"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}
              >
                Track your votes, save favorites, and help others find great food
              </p>
            </div>

            {message && (
              <div className="p-3 rounded-lg mb-4 text-sm"
                style={{
                  background: message.type === 'error' ? 'var(--color-danger-muted, rgba(239, 68, 68, 0.1))' : 'var(--color-success-muted, rgba(16, 185, 129, 0.1))',
                  color: message.type === 'error' ? 'var(--color-red)' : 'var(--color-emerald)',
                }}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              {/* Google Sign In - Primary */}
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border rounded-xl font-semibold text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-elevated)] active:scale-[0.98] transition-all disabled:opacity-50"
                style={{
                  background: 'var(--color-surface-elevated)',
                  borderColor: 'var(--color-divider)',
                  fontSize: '14px',
                  boxShadow: 'none',
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px" style={{ background: 'var(--color-divider)' }} />
                <span className="text-xs font-medium text-[color:var(--color-text-tertiary)]">or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--color-divider)' }} />
              </div>

              {/* Email Magic Link */}
              <form onSubmit={handleEmailSignIn}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none transition-all mb-3"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    borderColor: 'var(--color-divider)',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-4 py-3 text-[color:var(--color-text-primary)] font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    fontSize: '14px',
                  }}
                >
                  {authLoading ? 'Sending...' : 'Sign in with email'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
