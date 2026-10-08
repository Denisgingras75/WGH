import { getRatingColor } from '../../utils/ranking'

export function BatchSummary({
  restaurantName,
  dishes,
  ratingsById,
  onBack,
  onEdit,
  onSubmit,
  submitting,
  submitError,
  uploadStatus,
}) {
  var submittedCount = submitError && submitError.submittedCount != null ? submitError.submittedCount : 0

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--color-bg)' }}>
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
            aria-label="Back to dishes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontSize: '26px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
              }}
            >
              Review Your Meal
            </h1>
            <p className="truncate" style={{ color: 'var(--color-accent)', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
              {restaurantName}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {dishes.map(function (dish, index) {
          var rating = ratingsById[dish.clientId]
          return (
            <button
              key={dish.clientId}
              onClick={function () { onEdit(index) }}
              className="w-full text-left px-4 py-3.5 press"
              style={{
                background: 'var(--color-card)',
                border: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p style={{ color: 'var(--color-text-primary)', fontSize: '15px', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                    {dish.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '26px',
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                        lineHeight: 1,
                        color: getRatingColor(rating.rating10),
                      }}
                    >
                      {Number(rating.rating10).toFixed(1)}
                    </span>
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', fontWeight: 700 }}>/10</span>
                    {rating.reviewText ? (
                      <span
                        style={{
                          padding: '1px 7px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: 'var(--color-card)',
                          border: 'var(--border-subtle)',
                          borderRadius: 'var(--radius-pill)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        Note
                      </span>
                    ) : null}
                    {rating.photoFile ? (
                      <span
                        style={{
                          padding: '1px 7px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: 'var(--color-highlight)',
                          border: 'var(--border-subtle)',
                          borderRadius: 'var(--radius-pill)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        Photo
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className="inline-block"
                    style={{
                      padding: '3px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      background: 'var(--color-card)',
                      border: 'var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    Edit
                  </span>
                  <p className="mt-1.5" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 600 }}>
                    Dish {index + 1}
                  </p>
                </div>
              </div>
            </button>
          )
        })}

        {submitError && (
          <div
            className="px-4 py-4"
            style={{
              background: 'var(--color-danger-muted)',
              border: '2px solid var(--color-danger)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
              {submittedCount > 0
                ? 'Stopped after ' + submittedCount + ' dish' + (submittedCount === 1 ? '' : 'es')
                : "Couldn't submit your meal"}
            </p>
            <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {submitError?.message || 'Please try again.'}
            </p>
            {submittedCount > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                Retry is safe. Existing votes update in place.
              </p>
            )}
          </div>
        )}

        {uploadStatus && (
          <div
            className="px-4 py-4"
            style={{
              background: 'var(--color-card)',
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              Preparing photos
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {uploadStatus}
            </p>
          </div>
        )}
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
          onClick={onSubmit}
          disabled={submitting}
          className="btn w-full py-3.5"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          {submitting ? 'Submitting...' : 'Submit All'}
        </button>
      </div>
    </div>
  )
}
