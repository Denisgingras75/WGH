import { memo } from 'react'
import { useTheme, THEMES } from '../context/ThemeContext'

function ThemeCard({ theme, active, onClick }) {
  var swatch = theme.swatch
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="press"
      style={{
        border: active ? '2px solid var(--ink)' : '1px solid var(--rule)',
        borderRadius: 12,
        background: swatch[0],
        color: swatch[1],
        padding: '14px 14px 12px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 120,
      }}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: swatch[2] }} />
        <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: swatch[3] }} />
        <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: swatch[1], opacity: 0.5 }} />
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div className="serif" style={{ fontWeight: 900, fontSize: 20, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {theme.name}
        </div>
        <div className="mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, opacity: 0.7 }}>
          {theme.subtitle}
        </div>
      </div>
    </button>
  )
}

export var DesignStudio = memo(function DesignStudio() {
  var { theme, setTheme, studioOpen, closeStudio } = useTheme()

  if (!studioOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Design Studio — pick a theme"
      onClick={closeStudio}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,23,20,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 0,
        animation: 'fadeIn 180ms ease both',
      }}
    >
      <div
        onClick={function (e) { e.stopPropagation() }}
        style={{
          background: 'var(--paper)',
          color: 'var(--ink)',
          width: '100%',
          maxWidth: 560,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: '22px 20px calc(22px + env(safe-area-inset-bottom, 0px))',
          boxShadow: 'var(--shadow-ink)',
          animation: 'slideUp 240ms ease both',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
      >
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Design Studio
        </div>
        <h2 className="serif" style={{
          margin: '4px 0 4px',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 28,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          Pick a vibe
        </h2>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 16 }}>
          6 themes · shown on your profile &amp; lists. Change anytime from Profile.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {THEMES.map(function (t) {
            return (
              <ThemeCard
                key={t.id}
                theme={t}
                active={theme === t.id}
                onClick={function () { setTheme(t.id) }}
              />
            )
          })}
        </div>
        <button
          type="button"
          onClick={closeStudio}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '12px 16px',
            border: 0,
            borderRadius: 999,
            background: 'var(--ink)',
            color: 'var(--paper)',
            font: '600 13px/1 Inter, system-ui, sans-serif',
            letterSpacing: '0.02em',
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
})
