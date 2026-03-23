import { supabase } from '../lib/supabase'
import { createClassifiedError } from '../utils/errorHandler'
import { logger } from '../utils/logger'

/**
 * Places API - Google Places proxy via Supabase Edge Functions
 *
 * Error strategy: methods log errors for diagnostics.
 * Autocomplete gracefully degrades (returns []) so local search still works.
 * discoverNearby propagates errors so callers can show error states.
 */

export const placesApi = {
  /**
   * Autocomplete restaurant search via Google Places
   * @param {string} input - Search text (min 2 chars)
   * @param {number} lat - User latitude
   * @param {number} lng - User longitude
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array>} Array of { placeId, name, address }
   */
  async autocomplete(input, lat, lng, radius) {
    if (!input || input.trim().length < 2) return []

    try {
      const response = await supabase.functions.invoke('places-autocomplete', {
        body: { input: input.trim(), lat, lng, radius },
      })

      if (response.error) {
        const errMsg = response.error?.message || response.error?.context?.message || String(response.error)
        logger.error('Places autocomplete edge function error:', errMsg, response.error)
        logger.warn('Places autocomplete failed:', errMsg)
        // Graceful degradation for search — don't break local results
        return []
      }

      // Check if the response itself contains an error (edge function returned 200 with error body)
      if (response.data?.error) {
        logger.error('Places autocomplete API error:', response.data.error)
        logger.warn('Places autocomplete API error:', response.data.error)
        return []
      }

      return response.data?.predictions || []
    } catch (error) {
      const errMsg = error?.message || String(error)
      logger.error('Places autocomplete exception:', errMsg)
      // Don't throw — graceful degradation, just show local results
      return []
    }
  },

  /**
   * Discover nearby restaurants via Google Places Nearby Search
   * @param {number} lat - User latitude
   * @param {number} lng - User longitude
   * @param {number} radiusMeters - Search radius in meters (capped at 25mi server-side)
   * @returns {Promise<Array>} Array of { placeId, name, address, lat, lng }
   */
  async discoverNearby(lat, lng, radiusMeters) {
    try {
      // Try nearby search first
      const response = await supabase.functions.invoke('places-nearby-search', {
        body: { lat, lng, radiusMeters },
      })

      if (response.error) {
        const errMsg = response.error?.message || response.error?.context?.message || String(response.error)
        logger.error('places-nearby-search edge function error:', errMsg, response.error)
        logger.warn('places-nearby-search failed:', errMsg)
        throw createClassifiedError(response.error)
      }

      // Check for API-level errors in the response body
      if (response.data?.error) {
        logger.error('places-nearby-search API error:', response.data.error)
        logger.warn('places-nearby-search API error:', response.data.error)
        // Still try to use places if they exist alongside the error
      }

      const places = response.data?.places || []
      if (places.length > 0) {
        return places
      }

      // Fallback: nearby search returned empty, try autocomplete instead
      logger.warn('places-nearby-search returned no results, falling back to autocomplete')
      return await this._discoverViaAutocomplete(lat, lng, radiusMeters)
    } catch (error) {
      logger.warn('places-nearby-search failed, falling back to autocomplete:', error?.message || error)
      try {
        return await this._discoverViaAutocomplete(lat, lng, radiusMeters)
      } catch (fallbackError) {
        logger.error('Places discover fallback also failed:', fallbackError?.message || fallbackError)
        logger.warn('Both nearby search and autocomplete failed')
        return []
      }
    }
  },

  /**
   * Internal fallback: discover restaurants via autocomplete endpoint
   */
  async _discoverViaAutocomplete(lat, lng, radiusMeters) {
    const response = await supabase.functions.invoke('places-autocomplete', {
      body: { input: 'restaurants', lat, lng, radius: radiusMeters },
    })

    if (response.error) {
      throw createClassifiedError(response.error)
    }

    const predictions = response.data?.predictions || []
    return predictions.map(p => ({
      placeId: p.placeId,
      name: p.name,
      address: p.address,
    }))
  },

  /**
   * Get place details from Google Places
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object>} { name, address, lat, lng, phone, websiteUrl, googleMapsUrl }
   */
  async getDetails(placeId) {
    if (!placeId) return null

    try {
      const response = await supabase.functions.invoke('places-details', {
        body: { placeId },
      })

      if (response.error) {
        throw createClassifiedError(response.error)
      }

      return response.data || null
    } catch (error) {
      logger.error('Places details error:', error?.message || error)
      throw error.type ? error : createClassifiedError(error)
    }
  },

  /**
   * Diagnostic: test edge function connectivity and return detailed status.
   * Call from browser console: (await import('/src/api/placesApi.js')).placesApi.diagnose()
   */
  async diagnose() {
    const results = {
      timestamp: new Date().toISOString(),
      session: null,
      nearbySearch: null,
      autocomplete: null,
    }

    // 1. Check session
    try {
      const { data: { session } } = await supabase.auth.getSession()
      results.session = session ? { status: 'ok', userId: session.user.id } : { status: 'no_session' }
    } catch (err) {
      results.session = { status: 'error', message: err.message }
    }

    // 2. Test nearby search
    try {
      const response = await supabase.functions.invoke('places-nearby-search', {
        body: { lat: 41.43, lng: -70.56, radiusMeters: 5000 },
      })
      if (response.error) {
        results.nearbySearch = {
          status: 'edge_function_error',
          errorType: response.error.constructor?.name,
          message: response.error.message || String(response.error),
          context: response.error.context,
        }
      } else if (response.data?.error) {
        results.nearbySearch = { status: 'api_error', error: response.data.error, data: response.data }
      } else {
        results.nearbySearch = { status: 'ok', placeCount: (response.data?.places || []).length }
      }
    } catch (err) {
      results.nearbySearch = { status: 'exception', message: err.message }
    }

    // 3. Test autocomplete
    try {
      const response = await supabase.functions.invoke('places-autocomplete', {
        body: { input: 'pizza', lat: 41.43, lng: -70.56, radius: 5000 },
      })
      if (response.error) {
        results.autocomplete = {
          status: 'edge_function_error',
          errorType: response.error.constructor?.name,
          message: response.error.message || String(response.error),
          context: response.error.context,
        }
      } else if (response.data?.error) {
        results.autocomplete = { status: 'api_error', error: response.data.error, data: response.data }
      } else {
        results.autocomplete = { status: 'ok', predictionCount: (response.data?.predictions || []).length }
      }
    } catch (err) {
      results.autocomplete = { status: 'exception', message: err.message }
    }

    logger.warn('[Places Diagnose] Results:', results)
    return results
  },
}
