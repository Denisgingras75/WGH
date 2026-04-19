import { memo } from 'react'
import { useTheme } from '../../context/ThemeContext'

/**
 * Editorial Profile header — Claude Design prototype `ProfilePage` pattern.
 * Identity card + Design-your-feed CTA + 4-up stat ledger.
 *
 * Props:
 *   profile        — WGH profile row (display_name, created_at, etc.)
 *   user           — Supabase auth user
 *   stats          — useUserVotes stats
 *   ratedCount     — number of tried dishes
 *   favoritesCount — number of "to try" (favorites)
 *   playlistsCount — number of lists
 *   followersCount — follower count
 */

function Stat({ n, label, delta, tint, divider }) {
  return (
    <div style={{
      padding: '14px 10px 12px',
      borderLeft: divider ? '1px solid var(--rule)' : 'none',
      textAlign: 'center',
      minWidth: 0,
    }}>
      <div className="rank-num" style={{
        fontSize: 32,
        lineHeight: 1,
        color: tint || 'var(--ink)',
        fontStyle: 'italic',
      }}>
        {n}
      </div>
      <div style={{
        font: "600 11px/1.1 Inter, system-ui, sans-serif",
        color: 'var(--ink-2)',
        marginTop: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {label}
      </div>
      {delta ? (
        <div className="mono" style={{
          fontSize: 9,
          color: 'var(--ink-3)',
          marginTop: 3,
          letterSpacing: '0.05em',
        }}>
          {delta}
        </div>
      ) : null}
    </div>
  )
}

export var ProfileEditorialHeader = memo(function ProfileEditorialHeader({
  profile,
  user,
  stats,
  ratedCount,
  favoritesCount,
  playlistsCount,
  followersCount,
}) {
  var { openStudio, theme } = useTheme()

  var displayName = (profile && profile.display_name)
    || (user && user.email && user.email.split('@')[0])
    || 'You'

  var initials = (function () {
    var name = displayName || ''
    var parts = name.split(/[\s@._-]+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    return (parts[0] || 'U').charAt(0).toUpperCase()
  })()

  var memberYear = (function () {
    var d = (profile && profile.created_at) || (user && user.created_at)
    if (!d) return null
    try { return "'" + String(new Date(d).getFullYear()).slice(-2) } catch (_e) { return null }
  })()

  var voteCount = (stats && stats.totalVotes) || 0
  var tried = ratedCount != null ? ratedCount : voteCount
  var toTry = favoritesCount != null ? favoritesCount : 0
  var lists = playlistsCount != null ? playlistsCount : 0
  var followers = followersCount != null ? followersCount : 0

  return (
    <>
      {/* Identity card */}
      <div style={{ padding: '20px 20px 10px', display: 'flex', gap: 14, alignItems: 'center' }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em', lineHeight: 1.1, color: 'var(--ink)' }}>
            {displayName}
          </div>
          <div style={{ font: "500 12px/1 Inter, system-ui, sans-serif", color: 'var(--ink-2)', marginTop: 4 }}>
            {memberYear ? 'Member since ' + memberYear : 'Welcome'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {stats && stats.ratingStyle ? (
              <span className="chip">{stats.ratingStyle.label}</span>
            ) : null}
            <button
              type="button"
              onClick={openStudio}
              className="chip"
              style={{ cursor: 'pointer', borderStyle: 'solid', fontWeight: 700 }}
            >
              🎨 <span style={{ marginLeft: 4, textTransform: 'capitalize' }}>{theme}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Design your feed CTA */}
      <div style={{ padding: '0 20px 14px' }}>
        <button
          type="button"
          onClick={openStudio}
          className="press"
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 14,
            alignItems: 'center',
            padding: '14px 16px',
            border: '1px solid var(--rule)',
            borderRadius: 14,
            background: 'var(--card)',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'inherit',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--tomato), var(--ochre))',
            color: 'var(--paper)', fontSize: 22,
          }}>
            🎨
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="serif" style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.005em', lineHeight: 1.15, color: 'var(--ink)' }}>
              Design your feed
            </div>
            <div style={{ font: "500 12px/1.3 Inter, system-ui, sans-serif", color: 'var(--ink-2)', marginTop: 2 }}>
              6 themes · shown on your profile &amp; lists
            </div>
          </div>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
            {theme}
          </span>
        </button>
      </div>

      {/* Stat ledger — 4-up editorial numerals */}
      <div style={{ padding: '4px 20px 18px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
          border: '1px solid var(--rule)',
          borderRadius: 12,
          background: 'var(--card)',
          overflow: 'hidden',
        }}>
          <Stat n={voteCount} label="Votes" tint="var(--tomato)" delta={followers > 0 ? followers + ' foll.' : null} />
          <Stat n={tried} label="Tried" tint="var(--ink)" divider />
          <Stat n={toTry} label="To try" tint="var(--ochre)" divider />
          <Stat n={lists} label="Lists" tint="var(--moss)" divider />
        </div>
      </div>

      <div className="hairline-b" style={{ margin: '0 20px' }} />
    </>
  )
})
