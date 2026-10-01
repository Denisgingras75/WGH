import { useQuery } from '@tanstack/react-query'
import { BROWSE_CATEGORIES } from '../../constants/categories'
import { restaurantsApi } from '../../api/restaurantsApi'

/**
 * Food Map — exploration progress in a single rounded box
 */
export function FoodMap({ stats, title }) {
  const { data: totalRestaurants } = useQuery({
    queryKey: ['restaurantCount'],
    queryFn: () => restaurantsApi.getCount(),
    staleTime: 1000 * 60 * 30,
  })

  const categoryCounts = stats.categoryCounts || {}
  const exploredCategories = BROWSE_CATEGORIES.filter(c => categoryCounts[c.id] > 0)
  const topCategories = exploredCategories.slice().sort((a, b) => (categoryCounts[b.id] || 0) - (categoryCounts[a.id] || 0)).slice(0, 3)

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-divider)',
      }}
    >
      <h2
        className="mb-3"
        style={{
          fontFamily: "'Amatic SC', cursive",
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1.1,
          color: 'var(--color-text-primary)',
        }}
      >
        {title || 'Your Food Map'}
      </h2>

      <div className="space-y-2">
        <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span aria-hidden="true" className="w-5 text-center">{'🍽️'}</span>
          <span>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.totalVotes}</span>
            {stats.totalVotes === 1 ? ' dish rated' : ' dishes rated'}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span aria-hidden="true" className="w-5 text-center">{'🏠'}</span>
          <span>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.uniqueRestaurants}</span>
            {totalRestaurants
              ? ' of ' + totalRestaurants + ' restaurants visited'
              : (stats.uniqueRestaurants === 1 ? ' restaurant visited' : ' restaurants visited')}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span aria-hidden="true" className="w-5 text-center">{'📋'}</span>
          <span>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{exploredCategories.length}</span> of {BROWSE_CATEGORIES.length} categories explored
          </span>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {topCategories.map(function (cat) {
            return (
              <span
                key={cat.id}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span aria-hidden="true">{cat.emoji}</span> {cat.label}
                <span style={{ color: 'var(--color-text-tertiary)' }}>{categoryCounts[cat.id]}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FoodMap
