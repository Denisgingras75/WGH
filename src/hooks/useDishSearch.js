import { useMemo } from 'react'
import { useAllDishes } from './useAllDishes'
import { searchDishes } from '../utils/dishSearch'

/**
 * Search dishes with instant client-side filtering.
 * Same API signature as previous server-based version.
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 5)
 * @returns {Object} { results, loading, error }
 */
export function useDishSearch(query, limit = 5) {
  const trimmedQuery = query?.trim() || ''
  const isActive = trimmedQuery.length >= 2

  const { dishes, loading: cacheLoading, error } = useAllDishes({ enabled: isActive })

  const results = useMemo(() => {
    if (trimmedQuery.length < 2) return []
    if (!dishes.length) return []
    return searchDishes(dishes, trimmedQuery, { limit })
  }, [dishes, trimmedQuery, limit])

  return {
    results,
    loading: cacheLoading && trimmedQuery.length >= 2,
    error,
  }
}
