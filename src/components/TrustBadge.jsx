import { useState } from 'react'

/**
 * Displays trust indicators on reviews and profiles.
 * Optional popover shows cumulative stats when profileData is provided.
 *
 * Types:
 * - 'human_verified': Green check — reviewer has consistent jitter profile (5+ reviews)
 * - 'trusted_reviewer': Solid green — high-confidence jitter (15+ reviews)
 * - 'ai_estimated': Blue info — AI-estimated from Google reviews
 * - 'building': Gray — new reviewer, building verification
 * - null: No badge shown
 */
export function TrustBadge({ type, size = 'sm', profileData, warScore }) {
  const [showPopover, setShowPopover] = useState(false)

  // WAR score mode — overrides type-based badge
  if (warScore != null) {
    const war = getWarConfig(warScore)
    const hasPopover = profileData != null

    return (
      <span
        className="inline-flex items-center gap-1 rounded-full flex-shrink-0 relative"
        style={{
          padding: '2px 8px',
          background: war.bg,
          color: war.color,
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 600,
          cursor: hasPopover ? 'pointer' : 'default',
          lineHeight: 1.4,
        }}
        title={war.label + ' \u00B7 WAR ' + warScore.toFixed(2)}
        onClick={() => hasPopover && setShowPopover(!showPopover)}
        onMouseEnter={() => hasPopover && setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
      >
        <span>{war.icon}</span>
        <span>{war.label} {'\u00B7'} {warScore.toFixed(2)}</span>

        {showPopover && profileData && (
          <WarPopover profileData={profileData} warScore={warScore} warConfig={war} />
        )}
      </span>
    )
  }

  if (!type) return null

  const configs = {
    human_verified: {
      label: 'Verified Human',
      color: 'var(--color-rating)',
      bg: 'rgba(34, 197, 94, 0.15)',
    },
    trusted_reviewer: {
      label: 'Trusted Reviewer',
      color: 'var(--color-rating)',
      bg: 'rgba(34, 197, 94, 0.22)',
    },
    ai_estimated: {
      label: 'AI Estimated',
      color: 'var(--color-blue, #3b82f6)',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    building: {
      label: 'Building...',
      color: 'var(--color-text-tertiary)',
      bg: 'rgba(156, 163, 175, 0.12)',
    },
  }

  const config = configs[type]
  if (!config) return null

  const dim = size === 'sm' ? 16 : 20
  const iconSize = size === 'sm' ? 10 : 12
  const isTrusted = type === 'trusted_reviewer'

  return (
    <span
      className="inline-flex items-center justify-center rounded-full flex-shrink-0 relative"
      style={{
        width: dim,
        height: dim,
        background: isTrusted ? config.color : config.bg,
        cursor: profileData ? 'pointer' : 'default',
      }}
      title={config.label}
      onClick={() => profileData && setShowPopover(!showPopover)}
      onMouseEnter={() => profileData && setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      {(type === 'human_verified' || type === 'trusted_reviewer') && (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke={isTrusted ? 'white' : config.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {type === 'ai_estimated' && (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="7" r="1.5" fill={config.color} />
          <rect x="10.5" y="11" width="3" height="7" rx="1" fill={config.color} />
        </svg>
      )}
      {type === 'building' && (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke={config.color} strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      )}

      {showPopover && profileData && (
        <span
          className="absolute left-0 top-full mt-1 p-3 rounded-lg shadow-lg z-50"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-divider)',
            minWidth: '160px',
            fontSize: '11px',
            display: 'block',
          }}
        >
          <span className="block space-y-1.5">
            {profileData.review_count != null && (
              <PopoverRow label="Verified sessions" value={profileData.review_count} />
            )}
            {profileData.consistency_score != null && (
              <PopoverRow label="Consistency" value={Number(profileData.consistency_score).toFixed(2)} />
            )}
            {profileData.created_at && (
              <PopoverRow label="Member since" value={formatMemberSince(profileData.created_at)} />
            )}
            <PopoverRow label="Trust level" value={config.label} />
          </span>
        </span>
      )}
    </span>
  )
}

function getWarConfig(warScore) {
  if (warScore >= 0.80) {
    return {
      label: 'Verified',
      color: 'var(--color-rating)',
      bg: 'rgba(34, 197, 94, 0.15)',
      icon: '\u2713',
    }
  }
  if (warScore >= 0.50) {
    return {
      label: 'Suspicious',
      color: 'var(--color-accent-orange)',
      bg: 'rgba(245, 158, 11, 0.12)',
      icon: '\u26A0',
    }
  }
  return {
    label: 'Bot',
    color: 'var(--color-error, #ef4444)',
    bg: 'rgba(239, 68, 68, 0.12)',
    icon: '\u2716',
  }
}

function WarPopover({ profileData, warScore, warConfig }) {
  return (
    <span
      className="absolute left-0 top-full mt-1 p-3 rounded-lg shadow-lg z-50"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-divider)',
        minWidth: '180px',
        fontSize: '11px',
        display: 'block',
      }}
    >
      <span className="block space-y-1.5">
        {profileData.review_count != null && (
          <PopoverRow label="Reviews" value={profileData.review_count} />
        )}
        {profileData.consistency_score != null && (
          <PopoverRow label="Consistency" value={Number(profileData.consistency_score).toFixed(2)} />
        )}
        <PopoverRow label="WAR" value={warScore.toFixed(2)} />
        <PopoverRow label="Classification" value={warConfig.label} />
      </span>
    </span>
  )
}

function PopoverRow({ label, value }) {
  return (
    <span className="flex justify-between gap-3" style={{ display: 'flex' }}>
      <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </span>
  )
}

function formatMemberSince(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Review trust summary for restaurant pages.
 * Shows "12 verified reviews, 8 AI-estimated"
 */
export function TrustSummary({ verifiedCount, aiCount }) {
  if (!verifiedCount && !aiCount) return null

  return (
    <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '12px' }}>
      {verifiedCount > 0 && (
        <span className="flex items-center gap-1" style={{ color: 'var(--color-rating)' }}>
          <span>{'\u2713'}</span>
          <span>{verifiedCount} verified review{verifiedCount !== 1 ? 's' : ''}</span>
        </span>
      )}
      {aiCount > 0 && (
        <span className="flex items-center gap-1" style={{ color: 'var(--color-blue)' }}>
          <span>{'\u2139'}</span>
          <span>{aiCount} AI-estimated</span>
        </span>
      )}
    </div>
  )
}
