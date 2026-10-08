/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * Calculate impact message based on before/after vote data.
 */
export function getImpactMessage(before, after, beforeRank, afterRank) {
  // Just became ranked (hit 5 votes)
  if (before.total_votes < 5 && after.total_votes >= 5) {
    return {
      message: "This dish is now ranked!",
      emoji: "🎉",
      type: "milestone"
    }
  }

  // Entered top 10
  if (beforeRank > 10 && afterRank <= 10) {
    return {
      message: "Just entered the Top 10!",
      emoji: "🏆",
      type: "milestone"
    }
  }

  // Moved up significantly (3+ spots)
  if (afterRank < beforeRank && beforeRank - afterRank >= 3) {
    return {
      message: `Moved up ${beforeRank - afterRank} spots!`,
      emoji: "🚀",
      type: "movement"
    }
  }

  // Moved up
  if (afterRank < beforeRank) {
    const spots = beforeRank - afterRank
    return {
      message: `Moved up ${spots} spot${spots > 1 ? 's' : ''}!`,
      emoji: "📈",
      type: "movement"
    }
  }

  // Still needs votes to qualify
  if (after.total_votes < 5) {
    const needed = 5 - after.total_votes
    return {
      message: `${needed} more rating${needed > 1 ? 's' : ''} to qualify`,
      emoji: '⭐',
      type: "progress"
    }
  }

  // Default for ranked dishes - show rating
  return {
    message: `Now rated ${after.avg_rating || '—'}`,
    emoji: "✓",
    type: "update"
  }
}

/**
 * Show impact feedback toast using Sonner
 * Beautiful toast with progress bar like PostHog
 */
export function showImpactToast(impact) {
  if (!impact) return

  const toastType = impact.type === 'milestone' ? 'success' : 'success'

  toast[toastType](
    <div className="flex items-center gap-3">
      <span
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl"
        style={{
          background: 'var(--color-category-strip)',
          border: 'var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {impact.emoji}
      </span>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2, color: 'var(--color-ink)' }}>
          {impact.message}
        </p>
        <p className="text-sm" style={{ fontWeight: 500, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Your rating made a difference!
        </p>
      </div>
    </div>,
    {
      duration: 4000,
    }
  )
}

/**
 * Legacy component for backward compatibility
 * Now uses Sonner under the hood
 */
export function ImpactFeedback({ impact, onClose }) {
  const shownRef = useRef(false)

  useEffect(() => {
    if (impact && !shownRef.current) {
      shownRef.current = true
      showImpactToast(impact)
      // Reset state after toast is shown
      setTimeout(() => {
        onClose?.()
        shownRef.current = false
      }, 100)
    }
  }, [impact, onClose])

  return null
}
