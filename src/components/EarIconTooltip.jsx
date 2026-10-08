import { useEffect, useState } from 'react'

export function EarIconTooltip({ visible, onDismiss }) {
  const [show, setShow] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(id)
    }
  }, [visible])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => handleDismiss(), 5000)
    return () => clearTimeout(timer)
  }, [visible])

  function handleDismiss() {
    setFading(true)
    setTimeout(() => {
      onDismiss()
    }, 250)
  }

  if (!visible) return null

  return (
    <div
      role="tooltip"
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
        className="absolute -top-[6px]"
        style={{
          right: 20,
          width: 12,
          height: 12,
          background: 'var(--color-card)',
          border: 'var(--border-default)',
          borderRight: 'none',
          borderBottom: 'none',
          borderTopLeftRadius: '2px',
          transform: 'rotate(45deg)',
        }}
      />
      <div
        className="px-3.5 py-2.5"
        style={{
          background: 'var(--color-card)',
          border: 'var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        <p
          className="text-[13px] leading-snug"
          style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
        >
          Tap to save dishes you hear about
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss()
          }}
          className="mt-1.5 text-xs"
          style={{ color: 'var(--color-accent)', fontWeight: 600 }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
