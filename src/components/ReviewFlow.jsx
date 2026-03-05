import { useState, useEffect, useRef } from 'react'
import { capture } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'
import { useVote } from '../hooks/useVote'
import { SessionCard } from './jitter'
import JitterBox from '../utils/jitter-box'
import { jitterApi } from '../api/jitterApi'
import { authApi } from '../api/authApi'
import { FoodRatingSlider } from './FoodRatingSlider'
import { ThumbsUpIcon } from './ThumbsUpIcon'
import { ThumbsDownIcon } from './ThumbsDownIcon'
import { MAX_REVIEW_LENGTH } from '../constants/app'
import {
  getPendingVoteFromStorage,
  setPendingVoteToStorage,
  clearPendingVoteStorage,
} from '../lib/storage'
import { logger } from '../utils/logger'
import { hapticLight, hapticSuccess } from '../utils/haptics'
// scoreSession replaced by JitterBox.score() (WAR v2)
import { PhotoUploadButton } from './PhotoUploadButton'
import { setBackButtonInterceptor, clearBackButtonInterceptor } from '../utils/backButtonInterceptor'

export function ReviewFlow({ dishId, dishName, restaurantId, restaurantName, category, price, totalVotes = 0, yesVotes = 0, percentWorthIt = 0, isRanked = false, hasPhotos = false, onVote, onLoginRequired, onPhotoUploaded, onToggleFavorite, isFavorite }) {
  const { user } = useAuth()
  const { submitVote, submitting } = useVote()
  const jitterBoxRef = useRef(null)
  const [userVote, setUserVote] = useState(null)
  const [userRating, setUserRating] = useState(null)
  const [userReviewText, setUserReviewText] = useState(null)

  const [localTotalVotes, setLocalTotalVotes] = useState(totalVotes)
  const [localYesVotes, setLocalYesVotes] = useState(yesVotes)

  // Flow: 1 = yes/no, 2 = rate + extras (review + photo)
  // Initialize from localStorage if there's a pending vote for this dish (survives page reload after magic link)
  const [step, setStep] = useState(() => {
    const stored = getPendingVoteFromStorage()
    return (stored && stored.dishId === dishId) ? 2 : 1
  })
  const [pendingVote, setPendingVote] = useState(() => {
    const stored = getPendingVoteFromStorage()
    return (stored && stored.dishId === dishId) ? stored.vote : null
  })
  const [sliderValue, setSliderValue] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewError, setReviewError] = useState(null)

  const [awaitingLogin, setAwaitingLogin] = useState(false)
  const [announcement, setAnnouncement] = useState('') // For screen reader announcements
  const [photoAdded, setPhotoAdded] = useState(false)
  const [sessionCardData, setSessionCardData] = useState(null)
  const reviewTextareaRef = useRef(null)

  const noVotes = localTotalVotes - localYesVotes
  const yesPercent = localTotalVotes > 0 ? Math.round((localYesVotes / localTotalVotes) * 100) : 0
  const noPercent = localTotalVotes > 0 ? 100 - yesPercent : 0

  useEffect(() => {
    setLocalTotalVotes(totalVotes)
    setLocalYesVotes(yesVotes)
  }, [totalVotes, yesVotes])

  useEffect(() => {
    async function fetchUserVote() {
      if (!user) {
        setUserVote(null)
        setUserRating(null)
        setUserReviewText(null)
        return
      }
      try {
        const vote = await authApi.getUserVoteForDish(dishId, user.id)
        if (vote) {
          setUserVote(vote.would_order_again)
          setUserRating(vote.rating_10)
          setUserReviewText(vote.review_text || null)
          if (vote.rating_10) setSliderValue(vote.rating_10)
          if (vote.review_text) setReviewText(vote.review_text)
        }
      } catch (error) {
        logger.error('Error fetching user vote:', error)
      }
    }
    fetchUserVote()
  }, [dishId, user])

  // Continue flow after successful login (including OAuth redirect)
  useEffect(() => {
    if (user && awaitingLogin && pendingVote !== null) {
      // User just logged in and we have a pending vote - continue to rating step
      setAwaitingLogin(false)
      setStep(2)
      clearPendingVoteStorage()
    }
  }, [user, awaitingLogin, pendingVote])

  // Check for pending vote in localStorage after OAuth redirect
  useEffect(() => {
    if (user && step === 1 && pendingVote === null) {
      const stored = getPendingVoteFromStorage()
      if (stored && stored.dishId === dishId) {
        // User just logged in after OAuth redirect - restore their vote and continue
        setPendingVote(stored.vote)  // Set the pending vote BEFORE changing step
        setStep(2)
        clearPendingVoteStorage()
      }
    }
  }, [user, dishId, step, pendingVote])

  // Auth guard: if on step 2 without auth, kick back to step 1
  useEffect(() => {
    if (step === 2 && !user) {
      setStep(1)
      setAwaitingLogin(true)
      onLoginRequired?.()
    }
  }, [step, user, onLoginRequired])

  // Attach JitterBox to textarea when it mounts (step 2)
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
  }, [step]) // re-run when step changes (textarea mounts on step 2)

  const handleVoteClick = (wouldOrderAgain) => {
    setPendingVote(wouldOrderAgain)
    hapticLight() // Tactile feedback on selection

    // Auth gate: check if user is logged in BEFORE showing confirmation
    if (!user) {
      // Save to localStorage so it survives OAuth redirect
      setPendingVoteToStorage(dishId, wouldOrderAgain)
      setAwaitingLogin(true)
      onLoginRequired?.()
      // Don't show confirmation animation - go straight to login
      return
    }

    // User is authenticated — expand rating UI immediately
    setStep(2)
  }

  const handleSubmit = async () => {
    // Validate review length if they wrote something
    if (reviewText.length > MAX_REVIEW_LENGTH) {
      setReviewError(`${reviewText.length - MAX_REVIEW_LENGTH} characters over limit`)
      return
    }
    setReviewError(null)
    await doSubmit(reviewText.trim() || null)
  }

  const doSubmit = async (reviewTextToSubmit) => {
    // Prevent double submission
    if (submitting) return
    if (pendingVote === null) return

    if (!user) {
      onLoginRequired?.()
      return
    }

    // Validate rating is within acceptable range
    if (sliderValue < 0 || sliderValue > 10) {
      logger.error('Invalid rating value:', sliderValue)
      return
    }

    const previousVote = userVote

    if (previousVote === null) {
      setLocalTotalVotes(prev => prev + 1)
      if (pendingVote) setLocalYesVotes(prev => prev + 1)
    } else if (previousVote !== pendingVote) {
      if (pendingVote) {
        setLocalYesVotes(prev => prev + 1)
      } else {
        setLocalYesVotes(prev => prev - 1)
      }
    }

    setUserVote(pendingVote)
    setUserRating(sliderValue)
    if (reviewTextToSubmit) setUserReviewText(reviewTextToSubmit)

    // Track vote immediately for snappy analytics
    capture('vote_cast', {
      dish_id: dishId,
      dish_name: dishName,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      category: category,
      price: price != null ? Number(price) : null,
      would_order_again: pendingVote,
      rating: sliderValue,
      has_review: !!reviewTextToSubmit,
      has_photo: photoAdded,
      is_update: previousVote !== null,
    })

    // Capture WAR badge before clearing state
    const badge = reviewTextToSubmit && jitterBoxRef.current
      ? jitterBoxRef.current.score()
      : null
    const purityData = badge ? { purity: badge.purity } : null
    const jitterData = badge ? badge.profile : null
    const jitterScore = badge
      ? { score: badge.war, flags: badge.flags, classification: badge.classification }
      : null
    const sessionStatsData = badge ? { isCapturing: true, keystrokes: badge.session.keystrokes, wpm: badge.session.wpm, duration: badge.session.duration } : null

    // Clear UI state immediately - instant feedback
    clearPendingVoteStorage()
    setStep(1)
    setPendingVote(null)
    setReviewText('')
    setReviewError(null)
    setPhotoAdded(false)
    if (jitterBoxRef.current) jitterBoxRef.current.reset()

    // Haptic success feedback
    hapticSuccess()

    // Announce for screen readers
    setAnnouncement('Vote submitted successfully')
    setTimeout(() => setAnnouncement(''), 1000)

    // Notify parent to refresh data
    onVote?.()

    // Submit to server in background (non-blocking)
    submitVote(dishId, pendingVote, sliderValue, reviewTextToSubmit, purityData, jitterData, jitterScore)
      .then(async (result) => {
        if (result.success && sessionStatsData?.isCapturing) {
          try {
            const profile = await jitterApi.getMyProfile()
            setSessionCardData({ sessionStats: sessionStatsData, profileStats: profile })
          } catch (e) {
            // Non-critical — show card with session stats only
            setSessionCardData({ sessionStats: sessionStatsData, profileStats: null })
          }
        }
        if (!result.success) {
          logger.error('Vote submission failed:', result.error)
        }
      })
      .catch((err) => {
        logger.error('Vote submission error:', err)
      })
  }

  // Intercept browser back button during vote flow — navigate between steps instead of leaving.
  // The interceptor was registered in main.jsx BEFORE React Router, so its popstate listener
  // fires first (AT_TARGET phase = registration order). It calls stopImmediatePropagation to
  // prevent React Router from processing the navigation, then pushes the dish URL back.
  useEffect(() => {
    if (step <= 1) {
      clearBackButtonInterceptor()
      return
    }

    // Save the dish page URL/state now — by the time popstate fires, the browser
    // has already changed the URL to the previous page
    const currentUrl = window.location.href
    const currentState = window.history.state

    setBackButtonInterceptor(() => {
      // Restore the dish page in the history stack
      window.history.pushState(currentState, '', currentUrl)
      setStep(1)
    })

    return () => clearBackButtonInterceptor()
  }, [step])

  // Already voted - show summary
  if (userVote !== null && userRating !== null && step === 1) {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl" style={{ background: 'var(--color-success-light)', border: '1.5px solid var(--color-success)' }}>
          <p className="text-sm font-medium text-center mb-2" style={{ color: 'var(--color-success)' }}>Your review</p>
          <div className="flex items-center justify-center gap-4">
            {userVote ? <ThumbsUpIcon size={32} /> : <ThumbsDownIcon size={32} />}
            <span className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>{Number(userRating).toFixed(1)}</span>
          </div>
          {userReviewText && (
            <p className="mt-3 text-sm text-center italic" style={{ color: 'var(--color-text-tertiary)' }}>
              "{userReviewText}"
            </p>
          )}
        </div>
        {isRanked && (
          <div>
            <div
              className="w-full overflow-hidden"
              style={{ height: '6px', borderRadius: '3px', background: 'var(--color-surface)' }}
            >
              <div style={{ width: `${yesPercent}%`, height: '100%', borderRadius: '3px', background: 'var(--color-success)' }} />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>{yesPercent}%</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>would order again</span>
            </div>
          </div>
        )}
        {sessionCardData && (
          <SessionCard
            sessionStats={sessionCardData.sessionStats}
            profileStats={sessionCardData.profileStats}
            onDismiss={() => setSessionCardData(null)}
          />
        )}

        <button
          onClick={() => {
            setPendingVote(userVote)
            setSliderValue(userRating)
            if (userReviewText) {
              setReviewText(userReviewText)
            }
            setUserVote(null)
            setUserRating(null)
            setUserReviewText(null)
            setStep(1)
          }}
          className="w-full py-2 text-sm transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Update your review
        </button>

        {/* Post-vote prompts for missing content */}
        {!userReviewText && (
          <button
            onClick={() => {
              setPendingVote(userVote)
              setSliderValue(userRating)
              setStep(2)
              setTimeout(() => {
                const el = document.getElementById('review-text')
                if (el) el.focus()
              }, 100)
            }}
            className="w-full py-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            Be the first to describe this dish
          </button>
        )}
        {!hasPhotos && (
          <PhotoUploadButton
            dishId={dishId}
            onPhotoUploaded={(photo) => {
              onPhotoUploaded?.(photo)
            }}
            onLoginRequired={onLoginRequired}
            label="Add a photo — be the first"
          />
        )}
      </div>
    )
  }

  // Show pending selection state when awaiting login
  const showPendingYes = awaitingLogin && pendingVote === true
  const showPendingNo = awaitingLogin && pendingVote === false
  const isYesSelected = step === 2 && pendingVote === true
  const isNoSelected = step === 2 && pendingVote === false

  return (
    <div className="space-y-3">
      {/* Screen reader announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <p className="text-sm font-medium text-center" style={{ color: 'var(--color-text-tertiary)' }}>Worth ordering again?</p>

      {/* Show "sign in to continue" note when awaiting login */}
      {awaitingLogin && pendingVote !== null && (
        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--color-primary-muted)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            {pendingVote ? <ThumbsUpIcon size={22} /> : <ThumbsDownIcon size={22} />} Vote selected — sign in to save it
          </p>
        </div>
      )}

      {!isRanked && !awaitingLogin && step === 1 ? (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          {localTotalVotes === 0
            ? 'Be the first to rank this dish!'
            : `${localTotalVotes} vote${localTotalVotes === 1 ? '' : 's'} so far \u00B7 ${5 - localTotalVotes} more to rank`
          }
        </p>
      ) : null}

      {/* Yes/No buttons — always visible, selected one stays highlighted */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleVoteClick(true)}
          className="relative overflow-hidden flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ease-out focus-ring active:scale-95"
          style={isYesSelected || showPendingYes
            ? { background: 'linear-gradient(to bottom right, var(--color-success), var(--color-green-deep))', color: 'var(--color-text-on-primary)', boxShadow: '0 10px 15px -3px var(--color-success-border)', transform: 'scale(1.05)' }
            : { background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-divider)' }}
        >
          <ThumbsUpIcon size={30} /><span>Yes</span>
        </button>
        <button
          onClick={() => handleVoteClick(false)}
          className="relative overflow-hidden flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ease-out focus-ring active:scale-95"
          style={isNoSelected || showPendingNo
            ? { background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-danger))', color: 'var(--color-text-on-primary)', boxShadow: '0 10px 15px -3px var(--color-primary-glow)', transform: 'scale(1.05)' }
            : { background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-divider)' }}
        >
          <ThumbsDownIcon size={30} /><span>No</span>
        </button>
      </div>

      {/* Step 2: Rating + review + photo — expands inline below yes/no */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <p className="text-sm font-medium text-center" style={{ color: 'var(--color-text-tertiary)' }}>How good was it?</p>

          {/* Food Rating Slider */}
          <FoodRatingSlider
            value={sliderValue}
            onChange={setSliderValue}
            min={0}
            max={10}
            step={0.1}
            category={category}
          />

          {/* Review textarea with JitterBox biometric capture */}
          <div className="relative">
            <label htmlFor="review-text" className="sr-only">Your review</label>
            <textarea
              ref={reviewTextareaRef}
              id="review-text"
              className="w-full rounded-lg p-3 text-sm"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: reviewError ? '2px solid var(--color-primary)' : '1px solid var(--color-divider)',
                minHeight: '60px',
                resize: 'vertical',
              }}
              value={reviewText}
              onChange={(e) => {
                setReviewText(e.target.value)
                if (reviewError) setReviewError(null)
              }}
              placeholder="What stood out?"
              aria-label="Write your review"
              aria-describedby={reviewError ? 'review-error' : 'review-char-count'}
              aria-invalid={!!reviewError}
              maxLength={MAX_REVIEW_LENGTH + 50}
              rows={1}
            />
            {reviewText.length > 0 && (
              <div id="review-char-count" className="absolute bottom-2 right-3 text-xs" style={{ color: reviewText.length > MAX_REVIEW_LENGTH ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
                {reviewText.length}/{MAX_REVIEW_LENGTH}
              </div>
            )}
            {reviewError && (
              <p id="review-error" role="alert" className="text-sm text-center mt-1" style={{ color: 'var(--color-primary)' }}>
                {reviewError}
              </p>
            )}
          </div>

          {/* Photo upload — inline */}
          {photoAdded ? (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-success-muted)', border: '1px solid var(--color-success-border)' }}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-success)' }}>
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

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || reviewText.length > MAX_REVIEW_LENGTH}
            className={`w-full py-4 px-6 rounded-xl font-semibold shadow-lg transition-all duration-200 ease-out focus-ring
              ${submitting || reviewText.length > MAX_REVIEW_LENGTH ? 'opacity-50 cursor-not-allowed' : 'active:scale-98 hover:shadow-xl'}`}
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            {submitting ? 'Saving...' : (reviewText.trim() || photoAdded) ? 'Submit' : 'Submit Rating'}
          </button>
        </div>
      )}
    </div>
  )
}
