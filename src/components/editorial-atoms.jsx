/**
 * Editorial atoms — ported 1:1 from the claude.ai/design handoff bundle's
 * atoms.jsx. Class names + sizing + spacing match the prototype's tokens.css
 * exactly so visual divergence stays minimal.
 *
 * These are NOT yet used by any production surface. Preview at /redesign-atoms.
 * Promote them to the live UI only after Dan signs off on the tone shift.
 */

// Rating display: editorial Fraunces numeral
export function Rating({ value, size = 'md' }) {
  if (value == null) return null
  const sz = { sm: 14, md: 18, lg: 28, xl: 44 }[size] || 18
  const tone =
    value >= 9 ? 'var(--color-primary)'
    : value >= 8 ? 'var(--color-text-primary)'
    : 'var(--color-text-secondary)'
  return (
    <span className="stat-num" style={{ fontSize: sz, lineHeight: `${sz}px`, color: tone }}>
      {Number(value).toFixed(1)}
    </span>
  )
}

// "Worth It" / "Skip" stamp — hand-stamp aesthetic, rotated slightly.
export function VoteStamp({ wouldAgain, size = 'sm' }) {
  const isWorth = wouldAgain
  return (
    <span
      className="stamp"
      style={{
        color: isWorth ? 'var(--color-success)' : 'var(--color-text-tertiary)',
        background: isWorth ? 'rgba(22,163,74,0.06)' : 'rgba(118,118,118,0.06)',
        fontSize: size === 'lg' ? 12 : 10,
      }}
    >
      {isWorth ? '✓ Worth it' : '✗ Skip'}
    </span>
  )
}

// % "Worth It" badge — used in dish rows.
export function WorthBadge({ pct }) {
  if (pct == null) return null
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 11,
        fontWeight: 600,
        color: pct >= 90 ? 'var(--color-success)' : 'var(--color-text-secondary)',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {pct}%<span style={{ fontSize: 9, opacity: 0.7 }}>worth</span>
    </span>
  )
}

// Dish thumbnail — emoji over warm tile (placeholder for real photos).
export function DishThumb({ emoji, size = 56, rounded = 12 }) {
  return (
    <div
      className="dish-thumb"
      style={{ width: size, height: size, borderRadius: rounded, fontSize: size * 0.5 }}
    >
      {emoji || '🍽'}
    </div>
  )
}

// Section header w/ editorial eyebrow + optional rule.
export function SectionHead({ eyebrow, title, action, rule = true }) {
  return (
    <div style={{ padding: '20px 16px 8px' }}>
      {eyebrow && (
        <div className="section-eyebrow" style={{ marginBottom: 4 }}>
          {eyebrow}
        </div>
      )}
      <div
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}
      >
        <h2
          className="font-display"
          style={{
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {action}
      </div>
      {rule && <div className="rule" style={{ marginTop: 10 }} />}
    </div>
  )
}

// Tiny rank number — newspaper-style, padded to 2 digits.
export function RankNum({ n, size = 'md' }) {
  const sz = size === 'lg' ? 36 : size === 'sm' ? 16 : 24
  const color =
    n === 1 ? 'var(--color-medal-gold)'
    : n === 2 ? 'var(--color-medal-silver)'
    : n === 3 ? 'var(--color-medal-bronze)'
    : 'var(--color-text-tertiary)'
  return (
    <span
      className="font-display"
      style={{
        fontSize: sz,
        fontWeight: 700,
        lineHeight: 1,
        color,
        letterSpacing: '-0.04em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {String(n).padStart(2, '0')}
    </span>
  )
}

// Honest delta tag — your rating vs crowd. "match" if within 0.3.
export function DeltaTag({ mine, consensus }) {
  if (mine == null || consensus == null) return null
  const d = mine - consensus
  if (Math.abs(d) < 0.3) return <span className="delta-pill match">match</span>
  const tone = d > 0 ? 'warm' : 'cool'
  const sign = d > 0 ? '+' : '−'
  return (
    <span className={'delta-pill ' + tone}>
      {sign}
      {Math.abs(d).toFixed(1)} <span style={{ opacity: 0.7 }}>vs crowd</span>
    </span>
  )
}
