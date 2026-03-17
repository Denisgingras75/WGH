import { useState, useEffect } from 'react'
import { WghLogo } from './WghLogo'

// Module-level flag - persists across re-renders, resets on app reload
let hasShownThisSession = false

export function WelcomeSplash({ onComplete }) {
  const [phase, setPhase] = useState('pre-entry')
  const [shouldShow, setShouldShow] = useState(() => !hasShownThisSession)

  useEffect(() => {
    // Already shown this session, skip
    if (hasShownThisSession) {
      onComplete?.()
      return
    }

    hasShownThisSession = true
    const timers = []

    // Animation timeline: fade in (300ms) → hold (1.9s) → fade out (300ms) = 2.5s total
    timers.push(setTimeout(() => setPhase('visible'), 50))       // Start fade in
    timers.push(setTimeout(() => setPhase('fade-out'), 2200))    // Start fade out
    timers.push(setTimeout(() => {
      setShouldShow(false)
      onComplete?.()
    }, 2500))

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  const handleSkip = () => {
    if (phase !== 'pre-entry' && phase !== 'fade-out') {
      hasShownThisSession = true
      setShouldShow(false)
      onComplete?.()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSkip()
    }
  }

  if (!shouldShow) return null

  const isVisible = phase !== 'pre-entry'
  const isFadingOut = phase === 'fade-out'

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center cursor-pointer"
      style={{
        background: 'var(--color-primary)',
        opacity: isFadingOut ? 0 : isVisible ? 1 : 0,
        transition: isFadingOut ? 'opacity 300ms ease-out' : 'opacity 300ms ease-in',
        pointerEvents: (isFadingOut || !isVisible) ? 'none' : 'auto',
      }}
      onClick={handleSkip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Welcome splash screen. Press Enter or tap to skip."
    >
      <div
        className="flex items-center gap-3"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 300ms ease-out, transform 300ms ease-out',
        }}
      >
        {/* White on brand coral — intentional, not theme-dependent */}
        <WghLogo size={52} color="#FFFFFF" />
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '36px',
            fontWeight: 700,
            color: 'var(--color-text-on-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          What's Good Here
        </h1>
      </div>
    </div>
  )
}
