import { useRef, useState } from 'react'
import { FoodRatingSlider } from '../FoodRatingSlider'
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
          borderBottom: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-ink)', border: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
                color: 'var(--color-text-primary)',
              }}
            >
              {index + 1} of {total}
            </p>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
              Rate each dish before you submit
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div
          className="px-4 py-5"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="text-center mb-5">
            {dish.isSpecial && (
              <span
                className="inline-block uppercase"
                style={{
                  padding: '2px 9px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  background: 'var(--color-highlight)',
                  border: 'var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--color-ink)',
                }}
              >
                Special
              </span>
            )}
            <h1
              className="mt-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '30px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
                color: 'var(--color-text-primary)',
              }}
            >
              {dish.name}
            </h1>
            <p className="mt-1.5" style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontWeight: 600 }}>
              {dish.category || 'Menu item'}
            </p>
          </div>

          <FoodRatingSlider
            value={value.rating10 ?? 0}
            unrated={value.rating10 == null || value.rating10 === 0}
            onChange={function (nextRating) { updateValue({ rating10: nextRating }) }}
            min={0}
            max={10}
            step={0.1}
            category={dish.category}
          />

          <div className="mt-6">
            <button
              onClick={function () { setIsReviewExpanded(!isReviewExpanded) }}
              className="w-full px-4 py-3 text-left transition-all active:scale-[0.99]"
              style={{
                background: isReviewExpanded ? 'var(--color-highlight-muted)' : 'var(--color-surface)',
                border: isReviewExpanded ? 'var(--border-default)' : '1px dashed var(--color-divider-strong)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span className="block" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                What stood out?
              </span>
              <span className="block text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
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
                  className="w-full px-4 py-3 resize-none outline-none"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    border: reviewOverLimit ? '2px solid var(--color-danger)' : 'var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: '16px',
                  }}
                />
                <p className="text-xs mt-2 text-right" style={{ color: reviewOverLimit ? 'var(--color-danger)' : 'var(--color-text-tertiary)', fontWeight: 700 }}>
                  {reviewLength}/{MAX_REVIEW_LENGTH}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={function () { fileInputRef.current && fileInputRef.current.click() }}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              style={{
                background: 'var(--color-surface)',
                border: '1px dashed var(--color-divider-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.37 5.5h7.26a2.31 2.31 0 0 1 1.543.675l.87.778a2.31 2.31 0 0 1 .77 1.72v7.655a2.31 2.31 0 0 1-2.31 2.31H7.497a2.31 2.31 0 0 1-2.31-2.31V8.674a2.31 2.31 0 0 1 .77-1.72l.87-.778Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 14 1.878-1.878a1.5 1.5 0 0 1 2.122 0L15 14m-6 0 1.5-1.5a1.5 1.5 0 0 1 2.121 0L14 14m0 0 1.5-1.5a1.5 1.5 0 0 1 2.121 0L19 14m-8-4.5h.008v.008H11V9.5Z" />
              </svg>
              <span className="text-sm" style={{ fontWeight: 700 }}>{value.photoFile ? 'Change Photo' : 'Add Photo'}</span>
            </button>

            {value.photoFile && (
              <div
                className="mt-3 px-4 py-3 flex items-center justify-between gap-3"
                style={{
                  background: 'var(--color-surface)',
                  border: 'var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    {value.photoFile.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                    Uploads when you submit everything
                  </p>
                </div>
                <button
                  onClick={function () { updateValue({ photoFile: null }) }}
                  className="text-sm flex-shrink-0"
                  style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="fixed left-0 right-0 z-30 px-4 pt-3 pb-3"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          background: 'var(--color-bg)',
          borderTop: 'var(--border-default)',
        }}
      >
        <button
          onClick={onNext}
          disabled={value.rating10 == null || value.rating10 === 0 || reviewOverLimit}
          className="btn w-full py-3.5"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          {index === total - 1 ? 'Review' : 'Next'}
        </button>
      </div>
    </div>
  )
}
