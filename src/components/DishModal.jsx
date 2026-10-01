import { useState, useEffect, useEffectEvent, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ReviewFlow } from './ReviewFlow'
import { PhotoUploadConfirmation } from './PhotoUploadConfirmation'
import { dishPhotosApi } from '../api/dishPhotosApi'
import { shareOrCopy, buildDishShareData } from '../utils/share'
import { capture } from '../lib/analytics'
import { toast } from 'sonner'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getResponsiveImageProps } from '../utils/images'
import { clearBackButtonInterceptor, hasBackButtonInterceptor } from '../utils/backButtonInterceptor'

export function DishModal({ dish, onClose, onVote, onLoginRequired }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [photoUploaded, setPhotoUploaded] = useState(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [featuredImageLoaded, setFeaturedImageLoaded] = useState(false)
  const dishId = dish?.dish_id

  // Track if closing via back button to avoid double history.back()
  const closingViaBackButton = useRef(false)

  // Animated close handler. Every exit (X, backdrop, Escape, Later, vote) goes
  // through here so the history entry pushed on open is always popped.
  // Returns true when the modal is actually closing.
  const handleClose = useCallback(() => {
    const viaBackButton = closingViaBackButton.current
    closingViaBackButton.current = false
    if (isClosing) return false // Prevent double close

    const ownsTopEntry = window.history.state?.modal === 'dish'

    // Unsaved rating in ReviewFlow: pop our entry but don't close. ReviewFlow's
    // interceptor catches that popstate, restores the entry and asks "Discard
    // your rating?". Discard pops it again, which reaches our popstate listener
    // and closes via the back-button path; Cancel keeps the modal and the draft.
    if (!viaBackButton && ownsTopEntry && hasBackButtonInterceptor()) {
      window.history.back()
      return false
    }

    setIsClosing(true)

    // Not closing via back button: pop our entry, but only if it's still on top
    if (!viaBackButton && ownsTopEntry) {
      window.history.back()
    }

    setTimeout(() => {
      setIsClosing(false)
      onClose?.()
    }, 200) // Match animation duration
    return true
  }, [isClosing, onClose])

  // Focus trap hook must be called BEFORE any early returns to satisfy React hooks rules
  const modalRef = useFocusTrap(!!dish && !isClosing, handleClose)

  // Escape closes only the lightbox. Capture phase on document runs before
  // useFocusTrap's bubble-phase listener, so stopPropagation keeps the modal open.
  useEffect(() => {
    if (!lightboxPhoto) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setLightboxPhoto(null)
      }
    }

    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [lightboxPhoto])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!dish) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [dish])

  // Back button closes the modal
  const onBackButton = useEffectEvent(() => {
    closingViaBackButton.current = true
    handleClose()
  })

  useEffect(() => {
    if (!dishId) return

    // Idempotent push: re-runs (StrictMode, re-renders) must not stack entries
    if (window.history.state?.modal !== 'dish') {
      window.history.pushState({ modal: 'dish', dishId }, '')
    }

    const handlePopState = () => onBackButton()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [dishId])

  // Share functionality - must be before early return to satisfy hooks rules
  const handleShare = useCallback(async () => {
    if (!dish) return
    const shareData = buildDishShareData(dish)
    const result = await shareOrCopy(shareData)

    capture('dish_shared', {
      dish_id: dish.dish_id,
      dish_name: dish.dish_name,
      restaurant_name: dish.restaurant_name,
      context: 'dish_modal',
      method: result.method,
      success: result.success,
    })

    if (result.success && result.method !== 'native') {
      toast.success('Link copied!', { duration: 2000 })
    } else if (!result.success && result.method !== 'native') {
      toast.error("Couldn't copy the link")
    }
  }, [dish])

  const { data: photoData, isError: photoLoadError, refetch: refetchPhotos } = useQuery({
    queryKey: ['dishPhotos', dishId],
    queryFn: () => Promise.all([
      dishPhotosApi.getFeaturedPhoto(dishId),
      dishPhotosApi.getCommunityPhotos(dishId),
      dishPhotosApi.getAllVisiblePhotos(dishId),
    ]).then(([featured, community, all]) => ({ featured, community, all })),
    enabled: !!dishId,
  })

  if (!dish) return null

  const featuredPhoto = photoData?.featured ?? null
  const communityPhotos = photoData?.community ?? []
  const allPhotos = photoData?.all ?? []

  const handlePhotoUploaded = (photo) => {
    setPhotoUploaded(photo)
    queryClient.invalidateQueries({ queryKey: ['dishPhotos', dish.dish_id] })
  }

  // "Rate Now" just dismisses the confirmation; ReviewFlow is right above it.
  const handleRateNow = () => setPhotoUploaded(null)

  const handleLater = () => {
    setPhotoUploaded(null)
    handleClose()
  }

  const handleVoted = () => {
    // The vote is saved, so there's no draft left to guard. Drop ReviewFlow's
    // back-button interceptor before handleClose pops our history entry.
    clearBackButtonInterceptor()
    handleClose()
    onVote?.()
  }

  const closeLightbox = (e) => {
    e.stopPropagation() // Don't let the click reach the backdrop and close the modal
    setLightboxPhoto(null)
  }

  // Grid preview: first 4 community photos, or every visible photo once expanded
  const displayPhotos = showAllPhotos ? allPhotos : communityPhotos.slice(0, 4)
  const hasMorePhotos = !showAllPhotos && allPhotos.length > displayPhotos.length

  return createPortal(
    <div
      key={`modal-${dish.dish_id}`}
      className={'fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm ' + (isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade-in')}
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={handleClose}
      role="presentation"
    >
      {/* Modal card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={'relative rounded-3xl max-w-md w-full shadow-xl overflow-y-auto p-6 ' + (isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up')}
        style={{ maxHeight: '85vh', background: 'var(--color-surface-elevated)' }}
      >
        {/* Action buttons - top right */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share dish"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dish name + restaurant */}
        <h2 id="dish-modal-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', paddingRight: '88px', color: 'var(--color-text-primary)' }}>
          {dish.dish_name}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          {dish.restaurant_name}
          {dish.price ? ` · $${Number(dish.price).toFixed(0)}` : null}
        </p>

        {/* See Reviews and Photos button */}
        <button
          type="button"
          onClick={() => {
            // Navigate only if the modal really closes (not held by a draft prompt).
            // Small delay to let modal close animation complete
            if (handleClose()) setTimeout(() => navigate(`/dish/${dish.dish_id}`), 200)
          }}
          className="w-full py-3 px-4 mb-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background: 'transparent',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <span>See Reviews & Photos</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Photo load error feedback */}
        {photoLoadError && (
          <div className="mb-3 text-center">
            <p
              role="alert"
              className="text-sm text-center p-3 rounded-xl"
              style={{ background: 'rgba(var(--color-danger-rgb), 0.1)', color: 'var(--color-danger)' }}
            >
              Couldn't load photos.
            </p>
            <button
              type="button"
              className="inline-flex items-center min-h-[44px] text-sm font-semibold"
              style={{ color: 'var(--color-primary)' }}
              onClick={() => refetchPhotos()}
            >
              Try again
            </button>
          </div>
        )}

        {/* Featured photo (hero) */}
        {featuredPhoto && (
          <button
            className="dish-hero-photo tap-target image-placeholder"
            onClick={() => setLightboxPhoto(featuredPhoto.photo_url)}
            aria-label={`View featured photo of ${dish.dish_name}`}
          >
            <img
              {...getResponsiveImageProps(featuredPhoto.photo_url, [400, 600, 800])}
              alt={dish.dish_name}
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 600px"
              className={`transition-opacity duration-300 ${featuredImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setFeaturedImageLoaded(true)}
              onError={(e) => {
                // Hide broken images
                e.target.style.display = 'none'
              }}
            />
            {featuredPhoto.source_type === 'restaurant' && (
              <span className="photo-badge restaurant">Official</span>
            )}
          </button>
        )}

        {/* Photos grid */}
        {allPhotos.length > 0 && (
          <div className="community-photos">
            <h4>Photos ({allPhotos.length})</h4>
            {displayPhotos.length > 0 && (
              <div className="photo-grid">
                {displayPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    className="photo-grid-item tap-target"
                    onClick={() => setLightboxPhoto(photo.photo_url)}
                    aria-label={`View photo of ${dish.dish_name}`}
                  >
                    <img
                      {...getResponsiveImageProps(photo.photo_url, [200, 300, 400])}
                      alt={dish.dish_name}
                      loading="lazy"
                      sizes="150px"
                      onError={(e) => {
                        // Hide broken images
                        e.target.parentElement.style.display = 'none'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            {hasMorePhotos && (
              <button
                className="see-all-photos-btn"
                onClick={() => setShowAllPhotos(true)}
              >
                See all {allPhotos.length} photo{allPhotos.length === 1 ? '' : 's'}
              </button>
            )}
          </div>
        )}

        {/* Review Flow — single-screen rating, includes the photo upload */}
        <ReviewFlow
          dishId={dish.dish_id}
          dishName={dish.dish_name}
          restaurantId={dish.restaurant_id}
          restaurantName={dish.restaurant_name}
          category={dish.category}
          totalVotes={dish.total_votes || 0}
          onVote={handleVoted}
          onLoginRequired={onLoginRequired}
          onPhotoUploaded={handlePhotoUploaded}
        />

        {/* Photo confirmation sits beside ReviewFlow so the draft survives */}
        {photoUploaded && (
          <div className="mt-4">
            <PhotoUploadConfirmation
              dishName={dish.dish_name}
              photoUrl={photoUploaded.photo_url}
              status={photoUploaded.analysisResults?.status}
              onRateNow={handleRateNow}
              onLater={handleLater}
            />
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {lightboxPhoto && (
        <div
          className="photo-lightbox animate-backdrop-fade-in"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          <button
            type="button"
            className="lightbox-close tap-target"
            aria-label="Close"
            onClick={closeLightbox}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            {...getResponsiveImageProps(lightboxPhoto, [800, 1200, 1600])}
            alt={dish.dish_name}
            sizes="100vw"
            onError={() => {
              // Close lightbox if image fails to load
              setLightboxPhoto(null)
            }}
          />
        </div>
      )}
    </div>,
    document.body
  )
}
