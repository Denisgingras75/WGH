import { useState } from 'react'
import { JITTER_TIERS } from '../constants/jitter'
import { jitterApi } from '../api/jitterApi'
import { logger } from '../utils/logger'

// Sticker-sheet inks for the numbered steps
var STEP_INKS = {
  '1': { bg: 'var(--color-primary)', fg: 'var(--color-text-on-primary)' },
  '2': { bg: 'var(--color-accent)', fg: 'var(--color-text-on-primary)' },
  '3': { bg: 'var(--color-highlight)', fg: 'var(--color-ink)' },
}

/**
 * JitterLanding — standalone explainer page.
 * Three layers: Hook → Explainer → Protocol.
 * Route: /jitter
 */
export default function JitterLanding() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <HookSection />
      <ExplainerSection />
      <ProtocolSection />
      <div className="px-6 pb-12" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <WaitlistSection position="bottom" />
      </div>
      <Footer />
    </div>
  )
}

// ── Layer 1: The Hook ──────────────────────────────────────────────

function HookSection() {
  return (
    <section className="px-6 pt-16 pb-12 text-center" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="mb-6">
        <JitterWordmark />
      </div>
      <h1
        className="mb-5"
        style={{ fontSize: '42px', color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.035em' }}
      >
        Every review is verified human.
      </h1>
      <p className="mb-8" style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        Jitter proves reviews are written by real people using typing patterns — not what you type, just how.
        No surveillance. No tracking. Just proof.
      </p>
      <WaitlistSection position="top" />
    </section>
  )
}

// ── Layer 2: The Explainer ─────────────────────────────────────────

function ExplainerSection() {
  return (
    <section className="px-6 py-12" style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* How it works */}
      <h2 className="mb-5" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
        How it works
      </h2>
      <div className="flex flex-col gap-4 mb-10">
        <StepCard number="1" title="You type" description="Write your review naturally. Jitter runs silently in the background." />
        <StepCard number="2" title="Jitter reads rhythm" description="Timing between keystrokes creates a unique pattern — like a fingerprint, but for typing." />
        <StepCard number="3" title="Badge earned over time" description="One session isn't enough. Trust builds across multiple reviews over weeks and months." />
      </div>

      {/* What the tiers mean */}
      <h2 className="mb-4" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
        What the badges mean
      </h2>
      <div className="flex flex-col gap-3 mb-10">
        {Object.keys(JITTER_TIERS).map(function (key) {
          var tier = JITTER_TIERS[key]
          return (
            <div
              key={key}
              className="p-4"
              style={{
                background: 'var(--color-card)',
                border: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p className="mb-2">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full"
                  style={{
                    background: tier.bg,
                    color: tier.color,
                    border: 'var(--border-subtle)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {tier.label}
                </span>
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.6 }}>
                {tier.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* What we don't do */}
      <h2 className="mb-4" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
        What we don't do
      </h2>
      <div className="flex flex-col gap-3 mb-10">
        <PrivacyPoint text="We never see your words. Only timing metadata." />
        <PrivacyPoint text="We never track you across sites." />
        <PrivacyPoint text="Everything stays on your device by default." />
        <PrivacyPoint text="No account required. No personal data collected." />
      </div>

      {/* Why time matters */}
      <div
        className="p-5"
        style={{
          background: 'var(--color-highlight)',
          border: 'var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h3 className="mb-2" style={{ fontSize: '22px', lineHeight: 1.1, color: 'var(--color-ink)' }}>
          Why time is the defense
        </h3>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.6 }}>
          A bot can fake one typing session. It cannot economically maintain consistent human-like patterns
          across months of reviews. The longer you use Jitter, the more your trust compounds — and the more
          expensive it becomes for anyone to fake it.
        </p>
      </div>
    </section>
  )
}

// ── Layer 3: The Protocol ──────────────────────────────────────────

function ProtocolSection() {
  return (
    <section className="px-6 py-12" style={{ maxWidth: '640px', margin: '0 auto', borderTop: 'var(--border-default)' }}>
      <h2 className="mb-5" style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>
        The protocol
      </h2>

      {/* WAR Score */}
      <h3 className="mb-2 mt-6" style={{ fontSize: '20px', color: 'var(--color-text-primary)' }}>
        The WAR Score (0–10)
      </h3>
      <p className="mb-4" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        Weighted Authenticity Rating. Nine signals, each measuring a different dimension of human typing:
      </p>
      <div className="flex flex-col gap-2 mb-8">
        <SignalRow name="Rhythm consistency" weight="18%" description="How stable is your bigram timing across a session?" />
        <SignalRow name="Per-key uniqueness" weight="15%" description="Does each key have its own dwell signature?" />
        <SignalRow name="Cross-signal correlation" weight="15%" description="Do your signals move independently or in lockstep?" />
        <SignalRow name="Distribution shape" weight="12%" description="Does your timing follow natural human distributions?" />
        <SignalRow name="Inter-key variance" weight="10%" description="How much does your speed vary between different key pairs?" />
        <SignalRow name="Dwell consistency" weight="10%" description="How long you hold each key — and how consistent that is." />
        <SignalRow name="Average dwell" weight="8%" description="Baseline hold time across all keys." />
        <SignalRow name="Editing behavior" weight="7%" description="Backspaces, corrections, rewrites — the mess of real writing." />
        <SignalRow name="Typing purity" weight="5%" description="Ratio of original typing to pasted content." />
      </div>

      {/* Cryptographic proof */}
      <h3 className="mb-2" style={{ fontSize: '20px', color: 'var(--color-text-primary)' }}>
        Cryptographic proof
      </h3>
      <p className="mb-6" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        Every session generates an ECDSA P-256 signature over your typing metrics. These signatures chain
        together into a hash chain — a tamper-evident ledger of your typing history. No one can insert or
        remove sessions without breaking the chain.
      </p>

      {/* Sequential gating */}
      <h3 className="mb-2" style={{ fontSize: '20px', color: 'var(--color-text-primary)' }}>
        Sequential trust gating
      </h3>
      <p className="mb-6" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
        Defenses run in series, not parallel. Fail any gate and you restart from day one. Each gate multiplies
        the cost of faking it. Phone verification alone costs $0.01. But phone + aged account + time dilation +
        biometric scoring + dish-level granularity pushes the cost of 50 fake reviews past $2,000.
      </p>

      {/* For developers */}
      <div
        className="p-5 mt-8"
        style={{
          background: 'var(--color-accent)',
          border: 'var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h3 className="mb-2" style={{ fontSize: '22px', lineHeight: 1.1, color: 'var(--color-text-on-primary)' }}>
          For developers
        </h3>
        <p className="mb-3" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-on-primary-muted)', lineHeight: 1.6 }}>
          Jitter is becoming an embeddable widget — drop a script tag, get human verification on any text input.
          Like reCAPTCHA, but for content authenticity instead of form submission.
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-on-primary)', fontWeight: 600 }}>
          Join the waitlist below for early access.
        </p>
      </div>

      {/* Patent */}
      <p className="text-xs mt-8" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
        Patent pending. US Provisional Applications #63/994,858 and #63/997,498.
      </p>
    </section>
  )
}

// ── Waitlist ───────────────────────────────────────────────────────

function WaitlistSection({ position }) {
  var [email, setEmail] = useState('')
  var [status, setStatus] = useState(null) // null | 'sending' | 'done' | 'error'

  function handleSubmit(e) {
    e.preventDefault()
    if (!email || status === 'sending') return
    setStatus('sending')

    jitterApi.joinWaitlist(email, position === 'bottom' ? 'developer' : 'general')
      .then(function () {
        setStatus('done')
        setEmail('')
      })
      .catch(function (err) {
        logger.error('Waitlist failed:', err)
        setStatus('error')
      })
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-center py-3" style={{ color: 'var(--color-rating)', fontWeight: 700 }}>
        You're on the list. We'll be in touch.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
      <input
        type="email"
        value={email}
        onChange={function (e) { setEmail(e.target.value) }}
        placeholder="your@email.com"
        required
        className="flex-1 min-w-0 px-4 py-2.5"
        style={{
          background: 'var(--color-surface-elevated)',
          border: 'var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          color: 'var(--color-text-primary)',
          fontSize: '16px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn px-5 py-2.5 text-sm"
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-text-on-primary)',
          fontWeight: 600,
        }}
      >
        {status === 'sending' ? '...' : 'Join'}
      </button>
    </form>
  )
}

// ── Shared small components ────────────────────────────────────────

function JitterWordmark() {
  return (
    <span
      className="inline-block px-3 py-1"
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '16px',
        letterSpacing: '0.08em',
        color: 'var(--color-rating)',
        textTransform: 'lowercase',
        background: 'var(--color-card)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      jitter
    </span>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div
      className="flex gap-4 items-start p-4"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: (STEP_INKS[number] || STEP_INKS['1']).bg,
          color: (STEP_INKS[number] || STEP_INKS['1']).fg,
          border: 'var(--border-default)',
          boxShadow: 'var(--shadow-card)',
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: '22px',
          lineHeight: 1,
        }}
      >
        {number}
      </span>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.01em', fontSize: '21px', lineHeight: 1.15, color: 'var(--color-text-primary)' }}>{title}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.55 }}>{description}</p>
      </div>
    </div>
  )
}

function PrivacyPoint({ text }) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: 'var(--color-rating)',
          color: 'var(--color-text-on-primary)',
          border: 'var(--border-subtle)',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        &#10003;
      </span>
      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.45, paddingTop: '2px' }}>{text}</p>
    </div>
  )
}

function SignalRow({ name, weight, description }) {
  return (
    <div
      className="p-3"
      style={{ background: 'var(--color-card)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
    >
      <div className="flex justify-between items-center gap-2 mb-1">
        <span className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{name}</span>
        <span
          className="flex-shrink-0 px-2 py-0.5 rounded-full"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            background: 'var(--color-highlight)',
            border: 'var(--border-subtle)',
            color: 'var(--color-ink)',
          }}
        >
          {weight}
        </span>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.45 }}>{description}</p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="px-6 py-8 text-center" style={{ borderTop: 'var(--border-default)' }}>
      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500, lineHeight: 1.6 }}>
        Jitter Integrity Tracking &amp; Typing Entropy Recognition<br />
        Patent pending &middot; Built on Martha's Vineyard
      </p>
    </footer>
  )
}
