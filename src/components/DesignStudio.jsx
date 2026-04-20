import { memo, useEffect, useRef, useState } from 'react'
import { useTheme, THEMES, getTheme } from '../context/ThemeContext'

// Verbatim port of Claude Design reference's Design Studio
// (designs/Whats Good Here.html · lines 1381–1482).
// Uses .studio-* classes already in src/styles/claude-design.css.

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="m2 6 3 3 5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const DesignStudio = memo(function DesignStudio() {
  const { theme: currentTheme, setTheme, studioMode, closeStudio } = useTheme()
  const [selected, setSelected] = useState(currentTheme || 'paper')
  const sheetRef = useRef(null)
  const lastFocusRef = useRef(null)

  // Reset selection to current theme whenever studio opens
  useEffect(function () {
    if (studioMode) setSelected(currentTheme || 'paper')
  }, [studioMode, currentTheme])

  // Focus trap + restore + Escape (edit mode only) + body scroll lock
  useEffect(function () {
    if (!studioMode) return
    lastFocusRef.current = document.activeElement

    function onKey(e) {
      if (e.key === 'Escape') {
        if (studioMode === 'edit') {
          e.preventDefault()
          closeStudio()
        }
        // onboard mode: swallow Escape — user must pick
        return
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)

    const raf = requestAnimationFrame(function () {
      if (!sheetRef.current) return
      const active = sheetRef.current.querySelector('[aria-checked="true"]')
      if (active) active.focus()
      else sheetRef.current.querySelector('[role="radio"]')?.focus()
    })

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return function () {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
      document.body.style.overflow = prevOverflow
      const el = lastFocusRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [studioMode, closeStudio])

  if (!studioMode) return null

  const mode = studioMode // 'onboard' | 'edit'
  const t = getTheme(selected)

  function onOverlayClick() {
    if (mode === 'edit') closeStudio()
    // onboard: swallow backdrop — must pick
  }

  function onPick() {
    setTheme(selected)
    closeStudio()
  }

  return (
    <div className="studio-overlay" onClick={onOverlayClick} role="dialog" aria-modal="true" aria-label="Design Studio">
      <div
        ref={sheetRef}
        className="studio-sheet"
        data-theme={selected}
        onClick={function (e) { e.stopPropagation() }}
      >
        {/* ----- Live preview pane ----- */}
        <div className="studio-preview">
          <div className="studio-preview-inner">
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
              Vol. III · Preview
            </div>
            <div
              className="serif"
              style={{ fontWeight: 900, fontSize: 26, lineHeight: 1, letterSpacing: '-.02em', marginTop: 6, fontStyle: 'italic' }}
            >
              What&apos;s Good <span style={{ color: 'var(--tomato)' }}>Here</span>
            </div>
            <div
              style={{
                marginTop: 14,
                display: 'grid',
                gridTemplateColumns: '48px 1fr auto',
                gap: 12,
                alignItems: 'center',
                padding: '10px 12px',
                background: 'var(--card)',
                border: '1px solid var(--rule)',
                borderRadius: 10,
              }}
            >
              <div className="rank-num" style={{ fontSize: 32, fontStyle: 'italic', color: 'var(--tomato)', textAlign: 'center' }}>
                01
              </div>
              <div>
                <div className="serif" style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.15 }}>Lobster roll</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '.06em' }}>
                  NET&apos;S · 94% yes
                </div>
              </div>
              <span className="vote-pill yes" style={{ fontSize: 10, padding: '4px 8px' }}>Worth</span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="chip active">Lobster</span>
              <span className="chip">Burgers</span>
              <span className="chip">Pizza</span>
            </div>
          </div>
        </div>

        {/* ----- Chrome (header + grid + footer) ----- */}
        <div className="studio-chrome">
          <div className="studio-header">
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                {mode === 'onboard' ? 'Welcome — step 1 of 1' : 'Design studio'}
              </div>
              <h2
                className="serif"
                style={{ margin: '4px 0 0', fontWeight: 900, fontSize: 24, letterSpacing: '-.02em', fontStyle: 'italic', lineHeight: 1.1 }}
              >
                {mode === 'onboard' ? 'Make it yours.' : 'Your look'}
              </h2>
              <div style={{ font: '500 12px/1.35 Inter', color: 'var(--ink-2)', marginTop: 6, maxWidth: 320 }}>
                {mode === 'onboard'
                  ? 'Pick a vibe. You can change it any time from your profile — and friends see it when they visit your lists.'
                  : 'Changes apply everywhere. Friends see your theme on your profile and lists.'}
              </div>
            </div>
            {mode === 'edit' && (
              <button
                onClick={closeStudio}
                aria-label="Close Design Studio"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 22, padding: 6 }}
              >
                ×
              </button>
            )}
          </div>

          <div className="studio-grid" role="radiogroup" aria-label="Theme">
            {THEMES.map(function (th) {
              const isActive = th.id === selected
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={function () { setSelected(th.id) }}
                  className="studio-card press"
                  data-active={isActive}
                  role="radio"
                  aria-checked={isActive}
                  aria-label={`${th.name} — ${th.tag.toLowerCase()}`}
                >
                  <div className="studio-swatch" style={{ background: th.swatch[0] }}>
                    <div
                      style={{
                        fontFamily: th.font,
                        color: th.swatch[1],
                        fontSize: 22,
                        fontWeight: 800,
                        fontStyle: th.id === 'neon' ? 'italic' : 'normal',
                        textShadow: th.id === 'neon' ? `0 0 10px ${th.swatch[2]}` : 'none',
                        letterSpacing: th.id === 'paper' || th.id === 'dusk' ? '-.02em' : 0,
                      }}
                    >
                      Aa
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', gap: 4 }}>
                      <span style={{ flex: 1, height: 6, borderRadius: 3, background: th.swatch[2] }} />
                      <span style={{ flex: 1, height: 6, borderRadius: 3, background: th.swatch[3] }} />
                      <span style={{ flex: 1, height: 6, borderRadius: 3, background: th.swatch[1], opacity: 0.3 }} />
                    </div>
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          background: th.swatch[2],
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                  <div className="studio-meta">
                    <div style={{ font: '800 13px/1.1 Inter', letterSpacing: '-.005em' }}>{th.name}</div>
                    <div
                      className="mono"
                      style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 3 }}
                    >
                      {th.tag}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="studio-footer">
            <div style={{ font: '500 11px/1.3 Inter', color: 'var(--ink-3)', flex: 1, minWidth: 0 }}>
              <span style={{ color: 'var(--ink-2)' }}>Now showing:</span>{' '}
              <b style={{ color: 'var(--ink)' }}>{t.name}</b>
              <span className="mono" style={{ marginLeft: 8, fontSize: 10, color: 'var(--ink-3)' }}>· {t.tag}</span>
            </div>
            <button
              type="button"
              onClick={onPick}
              style={{
                border: 0,
                background: 'var(--ink)',
                color: 'var(--paper)',
                padding: '12px 20px',
                borderRadius: 999,
                font: '700 13px/1 Inter',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '.02em',
              }}
            >
              {mode === 'onboard' ? `Use ${t.name} →` : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
