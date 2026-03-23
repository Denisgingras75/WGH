import { useQuery } from '@tanstack/react-query'
import { specialsApi } from '../api/specialsApi'
import { getUserMessage } from '../utils/errorHandler'

/**
 * Hook to fetch active specials
 */
export function useSpecials() {
  const {
    data: specials,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['specials', 'active'],
    queryFn: () => specialsApi.getActiveSpecials(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    specials: specials || [],
    loading,
    error: error ? { message: getUserMessage(error, 'loading specials') } : null,
    refetch
  }
}

/**
 * Hook to fetch specials for a specific restaurant
 */
export function useRestaurantSpecials(restaurantId) {
  const {
    data: specials,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['specials', 'restaurant', restaurantId],
    queryFn: () => specialsApi.getByRestaurant(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    specials: specials || [],
    loading,
    error: error ? { message: getUserMessage(error, 'loading specials') } : null,
    refetch
  }
}
