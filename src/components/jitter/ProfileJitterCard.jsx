import { useState } from 'react'

/**
 * Your Review Fingerprint — personal typing identity card.
 * Celebrates your unique typing rhythm. Every reviewer types differently
 * and that's what makes reviews trustworthy.
 */
export function ProfileJitterCard({ profile, user, userProfile, displayName, isPublic }) {
  const [expanded, setExpanded] = useState(false)

  if (!profile) return null

  const data = profile.profile_data || {}
  const hasPrivateData = !isPublic && Object.keys(data).length > 0
  const tierInfo = getTierInfo(profile.confidence_level, profile.consistency_score)
  const nextTier = isPublic ? null : getNextTier(profile.confidence_level, profile.review_count, profile.consistency_score)
  const name = displayName || userProfile?.display_name || ''
  const initial = name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-ink)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-hard)',
      }}
    >
      {/* Header — avatar left, identity right */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-on-primary)',
              border: 'var(--border-ink)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '20px',
            }}
          >
            {initial}
          </div>

          {/* Right side — title, tier, description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="eyebrow" style={{ color: 'var(--color-accent)' }}>
                Review Fingerprint
              </span>
              <span
                className="px-2 py-0.5 flex-shrink-0"
                style={{ background: tierInfo.bg, color: tierInfo.color, border: 'var(--border-ink-thin)', borderRadius: 'var(--radius-pill)', fontSize: '10.5px', fontWeight: 800 }}
              >
                {tierInfo.label}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.4 }}>
              {isPublic
                ? 'Every reviewer has a unique typing rhythm that verifies they\u2019re real.'
                : 'Your typing rhythm is unique — like a signature.'}
            </p>
          </div>
        </div>

        {/* Headline stats — friendly labels */}
        <div className={hasPrivateData ? 'grid grid-cols-3 gap-3 text-center mt-3' : 'grid grid-cols-2 gap-3 text-center mt-3'}>
          <StatCell label="Reviews" value={profile.review_count || 0} />
          <StatCell
            label="Rhythm"
            value={profile.consistency_score != null
              ? getRhythmLabel(Number(profile.consistency_score))
              : '\u2014'}
          />
          {hasPrivateData && (
            <StatCell label="Words typed" value={formatWordCount(data.total_keystrokes || 0)} />
          )}
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{nextTier.label}</span>
            <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 700 }}>{nextTier.current} of {nextTier.target}</span>
          </div>
          <div className="w-full overflow-hidden" style={{ height: '10px', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface)', border: 'var(--border-ink-thin)' }}>
            <div style={{ width: `${Math.min(100, (nextTier.current / nextTier.target) * 100)}%`, height: '100%', background: 'var(--color-butter)', borderRight: nextTier.current > 0 ? '1.5px solid var(--color-ink)' : 'none' }} />
          </div>
        </div>
      )}

      {/* Expand toggle — own profile only */}
      {hasPrivateData && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-center py-2.5 mt-1"
          style={{ color: 'var(--color-accent)', fontWeight: 700, borderTop: '1.5px solid var(--color-divider)' }}
        >
          {expanded ? 'Less detail \u25B2' : 'See your rhythm \u25BC'}
        </button>
      )}

      {/* Expanded details — own profile only */}
      {hasPrivateData && expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1.5px dashed var(--color-divider)' }}>
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
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
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
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500, lineHeight: 1.5 }}>
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
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--color-text-primary)' }}>{value}</div>
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

function KeyBar({ letter, ms, max }) {
  var width = max > 0 ? Math.max(20, (ms / max) * 100) : 50
  return (
    <div className="flex items-center gap-1" style={{ minWidth: '60px' }}>
      <span className="font-mono font-bold text-xs w-3 text-center" style={{ color: 'var(--color-text-primary)' }}>{letter}</span>
      <div className="flex-1 overflow-hidden" style={{ height: '8px', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface)', border: '1px solid var(--color-ink)' }}>
        <div style={{ width: width + '%', height: '100%', background: 'var(--color-accent)' }} />
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
  if (confidence === 'high' && consistency >= 0.6) return { label: 'Trusted', bg: 'rgba(var(--color-success-rgb), 0.16)', color: 'var(--color-rating)' }
  if (confidence === 'medium' && consistency >= 0.4) return { label: 'Verified', bg: 'rgba(var(--color-success-rgb), 0.10)', color: 'var(--color-rating)' }
  return { label: 'Building', bg: 'var(--color-surface)', color: 'var(--color-text-secondary)' }
}

function getNextTier(confidence, reviewCount, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return null
  if (confidence === 'medium' || (confidence === 'low' && reviewCount >= 5)) {
    return { label: 'Trusted status', current: reviewCount, target: 15 }
  }
  return { label: 'Verified status', current: reviewCount, target: 5 }
}

export default ProfileJitterCard
