import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { getUserMessage } from '../utils/errorHandler'
import { authApi } from '../api/authApi'
import { followsApi } from '../api/followsApi'
import { useProfile } from '../hooks/useProfile'
import { useUserVotes } from '../hooks/useUserVotes'
import { useUnratedDishes } from '../hooks/useUnratedDishes'
import { useUserPlaylists } from '../hooks/useUserPlaylists'
import { useFollowedPlaylists } from '../hooks/useFollowedPlaylists'
import { DishModal } from '../components/DishModal'
import { FollowListModal } from '../components/FollowListModal'
import { ProfileSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { SectionHeader } from '../components/SectionHeader'
import { CameraIcon } from '../components/CameraIcon'
import { PlaylistGridCard } from '../components/playlists/PlaylistGridCard'
import { CreatePlaylistModal } from '../components/playlists/CreatePlaylistModal'
import {
  HeroIdentityCard,
  JournalFeed,
  SharePicksButton,
} from '../components/profile'
import { jitterApi } from '../api/jitterApi'
import { PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE } from '../constants/styles'

// SECURITY: Email is NOT persisted to storage to prevent XSS exposure of PII

const PROFILE_TABS = ['journal', 'playlists', 'saved']

// Inline load failure: readable message + retry (contract §7 error state)
function LoadError({ message, onRetry }) {
  return (
    <div className="py-10 text-center">
      <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          className={'mt-3 ' + PRIMARY_BUTTON_CLASS}
          style={PRIMARY_BUTTON_STYLE}
        >
          Try again
        </button>
      )}
    </div>
  )
}

function PlaylistGridSkeleton() {
  return (
    <div role="status" aria-label="Loading playlists" className="grid grid-cols-2 gap-3 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: 'var(--color-divider)' }} />
      ))}
    </div>
  )
}

