// Back button interceptor for multi-step flows (e.g., vote flow).
//
// The popstate event targets `window` directly, so capture vs bubble phase
// doesn't matter — all listeners fire in registration order (AT_TARGET phase).
// This interceptor must be initialized in main.jsx BEFORE React Router mounts
// so its listener fires first and can block React Router from navigating.

let interceptCallback = null

/**
 * Register the global popstate listener. Call once in main.jsx before React renders.
 */
export function initBackButtonInterceptor() {
  window.addEventListener('popstate', (e) => {
    if (interceptCallback) {
      e.stopImmediatePropagation()
      interceptCallback()
    }
  })
}

/**
 * Set a callback to handle the next back button press instead of navigating.
 * The callback is responsible for calling pushState to restore the URL.
 */
export function setBackButtonInterceptor(callback) {
  interceptCallback = callback
}

/**
 * Clear the interceptor, allowing normal back button behavior.
 */
export function clearBackButtonInterceptor() {
  interceptCallback = null
}

/**
 * True while a flow (e.g. an unsaved rating draft) is guarding the back button.
 */
export function hasBackButtonInterceptor() {
  return interceptCallback !== null
}
