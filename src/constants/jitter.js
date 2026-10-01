/**
 * Consumer-facing legend for Jitter trust badges.
 * `type` matches TrustBadge's `type` prop and labels match its configs, so the
 * explainer sheet, /jitter and /how-reviews-work describe the badges users see.
 * Ordered as a progression: new → verified → trusted, then the AI-estimate badge.
 */
export var TRUST_BADGE_LEGEND = [
  {
    type: 'building',
    label: 'Building...',
    description: 'New reviewer (1–4 reviews), still building verification.',
  },
  {
    type: 'human_verified',
    label: 'Verified Human',
    description: 'Consistent typing pattern (5+ reviews).',
  },
  {
    type: 'trusted_reviewer',
    label: 'Trusted Reviewer',
    description: 'Highly consistent typing pattern (15+ reviews).',
  },
  {
    type: 'ai_estimated',
    label: 'AI Estimated',
    description: 'Estimated from Google reviews, not a local vote.',
  },
]
