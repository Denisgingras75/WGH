import { useMemo } from 'react'
import { useAllDishes } from './useAllDishes'
import { searchDishes } from '../utils/dishSearch'
import { calculateDistance } from '../utils/distance'

/**
 * Search dishes with instant client-side filtering.
 *
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 5)
 * @param {Object|null} geo - Optional location/radius filter
 * @param {number} geo.lat - User latitude
 * @param {number} geo.lng - User longitude
 * @param {number} geo.radiusMiles - Radius in miles (0 = no filter)
 * @param {boolean} geo.isUsingDefault - If true, skip distance filter
 * @returns {Object} { results, loading, error }
 */
export function useDishSearch(query, limit, geo) {
  if (limit === undefined || limit === null) limit = 5
  var trimmedQuery = (query || '').trim()
  var isActive = trimmedQuery.length >= 2

  var { dishes, loading: cacheLoading, error } = useAllDishes({ enabled: isActive })

  var lat = geo && geo.lat
  var lng = geo && geo.lng
  var radiusMiles = geo && geo.radiusMiles
  var isUsingDefault = geo && geo.isUsingDefault

  var results = useMemo(function () {
    if (trimmedQuery.length < 2) return []
    if (!dishes.length) return []
    var matches = searchDishes(dishes, trimmedQuery, { limit: limit * 3 })

    // Apply radius filter if we have real GPS + a non-zero radius
    if (lat && lng && radiusMiles && radiusMiles > 0 && !isUsingDefault) {
      matches = matches.filter(function (d) {
        if (d.restaurant_lat == null || d.restaurant_lng == null) return true
        return calculateDistance(lat, lng, d.restaurant_lat, d.restaurant_lng) <= radiusMiles
      })
    }

    return matches.slice(0, limit)
  }, [dishes, trimmedQuery, limit, lat, lng, radiusMiles, isUsingDefault])

  return {
    results: results,
    loading: cacheLoading && trimmedQuery.length >= 2,
    error: error,
  }
}
