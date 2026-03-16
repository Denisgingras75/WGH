/**
 * Calculate "% Worth It" rating (reorder percentage)
 * @param {number} yesVotes - Number of "Would order again" votes
 * @param {number} totalVotes - Total number of votes
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentWorthIt(yesVotes, totalVotes) {
  if (totalVotes === 0) return 0
  return Math.round((yesVotes / totalVotes) * 100)
}

/**
 * Calculate Worth-It Score on 1-10 scale (derived from reorder %)
 * @param {number} reorderPercent - Percentage who would reorder (0-100)
 * @returns {number} Score on 1-10 scale
 */
export function calculateWorthItScore10(reorderPercent) {
  return reorderPercent / 10
}

/**
 * Format a score to one decimal place
 * @param {number} score - The score to format
 * @returns {string} Formatted score (e.g., "8.4", "9.0", "7.1")
 */
export function formatScore10(score) {
  if (score === null || score === undefined) return '—'
  return Number(score).toFixed(1)
}

/**
 * Get color for rating based on score
 * @param {number} rating - Rating on 1-10 scale
 * @returns {string} CSS color value
 */
export function getRatingColor(rating) {
  if (rating === null || rating === undefined) return 'var(--color-text-tertiary)'
  const score = Number(rating)
  if (score >= 8.0) return 'var(--color-green-deep)'
  if (score >= 6.0) return 'var(--color-amber)'
  return 'var(--color-red)'
}

/**
 * Get color for a percentage (0-100) with intensity gradient.
 * Higher values = deeper green. Lower values = deeper red. Middle = amber.
 * @param {number} pct - Percentage value (0-100)
 * @returns {string} Hex color
 */
export function getPercentColor(pct) {
  if (pct === null || pct === undefined) return '#999999'
  var p = Number(pct)
  if (p >= 80) {
    // Green tier: 80-100. Deeper green as it climbs.
    // 80% = #3AAE5C (lighter), 100% = #0F6B2E (deepest)
    var t = (p - 80) / 20
    var r = Math.round(58 - t * 43)
    var g = Math.round(174 - t * 67)
    var b = Math.round(92 - t * 46)
    return 'rgb(' + r + ',' + g + ',' + b + ')'
  }
  if (p >= 60) {
    // Amber tier: 60-79. Darker amber as it drops.
    // 79% = #D4A017 (lighter), 60% = #92600E (deepest)
    var t2 = (79 - p) / 19
    var r2 = Math.round(212 - t2 * 66)
    var g2 = Math.round(160 - t2 * 64)
    var b2 = Math.round(23 - t2 * 9)
    return 'rgb(' + r2 + ',' + g2 + ',' + b2 + ')'
  }
  // Red tier: 0-59. Deeper red as it drops.
  // 59% = #E05050 (lighter), 0% = #8B1A1A (deepest)
  var t3 = (59 - p) / 59
  var r3 = Math.round(224 - t3 * 85)
  var g3 = Math.round(80 - t3 * 54)
  var b3 = Math.round(80 - t3 * 54)
  return 'rgb(' + r3 + ',' + g3 + ',' + b3 + ')'
}

/**
 * Get Worth-It badge based on score and vote count
 * @param {number} worthItScore10 - Worth-It score on 1-10 scale
 * @param {number} totalVotes - Total number of votes
 * @returns {Object} { show: boolean, emoji: string, label: string }
 */
export function getWorthItBadge(worthItScore10, totalVotes) {
  // Not enough votes
  if (totalVotes < 10) {
    return {
      show: false,
      emoji: '📊',
      label: 'Not enough votes yet',
    }
  }

  // Determine emoji and label based on score
  if (worthItScore10 >= 9.5) {
    return { show: true, emoji: '🏆', label: 'The Best' }
  }
  if (worthItScore10 >= 9.0) {
    return { show: true, emoji: '⭐', label: 'Exceptional' }
  }
  if (worthItScore10 >= 8.5) {
    return { show: true, emoji: '🔥', label: 'Great Here' }
  }
  if (worthItScore10 >= 8.0) {
    return { show: true, emoji: '✅', label: 'Good Here' }
  }
  if (worthItScore10 >= 7.0) {
    return { show: true, emoji: '👍', label: 'Decent Here' }
  }
  if (worthItScore10 >= 6.0) {
    return { show: true, emoji: '😐', label: 'Not Bad' }
  }
  if (worthItScore10 >= 5.0) {
    return { show: true, emoji: '🤷', label: 'Iffy' }
  }
  return { show: true, emoji: '❌', label: 'Skip This' }
}

/**
 * Get confidence level based on vote count
 * @param {number} totalVotes - Total number of votes
 * @returns {'none' | 'low' | 'medium' | 'high'}
 */
export function getConfidenceLevel(totalVotes) {
  if (totalVotes === 0) return 'none'
  if (totalVotes < 10) return 'low'
  if (totalVotes < 20) return 'medium'
  return 'high'
}

/**
 * Get confidence indicator text and styling
 * @param {number} totalVotes - Total number of votes
 * @returns {Object} Confidence info object
 */
export function getConfidenceIndicator(totalVotes) {
  const level = getConfidenceLevel(totalVotes)

  const indicators = {
    none: {
      level: 'none',
      text: 'No votes yet — be the first!',
      icon: null,
      color: 'var(--color-text-tertiary)',
      style: { color: 'var(--color-text-tertiary)' },
    },
    low: {
      level: 'low',
      text: `Not enough votes yet (${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'})`,
      icon: '📊',
      color: 'var(--color-accent-gold)',
      style: { color: 'var(--color-accent-gold)', borderColor: 'var(--color-accent-gold)', background: 'color-mix(in srgb, var(--color-accent-gold) 10%, var(--color-bg))' },
    },
    medium: {
      level: 'medium',
      text: `${totalVotes} votes`,
      icon: null,
      color: 'var(--color-text-secondary)',
      style: { color: 'var(--color-text-secondary)' },
    },
    high: {
      level: 'high',
      text: `${totalVotes} votes`,
      icon: '✓',
      color: 'var(--color-rating)',
      style: { color: 'var(--color-rating)', borderColor: 'var(--color-rating)', background: 'color-mix(in srgb, var(--color-rating) 10%, var(--color-bg))' },
    },
  }

  return indicators[level]
}
