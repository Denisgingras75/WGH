import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

function getInitials(user) {
  if (!user) return null
  const meta = user.user_metadata || {}
  const name = meta.full_name || meta.name || user.email || ''
  if (!name) return null
  const parts = String(name).split(/[\s@.]+/).filter(Boolean)
  if (parts.length === 0) return null
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatIssueLine(now) {
  var dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / 86400000,
  )
  var weekday = now.toLocaleString('en-US', { weekday: 'short' })
  var day = now.getDate()
  var month = now.toLocaleString('en-US', { month: 'long' })
  return 'Vol. III · No. ' + dayOfYear + ' · ' + weekday + ' ' + day + ' ' + month
}

export function Masthead({ town = "Martha's Vineyard", onTownClick }) {
  var auth = useAuth()
  var initials = getInitials(auth.user)
  var issueLine = useMemo(function () { return formatIssueLine(new Date()) }, [])

  return (
    <header
      className="hairline-b"
      style={{ padding: '20px 20px 16px', background: 'transparent' }}
    >
      {/* Kicker — hairline rules flank the issue line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
        <div className="t-mono-lg" style={{ whiteSpace: 'nowrap' }}>
          {issueLine}
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="t-display" style={{ margin: '0 0 8px' }}>
            What&apos;s Good <span style={{ color: 'var(--tomato)' }}>Here</span>
          </h1>
          <div className="t-body-sm">
            A local&apos;s guide to what to actually order.
          </div>
        </div>
        {initials && (
          <div className="avatar" title={auth.user?.email || ''} style={{ flexShrink: 0 }}>
            {initials}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onTownClick}
          disabled={!onTownClick}
          className="t-mono"
          style={{
            border: 0,
            background: 'transparent',
            padding: 0,
            cursor: onTownClick ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--ink)',
            letterSpacing: '0.16em',
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span>{town}</span>
        </button>
      </div>
    </header>
  )
}
