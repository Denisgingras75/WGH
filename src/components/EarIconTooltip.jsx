import { useCallback, useEffect, useRef, useState } from 'react'

export function EarIconTooltip({ visible, onDismiss }) {
  const [show, setShow] = useState(false)
  const [fading, setFading] = useState(false)
  const fadeTimerRef = useRef(null)

  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(id)
    }
  }, [visible])

  // Parents pass an inline onDismiss; keep the latest in a ref so the
  // auto-dismiss timer below isn't restarted on every parent render.
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  const handleDismiss = useCallback(() => {
    setFading(true)
    clearTimeout(fadeTimerRef.current)
    fadeTimerRef.current = setTimeout(() => onDismissRef.current?.(), 250)
  }, [])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => handleDismiss(), 5000)
    return () => clearTimeout(timer)
  }, [visible, handleDismiss])

  // Never fire onDismiss after unmount
  useEffect(() => () => clearTimeout(fadeTimerRef.current), [])

  if (!visible) return null

  return (
    <div
      role="status"
      onClick={(e) => {
        e.stopPropagation()
        handleDismiss()
      }}
      className="absolute top-14 z-50"
      style={{
        right: -4,
        width: 190,
        opacity: show && !fading ? 1 : 0,
        transform: show && !fading ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
        pointerEvents: show && !fading ? 'auto' : 'none',
      }}
    >
      {/* Arrow pointing up toward the ear icon */}
      <div
        className="absolute -top-[5px]"
        style={{
          right: 20,
          width: 10,
          height: 10,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-divider)',
          borderRight: 'none',
          borderBottom: 'none',
          transform: 'rotate(45deg)',
        }}
      />
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-divider)',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 0 12px rgba(0, 0, 0, 0.04)',
        }}
      >
        <p
          className="text-[13px] font-medium leading-snug"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Tap to save dishes you hear about
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss()
          }}
          className="inline-flex items-center min-h-[44px] -my-2 text-xs font-semibold"
          style={{ color: 'var(--color-accent-gold)' }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
