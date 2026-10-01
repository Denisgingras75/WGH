import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { capture } from '../lib/analytics'
import { logger } from '../utils/logger'
import { useAuth } from '../context/AuthContext'
import { shareOrCopy, buildDishShareData } from '../utils/share'
import { toast } from 'sonner'
import { useFavorites } from '../hooks/useFavorites'
import { useDishDetail } from '../hooks/useDishDetail'
import { ReviewFlow } from '../components/ReviewFlow'
import { PhotoUploadConfirmation } from '../components/PhotoUploadConfirmation'
import { LoginModal } from '../components/Auth/LoginModal'
import { EmptyState } from '../components/EmptyState'
import { DishHero, DishEvidence, DishDetailHeader, DishActionBar } from '../components/dish'
import { AddToPlaylistSheet } from '../components/playlists/AddToPlaylistSheet'
import { ReportModal } from '../components/ReportModal'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getUserMessage, classifyError, ErrorTypes } from '../utils/errorHandler'
import { authApi } from '../api/authApi'
import { dishPhotosApi } from '../api/dishPhotosApi'
import { PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE } from '../constants/styles'

function toPhotoRef(photo) {
  return photo ? { id: photo.id, photo_url: photo.photo_url } : null
}

export function Dish() {
  const { dishId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    dish, loading, error, refetch,
    variants, parentDish, isVariant,
    photoUploaded, featuredPhoto, allPhotos, communityPhotos,
    friendsVotes, smartSnippet,
    reviews, reviewsLoading,
    shouldLoadEvidence, evidenceSentinelRef,
    handlePhotoUploaded, handleVote, clearPhotoUploaded,
  } = useDishDetail(dishId, user)

  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false)
  const [showReportDish, setShowReportDish] = useState(false)
  // When the user taps "+" on a dish with no rating yet, we nudge them to the
  // (always-visible) slider, then auto-open the playlist sheet once a number
  // is in.
  const [pendingPlaylistAdd, setPendingPlaylistAdd] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites(user?.id)

  // Ear icon tooltip — show once per device
  const [showEarTooltip, setShowEarTooltip] = useState(false)
  const tooltipChecked = useRef(false)
  const rateFlowRef = useRef(null)

  // Prior vote gates "+ add to list"; prior photo feeds ReviewFlow's thumbnail.
  const voteKey = ['userVote', dishId, user?.id]
  const photoKey = ['userDishPhoto', dishId, user?.id]
  const fetchPriorVote = () => authApi.getUserVoteForDish(dishId, user.id)
  // Warm the vote cache so the "+" gate answers instantly.
  useQuery({
    queryKey: voteKey,
    queryFn: fetchPriorVote,
    enabled: !!user && !!dishId,
  })
  const { data: existingPhoto = null } = useQuery({
    queryKey: photoKey,
    queryFn: () => dishPhotosApi.getUserPhotoForDish(dishId),
    enabled: !!user && !!dishId,
    select: toPhotoRef,
  })

  useEffect(() => {
    if (dish && !tooltipChecked.current) {
      tooltipChecked.current = true
      if (!getStorageItem(STORAGE_KEYS.HAS_SEEN_EAR_TOOLTIP)) {
        setShowEarTooltip(true)
      }
    }
  }, [dish])

  function dismissEarTooltip() {
    setShowEarTooltip(false)
    setStorageItem(STORAGE_KEYS.HAS_SEEN_EAR_TOOLTIP, '1')
  }

  const handleLoginRequired = () => setLoginModalOpen(true)

  const scrollToRateFlow = () => {
    rateFlowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // A ReviewFlow upload overwrites the user's photo row in place (upsert on
  // dish_id,user_id), so the new row becomes their existing photo right away.
  const handleReviewFlowPhoto = (photo) => {
    handlePhotoUploaded(photo)
    if (photo) queryClient.setQueryData(photoKey, photo)
  }

  const handleVoteSubmitted = () => {
    // If the rating was triggered by a "+ add to list" tap, finish the job:
    // the dish now has a number, so open the playlist sheet.
    if (pendingPlaylistAdd) {
      setPendingPlaylistAdd(false)
      setPlaylistSheetOpen(true)
    }
    // Refresh prior vote and prior photo so the "+" gate and thumbnail stay current.
    queryClient.invalidateQueries({ queryKey: voteKey })
    queryClient.invalidateQueries({ queryKey: photoKey })
    handleVote?.()
  }

  const handleAddToList = async () => {
    if (!user) { setLoginModalOpen(true); return }
    let vote
    try {
      vote = await queryClient.ensureQueryData({ queryKey: voteKey, queryFn: fetchPriorVote })
    } catch (err) {
      toast.error(getUserMessage(err, 'checking your rating'))
      return
    }
    // Gate: a dish needs a number before it can go on a list.
    if (vote?.rating_10 == null) {
      setPendingPlaylistAdd(true)
      toast('Rate it first to add it to a list', { duration: 2500 })
      scrollToRateFlow()
      return
    }
    setPlaylistSheetOpen(true)
  }

  const handleToggleSave = async () => {
    if (!user) {
      setLoginModalOpen(true)
      return
    }
    try {
      await toggleFavorite(dishId, dish)
    } catch (error) {
      logger.error('Failed to toggle favorite:', error)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else if (dish?.restaurant_id) {
      navigate(`/restaurants/${dish.restaurant_id}`)
    } else {
      navigate('/')
    }
  }

  const handleShare = async () => {
    const shareData = buildDishShareData(dish)
    const result = await shareOrCopy(shareData)

    capture('dish_shared', {
      dish_id: dish.dish_id,
      dish_name: dish.dish_name,
      restaurant_name: dish.restaurant_name,
      context: 'dish_page',
      method: result.method,
      success: result.success,
    })

    if (result.success && result.method !== 'native') {
      toast.success('Link copied!', { duration: 2000 })
    } else if (!result.success && result.method !== 'native') {
      toast.error("Couldn't copy the link")
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <DishDetailHeader onBack={handleBack} />
        <div className="animate-pulse" role="status" aria-label="Loading dish">
          <div className="h-[220px] w-full" style={{ background: 'var(--color-divider)' }} />
          <div
            className="mx-4 -mt-6 relative rounded-xl p-4 space-y-3"
            style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-divider)' }}
          >
            <div className="h-6 w-48 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="h-4 w-32 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="flex items-end justify-between pt-2">
              <div className="h-10 w-14 rounded" style={{ background: 'var(--color-divider)' }} />
              <div className="h-4 w-24 rounded" style={{ background: 'var(--color-divider)' }} />
            </div>
          </div>
          <div className="p-4 mt-4 space-y-3">
            <div className="h-4 w-48 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="h-4 w-32 rounded" style={{ background: 'var(--color-divider)' }} />
          </div>
        </div>
      </div>
    )
  }

  // Only a missing dish (or a malformed id) is "not found". Every other failure
  // (network, timeout, server, unknown Postgres codes) gets a retry.
  const errorType = error ? classifyError(typeof error === 'string' ? { message: error } : error) : null
  const isNotFound = errorType === ErrorTypes.NOT_FOUND || errorType === ErrorTypes.VALIDATION_ERROR

  if (error && !isNotFound) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <DishDetailHeader onBack={handleBack} />
        <div className="px-4 py-12 text-center">
          <h1 className="sr-only">Couldn't load dish</h1>
          <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {getUserMessage(error, 'loading this dish')}
          </p>
          <button
            type="button"
            onClick={refetch}
            className={'mt-4 ' + PRIMARY_BUTTON_CLASS}
            style={PRIMARY_BUTTON_STYLE}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (isNotFound || !dish) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <DishDetailHeader onBack={handleBack} />
        <h1 className="sr-only">Dish not found</h1>
        <EmptyState
          emoji={<img src="/empty-plate.webp" alt="" className="w-16 h-16 mx-auto rounded-full object-cover" />}
          title="Dish not found"
          action={
            <button type="button" onClick={handleBack} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
              Go back
            </button>
          }
        />
      </div>
    )
  }

  const isRanked = dish.total_votes >= MIN_VOTES_FOR_RANKING

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      <DishDetailHeader
        dish={dish}
        onBack={handleBack}
        onShare={handleShare}
        isFavorite={!!isFavorite?.(dishId)}
        onToggleFavorite={handleToggleSave}
        showEarTooltip={showEarTooltip}
        onDismissEarTooltip={dismissEarTooltip}
        onAddToList={handleAddToList}
        onReport={user && dish.created_by !== user.id ? () => setShowReportDish(true) : undefined}
      />

      {/* LAYER 1: THE VERDICT */}
      <DishHero
        dish={dish}
        featuredPhoto={featuredPhoto}
        allPhotos={allPhotos}
        isVariant={isVariant}
        parentDish={parentDish}
      />

      {/* LAYER 2: THE ACTION — rate flow, always visible (no button to tap) */}
      <div className="p-4">
        <div
          id="rate-flow-panel"
          ref={rateFlowRef}
          className="p-4 rounded-xl"
          style={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <ReviewFlow
            dishId={dish.dish_id}
            dishName={dish.dish_name}
            restaurantId={dish.restaurant_id}
            restaurantName={dish.restaurant_name}
            category={dish.category}
            totalVotes={dish.total_votes}
            isRanked={isRanked}
            existingPhoto={existingPhoto}
            onVote={handleVoteSubmitted}
            onLoginRequired={handleLoginRequired}
            onPhotoUploaded={handleReviewFlowPhoto}
          />
        </div>

        {/* Photo confirmation after upload — beside the rate flow so the draft survives */}
        {photoUploaded && (
          <div
            className="mt-3 px-4 rounded-xl"
            style={{
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-divider)',
            }}
          >
            <PhotoUploadConfirmation
              dishName={dish.dish_name}
              photoUrl={photoUploaded.photo_url}
              status={photoUploaded.analysisResults?.status}
              onRateNow={() => {
                clearPhotoUploaded()
                scrollToRateFlow()
              }}
              onLater={clearPhotoUploaded}
            />
          </div>
        )}
      </div>

      {/* LAYER 3: THE EVIDENCE (reviews) */}
      <DishEvidence
        dish={dish}
        user={user}
        shouldLoadEvidence={shouldLoadEvidence}
        evidenceSentinelRef={evidenceSentinelRef}
        friendsVotes={friendsVotes}
        smartSnippet={smartSnippet}
        allPhotos={allPhotos}
        communityPhotos={communityPhotos}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        variants={variants}
        isVariant={isVariant}
      />

      {/* Order / menu / directions all live in the fixed action bar */}
      <DishActionBar dish={dish} />

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
      <AddToPlaylistSheet
        isOpen={playlistSheetOpen}
        onClose={() => setPlaylistSheetOpen(false)}
        dishId={dishId}
        dishName={dish?.dish_name}
        restaurantName={dish?.restaurant_name}
      />
      <ReportModal
        isOpen={showReportDish}
        onClose={() => setShowReportDish(false)}
        target={{ type: 'dish', id: dishId, label: dish?.dish_name }}
      />
    </div>
  )
}
