/**
 * Chunk-load failure detection, shared by lazyWithRetry (App.jsx) and the
 * root ErrorBoundary. After a deploy, a stale tab can request a lazy chunk
 * that no longer exists; we reload the page once to pick up the new build.
 */

// sessionStorage flag so a failing chunk only triggers a single reload
export const CHUNK_RELOAD_KEY = 'wgh_chunk_reload'

export function isChunkLoadError(error) {
  const msg = error?.message || ''
  return (
    msg.includes('Failed to fetch dynamically imported module') || // Chrome
    msg.includes('error loading dynamically imported module') ||   // Safari
    msg.includes('Importing a module script failed') ||            // Firefox
    msg.includes('Loading chunk') ||                               // Generic bundler
    msg.includes('Failed to fetch')                                // Network-level
  )
}
