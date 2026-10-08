import { useState } from 'react'

/**
 * Hero Identity Card for the Profile page
 * Centered layout: avatar, name, stats row
 */
var STAT_NUM = { fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }

function getRhythmLabel(score) {
  if (score >= 0.8) return 'Steady'
  if (score >= 0.5) return 'Forming'
  return 'New'
}

function getTierInfo(confidence, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return { label: 'Trusted', bg: 'rgba(var(--color-success-rgb), 0.16)', color: 'var(--color-rating)' }
  if (confidence === 'medium' && consistency >= 0.4) return { label: 'Verified', bg: 'rgba(var(--color-success-rgb), 0.10)', color: 'var(--color-rating)' }
  return { label: 'Building', bg: 'var(--color-surface)', color: 'var(--color-text-secondary)' }
}

export function HeroIdentityCard({
  user,
  profile,
  stats,
  followCounts,
  editingName,
  newName,
  nameStatus,
  setEditingName,
  setNewName,
  setNameStatus,
  handleSaveName,
  setFollowListModal,
  jitterProfile,
}) {
  const [jitterExpanded, setJitterExpanded] = useState(false)
  const jitterData = jitterProfile?.profile_data || {}
  const hasJitterDetail = !!(jitterProfile && Object.keys(jitterData).length > 0)

  return (
    <div
      className="relative px-4 pt-6 pb-5"
      style={{
        background: 'var(--color-bg)',
        borderBottom: 'var(--border-ink)',
      }}
    >
      {/* Avatar + Name row */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            border: 'var(--border-ink)',
            boxShadow: 'var(--shadow-hard)',
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Display Name */}
          {editingName ? (
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.replace(/\s/g, ''))}
                  className="w-full px-3 py-1.5 focus:outline-none pr-8"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    border: '2px solid ' + (nameStatus === 'taken' ? 'var(--color-danger)' : nameStatus === 'available' ? 'var(--color-success)' : 'var(--color-ink)'),
                    borderRadius: 'var(--radius-md)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)'
                  }}
                  autoFocus
                  maxLength={30}
                />
                {nameStatus && nameStatus !== 'same' && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                    {nameStatus === 'checking' && '\u23F3'}
                    {nameStatus === 'available' && '\u2713'}
                    {nameStatus === 'taken' && '\u2717'}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={nameStatus === 'taken' || nameStatus === 'checking'}
                  className="btn-ink px-3 py-1 text-sm"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', boxShadow: 'var(--shadow-hard-sm)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setNewName(profile?.display_name || '')
                    setNameStatus(null)
                  }}
                  className="btn-ink px-3 py-1 text-sm"
                  style={{ background: 'var(--color-card)', color: 'var(--color-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
                >
                  Cancel
                </button>
              </div>
              {nameStatus === 'taken' && (
                <p className="text-xs" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>Username taken</p>
              )}
              {nameStatus === 'available' && (
                <p className="text-xs" style={{ color: 'var(--color-success)', fontWeight: 700 }}>Available!</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="inline-flex items-center gap-1.5 text-left"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontSize: '27px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: '1.1',
              }}
            >
              {profile?.display_name || 'Set your name'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}

          {/* Stats row — dishes · restaurants · followers */}
          <div className="flex items-baseline gap-x-2.5 gap-y-1 mt-1.5 flex-wrap" style={{ fontSize: '13px', fontWeight: 600 }}>
            {stats.totalVotes > 0 && (
              <>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <span style={STAT_NUM}>{stats.totalVotes}</span> dishes
                </span>
                {stats.uniqueRestaurants > 0 && (
                  <>
                    <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 800 }}>&middot;</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      <span style={STAT_NUM}>{stats.uniqueRestaurants}</span> spots
                    </span>
                  </>
                )}
              </>
            )}
            <button
              onClick={() => setFollowListModal('followers')}
              className="hover:underline"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span style={STAT_NUM}>
                {followCounts.followers}
              </span> followers
            </button>
            <button
              onClick={() => setFollowListModal('following')}
              className="hover:underline"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span style={STAT_NUM}>
                {followCounts.following}
              </span> following
            </button>
          </div>
        </div>

        {/* Compact Jitter Fingerprint — tap to expand */}
        {jitterProfile && (() => {
          const tier = getTierInfo(jitterProfile.confidence_level, jitterProfile.consistency_score)
          return (
            <button
              onClick={hasJitterDetail ? () => setJitterExpanded(!jitterExpanded) : undefined}
              className={'flex-shrink-0 px-3 py-2.5 text-center' + (hasJitterDetail ? ' sticker-press' : '')}
              style={{
                background: jitterExpanded ? 'var(--color-butter-muted)' : 'var(--color-card)',
                border: 'var(--border-ink)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-hard-sm)',
                minWidth: '90px',
                cursor: hasJitterDetail ? 'pointer' : 'default',
              }}
            >
              <span
                className="px-2 py-0.5 inline-block"
                style={{ background: tier.bg, color: tier.color, border: 'var(--border-ink-thin)', borderRadius: 'var(--radius-pill)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.02em' }}
              >
                {tier.label}
              </span>
              <div className="mt-1.5">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1 }}>
                  {jitterProfile.review_count || 0}
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>reviews</div>
              </div>
              <div className="mt-1">
                <div style={{ color: 'var(--color-accent)', fontSize: '12px', fontWeight: 800, lineHeight: 1 }}>
                  {jitterProfile.consistency_score != null
                    ? getRhythmLabel(Number(jitterProfile.consistency_score))
                    : '\u2014'}
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>rhythm</div>
              </div>
              {hasJitterDetail && (
                <div className="mt-1.5" style={{ color: 'var(--color-accent)', fontSize: '10px', fontWeight: 700 }}>
                  {jitterExpanded ? '\u25B2 less' : '\u25BC detail'}
                </div>
              )}
            </button>
          )
        })()}
      </div>

      {/* Expanded Jitter Detail Panel */}
      {jitterExpanded && hasJitterDetail && (
        <div
          className="mt-4 overflow-hidden"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-ink)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="px-4 py-3 space-y-2">
            <DetailRow label="Typing pace" value={jitterData.mean_inter_key ? Math.round(jitterData.mean_inter_key) + 'ms between keys' : '\u2014'} />
            <DetailRow label="Key press" value={jitterData.mean_dwell ? Math.round(jitterData.mean_dwell) + 'ms avg hold' : '\u2014'} />
            <DetailRow label="Typo rate" value={jitterData.edit_ratio != null ? Math.round(jitterData.edit_ratio * 100) + '% corrections' : '\u2014'} />
            {jitterProfile.created_at && (
              <DetailRow label="Reviewing since" value={new Date(jitterProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
            )}
          </div>

          {/* Per-key fingerprint visual */}
          {jitterData.per_key_dwell && Object.keys(jitterData.per_key_dwell).length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                How long you hold each key
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(jitterData.per_key_dwell)
                  .slice().sort(function (a, b) { return a[1] - b[1] })
                  .map(function (entry) {
                    var maxVal = getMaxDwell(jitterData.per_key_dwell)
                    return <KeyBar key={entry[0]} letter={entry[0]} ms={entry[1]} max={maxVal} />
                  })}
              </div>
            </div>
          )}

          <div className="px-4 py-3" style={{ borderTop: '1.5px dashed var(--color-divider)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontWeight: 500, lineHeight: 1.5 }}>
              Your typing rhythm builds over time as you write reviews. No two people type alike.
            </p>
          </div>
        </div>
      )}
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

export default HeroIdentityCard
