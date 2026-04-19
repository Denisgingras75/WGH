import { memo, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocationContext } from '../../context/LocationContext'

var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// ISO week number (simple). Ed. No. scales with weeks since Jan 1, for editorial feel.
function isoWeek(d) {
  var target = new Date(d.valueOf())
  var dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  var firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000)
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s-7-6.5-7-12a7 7 0 1114 0c0 5.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

export var Masthead = memo(function Masthead({ voteCount, dishCount, onTownClick }) {
  var { user } = useAuth()
  var { town } = useLocationContext()

  var dateline = useMemo(function () {
    var d = new Date()
    var wk = WEEKDAYS[d.getDay()]
    var mo = MONTHS[d.getMonth()]
    var day = d.getDate()
    var yr = d.getFullYear()
    var ed = isoWeek(d)
    return 'Vol. ' + (yr - 2024) + ' · No. ' + ed + ' · ' + wk + ' ' + day + ' ' + mo
  }, [])

  var initials = useMemo(function () {
    if (!user) return 'WGH'
    var name = (user.user_metadata && user.user_metadata.display_name)
      ? String(user.user_metadata.display_name)
      : (user.email ? String(user.email) : '')
    if (!name) return 'WGH'
    var parts = name.split(/[\s@._-]+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }, [user])

  var townLabel = town || 'Edgartown'
  var stats = (typeof voteCount === 'number' && typeof dishCount === 'number')
    ? voteCount.toLocaleString() + ' votes · ' + dishCount + ' dishes'
    : null

  return (
    <header className="hairline-b" style={{ padding: '18px 20px 14px', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
            {dateline}
          </div>
          <h1 className="serif" style={{
            margin: '4px 0 10px',
            fontWeight: 900,
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: '-.02em',
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            color: 'var(--ink)',
          }}>
            What's Good <span style={{ color: 'var(--tomato)' }}>Here</span>
          </h1>
          <div style={{ font: "500 12px/1.3 Inter, system-ui, sans-serif", color: 'var(--ink-2)' }}>
            A local's guide to what to actually order.
          </div>
        </div>
        <div className="avatar" title={user ? 'Signed in' : 'Guest'} style={{ flexShrink: 0 }}>{initials}</div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onTownClick}
          disabled={!onTownClick}
          style={{
            border: 0, background: 'transparent', padding: 0,
            cursor: onTownClick ? 'pointer' : 'default',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            font: "600 12px/1 Inter, system-ui, sans-serif",
            color: 'var(--ink)',
          }}
        >
          <PinIcon />
          <span>{townLabel}</span>
          <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>· Martha's Vineyard</span>
        </button>
        {stats ? (
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{stats}</div>
        ) : null}
      </div>
    </header>
  )
})
