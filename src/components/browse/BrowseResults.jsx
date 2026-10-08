import { memo } from 'react'
import { BROWSE_CATEGORIES } from '../../constants/categories'
import { getRelatedSuggestions } from '../../constants/searchSuggestions'
import { DishListItem } from '../DishListItem'
import { SortDropdown } from './SortDropdown'
import { LocationBanner } from '../LocationBanner'

const CATEGORIES = BROWSE_CATEGORIES

// Cuisine types that should have "food" appended for natural language
const CUISINE_TYPES = new Set([
  'mexican', 'chinese', 'thai', 'japanese', 'italian', 'indian', 'vietnamese',
  'korean', 'greek', 'french', 'spanish', 'mediterranean', 'american', 'brazilian',
  'cuban', 'caribbean', 'jamaican', 'ethiopian', 'moroccan', 'turkish', 'lebanese', 'persian',
  'german', 'british', 'irish', 'polish', 'russian', 'african', 'asian', 'european',
  'latin', 'southern', 'cajun', 'creole', 'hawaiian', 'filipino', 'indonesian',
  'malaysian', 'singaporean', 'taiwanese', 'cantonese', 'szechuan', 'hunan',
])

// Format search query for display - adds "food" for cuisine types
function formatSearchQuery(query) {
  const lower = query.toLowerCase().trim()
  if (CUISINE_TYPES.has(lower)) {
    return `${query} food`
  }
  return query
}

export const BrowseResults = memo(function BrowseResults({
  filteredDishes,
  loading,
  searchLoading,
  error,
  selectedCategory,
  debouncedSearchQuery,
  sortBy,
  sortDropdownOpen,
  radius,
  permissionState,
  requestLocation,
  onSortChange,
  onSortDropdownToggle,
  onShowRadiusSheet,
  onSearchSuggestionClick,
  onBackToCategories,
}) {
  return (
    <>
      {/* Category Header */}
      <div className="px-4 pt-2 pb-4" style={{ background: 'var(--color-bg)', borderBottom: 'var(--border-ink)' }}>
        <div className="flex flex-col gap-3">
          <div>
            <h2 style={{ fontSize: '28px', lineHeight: 1.05, color: 'var(--color-text-primary)' }}>
              {debouncedSearchQuery
                ? `Best ${formatSearchQuery(debouncedSearchQuery)} Nearby`
                : `The Best ${CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Dishes'} Nearby`
              }
            </h2>
            <p className="eyebrow mt-1.5">
              {(loading || searchLoading) ? (
                'Loading rankings...'
              ) : (
                `${Math.min(filteredDishes.length, 10)} top ranked${filteredDishes.length > 10 ? ` · ${filteredDishes.length} total` : ''}`
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Radius chip */}
            <button
              onClick={onShowRadiusSheet}
              aria-label={`Search radius: ${radius} miles. Tap to change`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{
                fontSize: '13px',
                fontWeight: 800,
                background: 'var(--color-butter)',
                border: 'var(--border-ink-thin)',
                color: 'var(--color-ink)',
              }}
            >
              <span>{radius} mi</span>
              <svg
                aria-hidden="true"
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sort dropdown */}
            <SortDropdown
              sortBy={sortBy}
              onSortChange={onSortChange}
              isOpen={sortDropdownOpen}
              onToggle={onSortDropdownToggle}
            />
          </div>
        </div>
      </div>

      {/* Dish Grid */}
      <div className="px-4 py-4">
        <LocationBanner
          permissionState={permissionState}
          requestLocation={requestLocation}
        />
        {(loading || searchLoading) ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-pulse"
                style={{ background: 'var(--color-surface)', border: '2px solid var(--color-divider)', borderRadius: 'var(--radius-lg)' }}
              >
                <div className="w-7 h-7 rounded-full" style={{ background: 'var(--color-divider)' }} />
                <div className="w-12 h-12 rounded-lg" style={{ background: 'var(--color-divider)' }} />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded mb-1" style={{ background: 'var(--color-divider)' }} />
                  <div className="h-3 w-24 rounded" style={{ background: 'var(--color-divider)' }} />
                </div>
                <div className="h-6 w-10 rounded" style={{ background: 'var(--color-divider)' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--color-danger-muted)', border: 'var(--border-ink)' }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{error?.message || 'Something went wrong'}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-ink px-5 py-2.5 text-sm"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Retry
            </button>
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="py-12 text-center">
            <img src="/search-not-found.webp" alt="" className="w-16 h-16 mx-auto mb-4 rounded-full object-cover" style={{ border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }} />
            <p className="mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
              {debouncedSearchQuery
                ? `No dishes found for "${debouncedSearchQuery}"`
                : 'No dishes in this category yet'
              }
            </p>
            {debouncedSearchQuery && (
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Explore similar:
              </p>
            )}

            {/* Contextual suggestions */}
            {debouncedSearchQuery && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {getRelatedSuggestions(debouncedSearchQuery).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onSearchSuggestionClick(suggestion)}
                    className="px-4 py-2 text-sm transition-transform active:scale-95"
                    style={{
                      background: 'var(--color-card)',
                      color: 'var(--color-ink)',
                      border: 'var(--border-ink-thin)',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: 700,
                    }}
                  >
                    {suggestion.charAt(0).toUpperCase() + suggestion.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Browse categories button */}
            <button
              onClick={onBackToCategories}
              className="btn-ink px-5 py-2.5 text-sm"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Browse Categories
            </button>
          </div>
        ) : (
          /* Ranked List View — matches Top 10 style */
          <div>
            {/* Podium rows 1-3 */}
            {filteredDishes.slice(0, 3).map((dish, index) => (
              <div key={dish.dish_id} style={{ marginBottom: '6px' }}>
                <DishListItem
                  dish={dish}
                  rank={index + 1}
                  sortBy={sortBy}
                  showDistance
                />
              </div>
            ))}

            {/* Finalists 4-10 — grouped Apple-style list */}
            {filteredDishes.length > 3 && (
              <div
                className="mt-3 rounded-xl overflow-hidden"
              >
                {filteredDishes.slice(3, 10).map((dish, index) => (
                  <DishListItem
                    key={dish.dish_id}
                    dish={dish}
                    rank={index + 4}
                    sortBy={sortBy}
                    showDistance
                    isLast={index === Math.min(filteredDishes.length - 4, 6)}
                  />
                ))}
              </div>
            )}

            {/* Show more if there are more than 10 */}
            {filteredDishes.length > 10 && (
              <details className="mt-4">
                <summary
                  className="btn-ink w-full cursor-pointer py-3 text-center text-sm"
                  style={{
                    background: 'var(--color-card)',
                    color: 'var(--color-ink)',
                    listStyle: 'none',
                  }}
                >
                  Show {filteredDishes.length - 10} more dishes
                </summary>
                <div
                  className="mt-3 rounded-xl overflow-hidden"
                >
                  {filteredDishes.slice(10).map((dish, index) => (
                    <DishListItem
                      key={dish.dish_id}
                      dish={dish}
                      rank={index + 11}
                      sortBy={sortBy}
                      showDistance
                      isLast={index === filteredDishes.length - 11}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && filteredDishes.length > 0 && (
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1.5px dashed var(--color-divider)' }}>
            <p className="eyebrow">
              {filteredDishes.length} {filteredDishes.length === 1 ? 'dish' : 'dishes'} found
            </p>
          </div>
        )}
      </div>
    </>
  )
})
