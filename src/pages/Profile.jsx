import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { authApi } from '../api/authApi'
import { followsApi } from '../api/followsApi'
import { votesApi } from '../api/votesApi'
import { dishPhotosApi } from '../api/dishPhotosApi'
import { useProfile } from '../hooks/useProfile'
import { useUserVotes } from '../hooks/useUserVotes'
import { useFavorites } from '../hooks/useFavorites'
import { useUnratedDishes } from '../hooks/useUnratedDishes'
import { DishModal } from '../components/DishModal'
import { LoginModal } from '../components/Auth/LoginModal'
import { FollowListModal } from '../components/FollowListModal'
import { ProfileSkeleton } from '../components/Skeleton'
import { CameraIcon } from '../components/CameraIcon'
import {
  HeroIdentityCard,
  ShelfFilter,
  JournalFeed,
  SharePicksButton,
} from '../components/profile'
import { CaretRight } from '@phosphor-icons/react'
import { getLists, createList, deleteList, addDishToList, removeDishFromList } from '../lib/lists'
import { useDishSearch } from '../hooks/useDishSearch'

const SHELVES = [
  { id: 'all', label: 'All' },
  { id: 'good-here', label: 'Good Here' },
  { id: 'heard', label: "Heard That's Good There" },
  { id: 'not-good-here', label: "Wasn't Good Here" },
]

// SECURITY: Email is NOT persisted to storage to prevent XSS exposure of PII

