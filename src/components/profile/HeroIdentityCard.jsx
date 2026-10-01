import { useState } from 'react'

/**
 * Hero Identity Card for the Profile page
 * Centered layout: avatar, name, stats row
 */
function getRhythmLabel(score) {
  if (score >= 0.8) return 'Steady'
  if (score >= 0.5) return 'Forming'
  return 'New'
}

function getTierInfo(confidence, consistency) {
  if (confidence === 'high' && consistency >= 0.6) return { label: 'Trusted', bg: 'rgba(34, 197, 94, 0.18)', color: 'var(--color-rating)' }
  if (confidence === 'medium' && consistency >= 0.4) return { label: 'Verified', bg: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-rating)' }
  return { label: 'Building', bg: 'rgba(156, 163, 175, 0.1)', color: 'var(--color-text-tertiary)' }
}

export function HeroIdentityCard({
  user,
  profile,
  stats,
  followCounts,
  editingName,
  newName,
  nameStatus,
  savingName = false,
  setEditingName,
  setNewName,
  setNameStatus,
  handleSaveName,
  setFollowListModal,
  jitterProfile,
}) {
  const [jitterExpanded, setJitterExpanded] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)
  const jitterData = jitterProfile?.profile_data || {}
  const hasJitterDetail = !!(jitterProfile && Object.keys(jitterData).length > 0)

  const trimmedLength = (newName || '').trim().length
  const nameTooShort = trimmedLength > 0 && trimmedLength < 2
  const saveDisabled = savingName || trimmedLength < 2 || nameStatus === 'taken' || nameStatus === 'checking'
  const nameStatusText = nameStatus === 'taken'
    ? 'Username taken'
    : nameStatus === 'available'
      ? 'Available'
      : nameTooShort
        ? 'At least 2 characters'
        : ''

  const cancelEdit = () => {
    setEditingName(false)
    setNewName(profile?.display_name || '')
    setNameStatus(null)
  }

  return (
    <div
      className="relative px-4 pt-8 pb-5 overflow-hidden"
      style={{
        background: 'var(--color-bg)',
      }}
    >
      {/* Bottom divider */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px"
        style={{
          width: '90%',
          background: 'linear-gradient(90deg, transparent, var(--color-divider), transparent)',
        }}
      />

      {/* Avatar + Name row */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            boxShadow: '0 0 0 3px var(--color-primary-muted)',
          }}
        >
          {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Display Name */}
          {editingName ? (
            <form
              className="flex flex-col gap-1"
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveName()
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      cancelEdit()
                    }
                  }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  aria-label="Display name"
                  aria-invalid={nameStatus === 'taken'}
                  aria-describedby="profile-name-status"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="off"
                  enterKeyHint="done"
                  className="w-full px-3 py-1.5 rounded-lg text-lg font-bold focus:outline-none pr-8"
                  style={{
                    background: 'var(--color-surface)',
                    border: '2px solid ' + (
                      nameStatus === 'taken'
                        ? 'var(--color-danger)'
                        : nameStatus === 'available'
                          ? 'var(--color-success)'
                          : nameFocused
                            ? 'var(--color-primary)'
                            : 'var(--color-divider)'
                    ),
                    color: 'var(--color-text-primary)'
                  }}
                  autoFocus
                  maxLength={30}
                />
                {nameStatus && nameStatus !== 'same' && (
                  <span aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                    {nameStatus === 'checking' && '⏳'}
                    {nameStatus === 'available' && '✓'}
                    {nameStatus === 'taken' && '✗'}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saveDisabled}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: saveDisabled && !savingName ? 'var(--color-surface)' : 'var(--color-primary)',
                    color: saveDisabled && !savingName ? 'var(--color-text-tertiary)' : 'var(--color-text-on-primary)',
                    opacity: savingName ? 0.7 : 1,
                  }}
                >
                  {savingName ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-divider)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Cancel
                </button>
              </div>
              {/* Always rendered so screen readers announce status changes */}
              <p
                id="profile-name-status"
                aria-live="polite"
                className="text-xs"
                style={{
                  color: nameStatus === 'taken'
                    ? 'var(--color-danger)'
                    : nameStatus === 'available'
                      ? 'var(--color-success)'
                      : 'var(--color-text-tertiary)',
                }}
              >
                {nameStatusText}
              </p>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              aria-label={profile?.display_name ? 'Edit display name, ' + profile.display_name : undefined}
              className="font-bold transition-colors inline-flex items-center gap-1.5 max-w-full min-w-0 min-h-[44px]"
              style={{
                color: 'var(--color-text-primary)',
                fontSize: '22px',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              }}
            >
              <span className="truncate">{profile?.display_name || 'Set your name'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}

          {/* Stats row — dishes · restaurants · followers */}
          <div className="flex items-center gap-x-2 flex-wrap" style={{ fontSize: '13px' }}>
            {stats.totalVotes > 0 && (
              <>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.totalVotes}</span>
                  {stats.totalVotes === 1 ? ' dish' : ' dishes'}
                </span>
                {stats.uniqueRestaurants > 0 && (
                  <>
                    <span aria-hidden="true" style={{ color: 'var(--color-text-tertiary)' }}>&middot;</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.uniqueRestaurants}</span>
                      {stats.uniqueRestaurants === 1 ? ' spot' : ' spots'}
                    </span>
                  </>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setFollowListModal('followers')}
              aria-label={followCounts.followers + (followCounts.followers === 1 ? ' follower' : ' followers')}
              className="inline-flex items-center min-h-[44px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {followCounts.followers}
              </span>
              {followCounts.followers === 1 ? ' follower' : ' followers'}
            </button>
            <button
              type="button"
              onClick={() => setFollowListModal('following')}
              aria-label={followCounts.following + ' following'}
              className="inline-flex items-center min-h-[44px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {followCounts.following}
              </span>
              {' following'}
            </button>
          </div>
        </div>

        {/* Compact Jitter Fingerprint — tap to expand */}
        {jitterProfile && (() => {
          const tier = getTierInfo(jitterProfile.confidence_level, jitterProfile.consistency_score)
          const JitterTag = hasJitterDetail ? 'button' : 'div'
          const interactiveProps = hasJitterDetail
            ? {
                type: 'button',
                onClick: () => setJitterExpanded(!jitterExpanded),
                'aria-expanded': jitterExpanded,
                'aria-controls': 'jitter-detail',
              }
            : {}
          return (
            <JitterTag
              {...interactiveProps}
              className="flex-shrink-0 rounded-xl px-3 py-2.5 text-center transition-all active:scale-95"
              style={{
                background: jitterExpanded ? tier.bg : 'var(--color-card)',
                border: '1px solid ' + (jitterExpanded ? tier.color : 'var(--color-divider)'),
                minWidth: '90px',
                cursor: hasJitterDetail ? 'pointer' : 'default',
              }}
            >
              <span
                className="px-2 py-0.5 rounded-full font-medium inline-block"
                style={{ background: tier.bg, color: tier.color, fontSize: '11px' }}
              >
                {tier.label}
              </span>
              <div className="mt-1.5">
                <div className="font-bold" style={{ color: 'var(--color-text-primary)', fontSize: '18px', lineHeight: 1 }}>
                  {jitterProfile.review_count || 0}
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 500, marginTop: '2px' }}>reviews</div>
              </div>
              <div className="mt-1">
                <div className="font-semibold" style={{ color: 'var(--color-accent-gold)', fontSize: '12px', lineHeight: 1 }}>
                  {jitterProfile.consistency_score != null
                    ? getRhythmLabel(Number(jitterProfile.consistency_score))
                    : '—'}
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', fontWeight: 500, marginTop: '2px' }}>rhythm</div>
              </div>
              {hasJitterDetail && (
                <div className="mt-1.5" style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontWeight: 600 }}>
                  {jitterExpanded ? '▲ less' : '▼ detail'}
                </div>
              )}
            </JitterTag>
          )
        })()}
      </div>

      {/* Expanded Jitter Detail Panel */}
      {jitterExpanded && hasJitterDetail && (
        <div
          id="jitter-detail"
          className="mt-3 rounded-xl overflow-hidden"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <div className="px-4 py-3 space-y-2">
            <DetailRow label="Typing pace" value={jitterData.mean_inter_key ? Math.round(jitterData.mean_inter_key) + 'ms between keys' : '—'} />
            <DetailRow label="Key press" value={jitterData.mean_dwell ? Math.round(jitterData.mean_dwell) + 'ms avg hold' : '—'} />
            <DetailRow label="Typo rate" value={jitterData.edit_ratio != null ? Math.round(jitterData.edit_ratio * 100) + '% corrections' : '—'} />
            {jitterProfile.created_at && (
              <DetailRow label="Reviewing since" value={new Date(jitterProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
            )}
          </div>

          {/* Per-key fingerprint visual */}
          {jitterData.per_key_dwell && Object.keys(jitterData.per_key_dwell).length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
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

          <div className="px-4 pb-3">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
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

export default HeroIdentityCard
