import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { getUserMessage } from '../utils/errorHandler'

export function useRestaurantManager() {
  const { user } = useAuth()

  const { data: result, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['restaurantManager', user?.id],
    queryFn: () => restaurantManagerApi.getMyRestaurant(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes — manager status rarely changes
  })

  if (!user) {
    return { isManager: false, restaurant: null, loading: false, error: null, refetch }
  }

  const restaurant = result?.restaurant ?? null

  return {
    isManager: !!restaurant,
    restaurant,
    loading,
    error: error ? { message: getUserMessage(error, 'loading your restaurant') } : null,
    refetch,
  }
}
