import { useQuery } from '@tanstack/react-query'
import { dishesApi } from '../api/dishesApi'
import { getUserMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'

/**
 * Fetch and cache dishes using React Query
 * Supports both location-based ranked dishes and restaurant-specific dishes
 */
export function useDishes(location, radius, category = null, restaurantId = null, town = null) {
  const queryKey = restaurantId
    ? ['dishes', 'restaurant', restaurantId, category]
    : ['dishes', 'ranked', location?.lat, location?.lng, radius, category, town]

  const enabled = restaurantId ? !!restaurantId : !!location

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (restaurantId) {
        return dishesApi.getDishesForRestaurant({ restaurantId, category })
      }
      return dishesApi.getRankedDishes({
        lat: location.lat,
        lng: location.lng,
        // 0 = "Anywhere" — use 25000 miles (global) so the RPC bounding box includes everything
        radiusMiles: radius === 0 ? 25000 : radius,
        category,
        town,
      })
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Transform error to user-friendly format
  const transformedError = error
    ? {
        message: getUserMessage(error, 'loading dishes'),
        originalError: error,
        type: error.type,
      }
    : null

  if (error) {
    logger.error('Error fetching dishes:', error)
  }

  return {
    dishes: data || [],
    loading: isLoading,
    error: transformedError,
    refetch,
    isFetching, // Additional state for background refetching
  }
}
