import { useState } from 'react'

/**
 * Full Jitter identity card for the user's profile page.
 * Shows all cumulative stats, per-key fingerprint, badge progress.
 */
export function ProfileJitterCard({ profile, warScore }) {
  const [expanded, setExpanded] = useState(false)

  if (!profile) return null

  const data = profile.profile_data || {}
  const badgeLabel = getBadgeLabel(profile.confidence_level, profile.consistency_score)
  const badgeColor = getBadgeColor(profile.confidence_level, profile.consistency_score)
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
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent-gold)' }}>
            Typing Identity
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: badgeColor.bg, color: badgeColor.text }}
          >
            {badgeLabel}
          </span>
        </div>

        {/* WAR hero stat */}
        {warScore != null && (
          <div className="text-center mb-4">
            <div
              className="text-3xl font-mono font-bold"
              style={{
                color: warScore >= 0.80
                  ? 'var(--color-rating)'
                  : warScore >= 0.50
                    ? 'var(--color-accent-orange)'
                    : 'var(--color-error, #ef4444)',
              }}
            >
              {Number(warScore).toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>WAR Score</div>
          </div>
        )}

        {/* Headline stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <StatCell label="Sessions" value={profile.review_count || 0} />
          <StatCell label="Consistency" value={profile.consistency_score != null ? Number(profile.consistency_score).toFixed(2) : '\u2014'} />
          <StatCell label="Keystrokes" value={formatNumber(data.total_keystrokes || 0)} />
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: 'var(--color-text-tertiary)' }}>{nextTier.label}</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>{nextTier.current}/{nextTier.target}</span>
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
        {expanded ? 'Hide deep stats \u25B2' : 'Show deep stats \u25BC'}
      </button>

      {/* Deep stats */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
          <div className="pt-3 space-y-2">
            <DetailRow label="Avg typing speed" value={`${data.mean_inter_key || '\u2014'}ms between keys`} />
            <DetailRow label="Avg key hold" value={`${data.mean_dwell || '\u2014'}ms`} />
            <DetailRow label="DD interval" value={`${data.mean_dd_time || '\u2014'}ms`} />
            <DetailRow label="Edit ratio" value={data.edit_ratio != null ? `${Math.round(data.edit_ratio * 100)}%` : '\u2014'} />
            <DetailRow label="Pause frequency" value={data.pause_freq != null ? `${data.pause_freq}/100ks` : '\u2014'} />
            {profile.created_at && (
              <DetailRow label="Member since" value={new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
            )}
          </div>

          {/* Per-key fingerprint */}
          {data.per_key_dwell && Object.keys(data.per_key_dwell).length > 0 && (
            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Key fingerprint</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(data.per_key_dwell)
                  .slice().sort(([, a], [, b]) => a - b)
                  .map(([key, ms]) => (
                    <KeyBar key={key} letter={key} ms={ms} max={getMaxDwell(data.per_key_dwell)} />
                  ))}
              </div>
            </div>
          )}
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
  const width = max > 0 ? Math.max(20, (ms / max) * 100) : 50
  return (
    <div className="flex items-center gap-1" style={{ minWidth: '60px' }}>
      <span className="font-mono font-bold text-xs w-3 text-center" style={{ color: 'var(--color-text-primary)' }}>{letter}</span>
      <div className="flex-1 overflow-hidden" style={{ height: '6px', borderRadius: '3px', background: 'var(--color-surface)' }}>
        <div style={{ width: `${width}%`, height: '100%', borderRadius: '3px', background: 'var(--color-accent-gold)' }} />
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)', minWidth: '32px', textAlign: 'right' }}>{Math.round(ms)}</span>
    </div>
  )
}

function getMaxDwell(perKeyDwell) {
  const values = Object.values(perKeyDwell)
  return values.length > 0 ? Math.max.apply(null, values) : 0
}

function getBadgeLabel(confidence, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return 'Trusted Reviewer'
  if (confidence === 'medium' && consistency >= 0.4) return 'Verified Human'
  if (confidence === 'low') return 'Building Verification'
  return 'New'
}

function getBadgeColor(confidence, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return { bg: 'rgba(34, 197, 94, 0.18)', text: 'var(--color-rating)' }
  if (confidence === 'medium' && consistency >= 0.4) return { bg: 'rgba(34, 197, 94, 0.12)', text: 'var(--color-rating)' }
  return { bg: 'rgba(156, 163, 175, 0.1)', text: 'var(--color-text-tertiary)' }
}

function getNextTier(confidence, reviewCount, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return null
  if (confidence === 'medium' || (confidence === 'low' && reviewCount >= 5)) {
    return { label: 'Next: Trusted Reviewer', current: reviewCount, target: 15 }
  }
  return { label: 'Next: Verified Human', current: reviewCount, target: 5 }
}

function formatNumber(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default ProfileJitterCard
