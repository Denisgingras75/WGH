import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dishesApi } from '../api/dishesApi'
import { getUserMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'

/**
 * Fetch and cache a single dish by ID using React Query
 * @param {string} dishId - The dish ID to fetch
 * @returns {Object} { dish, loading, error, refetch }
 */
export function useDish(dishId) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dish', dishId],
    queryFn: () => dishesApi.getDishById(dishId),
    enabled: !!dishId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Transform error to user-friendly format
  const transformedError = error
    ? {
        message: getUserMessage(error, 'loading dish'),
        originalError: error,
        type: error.type,
      }
    : null

  useEffect(() => {
    if (error) logger.error('Error fetching dish:', error)
  }, [error])

  return {
    dish: data,
    loading: isLoading,
    error: transformedError,
    refetch,
  }
}