export function Profile() {
  const { user } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameStatus, setNameStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'same'
  const [savingName, setSavingName] = useState(false)

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    refetch: refetchProfile,
  } = useProfile(user?.id)
  const {
    ratedDishes,
    stats,
    loading: votesLoading,
    error: votesError,
    refetch: refetchVotes,
  } = useUserVotes(user?.id)
  const { dishes: unratedDishes, count: unratedCount, refetch: refetchUnrated } = useUnratedDishes(user?.id)

  // Jitter typing identity profile
  const { data: jitterProfile = null } = useQuery({
    queryKey: ['jitterProfile', user?.id],
    queryFn: () => jitterApi.getMyProfile(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const [selectedDish, setSelectedDish] = useState(null)
  // Active tab lives in the URL so Back from a playlist lands on the same tab
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = PROFILE_TABS.includes(tabParam) ? tabParam : 'journal'
  const setActiveTab = (tab) => setSearchParams(tab === 'journal' ? {} : { tab }, { replace: true })
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false)
  const {
    playlists: myPlaylists,
    loading: myPlaylistsLoading,
    error: myPlaylistsError,
    refetch: refetchMyPlaylists,
  } = useUserPlaylists(user?.id)
  const {
    playlists: savedPlaylists,
    loading: savedLoading,
    error: savedError,
    refetch: refetchSaved,
  } = useFollowedPlaylists(!!user)
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
    const trimmed = newName.trim()
    if (savingName || trimmed.length < 2 || nameStatus === 'taken' || nameStatus === 'checking') {
      return
    }

    // Nothing changed — just close the editor
    if (trimmed === profile?.display_name) {
      setEditingName(false)
      setNameStatus(null)
      return
    }

    setSavingName(true)
    try {
      // updateProfile resolves to { data, error } — it never throws
      const { error } = await updateProfile({ display_name: trimmed })
      if (error) {
        toast.error(getUserMessage(error, 'updating your name'))
        return
      }
      toast.success('Name updated')
      setEditingName(false)
      setNameStatus(null)
    } finally {
      setSavingName(false)
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

  // Roving focus across the section tabs (mirrors RestaurantDetail)
  const handleTabKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const step = e.key === 'ArrowRight' ? 1 : -1
    const next = PROFILE_TABS[(PROFILE_TABS.indexOf(activeTab) + step + PROFILE_TABS.length) % PROFILE_TABS.length]
    setActiveTab(next)
    requestAnimationFrame(() => {
      document.getElementById('profile-tab-' + next)?.focus()
    })
  }

  // ProtectedRoute already resolved auth; wait for the profile itself so the
  // hero never shows "Set your name" over a real name that hasn't loaded yet.
  if (profileLoading) {
    return <ProfileSkeleton />
  }

  if (profileError && !profile) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <h1 className="sr-only">Your Profile</h1>
        <div className="px-4">
          <LoadError message={profileError.message} onRetry={refetchProfile} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <h1 className="sr-only">Your Profile</h1>

      {/* Hero Identity Card */}
      <HeroIdentityCard
        user={user}
        profile={profile}
        stats={stats}
        followCounts={followCounts}
        editingName={editingName}
        newName={newName}
        nameStatus={nameStatus}
        savingName={savingName}
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

      {/* Food Story chalkboard — your food identity at a glance */}
      {stats.totalVotes > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <div
            style={{
              background: '#2C3033',
              borderRadius: '12px',
              padding: '18px',
              backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.04) 0%, transparent 60%)',
            }}
          >
            <h2 style={{
              fontFamily: "'Amatic SC', cursive",
              fontSize: '22px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
              marginBottom: '10px',
            }}>
              Your Food Story
            </h2>
            {/* Rating style */}
            {stats.ratingStyle && (
              <div className="flex justify-between items-baseline" style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="flex-shrink-0 mr-3" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Rating style</span>
                <span className="text-right min-w-0" style={{ fontFamily: "'Amatic SC', cursive", fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {stats.ratingStyle.label}
                </span>
              </div>
            )}
            {/* Most loyal */}
            {stats.favoriteRestaurant && (
              <div className="flex justify-between items-baseline" style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="flex-shrink-0 mr-3" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Most loyal</span>
                <span className="text-right min-w-0" style={{ fontFamily: "'Amatic SC', cursive", fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                  {stats.favoriteRestaurant} &middot; {stats.favoriteRestaurantCount} {stats.favoriteRestaurantCount === 1 ? 'dish' : 'dishes'}
                </span>
              </div>
            )}
            {/* Best find */}
            {stats.standoutPicks && stats.standoutPicks.bestFind && (
              <div className="flex justify-between items-baseline" style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="flex-shrink-0 mr-3" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Best find</span>
                <span className="text-right min-w-0" style={{ fontFamily: "'Amatic SC', cursive", fontSize: '18px', fontWeight: 700, color: 'var(--color-accent-gold)' }}>
                  {stats.standoutPicks.bestFind.dish_name} &middot; {stats.standoutPicks.bestFind.userRating}
                </span>
              </div>
            )}
            {/* Hot take */}
            {stats.standoutPicks && stats.standoutPicks.harshestTake && (
              <div className="flex justify-between items-baseline" style={{ padding: '5px 0' }}>
                <span className="flex-shrink-0 mr-3" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Hot take</span>
                <span className="text-right min-w-0" style={{ fontFamily: "'Amatic SC', cursive", fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                  {stats.standoutPicks.harshestTake.dish_name} &middot; You: {stats.standoutPicks.harshestTake.userRating} &middot; Crowd: {(stats.standoutPicks.harshestTake.communityAvg ?? 0).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unrated Photos Banner - shown when user has photos to rate */}
      {unratedCount > 0 && (
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={() => {
              // Open the first unrated dish
              if (unratedDishes.length > 0) {
                handleUnratedDishClick(unratedDishes[0])
              }
            }}
            className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)' }}
          >
            <div aria-hidden="true" className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <CameraIcon size={28} />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-bold" style={{ fontSize: '17px', letterSpacing: '-0.01em', color: 'var(--color-text-on-primary)' }}>
                {unratedCount} photo{unratedCount === 1 ? '' : 's'} to rate
              </span>
              <span className="block" style={{ fontSize: '13px', color: 'var(--color-text-on-primary)', opacity: 0.9 }}>
                Tap to rate your dishes
              </span>
            </div>
            <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-on-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs: Journal / Playlists / Saved */}
      <div
        role="tablist"
        aria-label="Profile sections"
        onKeyDown={handleTabKeyDown}
        className="flex"
        style={{
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {PROFILE_TABS.map((tab) => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={'profile-tab-' + tab}
              aria-selected={active}
              aria-controls="profile-tab-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-xs font-semibold text-center"
              style={{
                color: active ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                background: 'transparent',
                borderBottom: '2px solid ' + (active ? 'var(--color-primary)' : 'transparent'),
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="profile-tab-panel" aria-labelledby={'profile-tab-' + activeTab}>
        {/* --- Journal tab --- */}
        {activeTab === 'journal' && (
          <>
            {/* Your Journal title */}
            <div className="px-4 pt-5 pb-1">
              <SectionHeader title="Your Journal" />
            </div>

            {/* Journal Feed — single chronological shelf */}
            <JournalFeed
              ratings={ratedDishes}
              loading={votesLoading}
              error={votesError}
              onRetry={refetchVotes}
              emptySubtitle="Start rating dishes to build your food journal"
              emptyAction={
                <Link
                  to="/"
                  className={'inline-flex items-center justify-center ' + PRIMARY_BUTTON_CLASS}
                  style={PRIMARY_BUTTON_STYLE}
                >
                  Find a dish to rate
                </Link>
              }
            />
          </>
        )}

        {/* --- Playlists tab --- */}
        {activeTab === 'playlists' && (
          <div className="px-4 pt-4 pb-6">
            {myPlaylistsLoading ? (
              <PlaylistGridSkeleton />
            ) : myPlaylistsError ? (
              <LoadError message={myPlaylistsError.message} onRetry={refetchMyPlaylists} />
            ) : myPlaylists.length === 0 ? (
              <EmptyState
                emoji="📝"
                title="No playlists yet"
                subtitle="Group your favorite dishes into lists to share"
                action={
                  <button
                    type="button"
                    onClick={() => setCreatePlaylistOpen(true)}
                    className={PRIMARY_BUTTON_CLASS}
                    style={PRIMARY_BUTTON_STYLE}
                  >
                    Create a playlist
                  </button>
                }
              />
            ) : (
              <>
                <div
                  className="text-xs font-medium pb-3"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {myPlaylists.length} {myPlaylists.length === 1 ? 'playlist' : 'playlists'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-label="Create playlist"
                    onClick={() => setCreatePlaylistOpen(true)}
                    className="transition-all active:scale-[0.98]"
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      border: '1.5px dashed var(--color-primary)',
                      borderRadius: 8,
                      background: 'var(--color-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      color: 'var(--color-primary)',
                    }}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                  {myPlaylists.map((p) => (
                    <PlaylistGridCard key={p.id} playlist={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- Saved tab --- */}
        {activeTab === 'saved' && (
          <div className="px-4 pt-4 pb-6">
            {savedLoading ? (
              <PlaylistGridSkeleton />
            ) : savedError ? (
              <LoadError message={savedError.message} onRetry={refetchSaved} />
            ) : savedPlaylists.length === 0 ? (
              <EmptyState
                emoji="🎵"
                title="No saved playlists yet"
                subtitle="Playlists you follow will appear here"
              />
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
      </div>

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
        />
      )}

      {/* Follow List Modal */}
      {followListModal && (
        <FollowListModal
          userId={user.id}
          type={followListModal}
          onClose={() => setFollowListModal(null)}
        />
      )}
    </div>
  )
}
