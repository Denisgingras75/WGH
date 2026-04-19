import { memo, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocationContext } from '../../context/LocationContext'

var WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatDateline(now) {
  var d = now || new Date()
  var wk = WEEKDAYS[d.getDay()]
  var mo = MONTHS[d.getMonth()]
  var day = d.getDate()
  var yr = d.getFullYear()
  return wk + ' · ' + day + ' ' + mo + ' ' + yr + ' · MV EDITION'
}

export var Masthead = memo(function Masthead() {
  var { user } = useAuth()
  var { town } = useLocationContext()

  var dateline = useMemo(function () { return formatDateline() }, [])

  var initials = user && user.user_metadata && user.user_metadata.display_name
    ? String(user.user_metadata.display_name).charAt(0).toUpperCase()
    : (user && user.email ? String(user.email).charAt(0).toUpperCase() : null)

  var townLabel = town || 'All Island'

  return (
    <header
      style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
            }}
          >
            {dateline}
          </div>
          <h1
            style={{
              margin: '6px 0 8px',
              fontFamily: "'Amatic SC', cursive",
              fontWeight: 700,
              fontSize: 42,
              lineHeight: 1,
              letterSpacing: '0.02em',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            What's Good <span style={{ color: 'var(--color-primary)' }}>Here</span>
          </h1>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.3,
              color: 'var(--color-text-secondary)',
            }}
          >
            A local's guide to what to actually order.
          </div>
        </div>
        {initials ? (
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-card)',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Amatic SC', cursive",
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            {initials}
          </div>
        ) : null}
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span>{townLabel}</span>
          <span
            style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 10,
              fontWeight: 500,
              color: 'var(--color-text-tertiary)',
              letterSpacing: '0.05em',
            }}
          >
            · Martha's Vineyard
          </span>
        </span>
      </div>
    </header>
  )
})
