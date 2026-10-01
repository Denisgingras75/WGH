import { Link } from 'react-router-dom'
import { TRUST_BADGE_LEGEND } from '../../constants/jitter'
import { TrustBadge } from '../TrustBadge'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * JitterExplainer — Bottom sheet explaining what Jitter trust badges mean.
 * Triggered by "?" icon next to trust badges on reviews.
 *
 * Props:
 *   open     — boolean, controls visibility
 *   onClose  — callback when sheet is dismissed
 */
export function JitterExplainer({ open, onClose }) {
  // Called before the early return so hook order stays stable
  var panelRef = useFocusTrap(open, onClose)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm animate-backdrop-fade-in"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jitter-explainer-title"
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-modal-slide-up"
        onClick={function (e) { e.stopPropagation() }}
        style={{
          background: 'var(--color-surface-elevated)',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-divider)' }} />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b" style={{ borderColor: 'var(--color-divider)' }}>
          <div className="flex items-center justify-between gap-3">
            <h2
              id="jitter-explainer-title"
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              What's this badge?
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Jitter measures <strong>how</strong> you type — not what you type — to prove reviews come from real people.
            Your typing rhythm builds a unique pattern over time that bots can't fake.
          </p>
        </div>

        <div className="px-6 pt-4 overflow-y-auto overscroll-contain" style={{ maxHeight: '60vh' }}>
          {/* Badge legend — same badges users see on reviews */}
          <div className="flex flex-col gap-3 mb-4">
            {TRUST_BADGE_LEGEND.map(function (badge) {
              return (
                <div key={badge.type} className="flex items-center gap-3">
                  <TrustBadge type={badge.type} size="md" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {badge.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {badge.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Privacy note */}
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            Jitter never sees your words — only typing rhythm (timing between keys). Your typing profile is stored with your account and is never sold or shared with advertisers.
          </p>

          {/* Learn more link */}
          <Link
            to="/jitter"
            onClick={onClose}
            className="flex items-center justify-center min-h-[44px] text-sm font-semibold"
            style={{ color: 'var(--color-accent-gold)' }}
          >
            Learn more about how Jitter works &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}

export default JitterExplainer
