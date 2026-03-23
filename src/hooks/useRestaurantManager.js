import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { restaurantManagerApi } from '../api/restaurantManagerApi'
import { logger } from '../utils/logger'

export function useRestaurantManager() {
  const { user } = useAuth()

  const { data: result, isLoading: loading } = useQuery({
    queryKey: ['restaurantManager', user?.id],
    queryFn: () => restaurantManagerApi.getMyRestaurant(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes — manager status rarely changes
  })

  if (!user) {
    return { isManager: false, restaurant: null, loading: false }
  }

  const isManager = !!result?.restaurant
  const restaurant = result?.restaurant ?? null

  useEffect(() => {
    if (result === undefined && !loading) {
      logger.error('Unexpected null result from getMyRestaurant')
    }
  }, [result, loading])

  return { isManager, restaurant, loading }
}
