import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useVote } from '../hooks/useVote'
import { usePurityTracker } from '../hooks/usePurityTracker'
import { useFocusTrap } from '../hooks/useFocusTrap'
import JitterBox from '../utils/jitter-box'
import { jitterApi } from '../api/jitterApi'
import { authApi } from '../api/authApi'
import { dishPhotosApi } from '../api/dishPhotosApi'
import { FoodRatingSlider } from './FoodRatingSlider'
import { MAX_REVIEW_LENGTH, MIN_VOTES_FOR_RANKING } from '../constants/app'
import {
  getPendingVoteFromStorage,
  clearPendingVoteStorage,
} from '../lib/storage'
import { logger } from '../utils/logger'
import { getUserMessage } from '../utils/errorHandler'
import { hapticLight, hapticSuccess } from '../utils/haptics'
import { PhotoUploadButton } from './PhotoUploadButton'
import { setBackButtonInterceptor, clearBackButtonInterceptor } from '../utils/backButtonInterceptor'
import { validateUserContent } from '../lib/reviewBlocklist'

// Keep / Replace / Remove chips for a prior photo.
function photoChipStyle(isActive, isDanger) {
  if (isActive) {
    return {
      background: isDanger ? 'var(--color-danger)' : 'var(--color-primary)',
      color: 'var(--color-text-on-primary)',
      border: 'none',
    }
  }
  return {
    background: 'var(--color-surface)',
    color: isDanger ? 'var(--color-danger)' : 'var(--color-text-secondary)',
    border: '1.5px solid var(--color-divider)',
  }
}

