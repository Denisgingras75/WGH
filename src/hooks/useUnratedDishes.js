import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dishPhotosApi } from '../api/dishPhotosApi'
import { logger } from '../utils/logger'

/**
 * Hook for fetching dishes that a user has photographed but not rated
 */
export function useUnratedDishes(userId) {
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['unratedDishes', userId],
    queryFn: () => dishPhotosApi.getUnratedDishesWithPhotos(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  useEffect(() => {
    if (error) logger.error('Error fetching unrated dishes:', error)
  }, [error])

  const dishes = data || []

  return {
    dishes,
    count: dishes.length,
    loading: userId ? loading : false,
    error: error ? (error.message || 'Failed to fetch unrated dishes') : null,
    refetch,
  }
}
