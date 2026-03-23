import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '../api/eventsApi'
import { getUserMessage } from '../utils/errorHandler'

/**
 * Hook to fetch active events with optional filters
 */
export function useEvents(filters = {}) {
  const {
    data: events,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['events', 'active', filters],
    queryFn: () => eventsApi.getActiveEvents(filters),
    staleTime: 1000 * 60 * 5,
  })

  return {
    events: events || [],
    loading,
    error: error ? { message: getUserMessage(error, 'loading events') } : null,
    refetch
  }
}

/**
 * Hook to fetch events for a specific restaurant
 */
export function useRestaurantEvents(restaurantId) {
  const {
    data: events,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['events', 'restaurant', restaurantId],
    queryFn: () => eventsApi.getByRestaurant(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    events: events || [],
    loading,
    error: error ? { message: getUserMessage(error, 'loading events') } : null,
    refetch
  }
}