export function Profile() {
  const { user, loading } = useAuth()
  const [activeShelf, setActiveShelf] = useState('all')
  const [authLoading, setAuthLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameStatus, setNameStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'same'

  const { profile, updateProfile } = useProfile(user?.id)
  const { worthItDishes, avoidDishes, stats, loading: votesLoading, refetch: refetchVotes } = useUserVotes(user?.id)
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites(user?.id)
  const { dishes: unratedDishes, count: unratedCount, loading: unratedLoading, refetch: refetchUnrated } = useUnratedDishes(user?.id)

  const [selectedDish, setSelectedDish] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { data: followCounts = { followers: 0, following: 0 } } = useQuery({
    queryKey: ['followCounts', user?.id],
    queryFn: () => followsApi.getFollowCounts(user.id),
    enabled: !!user,
  })
  const [followListModal, setFollowListModal] = useState(null) // 'followers' | 'following' | null

  const [lists, setLists] = useState(function() { return getLists() })
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const listNameRef = useRef(null)
  const [expandedListId, setExpandedListId] = useState(null)
  const [listSearchQuery, setListSearchQuery] = useState('')
  const listSearchData = useDishSearch(listSearchQuery, 10)
  const listSearchResults = listSearchData.results

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
  var enrichedWorthIt = worthItDishes.map(function (dish) {
    var review = userReviews.find(function (r) { return r.dish_id === dish.dish_id })
    return review ? Object.assign({}, dish, { review_text: review.review_text }) : dish
  })
  var enrichedAvoid = avoidDishes.map(function (dish) {
    var review = userReviews.find(function (r) { return r.dish_id === dish.dish_id })
    return review ? Object.assign({}, dish, { review_text: review.review_text }) : dish
  })

  var feedLoading = votesLoading || favoritesLoading

  // Handle "Tried it?" from heard card — open DishModal
  const handleTriedIt = (dish) => {
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

  // Handle vote from unrated dish or heard card
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

  // Handle deleting an unrated photo
  const handleDeletePhoto = async (photoId) => {
    // TODO: Replace browser confirm() with custom confirmation modal
    if (!confirm('Delete this photo? This cannot be undone.')) return
    try {
      await dishPhotosApi.deletePhoto(photoId)
      await refetchUnrated()
    } catch (error) {
      logger.error('Failed to delete photo:', error)
      alert('Failed to delete photo. Please try again.')
    }
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
          />

          {/* Newspaper-style stats bar */}
          {stats.totalVotes > 0 && (
            <div
              className="mx-4 mt-4 flex"
              style={{
                borderTop: '1px solid var(--color-divider)',
                borderBottom: '1px solid var(--color-divider)',
              }}
            >
              {/* Rated */}
              <div className="flex-1 py-3 text-center">
                <div style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                }}>
                  {stats.totalVotes}
                </div>
                <div style={{
                  fontSize: '7px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}>
                  Rated
                </div>
              </div>

              {/* Spots */}
              <div
                className="flex-1 py-3 text-center"
                style={{
                  borderLeft: '1px solid var(--color-divider)',
                  borderRight: '1px solid var(--color-divider)',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                }}>
                  {stats.uniqueRestaurants || 0}
                </div>
                <div style={{
                  fontSize: '7px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}>
                  Spots
                </div>
              </div>

              {/* Avg */}
              <div className="flex-1 py-3 text-center">
                <div style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: 'var(--color-primary)',
                  lineHeight: 1,
                }}>
                  {stats.avgRating != null ? stats.avgRating.toFixed(1) : '\u2014'}
                </div>
                <div style={{
                  fontSize: '7px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}>
                  Avg
                </div>
              </div>
            </div>
          )}

          {/* Share My Picks */}
          <div className="px-4 pt-3">
            <SharePicksButton
              userId={user.id}
              userName={profile?.display_name}
            />
          </div>

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
                className="w-full p-4 flex items-center gap-4 transition-all hover:scale-[0.99] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-orange) 100%)',
                  border: '1.5px solid var(--color-divider)',
                  borderRadius: '4px',
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CameraIcon size={28} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold" style={{ fontFamily: 'var(--font-headline)', fontSize: '17px', letterSpacing: '-0.01em', color: 'var(--color-text-on-primary)' }}>
                    {unratedCount} photo{unratedCount === 1 ? '' : 's'} to rate
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-on-primary-muted, rgba(255, 255, 255, 0.7))' }}>
                    Tap to rate your dishes
                  </p>
                </div>
                <CaretRight size={20} weight="bold" className="flex-shrink-0" style={{ color: 'var(--color-text-on-primary-muted, rgba(255, 255, 255, 0.6))' }} />
              </button>
            </div>
          )}

          {/* Your Lists section header — editorial divider */}
          <div className="px-4 pt-5 pb-1">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '18px',
                fontWeight: 700,
                fontStyle: 'italic',
                color: 'var(--color-primary)',
                letterSpacing: '0.08em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                Your Lists
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'var(--color-divider)',
              }} />
            </div>
          </div>

          {/* Create a List button */}
          <div className="px-4 pt-2">
            <button
              onClick={function() { setShowCreateList(true) }}
              className="w-full transition-all"
              style={{
                padding: '14px',
                border: '2px dashed var(--color-divider)',
                borderRadius: '4px',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-headline)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.color = 'var(--color-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-divider)'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.color = 'var(--color-primary)'
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-divider)'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
            >
              + Create a List
            </button>

            {showCreateList && (
              <div style={{ marginTop: '8px', padding: '12px', border: '1.5px solid var(--color-divider)', borderRadius: '4px' }}>
                <input
                  ref={listNameRef}
                  type="text"
                  placeholder="List name (e.g. Best Seafood 2026)"
                  value={newListName}
                  onChange={function(e) { setNewListName(e.target.value) }}
                  maxLength={50}
                  className="w-full"
                  style={{
                    padding: '10px 12px',
                    border: '1.5px solid var(--color-divider)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'var(--font-headline)',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-surface-elevated)',
                  }}
                />
                <div className="flex gap-2" style={{ marginTop: '8px' }}>
                  <button
                    onClick={function() {
                      if (!newListName.trim()) return
                      createList(newListName.trim())
                      setLists(getLists())
                      setNewListName('')
                      setShowCreateList(false)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '4px',
                      background: 'var(--color-primary)',
                      color: 'var(--color-text-on-primary)',
                      fontWeight: 700,
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Create
                  </button>
                  <button
                    onClick={function() { setShowCreateList(false); setNewListName('') }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '4px',
                      border: '1.5px solid var(--color-divider)',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 600,
                      fontSize: '13px',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List previews */}
          <div className="px-4" style={{ marginTop: '12px' }}>
            {/* Heard it was Good Here list */}
            {favorites && favorites.length > 0 && (
              <div style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--color-divider)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Heard it was Good Here
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                    Your saved dishes &middot; Want to try
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>&rarr;</span>
              </div>
            )}

            {/* User-created lists */}
            {lists.map(function(list) {
              return (
                <div key={list.id} style={{
                  borderBottom: '1px solid var(--color-divider)',
                }}>
                  <button
                    onClick={function() {
                      setExpandedListId(expandedListId === list.id ? null : list.id)
                      setListSearchQuery('')
                    }}
                    className="w-full flex items-center"
                    style={{
                      padding: '12px 0',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {list.emoji} {list.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                        {list.dishes.length} dish{list.dishes.length === 1 ? '' : 'es'}
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', transform: expandedListId === list.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>&rarr;</span>
                  </button>

                  {expandedListId === list.id && (
                    <div style={{ padding: '8px 0' }}>
                      {/* Search to add */}
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search dishes to add..."
                          value={listSearchQuery}
                          onChange={function(e) { setListSearchQuery(e.target.value) }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1.5px solid var(--color-divider)',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: 'var(--color-text-primary)',
                            background: 'var(--color-surface-elevated)',
                          }}
                        />
                        {/* Search results dropdown */}
                        {listSearchQuery.length >= 2 && listSearchResults.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '2px',
                            background: 'var(--color-surface-elevated)',
                            border: '1.5px solid var(--color-divider)',
                            borderRadius: '4px',
                            zIndex: 50,
                            maxHeight: '200px',
                            overflowY: 'auto',
                          }}>
                            {listSearchResults.map(function(dish) {
                              var alreadyInList = list.dishes.some(function(d) { return d.dish_id === dish.dish_id })
                              return (
                                <button
                                  key={dish.dish_id}
                                  onClick={function() {
                                    if (!alreadyInList) {
                                      addDishToList(list.id, dish)
                                      setLists(getLists())
                                    }
                                    setListSearchQuery('')
                                  }}
                                  disabled={alreadyInList}
                                  className="w-full flex items-center gap-2 text-left"
                                  style={{
                                    padding: '8px 12px',
                                    borderBottom: '1px solid var(--color-divider)',
                                    opacity: alreadyInList ? 0.4 : 1,
                                    cursor: alreadyInList ? 'default' : 'pointer',
                                    background: 'none',
                                    border: 'none',
                                    borderBottomWidth: '1px',
                                    borderBottomStyle: 'solid',
                                    borderBottomColor: 'var(--color-divider)',
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: 'var(--font-headline)', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                      {dish.dish_name}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                      {dish.restaurant_name}
                                    </div>
                                  </div>
                                  {dish.avg_rating && (
                                    <span style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 900, color: 'var(--color-rating)' }}>
                                      {Number(dish.avg_rating).toFixed(1)}
                                    </span>
                                  )}
                                  {alreadyInList && (
                                    <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>Added</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Current dishes in list */}
                      {list.dishes.length > 0 ? (
                        list.dishes.map(function(dish) {
                          return (
                            <div key={dish.dish_id} className="flex items-center gap-2" style={{
                              padding: '8px 0',
                              borderBottom: '1px solid var(--color-divider)',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                  {dish.dish_name}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                  {dish.restaurant_name}
                                </div>
                              </div>
                              {dish.avg_rating && (
                                <span style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 900, color: 'var(--color-rating)' }}>
                                  {Number(dish.avg_rating).toFixed(1)}
                                </span>
                              )}
                              <button
                                onClick={function() {
                                  removeDishFromList(list.id, dish.dish_id)
                                  setLists(getLists())
                                }}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  color: 'var(--color-danger)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ padding: '12px 0', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                          No dishes yet — search above to add some
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Journal section header — editorial divider */}
          <div className="px-4 pt-5 pb-1">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '18px',
                fontWeight: 700,
                fontStyle: 'italic',
                color: 'var(--color-primary)',
                letterSpacing: '0.08em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                My Tasting Notes
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'var(--color-divider)',
              }} />
            </div>
          </div>

          {/* Shelf Filters */}
          <ShelfFilter
            shelves={SHELVES}
            active={activeShelf}
            onSelect={setActiveShelf}
          />

          {/* Journal Feed */}
          <JournalFeed
            worthIt={enrichedWorthIt}
            avoid={enrichedAvoid}
            heard={favorites}
            activeShelf={activeShelf}
            onTriedIt={handleTriedIt}
            loading={feedLoading}
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
          {showLoginModal && (
            <LoginModal onClose={() => setShowLoginModal(false)} />
          )}

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
            className="p-7"
            style={{
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-divider)',
              borderRadius: '4px',
            }}
          >
            <div className="text-center mb-7">
              <img
                src="/logo.png"
                alt="What's Good Here"
                className="w-40 h-auto mx-auto mb-5"
              />
              <h2
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-headline)',
                  color: 'var(--color-text-primary)',
                  fontSize: '22px',
                  letterSpacing: '-0.02em',
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 font-semibold text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-elevated)] active:scale-[0.98] transition-all disabled:opacity-50"
                style={{
                  background: 'var(--color-surface-elevated)',
                  border: '1.5px solid var(--color-divider)',
                  fontSize: '14px',
                  borderRadius: '4px',
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
                  className="w-full px-4 py-3 focus:outline-none transition-all mb-3"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    border: '1.5px solid var(--color-divider)',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    borderRadius: '4px',
                  }}
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-4 py-3 text-[color:var(--color-text-primary)] font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    fontSize: '14px',
                    borderRadius: '4px',
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
