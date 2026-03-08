import { useState } from 'react'
import { JITTER_TIERS } from '../../constants/jitter'

/**
 * JitterExplainer — Bottom sheet explaining what Jitter trust badges mean.
 * Triggered by "?" icon next to trust badges on reviews.
 *
 * Props:
 *   open     — boolean, controls visibility
 *   onClose  — callback when sheet is dismissed
 *   warScore — optional, show this reviewer's specific score in detail
 *   stats    — optional { reviews, consistency, days_active }
 */
export function JitterExplainer({ open, onClose, warScore, stats }) {
  var [showScore, setShowScore] = useState(false)

  if (!open) return null

  var warDisplay = warScore != null ? (Number(warScore) * 10).toFixed(1) : null

  return (
    <div
      className="fixed inset-0 z-[10000]"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} aria-hidden="true" />
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden"
        onClick={function (e) { e.stopPropagation() }}
        style={{
          background: 'var(--color-surface-elevated)',
          maxHeight: '80vh',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-divider)' }} />
        </div>

        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            What's this badge?
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Jitter measures <strong>how</strong> you type — not what you type — to prove reviews come from real people.
            Your typing rhythm builds a unique pattern over time that bots can't fake.
          </p>

          {/* Tier list */}
          <div className="flex flex-col gap-3 mb-4">
            {Object.keys(JITTER_TIERS).map(function (key) {
              var tier = JITTER_TIERS[key]
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: tier.bg }}
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: tier.color }}
                  >
                    {(key === 'trusted' || key === 'verified') && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {key === 'new_reviewer' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {tier.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {tier.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Score detail (tap to expand) */}
          {warScore != null && (
            <button
              className="w-full text-left rounded-xl p-3 mb-4"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-divider)' }}
              onClick={function () { setShowScore(!showScore) }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  This reviewer's score
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {showScore ? 'Hide' : 'Show details'}
                </span>
              </div>
              {showScore && (
                <div className="mt-3 flex flex-col gap-2">
                  <ScoreRow label="Trust Score" value={warDisplay + ' / 10'} />
                  {stats && stats.reviews != null && (
                    <ScoreRow label="Verified sessions" value={String(stats.reviews)} />
                  )}
                  {stats && stats.days_active != null && (
                    <ScoreRow label="Days active" value={String(stats.days_active)} />
                  )}
                </div>
              )}
            </button>
          )}

          {/* Privacy note */}
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            Jitter never sees your words. Only typing rhythm metadata (timing between keys) is measured — everything stays on your device.
          </p>

          {/* Learn more link */}
          <a
            href="/jitter"
            className="block text-center text-sm font-semibold py-2"
            style={{ color: 'var(--color-primary)' }}
          >
            Learn more about how Jitter works &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}

function ScoreRow({ label, value }) {
  return (
    <div className="flex justify-between" style={{ fontSize: '13px' }}>
      <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

export default JitterExplainer
