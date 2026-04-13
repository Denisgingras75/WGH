import { logger } from './logger'

/**
 * Share or copy a URL with platform-appropriate behavior.
 *
 * Fallback strategy:
 * 1. Web Share API (mobile native share sheets)
 * 2. navigator.clipboard.writeText (modern desktop)
 * 3. Synchronous textarea + execCommand (mobile Safari fallback)
 *
 * @param {{ url: string, title?: string, text?: string }} options
 * @returns {Promise<{ method: string, success: boolean }>}
 */
export async function shareOrCopy({ url, title, text }) {
  // 1. Web Share API (best mobile UX — native share sheet)
  if (navigator.share) {
    const shareData = { url }
    if (title) shareData.title = title
    if (text) shareData.text = text

    if (!navigator.canShare || navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return { method: 'native', success: true }
      } catch (err) {
        if (err.name === 'AbortError') {
          return { method: 'native', success: false }
        }
        // Fall through to clipboard
      }
    }
  }

  // 2. Async clipboard API (desktop browsers)
  try {
    await navigator.clipboard.writeText(url)
    return { method: 'clipboard', success: true }
  } catch {
    // Fall through to execCommand
  }

  // 3. Synchronous textarea + execCommand (mobile Safari fallback)
  // Proven pattern from Admin.jsx invite copy
  try {
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return { method: 'execCommand', success }
  } catch (err) {
    logger.warn('All share methods failed:', err)
    return { method: 'execCommand', success: false }
  }
}

/**
 * Build share payload for a dish.
 * @param {{ dish_id: string, dish_name: string, restaurant_name: string }} dish
 * @returns {{ url: string, title: string, text: string }}
 */
export function buildDishShareData(dish) {
  const url = `${window.location.origin}/dish/${dish.dish_id}`
  return {
    url,
    title: `${dish.dish_name} at ${dish.restaurant_name}`,
    text: `Check out ${dish.dish_name} at ${dish.restaurant_name} on What's Good Here!`,
  }
}

/**
 * Build share payload for a restaurant.
 * @param {{ id: string, name: string, town?: string }} restaurant
 * @returns {{ url: string, title: string, text: string }}
 */
export function buildRestaurantShareData(restaurant) {
  const url = `${window.location.origin}/restaurants/${restaurant.id}`
  return {
    url,
    title: restaurant.name,
    text: `Check out ${restaurant.name}${restaurant.town ? ` in ${restaurant.town}` : ''} on What's Good Here!`,
  }
}
