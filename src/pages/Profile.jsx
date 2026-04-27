import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { authApi } from '../api/authApi'
import { followsApi } from '../api/followsApi'
import { useProfile } from '../hooks/useProfile'
import { useUserVotes } from '../hooks/useUserVotes'
import { useUnratedDishes } from '../hooks/useUnratedDishes'
import { useUserPlaylists } from '../hooks/useUserPlaylists'
import { useFollowedPlaylists } from '../hooks/useFollowedPlaylists'
import { DishModal } from '../components/DishModal'
import { LoginModal } from '../components/Auth/LoginModal'
import { FollowListModal } from '../components/FollowListModal'
import { ProfileSkeleton } from '../components/Skeleton'
import { CameraIcon } from '../components/CameraIcon'
import { PlaylistStripCard } from '../components/playlists/PlaylistStripCard'
import { PlaylistGridCard } from '../components/playlists/PlaylistGridCard'
import { CreatePlaylistModal } from '../components/playlists/CreatePlaylistModal'
import {
  HeroIdentityCard,
  JournalFeed,
  SharePicksButton,
} from '../components/profile'
import { jitterApi } from '../api/jitterApi'

// SECURITY: Email is NOT persisted to storage to prevent XSS exposure of PII

export function Profile() {
  const { user, loading } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameStatus, setNameStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'same'

  const { profile, updateProfile } = useProfile(user?.id)
  const { ratedDishes, stats, loading: votesLoading, refetch: refetchVotes } = useUserVotes(user?.id)
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
  const [activeTab, setActiveTab] = useState('journal')
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false)
  const { playlists: myPlaylists } = useUserPlaylists(user?.id)
  const { playlists: savedPlaylists } = useFollowedPlaylists(!!user)
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
    var cancelled = false
    const timer = setTimeout(async () => {
      try {
        const available = await authApi.isUsernameAvailable(newName.trim())
        if (!cancelled) setNameStatus(available ? 'available' : 'taken')
      } catch (error) {
        if (!cancelled) {
          logger.error('Profile: username check failed', error)
          setNameStatus(null)
        }
      }
    }, 500)

    return () => { clearTimeout(timer); cancelled = true }
  }, [newName, editingName, profile?.display_name])

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
    })
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--paper)' }}>
      <h1 className="sr-only">Your Profile</h1>

      {user && (
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

          {/* Share Picks — viral loop */}
          {stats.totalVotes > 0 && (
            <div className="flex justify-center py-3">
              <SharePicksButton
                userId={user.id}
                userName={profile?.display_name}
              />
            </div>
          )}

          {/* Food Story — editorial ledger */}
          {stats.totalVotes > 0 && (
            <div style={{ padding: '12px 16px 0' }}>
              <div
                style={{
                  background: 'var(--card-paper)',
                  border: '1px solid var(--ink)',
                  borderRadius: 4,
                  padding: '18px',
                  boxShadow: 'var(--shadow-ink)',
                }}
              >
                <h3 className="serif" style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontStyle: 'italic',
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  margin: '0 0 12px',
                }}>
                  Your Food Story
                </h3>
                {stats.ratingStyle && (
                  <div className="flex justify-between items-baseline" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Rating style</span>
                    <span className="serif" style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: 'var(--tomato)' }}>
                      {stats.ratingStyle.label}
                    </span>
                  </div>
                )}
                {stats.favoriteRestaurant && (
                  <div className="flex justify-between items-baseline" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Most loyal</span>
                    <span className="serif" style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: 'var(--ink)', textAlign: 'right' }}>
                      {stats.favoriteRestaurant} &middot; {stats.favoriteRestaurantCount} {stats.favoriteRestaurantCount === 1 ? 'dish' : 'dishes'}
                    </span>
                  </div>
                )}
                {stats.standoutPicks && stats.standoutPicks.bestFind && (
                  <div className="flex justify-between items-baseline" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Best find</span>
                    <span className="serif" style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: 'var(--ochre)', textAlign: 'right' }}>
                      {stats.standoutPicks.bestFind.dish_name} &middot; {stats.standoutPicks.bestFind.userRating}
                    </span>
                  </div>
                )}
                {stats.standoutPicks && stats.standoutPicks.harshestTake && (
                  <div className="flex justify-between items-baseline" style={{ padding: '8px 0' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Hot take</span>
                    <span className="serif" style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: 'var(--ink)', textAlign: 'right' }}>
                      {stats.standoutPicks.harshestTake.dish_name} &middot; You: {stats.standoutPicks.harshestTake.userRating} &middot; Crowd: {(stats.standoutPicks.harshestTake.communityAvg ?? 0).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Tabs: Journal / Playlists / Saved */}
          <div
            className="flex hairline-b"
            style={{
              background: 'var(--paper)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              marginTop: 12,
            }}
          >
            {['journal', 'playlists', 'saved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 mono"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: activeTab === tab ? 'var(--ink)' : 'var(--ink-3)',
                  background: 'transparent',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                {tab}
                {activeTab === tab && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '20%',
                      right: '20%',
                      bottom: -1,
                      height: 2,
                      background: 'var(--tomato)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* --- Journal tab --- */}
          {activeTab === 'journal' && (
            <>
              {/* Your Journal title */}
              <div className="px-4 pt-5 pb-1">
                <h2 className="serif" style={{
                  color: 'var(--ink)',
                  fontSize: 28,
                  fontWeight: 800,
                  fontStyle: 'italic',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}>
                  Your Journal
                </h2>
              </div>

              {/* Journal Feed — single chronological shelf */}
              <JournalFeed
                ratings={ratedDishes}
                loading={votesLoading}
              />
            </>
          )}

          {/* --- Playlists tab --- */}
          {activeTab === 'playlists' && (
            <div className="px-4 pt-4 pb-6">
              <div
                className="text-xs font-bold uppercase tracking-wider pb-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {myPlaylists.length} {myPlaylists.length === 1 ? 'playlist' : 'playlists'}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCreatePlaylistOpen(true)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    border: '1.5px dashed var(--color-accent-gold)',
                    borderRadius: 8,
                    background: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    color: 'var(--color-accent-gold)',
                  }}
                >
                  +
                </button>
                {myPlaylists.map((p) => (
                  <PlaylistGridCard key={p.id} playlist={p} />
                ))}
              </div>
            </div>
          )}

          {/* --- Saved tab --- */}
          {activeTab === 'saved' && (
            <div className="px-4 pt-4 pb-6">
              {savedPlaylists.length === 0 ? (
                <div className="py-10 text-center" style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎵</div>
                  Playlists you follow will appear here
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {savedPlaylists.map((p) => (
                    <PlaylistGridCard
                      key={p.playlist_id}
                      playlist={p}
                      tombstone={p.visibility === 'unavailable'}
                    />
                  ))}
                </div>
              )}
            </div>
          )}


          <CreatePlaylistModal
            isOpen={createPlaylistOpen}
            onClose={() => setCreatePlaylistOpen(false)}
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
      )}
    </div>
  )
}
