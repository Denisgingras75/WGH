import { useState, useEffect } from 'react'
import { restaurantsApi } from '../api/restaurantsApi'
import { placesApi } from '../api/placesApi'
import { logger } from '../utils/logger'

/**
 * Combined local DB + Google Places restaurant search
 * Deduplicates by google_place_id
 *
 * @param {string} query - Search term (min 2 chars)
 * @param {number|null} lat - User latitude
 * @param {number|null} lng - User longitude
 * @param {boolean} enabled - Whether to search (default true)
 * @param {number} radiusMiles - Radius in miles for biasing Google Places results
 * @returns {{ localResults: Array, externalResults: Array, loading: boolean }}
 */
export function useRestaurantSearch(query, lat, lng, enabled = true, radiusMiles = null) {
  const [localResults, setLocalResults] = useState([])
  const [externalResults, setExternalResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !query || query.trim().length < 2) {
      setLocalResults([])
      setExternalResults([])
      // Clear loading: prevents stuck spinner if user clears the query while
      // a previous fetch is still in flight (the in-flight fetch is cancelled
      // below, so its `finally` won't run).
      setLoading(false)
      return
    }

    const trimmed = query.trim()
    // Effect-scoped cancellation flag. Each effect run owns its own flag, so
    // a slow response from a previous query can't clobber state for a newer
    // query even though both `fetchResults` closures are alive briefly.
    let cancelled = false
    setLoading(true)

    // Only bias toward user location if we actually have one
    // Passing null lets Google return global results based on query alone
    const hasLocation = lat != null && lng != null
    const searchLat = hasLocation ? lat : null
    const searchLng = hasLocation ? lng : null
    const searchRadiusMeters = hasLocation ? (radiusMiles ? radiusMiles * 1609 : 50000) : null

    const fetchResults = async () => {
      try {
        // Run local + Google Places searches in parallel
        const [local, external] = await Promise.all([
          restaurantsApi.search(trimmed, 5).catch((err) => {
            logger.error('Local restaurant search error:', err)
            return []
          }),
          placesApi.autocomplete(trimmed, searchLat, searchLng, searchRadiusMeters).catch((err) => {
            logger.error('Places autocomplete error:', err)
            return []
          }),
        ])

        if (cancelled) return

        // Collect google_place_ids from local results for dedup
        const localPlaceIds = new Set()
        local.forEach(r => {
          if (r.google_place_id) localPlaceIds.add(r.google_place_id)
        })

        // Filter out external results that already exist locally
        const dedupedExternal = external.filter(p => !localPlaceIds.has(p.placeId))

        setLocalResults(local)
        setExternalResults(dedupedExternal)
      } catch (err) {
        logger.error('Restaurant search error:', err)
        if (!cancelled) {
          setLocalResults([])
          setExternalResults([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    // Debounce
    const timer = setTimeout(fetchResults, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, lat, lng, enabled, radiusMiles])

  return { localResults, externalResults, loading }
}
