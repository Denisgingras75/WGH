import { useState } from 'react'

/**
 * Post-submission baseball card showing session + cumulative stats.
 * Headline stats (PPG/APG/RPG equivalent), expandable deep stats.
 */
export function SessionCard({ sessionStats, profileStats, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  if (!sessionStats) return null

  const badgeType = profileStats
    ? getBadgeLabel(profileStats.confidence_level, profileStats.consistency_score)
    : 'Building...'

  return (
    <div
      className="p-4 space-y-3"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="eyebrow" style={{ color: 'var(--color-accent)' }}>
          Session Stats
        </span>
        {onDismiss && (
          <button onClick={onDismiss} className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
            ✕
          </button>
        )}
      </div>

      {/* Headline stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox label="Purity" value={sessionStats.purity != null ? `${sessionStats.purity}%` : '\u2014'} />
        <StatBox
          label="Consistency"
          value={profileStats?.consistency_score != null ? Number(profileStats.consistency_score).toFixed(2) : '\u2014'}
        />
        <StatBox label="Sessions" value={profileStats?.review_count || 1} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox label="WPM" value={sessionStats.wpm || '\u2014'} />
        <StatBox label="Edit Ratio" value={`${sessionStats.editRatio || 0}%`} />
        <StatBox label="Trust" value={badgeType} highlight />
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-xs text-center py-1"
        style={{ color: 'var(--color-accent)', fontWeight: 700 }}
      >
        {expanded ? 'Hide details \u25B2' : 'Show details \u25BC'}
      </button>

      {/* Deep stats */}
      {expanded && (
        <div className="space-y-2 pt-3" style={{ borderTop: '1px dashed var(--color-divider-strong)' }}>
          <DetailRow label="Keystrokes" value={sessionStats.keystrokes} />
          <DetailRow label="Duration" value={`${Math.round(sessionStats.duration / 60)}m ${sessionStats.duration % 60}s`} />
          {profileStats?.profile_data && (
            <>
              <DetailRow label="Avg inter-key" value={`${profileStats.profile_data.mean_inter_key || '\u2014'}ms`} />
              <DetailRow label="Avg dwell" value={`${profileStats.profile_data.mean_dwell || '\u2014'}ms`} />
              <DetailRow label="DD time" value={`${profileStats.profile_data.mean_dd_time || '\u2014'}ms`} />
              <DetailRow label="Pause freq" value={`${profileStats.profile_data.pause_freq || '\u2014'}/100ks`} />
              <DetailRow label="Lifetime keystrokes" value={profileStats.profile_data.total_keystrokes || '\u2014'} />
              {profileStats.profile_data.per_key_dwell && (
                <div>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>Key fingerprint</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(profileStats.profile_data.per_key_dwell).map(([key, ms]) => (
                      <span
                        key={key}
                        className="px-1.5 py-0.5 text-xs font-mono"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)', borderRadius: '6px', color: 'var(--color-text-secondary)' }}
                      >
                        {key}:{Math.round(ms)}ms
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, highlight }) {
  return (
    <div className="py-1">
      <div
        style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.15, color: highlight ? 'var(--color-rating)' : 'var(--color-text-primary)' }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>{label}</span>
      <span className="font-mono" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function getBadgeLabel(confidence, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return 'Trusted'
  if (confidence === 'medium' && consistency >= 0.4) return 'Verified'
  return 'Building'
}

export default SessionCard