// Single-screen rating flow.
// - Slider defaults to null; submit stays disabled until the user touches it.
// - Review + photo are optional and collapsed by default.
// - No "would you order again?" step. Rating alone is the signal.
export function ReviewFlow({
  dishId,
  dishName,
  restaurantId,
  restaurantName,
  category,
  totalVotes = null,
  isRanked = false,
  existingPhoto = null,
  onVote,
  onLoginRequired,
  onPhotoUploaded,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id
  const { submitVote, submitting } = useVote()
  const { getPurity, getJitterProfile, attachToTextarea, reset: resetPurity } = usePurityTracker()
  const jitterBoxRef = useRef(null)

  // Prior-vote state: used to prefill and to decide "Update" vs "Submit" label.
  const [priorRating, setPriorRating] = useState(null)
  const [priorReviewText, setPriorReviewText] = useState(null)

  // Form state.
  // sliderValue = null means "unrated" — submit button stays disabled.
  const [sliderValue, setSliderValue] = useState(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewError, setReviewError] = useState(null)
  const [reviewFocused, setReviewFocused] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const [photoExpanded, setPhotoExpanded] = useState(false)
  const [photoAdded, setPhotoAdded] = useState(false)
  const [existingPhotoAction, setExistingPhotoAction] = useState('keep') // keep | replace | remove

  // Covers the attestation round-trip before useVote's `submitting` turns on.
  const savingRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const closeDiscardConfirm = useCallback(() => setShowDiscardConfirm(false), [])
  const discardDialogRef = useFocusTrap(showDiscardConfirm, closeDiscardConfirm)

  const reviewTextareaRef = useRef(null)

  const combinedTextareaRef = useCallback((el) => {
    reviewTextareaRef.current = el
    attachToTextarea(el)
  }, [attachToTextarea])

  const isUpdate = priorRating !== null
  const hasDraft =
    (sliderValue !== null && sliderValue !== priorRating) ||
    reviewText.trim() !== (priorReviewText || '') ||
    existingPhotoAction !== 'keep'

  // Reset per-dish state when the dish changes on a mounted instance
  // (DishModal / MyList reuse it), so the previous dish's draft never leaks.
  useEffect(() => {
    setSliderValue(null)
    setReviewText('')
    setPriorRating(null)
    setPriorReviewText(null)
    setReviewError(null)
    setSubmitError(null)
    setPhotoAdded(false)
    setPhotoExpanded(false)
    setExistingPhotoAction('keep')
  }, [dishId])

  // Load prior vote (if any) to prefill. Keyed on user id, not the user
  // object: AuthContext hands out a new object on every token refresh.
  useEffect(() => {
    let cancelled = false
    async function fetchUserVote() {
      if (!userId) {
        setPriorRating(null)
        setPriorReviewText(null)
        return
      }
      try {
        const vote = await authApi.getUserVoteForDish(dishId, userId)
        if (cancelled) return
        if (vote) {
          setPriorRating(vote.rating_10 ?? null)
          setPriorReviewText(vote.review_text || null)
          if (vote.rating_10 != null) setSliderValue(vote.rating_10)
          if (vote.review_text) {
            setReviewText(vote.review_text)
          }
        }
      } catch (error) {
        logger.error('Error fetching user vote:', error)
      }
    }
    fetchUserVote()
    return () => { cancelled = true }
  }, [dishId, userId])

  // Clear any stale pending-vote localStorage from the old thumbs-first flow.
  useEffect(() => {
    const stored = getPendingVoteFromStorage()
    if (stored && stored.dishId === dishId) {
      clearPendingVoteStorage()
    }
  }, [dishId])

  // Attach JitterBox to the (always-visible) review textarea on mount.
  useEffect(() => {
    if (reviewTextareaRef.current && !jitterBoxRef.current) {
      jitterBoxRef.current = JitterBox.attach(reviewTextareaRef.current)
    }
    return () => {
      if (jitterBoxRef.current) {
        jitterBoxRef.current.detach()
        jitterBoxRef.current = null
      }
    }
  }, [])

  // Intercept browser back during unsaved drafts: ask before leaving.
  useEffect(() => {
    if (!hasDraft) {
      clearBackButtonInterceptor()
      return
    }
    const currentUrl = window.location.href
    const currentState = window.history.state
    setBackButtonInterceptor(() => {
      // Restore the URL first so the draft page stays visible during the confirm.
      window.history.pushState(currentState, '', currentUrl)
      setShowDiscardConfirm(true)
    })
    return () => clearBackButtonInterceptor()
  }, [hasDraft])

  const handleDiscard = () => {
    setShowDiscardConfirm(false)
    clearBackButtonInterceptor()
    window.history.back()
  }

  const handleSubmit = async () => {
    if (sliderValue === null) return // safety guard — button should already be disabled
    if (!user) {
      onLoginRequired?.()
      return
    }
    if (savingRef.current) return
    setSubmitError(null)

    // Review validation
    if (reviewText.length > MAX_REVIEW_LENGTH) {
      setReviewError(`${reviewText.length - MAX_REVIEW_LENGTH} characters over limit`)
      return
    }
    if (reviewText.trim()) {
      const contentError = validateUserContent(reviewText, 'Review')
      if (contentError) {
        setReviewError(contentError)
        return
      }
    }
    setReviewError(null)

    if (sliderValue < 0 || sliderValue > 10) {
      logger.error('Invalid rating value:', sliderValue)
      return
    }

    savingRef.current = true
    setIsSaving(true)
    try {
      const reviewTextToSubmit = reviewText.trim() || null

      const badge = reviewTextToSubmit && jitterBoxRef.current ? jitterBoxRef.current.score() : null
      const purityData = badge ? { purity: badge.purity } : (reviewTextToSubmit ? getPurity() : null)
      const jitterData = badge ? badge.profile : (reviewTextToSubmit ? getJitterProfile() : null)
      const jitterScore = badge
        ? { score: badge.war, flags: badge.flags, classification: badge.classification }
        : null

      const attestResult = jitterScore && user
        ? await jitterApi.attestReview({
            userId: user.id,
            warScore: jitterScore.score,
            classification: jitterScore.classification,
            flags: jitterScore.flags,
            meta: {
              keys: badge?.session?.keystrokes || 0,
              paste_chars: badge?.session?.alien_chars || 0,
              focus_ms: badge?.session?.duration ? badge.session.duration * 1000 : 0,
            },
          })
        : null
      const badgeHash = attestResult?.badge_hash || null

      const result = await submitVote(dishId, sliderValue, reviewTextToSubmit, purityData, jitterData, jitterScore, badgeHash)

      if (!result.success) {
        logger.error('Vote submission failed:', result.error)
        setSubmitError(getUserMessage({ message: result.error }, 'saving your rating'))
        return
      }

      // Photo lifecycle: if the user had a prior photo and chose Remove, delete
      // the old row. A Replace upload already overwrote that row in place
      // (upsert on dish_id,user_id), so deleting it would drop the new photo.
      // Vote already saved; photo failure is logged but doesn't roll back the rating.
      if (existingPhoto?.id && existingPhotoAction === 'remove') {
        try {
          await dishPhotosApi.deletePhoto(existingPhoto.id)
        } catch (err) {
          logger.error('Failed to delete old photo after vote update:', err)
        }
      }

      // Analytics: votesApi.submitVote emits rating_submitted for every vote.
      // Dashboards that need dish/restaurant context can join against dish_id
      // in PostHog.

      const wasUpdate = isUpdate
      setPriorRating(sliderValue)
      setPriorReviewText(reviewTextToSubmit)
      setPhotoAdded(false)
      setExistingPhotoAction('keep')
      setReviewError(null)
      resetPurity()
      if (jitterBoxRef.current) jitterBoxRef.current.reset()

      hapticSuccess()
      toast.success(wasUpdate ? 'Rating updated' : 'Rating saved')

      onVote?.()
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  const busy = isSaving || submitting
  const canSubmit = sliderValue !== null && !busy && reviewText.length <= MAX_REVIEW_LENGTH
  const submitLabel = busy ? 'Saving…' : isUpdate ? 'Update rating' : 'Submit rating'
  const ranked = isRanked || (totalVotes != null && totalVotes >= MIN_VOTES_FOR_RANKING)
  const overLimit = reviewText.length > MAX_REVIEW_LENGTH

  let submitStyle
  if (busy) {
    submitStyle = { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: 0.7 }
  } else if (canSubmit) {
    submitStyle = { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }
  } else {
    submitStyle = { background: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }
  }

  let reviewBorderColor = 'var(--color-divider)'
  if (reviewError) reviewBorderColor = 'var(--color-danger)'
  else if (reviewFocused) reviewBorderColor = 'var(--color-primary)'

  return (
    <div className="space-y-4">
      {/* Rating slider — the single required input. */}
      <FoodRatingSlider
        value={sliderValue ?? 0}
        unrated={sliderValue === null}
        onChange={(v) => {
          if (Math.floor(v) !== Math.floor(sliderValue ?? -1)) hapticLight()
          setSliderValue(v)
        }}
        min={0}
        max={10}
        step={0.1}
        category={category}
        dishName={dishName}
      />

      {!ranked && totalVotes != null && sliderValue === null && (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          {totalVotes === 0
            ? 'Be the first to rate this dish.'
            : `${totalVotes} rating${totalVotes === 1 ? '' : 's'} so far · ${MIN_VOTES_FOR_RANKING - totalVotes} more to rank`}
        </p>
      )}

      {/* Review — always visible, optional. Rating is the required signal; words are a bonus. */}
      <div>
        <label htmlFor="review-text" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          Add a review <span style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
        </label>
        <textarea
          ref={combinedTextareaRef}
          id="review-text"
          value={reviewText}
          onChange={(e) => {
            setReviewText(e.target.value)
            if (reviewError) setReviewError(null)
          }}
          onFocus={() => setReviewFocused(true)}
          onBlur={() => setReviewFocused(false)}
          placeholder="What stood out?"
          aria-describedby={'review-char-count' + (reviewError ? ' review-error' : '')}
          aria-invalid={!!reviewError}
          maxLength={MAX_REVIEW_LENGTH + 50}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none"
          style={{
            background: 'var(--color-bg)',
            border: '2px solid ' + reviewBorderColor,
            color: 'var(--color-text-primary)',
          }}
        />
        <div
          id="review-char-count"
          className="text-xs text-right mt-1"
          style={{ color: overLimit ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}
        >
          {reviewText.length}/{MAX_REVIEW_LENGTH}
        </div>
        {reviewError && (
          <p id="review-error" role="alert" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
            {reviewError}
          </p>
        )}
      </div>

      {/* Photo — collapsed by default; if user had a prior photo, show thumbnail + keep/replace/remove. */}
      {existingPhoto && !photoAdded ? (
        <div
          className="p-3 rounded-xl space-y-2"
          style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <div className="flex items-center gap-3">
            <img src={existingPhoto.photo_url} alt="Your existing photo" className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Your photo</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={existingPhotoAction === 'keep'}
                  onClick={() => setExistingPhotoAction('keep')}
                  className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px]"
                  style={photoChipStyle(existingPhotoAction === 'keep', false)}
                >
                  Keep
                </button>
                <button
                  type="button"
                  aria-pressed={existingPhotoAction === 'replace'}
                  onClick={() => { setExistingPhotoAction('replace'); setPhotoExpanded(true) }}
                  className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px]"
                  style={photoChipStyle(existingPhotoAction === 'replace', false)}
                >
                  Replace
                </button>
                <button
                  type="button"
                  aria-pressed={existingPhotoAction === 'remove'}
                  onClick={() => setExistingPhotoAction('remove')}
                  className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px]"
                  style={photoChipStyle(existingPhotoAction === 'remove', true)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          {existingPhotoAction === 'replace' && photoExpanded && (
            <PhotoUploadButton
              dishId={dishId}
              onPhotoUploaded={(photo) => {
                setPhotoAdded(true)
                onPhotoUploaded?.(photo)
              }}
              onLoginRequired={onLoginRequired}
            />
          )}
        </div>
      ) : !photoExpanded && !photoAdded ? (
        <button
          type="button"
          onClick={() => setPhotoExpanded(true)}
          className="w-full py-3 text-sm rounded-xl transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px dashed var(--color-divider)' }}
        >
          + Add a photo (optional)
        </button>
      ) : photoAdded ? (
        <div
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: 'var(--color-success-muted)', border: '1px solid var(--color-success-border)' }}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: 'var(--color-success)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>Photo added</span>
        </div>
      ) : (
        <PhotoUploadButton
          dishId={dishId}
          onPhotoUploaded={(photo) => {
            setPhotoAdded(true)
            onPhotoUploaded?.(photo)
          }}
          onLoginRequired={onLoginRequired}
        />
      )}

      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
          style={submitStyle}
        >
          {submitLabel}
        </button>
        {submitError && (
          <p role="alert" className="text-sm mt-2" style={{ color: 'var(--color-danger)' }}>
            {submitError}
          </p>
        )}
      </div>

      {restaurantId && !hasDraft && isUpdate && (
        <button
          type="button"
          onClick={() => navigate('/restaurants/' + restaurantId + '/rate')}
          className="w-full p-4 rounded-xl flex items-center justify-between card-press"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-divider)' }}
        >
          <span className="block text-left">
            <span className="block text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
              Had more at {restaurantName || 'this restaurant'}?
            </span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Rate your whole meal in one go
            </span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 flex-shrink-0"
            style={{ color: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {showDiscardConfirm && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
          onClick={closeDiscardConfirm}
          role="presentation"
        >
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            aria-hidden="true"
          />
          <div
            ref={discardDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-rating-title"
            aria-describedby="discard-rating-desc"
            className="relative rounded-3xl max-w-md w-full shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--color-surface-elevated)' }}
          >
            <h2
              id="discard-rating-title"
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Discard your rating?
            </h2>
            <p
              id="discard-rating-desc"
              className="text-sm leading-relaxed mb-5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Your rating and review haven't been saved yet.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDiscardConfirm}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-divider)',
                  color: 'var(--color-text-primary)',
                  fontSize: '15px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: 'var(--color-danger)',
                  color: 'var(--color-text-on-primary)',
                  fontSize: '15px',
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
