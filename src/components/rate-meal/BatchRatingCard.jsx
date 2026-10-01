import { useEffect, useRef, useState } from 'react'
import { FoodRatingSlider } from '../FoodRatingSlider'
import { MAX_REVIEW_LENGTH } from '../../constants/app'
import { getCategoryById } from '../../constants/categories'
import { RATE_LIMITS } from '../../lib/rateLimiter'
import { validateUserContent } from '../../lib/reviewBlocklist'
import { PageHeader } from '../PageHeader'
import { AMATIC_TITLE } from '../../constants/styles'

var MAX_PHOTOS_PER_MEAL = RATE_LIMITS.photoUpload.maxAttempts

export function BatchRatingCard({
  dish,
  value,
  index,
  total,
  isEditing,
  photosUsed = 0,
  onBack,
  onNext,
  onChange,
}) {
  var fileInputRef = useRef(null)
  var [isReviewExpanded, setIsReviewExpanded] = useState(!!value.reviewText)
  var [noteFocused, setNoteFocused] = useState(false)
  var [contentError, setContentError] = useState(null)
  var [previewUrl, setPreviewUrl] = useState(null)
  var reviewLength = (value.reviewText || '').length
  var reviewOverLimit = reviewLength > MAX_REVIEW_LENGTH
  var canAdvance = value.rating10 != null && !reviewOverLimit
  var photoLimitReached = !value.photoFile && photosUsed >= MAX_PHOTOS_PER_MEAL
  var noteId = 'note-' + dish.clientId
  var noteCountId = 'note-count-' + dish.clientId

  // Thumbnail for the staged photo (iOS names every capture "image.jpg").
  useEffect(function () {
    if (!value.photoFile) {
      setPreviewUrl(null)
      return
    }
    var url = URL.createObjectURL(value.photoFile)
    setPreviewUrl(url)
    return function () { URL.revokeObjectURL(url) }
  }, [value.photoFile])

  function updateValue(nextFields) {
    onChange({
      ...value,
      ...nextFields,
    })
  }

  function handleFileChange(event) {
    var file = event.target.files && event.target.files[0]
    if (!file) return

    updateValue({
      photoFile: file,
      photoUploaded: false,
    })

    event.target.value = ''
  }

  function handleNext() {
    var error = validateUserContent(value.reviewText, 'Note')
    if (error) {
      setContentError(error)
      setIsReviewExpanded(true)
      return
    }
    onNext()
  }

  var noteBorderColor = 'var(--color-divider)'
  if (reviewOverLimit || contentError) noteBorderColor = 'var(--color-danger)'
  else if (noteFocused) noteBorderColor = 'var(--color-primary)'

  var nextLabel
  if (isEditing) nextLabel = 'Done'
  else if (index === total - 1) nextLabel = 'Review'
  else nextLabel = 'Next'

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Same header as the other Rate Your Meal screens; the dish name below is the h1 */}
      <PageHeader
        title="Rate Your Meal"
        titleAs="p"
        meta={'Dish ' + (index + 1) + ' of ' + total}
        onBack={onBack}
      />

      <div className="px-4 pt-5">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <div className="text-center mb-5">
            {dish.isSpecial && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-accent-gold)' }}>
                Special
              </p>
            )}
            <h1 className="mt-1" style={{ ...AMATIC_TITLE, fontSize: '28px' }}>
              {dish.name}
            </h1>
            <p className="mt-1" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
              {getCategoryById(dish.category)?.label || dish.category || 'Menu item'}
            </p>
          </div>

          <FoodRatingSlider
            value={value.rating10 ?? 0}
            unrated={value.rating10 == null}
            onChange={function (nextRating) { updateValue({ rating10: nextRating }) }}
            min={0}
            max={10}
            step={0.1}
            category={dish.category}
            dishName={dish.name}
          />

          <div className="mt-6">
            <button
              type="button"
              aria-expanded={isReviewExpanded}
              aria-controls={noteId}
              onClick={function () { setIsReviewExpanded(!isReviewExpanded) }}
              className="w-full rounded-xl px-4 py-3 text-left transition-all active:scale-[0.99]"
              style={{
                background: isReviewExpanded ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                border: '1px solid var(--color-divider)',
              }}
            >
              <span className="block font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                What stood out?
              </span>
              <span className="block text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {isReviewExpanded
                  ? 'Add a quick note if you want'
                  : (value.reviewText ? 'Tap to edit your note' : 'Tap to add a note')}
              </span>
            </button>

            {isReviewExpanded && (
              <div className="mt-3">
                <label htmlFor={noteId} className="sr-only">Note (optional)</label>
                <textarea
                  id={noteId}
                  value={value.reviewText}
                  onChange={function (event) {
                    if (contentError) setContentError(null)
                    updateValue({ reviewText: event.target.value })
                  }}
                  onFocus={function () { setNoteFocused(true) }}
                  onBlur={function () { setNoteFocused(false) }}
                  placeholder="Crunchy edge, too salty, great sauce, worth the splurge..."
                  rows={4}
                  maxLength={MAX_REVIEW_LENGTH}
                  aria-describedby={noteCountId + (contentError ? ' ' + noteId + '-error' : '')}
                  aria-invalid={!!contentError || reviewOverLimit}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{
                    background: 'var(--color-bg)',
                    border: '2px solid ' + noteBorderColor,
                    color: 'var(--color-text-primary)',
                  }}
                />
                <p
                  id={noteCountId}
                  className="text-xs mt-1 text-right"
                  style={{ color: reviewOverLimit ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}
                >
                  {reviewLength}/{MAX_REVIEW_LENGTH}
                </p>
                {contentError && (
                  <p id={noteId + '-error'} role="alert" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
                    {contentError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              disabled={photoLimitReached}
              onClick={function () { fileInputRef.current && fileInputRef.current.click() }}
              className="w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98]"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-divider)',
                color: photoLimitReached ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.37 5.5h7.26a2.31 2.31 0 0 1 1.543.675l.87.778a2.31 2.31 0 0 1 .77 1.72v7.655a2.31 2.31 0 0 1-2.31 2.31H7.497a2.31 2.31 0 0 1-2.31-2.31V8.674a2.31 2.31 0 0 1 .77-1.72l.87-.778Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 14 1.878-1.878a1.5 1.5 0 0 1 2.122 0L15 14m-6 0 1.5-1.5a1.5 1.5 0 0 1 2.121 0L14 14m0 0 1.5-1.5a1.5 1.5 0 0 1 2.121 0L19 14m-8-4.5h.008v.008H11V9.5Z" />
              </svg>
              <span className="text-sm">{value.photoFile ? 'Change Photo' : 'Add Photo'}</span>
            </button>
            {photoLimitReached && (
              <p className="mt-2 text-center" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                Up to {MAX_PHOTOS_PER_MEAL} photos per meal
              </p>
            )}

            {value.photoFile && (
              <div
                className="mt-3 rounded-xl px-3 py-3 flex items-center justify-between gap-3"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-divider)',
                }}
              >
                <div className="min-w-0 flex items-center gap-3">
                  {previewUrl && (
                    <img src={previewUrl} alt="Selected photo" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Uploads when you submit everything
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={function () { updateValue({ photoFile: null, photoUploaded: false }) }}
                  className="inline-flex items-center min-h-[44px] px-2 text-sm font-semibold flex-shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="fixed left-0 right-0 z-30 px-3 pt-3 pb-3"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          background: 'var(--color-bg)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
          style={{
            background: canAdvance ? 'var(--color-primary)' : 'var(--color-surface)',
            color: canAdvance ? 'var(--color-text-on-primary)' : 'var(--color-text-tertiary)',
          }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
