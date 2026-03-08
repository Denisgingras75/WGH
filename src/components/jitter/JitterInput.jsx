import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { usePurityTracker } from '../../hooks/usePurityTracker'
import { SessionBadge } from './SessionBadge'

/**
 * Self-contained typing biometrics input.
 * Wraps a textarea, captures keystroke dynamics, exposes session stats.
 * Zero WGH-specific dependencies — ready for standalone extraction.
 *
 * Ref methods:
 *   ref.current.getPurity()        — purity snapshot
 *   ref.current.getJitterProfile() — full biometric profile for submission
 *   ref.current.getSessionStats()  — lightweight live stats
 *   ref.current.reset()            — reset tracking data
 */
export const JitterInput = forwardRef(function JitterInput({
  value,
  onChange,
  onStatsUpdate,
  showBadge = true,
  placeholder,
  maxLength,
  rows = 1,
  onFocus,
  id,
  className = '',
  style = {},
  ariaLabel,
  ariaDescribedby,
  ariaInvalid,
}, ref) {
  const { getPurity, getJitterProfile, getSessionStats, attachToTextarea, reset } = usePurityTracker()
  const [liveStats, setLiveStats] = useState(null)

  // Expose biometric methods to parent via ref
  useImperativeHandle(ref, () => ({
    getPurity,
    getJitterProfile,
    getSessionStats,
    reset,
  }), [getPurity, getJitterProfile, getSessionStats, reset])

  // Poll session stats for live badge display
  useEffect(() => {
    if (!showBadge && !onStatsUpdate) return

    const interval = setInterval(() => {
      const stats = getSessionStats()
      setLiveStats(stats)
      if (onStatsUpdate) onStatsUpdate(stats)
    }, 500)

    return () => clearInterval(interval)
  }, [showBadge, onStatsUpdate, getSessionStats])

  // Textarea ref callback
  const setTextareaRef = useCallback((el) => {
    attachToTextarea(el)
  }, [attachToTextarea])

  return (
    <div>
      <textarea
        ref={setTextareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        maxLength={maxLength}
        rows={rows}
        className={`w-full p-4 rounded-xl text-sm resize-none focus:outline-none ${className}`}
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-divider)',
          color: 'var(--color-text-primary)',
          ...style,
        }}
      />
      {showBadge && <SessionBadge stats={liveStats} />}
    </div>
  )
})

export default JitterInput
