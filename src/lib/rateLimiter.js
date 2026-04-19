/**
 * Client-side rate limiter to prevent abuse
 * Tracks actions in memory and blocks if limits are exceeded
 */

const actionTimestamps = {}

/**
 * Check if an action is allowed based on rate limits
 * @param {string} action - Action identifier (e.g., 'vote', 'photo-upload')
 * @param {Object} options - Rate limit options
 * @param {number} options.maxAttempts - Max attempts allowed in the window
 * @param {number} options.windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, retryAfterMs: number | null }
 */
export function checkRateLimit(action, { maxAttempts = 10, windowMs = 60000 } = {}) {
  const now = Date.now()
  const key = action

  // Initialize if needed
  if (!actionTimestamps[key]) {
    actionTimestamps[key] = []
  }

  // Remove timestamps outside the window
  actionTimestamps[key] = actionTimestamps[key].filter(
    (timestamp) => now - timestamp < windowMs
  )

  // Check if limit exceeded
  if (actionTimestamps[key].length >= maxAttempts) {
    const oldestTimestamp = actionTimestamps[key][0]
    const retryAfterMs = windowMs - (now - oldestTimestamp)
    return {
      allowed: false,
      retryAfterMs,
      message: `Too many attempts. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
    }
  }

  // Record this attempt
  actionTimestamps[key].push(now)

  return { allowed: true, retryAfterMs: null }
}

/**
 * Rate limit presets for different actions
 */
export const RATE_LIMITS = {
  vote: { maxAttempts: 10, windowMs: 60000 },       // 10 votes per minute
  photoUpload: { maxAttempts: 5, windowMs: 60000 }, // 5 uploads per minute
  search: { maxAttempts: 30, windowMs: 60000 },     // 30 searches per minute
  auth: { maxAttempts: 5, windowMs: 300000 },       // 5 auth attempts per 5 minutes
  dishCreate: { maxAttempts: 20, windowMs: 3600000 },       // 20 dishes per hour
  restaurantCreate: { maxAttempts: 5, windowMs: 3600000 },  // 5 restaurants per hour
  playlistCreate: { maxAttempts: 5, windowMs: 3600000 },    // 5 playlists per hour
  playlistItemAdd: { maxAttempts: 60, windowMs: 3600000 },  // 60 dish adds per hour
  playlistFollow: { maxAttempts: 120, windowMs: 3600000 },  // 120 follows per hour
}

/**
 * Convenience function to check vote rate limit
 */
export function checkVoteRateLimit() {
  return checkRateLimit('vote', RATE_LIMITS.vote)
}

/**
 * Convenience function to check photo upload rate limit
 */
export function checkPhotoUploadRateLimit() {
  return checkRateLimit('photo-upload', RATE_LIMITS.photoUpload)
}

/**
 * Convenience function to check dish creation rate limit
 */
export function checkDishCreateRateLimit() {
  return checkRateLimit('dish_create', RATE_LIMITS.dishCreate)
}

/**
 * Convenience function to check restaurant creation rate limit
 */
export function checkRestaurantCreateRateLimit() {
  return checkRateLimit('restaurant_create', RATE_LIMITS.restaurantCreate)
}

/**
 * Convenience functions for playlist actions. Belt-and-suspenders layer
 * alongside the DB hard-cap triggers — catches accidental client loops
 * before they hit the network.
 */
export function checkPlaylistCreateRateLimit() {
  return checkRateLimit('playlist_create', RATE_LIMITS.playlistCreate)
}

export function checkPlaylistItemAddRateLimit() {
  return checkRateLimit('playlist_item_add', RATE_LIMITS.playlistItemAdd)
}

export function checkPlaylistFollowRateLimit() {
  return checkRateLimit('playlist_follow', RATE_LIMITS.playlistFollow)
}

/**
 * Clear rate limit history for an action (useful for testing)
 */
export function clearRateLimit(action) {
  delete actionTimestamps[action]
}
