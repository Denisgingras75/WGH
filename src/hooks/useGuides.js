import { useQuery } from '@tanstack/react-query'
import { dishesApi } from '../api/dishesApi'
import { logger } from '../utils/logger'

const GUIDE_CATEGORIES = [null, 'lobster roll', 'seafood', 'pizza', 'breakfast', 'burger', 'chowder']

export function useGuides(location, radius) {
  const { data, isLoading } = useQuery({
    queryKey: ['guides', location?.lat, location?.lng, radius],
    queryFn: async () => {
      const allDishes = await dishesApi.getRankedDishes({
        lat: location?.lat || 41.43,
        lng: location?.lng || -70.56,
        radiusMiles: radius === 0 ? 25000 : (radius || 50),
        category: null,
        town: null,
      })

      const result = {}
      // "must-try" = top 3 overall
      result['null'] = allDishes.slice(0, 3)

      // Per category: filter and take top 3
      for (let i = 0; i < GUIDE_CATEGORIES.length; i++) {
        const cat = GUIDE_CATEGORIES[i]
        if (cat === null) continue
        const filtered = allDishes.filter(d =>
          d.category && d.category.toLowerCase() === cat
        )
        result[cat] = filtered.slice(0, 3)
      }

      return result
    },
    enabled: true,
    staleTime: 1000 * 60 * 10,
  })

  if (!data) {
    logger.debug('Guides data not yet loaded')
  }

  return {
    guideData: data || {},
    loading: isLoading,
  }
}
