import { useRef, useState } from 'react'
import { FoodRatingSlider } from '../FoodRatingSlider'
import { ThumbsUpIcon } from '../ThumbsUpIcon'
import { ThumbsDownIcon } from '../ThumbsDownIcon'
import { MAX_REVIEW_LENGTH } from '../../constants/app'

export function BatchRatingCard({
  dish,
  value,
  index,
  total,
  onBack,
  onNext,
  onChange,
}) {
  var fileInputRef = useRef(null)
  var [isReviewExpanded, setIsReviewExpanded] = useState(!!value.reviewText)
  var reviewLength = (value.reviewText || '').length
  var reviewOverLimit = reviewLength > MAX_REVIEW_LENGTH

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
    })

    event.target.value = ''
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      <div
        className="sticky top-0 z-20 px-4 py-3"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              {index + 1} of {total}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Rate each dish before you submit
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div
          className="rounded-[28px] px-4 py-5"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-divider)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}
        >
          <div className="text-center mb-5">
            {dish.isSpecial && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-accent-gold)' }}>
                Special
              </p>
            )}
            <h1
              className="mt-1"
              style={{
                fontFamily: "'Amatic SC', cursive",
                fontSize: '38px',
                lineHeight: 1,
                color: 'var(--color-text-primary)',
              }}
            >
              {dish.name}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              {dish.category || 'Menu item'}
            </p>
          </div>

          <p className="text-sm font-medium text-center mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Worth ordering again?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={function () { updateValue({ wouldOrderAgain: true }) }}
              className="rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
              style={value.wouldOrderAgain === true
                ? { background: 'linear-gradient(to bottom right, var(--color-success), var(--color-green-deep))', color: 'var(--color-text-on-primary)', boxShadow: '0 10px 15px -3px var(--color-success-border)' }
                : { background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-divider)' }}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsUpIcon size={36} active={value.wouldOrderAgain === true} />
                <span className="font-bold text-sm">Yes</span>
              </div>
            </button>
            <button
              onClick={function () { updateValue({ wouldOrderAgain: false }) }}
              className="rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
              style={value.wouldOrderAgain === false
                ? { background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-danger))', color: 'var(--color-text-on-primary)', boxShadow: '0 10px 15px -3px var(--color-primary-glow)' }
                : { background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-divider)' }}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsDownIcon size={36} active={value.wouldOrderAgain === false} />
                <span className="font-bold text-sm">No</span>
              </div>
            </button>
          </div>

          <div className="mt-6">
            <FoodRatingSlider
              value={value.rating10}
              onChange={function (nextRating) { updateValue({ rating10: nextRating }) }}
              min={1}
              max={10}
              step={0.1}
              category={dish.category}
            />
          </div>

          <div className="mt-6">
            <button
              onClick={function () { setIsReviewExpanded(!isReviewExpanded) }}
              className="w-full rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.99]"
              style={{
                background: isReviewExpanded ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                border: isReviewExpanded ? '1px solid var(--color-primary)' : '1px solid var(--color-divider)',
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
                <textarea
                  value={value.reviewText}
                  onChange={function (event) { updateValue({ reviewText: event.target.value }) }}
                  placeholder="Crunchy edge, too salty, great sauce, worth the splurge..."
                  rows={4}
                  className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none"
                  style={{
                    background: 'var(--color-bg)',
                    border: reviewOverLimit ? '1px solid var(--color-danger)' : '1px solid var(--color-divider)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <p className="text-xs mt-2 text-right" style={{ color: reviewOverLimit ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
                  {reviewLength}/{MAX_REVIEW_LENGTH}
                </p>
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
              onClick={function () { fileInputRef.current && fileInputRef.current.click() }}
              className="w-full rounded-2xl px-4 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-divider)',
                color: 'var(--color-text-primary)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.37 5.5h7.26a2.31 2.31 0 0 1 1.543.675l.87.778a2.31 2.31 0 0 1 .77 1.72v7.655a2.31 2.31 0 0 1-2.31 2.31H7.497a2.31 2.31 0 0 1-2.31-2.31V8.674a2.31 2.31 0 0 1 .77-1.72l.87-.778Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 14 1.878-1.878a1.5 1.5 0 0 1 2.122 0L15 14m-6 0 1.5-1.5a1.5 1.5 0 0 1 2.121 0L14 14m0 0 1.5-1.5a1.5 1.5 0 0 1 2.121 0L19 14m-8-4.5h.008v.008H11V9.5Z" />
              </svg>
              <span className="font-semibold text-sm">{value.photoFile ? 'Change Photo' : 'Add Photo'}</span>
            </button>

            {value.photoFile && (
              <div
                className="mt-3 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-divider)',
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {value.photoFile.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Uploads when you submit everything
                  </p>
                </div>
                <button
                  onClick={function () { updateValue({ photoFile: null }) }}
                  className="text-sm font-semibold"
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
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3"
        style={{
          background: 'var(--color-bg)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={onNext}
          disabled={value.wouldOrderAgain == null || reviewOverLimit}
          className="w-full rounded-2xl py-3.5 font-bold text-sm transition-all"
          style={{
            background: (value.wouldOrderAgain == null || reviewOverLimit) ? 'var(--color-surface-elevated)' : 'var(--color-primary)',
            color: (value.wouldOrderAgain == null || reviewOverLimit) ? 'var(--color-text-tertiary)' : 'var(--color-text-on-primary)',
          }}
        >
          {index === total - 1 ? 'Review' : 'Next'}
        </button>
      </div>
    </div>
  )
}
