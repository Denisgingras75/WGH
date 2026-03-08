/**
 * Consumer-facing Jitter trust tiers.
 * Maps internal WAR scores to user-visible labels.
 * WAR is 0-1 internally (JitterBadge) but displayed as 0-10 in explainer.
 */

export var JITTER_TIERS = {
  trusted: {
    label: 'Trusted Reviewer',
    minWar: 0.80,
    color: 'var(--color-accent-gold)',
    bg: 'rgba(196, 138, 18, 0.12)',
    description: 'Months of consistent, verified human typing patterns.',
  },
  verified: {
    label: 'Verified',
    minWar: 0.40,
    color: 'var(--color-rating)',
    bg: 'rgba(22, 163, 74, 0.10)',
    description: 'Typing patterns confirmed as authentically human.',
  },
  new_reviewer: {
    label: 'New',
    minWar: 0,
    color: 'var(--color-text-tertiary)',
    bg: 'rgba(156, 163, 175, 0.12)',
    description: 'New reviewer — building verification over time.',
  },
}

/**
 * Resolve WAR score (0-1) to consumer tier key.
 * Returns null for suspicious scores (WAR < 0.20) — no badge shown.
 */
export function getConsumerTier(warScore) {
  if (warScore == null || warScore < 0.20) return null
  if (warScore >= 0.80) return 'trusted'
  if (warScore >= 0.40) return 'verified'
  return 'new_reviewer'
}
