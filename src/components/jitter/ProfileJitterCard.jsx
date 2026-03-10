import { useState } from 'react'

/**
 * Your Review Fingerprint — personal typing identity card.
 * Celebrates your unique typing rhythm. Every reviewer types differently
 * and that's what makes reviews trustworthy.
 */
export function ProfileJitterCard({ profile }) {
  const [expanded, setExpanded] = useState(false)

  if (!profile) return null

  const data = profile.profile_data || {}
  const tierInfo = getTierInfo(profile.confidence_level, profile.consistency_score)
  const nextTier = getNextTier(profile.confidence_level, profile.review_count, profile.consistency_score)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-divider)',
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent-gold)' }}>
            Your Review Fingerprint
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: tierInfo.bg, color: tierInfo.color }}
          >
            {tierInfo.label}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
          Your typing rhythm is unique — like a signature. The more you review, the stronger your identity becomes.
        </p>

        {/* Headline stats — friendly labels */}
        <div className="grid grid-cols-3 gap-3 text-center mt-3">
          <StatCell label="Reviews" value={profile.review_count || 0} />
          <StatCell
            label="Rhythm"
            value={profile.consistency_score != null
              ? getRhythmLabel(Number(profile.consistency_score))
              : '\u2014'}
          />
          <StatCell label="Words typed" value={formatWordCount(data.total_keystrokes || 0)} />
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: 'var(--color-text-tertiary)' }}>{nextTier.label}</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>{nextTier.current} of {nextTier.target}</span>
          </div>
          <div className="w-full overflow-hidden" style={{ height: '4px', borderRadius: '2px', background: 'var(--color-surface)' }}>
            <div style={{ width: `${Math.min(100, (nextTier.current / nextTier.target) * 100)}%`, height: '100%', borderRadius: '2px', background: 'var(--color-accent-gold)' }} />
          </div>
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-xs text-center py-2"
        style={{ color: 'var(--color-accent-gold)', borderTop: '1px solid var(--color-divider)' }}
      >
        {expanded ? 'Less detail \u25B2' : 'See your rhythm \u25BC'}
      </button>

      {/* Expanded details — friendly framing */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
          <div className="pt-3 space-y-2">
            <DetailRow label="Typing pace" value={data.mean_inter_key ? `${Math.round(data.mean_inter_key)}ms between keys` : '\u2014'} />
            <DetailRow label="Key press" value={data.mean_dwell ? `${Math.round(data.mean_dwell)}ms avg hold` : '\u2014'} />
            <DetailRow label="Typo rate" value={data.edit_ratio != null ? `${Math.round(data.edit_ratio * 100)}% corrections` : '\u2014'} />
            {profile.created_at && (
              <DetailRow label="Reviewing since" value={new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
            )}
          </div>

          {/* Per-key fingerprint — the fun visual */}
          {data.per_key_dwell && Object.keys(data.per_key_dwell).length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                How long you hold each key — your unique pattern
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.per_key_dwell)
                  .slice().sort(([, a], [, b]) => a - b)
                  .map(([key, ms]) => (
                    <KeyBar key={key} letter={key} ms={ms} max={getMaxDwell(data.per_key_dwell)} />
                  ))}
              </div>
            </div>
          )}

          {/* What this means */}
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            This fingerprint builds over time as you write reviews. It helps verify that reviews come from real people — no two typing rhythms are alike.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCell({ label, value }) {
  return (
    <div>
      <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
    </div>
  )
}

function KeyBar({ letter, ms, max }) {
  var width = max > 0 ? Math.max(20, (ms / max) * 100) : 50
  return (
    <div className="flex items-center gap-1" style={{ minWidth: '60px' }}>
      <span className="font-mono font-bold text-xs w-3 text-center" style={{ color: 'var(--color-text-primary)' }}>{letter}</span>
      <div className="flex-1 overflow-hidden" style={{ height: '6px', borderRadius: '3px', background: 'var(--color-surface)' }}>
        <div style={{ width: width + '%', height: '100%', borderRadius: '3px', background: 'var(--color-accent-gold)' }} />
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)', minWidth: '32px', textAlign: 'right' }}>{Math.round(ms)}</span>
    </div>
  )
}

function getMaxDwell(perKeyDwell) {
  var values = Object.values(perKeyDwell)
  return values.length > 0 ? Math.max.apply(null, values) : 0
}

// Friendly rhythm label from consistency score
function getRhythmLabel(score) {
  if (score >= 0.8) return 'Steady'
  if (score >= 0.5) return 'Forming'
  return 'New'
}

// Approximate word count from keystrokes (avg 5 chars per word)
function formatWordCount(keystrokes) {
  var words = Math.round(keystrokes / 5)
  if (words >= 1000) return (words / 1000).toFixed(1) + 'k'
  return String(words)
}

function getTierInfo(confidence, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return { label: 'Trusted', bg: 'rgba(34, 197, 94, 0.18)', color: 'var(--color-rating)' }
  if (confidence === 'medium' && consistency >= 0.4) return { label: 'Verified', bg: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-rating)' }
  return { label: 'Building', bg: 'rgba(156, 163, 175, 0.1)', color: 'var(--color-text-tertiary)' }
}

function getNextTier(confidence, reviewCount, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return null
  if (confidence === 'medium' || (confidence === 'low' && reviewCount >= 5)) {
    return { label: 'Trusted status', current: reviewCount, target: 15 }
  }
  return { label: 'Verified status', current: reviewCount, target: 5 }
}

export default ProfileJitterCard
