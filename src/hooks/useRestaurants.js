import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { restaurantsApi } from '../api/restaurantsApi'
import { getUserMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'

/**
 * Fetch restaurants with distance filtering via React Query
 * Falls back to getAll() when no location is available
 */
export function useRestaurants(location, radius, permissionState) {
  const hasLocation = !!location && permissionState === 'granted'

  const queryKey = hasLocation
    ? ['restaurants', 'byDistance', location.lat, location.lng, radius]
    : ['restaurants', 'all']

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (hasLocation) {
        return restaurantsApi.getByDistance(location.lat, location.lng, radius)
      }
      return restaurantsApi.getAll()
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  const transformedError = error
    ? {
        message: getUserMessage(error, 'loading restaurants'),
        originalError: error,
        type: error.type,
      }
    : null

  useEffect(() => {
    if (error) logger.error('Error fetching restaurants:', error)
  }, [error])

  return {
    restaurants: data || [],
    loading: isLoading,
    error: transformedError,
    refetch,
    isDistanceFiltered: hasLocation,
  }
}
