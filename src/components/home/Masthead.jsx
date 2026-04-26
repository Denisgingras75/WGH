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
      style={{
        padding: '18px 20px 14px',
        background: 'var(--paper)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
            }}
          >
            {issueLine}
          </div>
          <h1
            className="serif"
            style={{
              margin: '4px 0 10px',
              fontWeight: 900,
              fontSize: 34,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              color: 'var(--ink)',
            }}
          >
            What's Good <span style={{ color: 'var(--tomato)' }}>Here</span>
          </h1>
          <div style={{ font: "500 12px/1.3 'Inter', system-ui, sans-serif", color: 'var(--ink-2)' }}>
            A local's guide to what to actually order.
          </div>
        </div>
        {initials && (
          <div className="avatar" title={auth.user?.email || ''} style={{ flexShrink: 0 }}>
            {initials}
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={onTownClick}
          disabled={!onTownClick}
          style={{
            border: 0,
            background: 'transparent',
            padding: 0,
            cursor: onTownClick ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            font: "600 12px/1 'Inter', system-ui, sans-serif",
            color: 'var(--ink)',
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
