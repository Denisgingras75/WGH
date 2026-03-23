import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { placesApi } from '../api/placesApi'
import { logger } from '../utils/logger'

const MILES_TO_METERS = 1609.34
const MAX_DISCOVERY_RADIUS_MI = 25

/**
 * Discover nearby restaurants via Google Places that aren't already in the DB.
 * Requires authentication (edge functions need JWT) and GPS coordinates.
 * Search radius is capped at 25 miles.
 *
 * @param {Object} params
 * @param {number} params.lat - User latitude
 * @param {number} params.lng - User longitude
 * @param {number} params.radius - Radius in miles (capped at 25)
 * @param {boolean} params.isAuthenticated - Whether user is logged in
 * @param {string[]} params.existingPlaceIds - Google Place IDs already in DB
 */
export function useNearbyPlaces({ lat, lng, radius, isAuthenticated, existingPlaceIds = [] }) {
  // Auth is required because edge functions require JWT for rate limiting
  const enabled = !!isAuthenticated && !!lat && !!lng
  const searchRadius = Math.min(radius || 5, MAX_DISCOVERY_RADIUS_MI)
  const radiusMeters = Math.round(searchRadius * MILES_TO_METERS)

  const { data, isLoading, error } = useQuery({
    queryKey: ['nearbyPlaces', lat, lng, searchRadius],
    queryFn: async () => {
      return placesApi.discoverNearby(lat, lng, radiusMeters)
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Google Places API is rate-limited — retries make it worse
  })

  // Filter out places already in the DB
  const existingSet = new Set(existingPlaceIds)
  const places = (data || []).filter(p => !existingSet.has(p.placeId))

  useEffect(() => {
    if (error) logger.error('Error discovering nearby places:', error?.message || error)
  }, [error])

  // Surface the error with more detail for diagnostics
  const errorInfo = error
    ? { message: error?.message || 'Could not load nearby restaurant suggestions' }
    : !isAuthenticated && lat && lng
      ? { message: 'Sign in to discover nearby restaurants from Google' }
      : null

  return {
    places,
    loading: isLoading && enabled,
    error: errorInfo,
    needsAuth: !isAuthenticated && !!lat && !!lng,
  }
}
