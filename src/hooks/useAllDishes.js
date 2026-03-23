import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dishesApi } from '../api/dishesApi'
import { logger } from '../utils/logger'

/**
 * Cache all dishes for client-side search.
 * ~300 rows, ~50KB. Fetched once, refreshed on window focus and every 5 minutes.
 * @returns {Object} { dishes, loading, error }
 */
export function useAllDishes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['allDishes'],
    queryFn: () => dishesApi.getAllSearchable(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  useEffect(() => {
    if (error) logger.error('Error loading dish cache:', error)
  }, [error])

  return {
    dishes: data || [],
    loading: isLoading,
    error,
  }
}
