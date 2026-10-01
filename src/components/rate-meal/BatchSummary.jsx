import { getRatingColor } from '../../utils/ranking'
import { getUserMessage } from '../../utils/errorHandler'
import { PageHeader } from '../PageHeader'

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
      <PageHeader
        title="Rate Your Meal"
        meta={restaurantName ? 'Review & submit · ' + restaurantName : 'Review & submit'}
        onBack={onBack}
        backLabel="Back to dishes"
      />

      <div className="px-4 pt-5 space-y-3">
        {submitError && (
          <div
            role="alert"
            className="rounded-xl px-4 py-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-danger)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
              {submittedCount > 0
                ? 'Stopped after ' + submittedCount + ' dish' + (submittedCount === 1 ? '' : 'es')
                : "Couldn't submit your meal"}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              {submitError.userMessage || getUserMessage(submitError, 'submitting your meal')}
            </p>
            {submittedCount > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Retry is safe. Existing votes update in place.
              </p>
            )}
          </div>
        )}

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-divider)',
          }}
        >
          {dishes.map(function (dish, index) {
            var rating = ratingsById[dish.clientId] || {}
            var score = rating.rating10 != null ? Number(rating.rating10).toFixed(1) : '—'
            return (
              <button
                key={dish.clientId}
                type="button"
                aria-label={'Edit rating for ' + dish.name + ', ' + score + ' out of 10'}
                onClick={function () { onEdit(index) }}
                className="w-full text-left px-4 py-3 active:scale-[0.98] transition-all"
                style={{
                  borderBottom: index < dishes.length - 1 ? '1px solid var(--color-divider)' : 'none',
                }}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="block min-w-0">
                    <span
                      className="block"
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {dish.name}
                    </span>
                    <span className="flex items-center gap-2 mt-2">
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          letterSpacing: '-0.02em',
                          fontVariantNumeric: 'tabular-nums',
                          color: getRatingColor(rating.rating10),
                        }}
                      >
                        {score}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>/10</span>
                      {rating.reviewText ? (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Note
                        </span>
                      ) : null}
                      {rating.photoFile ? (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'var(--color-primary-muted)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          Photo
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="block text-right flex-shrink-0">
                    <span className="block text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                      Edit
                    </span>
                    <span className="block text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      Dish {index + 1}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {uploadStatus && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl px-4 py-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Preparing photos
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {uploadStatus}
            </p>
          </div>
        )}
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
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Submitting…' : 'Submit All'}
        </button>
      </div>
    </div>
  )
}
