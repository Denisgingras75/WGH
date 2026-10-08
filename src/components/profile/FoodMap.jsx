import { useState, useEffect } from 'react'
import { BROWSE_CATEGORIES } from '../../constants/categories'
import { restaurantsApi } from '../../api/restaurantsApi'

var FOOD_MAP_NUM = { fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }

/**
 * Food Map — exploration progress in a single rounded box
 */
export function FoodMap({ stats, title }) {
  const [totalRestaurants, setTotalRestaurants] = useState(null)

  useEffect(() => {
    restaurantsApi.getCount().then(setTotalRestaurants)
  }, [])

  const categoryCounts = stats.categoryCounts || {}
  const exploredCategories = BROWSE_CATEGORIES.filter(c => categoryCounts[c.id] > 0)
  const topCategories = exploredCategories.slice().sort((a, b) => (categoryCounts[b.id] || 0) - (categoryCounts[a.id] || 0)).slice(0, 3)

  return (
    <div
      className="px-4 py-4"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-ink)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-hard)',
      }}
    >
      <h2
        className="mb-3"
        style={{
          color: 'var(--color-text-primary)',
          fontSize: '19px',
          lineHeight: 1.1,
        }}
      >
        {title || 'Your Food Map'}
      </h2>

      <div className="space-y-2" style={{ fontWeight: 500 }}>
        <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="w-5 text-center">{'\uD83C\uDF7D\uFE0F'}</span>
          <span>
            <span style={FOOD_MAP_NUM}>{stats.totalVotes}</span> dishes rated
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="w-5 text-center">{'\uD83C\uDFE0'}</span>
          <span>
            <span style={FOOD_MAP_NUM}>{stats.uniqueRestaurants}</span>
            {totalRestaurants ? ` of ${totalRestaurants}` : ''} restaurants visited
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="w-5 text-center">{'\uD83D\uDCCB'}</span>
          <span>
            <span style={FOOD_MAP_NUM}>{exploredCategories.length}</span> of {BROWSE_CATEGORIES.length} categories explored
          </span>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: '1.5px dashed var(--color-divider)' }}>
          {topCategories.map(function (cat, i) {
            return (
              <span
                key={cat.id}
                className="flex items-center gap-1 px-2.5 py-1 text-xs"
                style={{
                  background: i === 0 ? 'var(--color-butter)' : 'var(--color-card)',
                  border: 'var(--border-ink-thin)',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--color-ink)',
                  fontWeight: 700,
                }}
              >
                {cat.emoji} {cat.label}
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: i === 0 ? 'var(--color-ink)' : 'var(--color-text-tertiary)' }}>{categoryCounts[cat.id]}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FoodMap
