import { memo, useState } from 'react'
import { BROWSE_CATEGORIES, ALL_CATEGORIES } from '../../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../../constants/app'
import { getRelatedSuggestions } from '../../constants/searchSuggestions'
import { DishListItem } from '../DishListItem'
import { DishRowSkeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'
import { SortDropdown } from './SortDropdown'
import { LocationBanner } from '../LocationBanner'
import { PageHeader } from '../PageHeader'
import { RadiusChip } from '../home/RadiusChip'
import { PRIMARY_BUTTON_CLASS, PRIMARY_BUTTON_STYLE } from '../../constants/styles'

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

// Browse shortcuts carry plural labels ("Burgers"), so try them first
function getCategoryLabel(categoryId) {
  if (!categoryId) return 'Dishes'
  const match = BROWSE_CATEGORIES.find(c => c.id === categoryId) || ALL_CATEGORIES.find(c => c.id === categoryId)
  return match?.label || categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
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
  onBack,
  onRetry,
}) {
  const [showAll, setShowAll] = useState(false)
  const isLoading = loading || searchLoading
  const relatedSuggestions = debouncedSearchQuery ? getRelatedSuggestions(debouncedSearchQuery) : []
  const rankedCount = filteredDishes.filter(d => (d.total_votes || 0) >= MIN_VOTES_FOR_RANKING).length
  const dishCount = filteredDishes.length

  return (
    <>
      {/* Detail header — back, title, meta, then radius + sort controls */}
      <PageHeader
        title={debouncedSearchQuery
          ? `Best ${formatSearchQuery(debouncedSearchQuery)} Nearby`
          : `The Best ${getCategoryLabel(selectedCategory)} Nearby`}
        meta={isLoading
          ? 'Loading rankings…'
          : error
            ? null
            : `${dishCount} ${dishCount === 1 ? 'dish' : 'dishes'}${rankedCount ? ` · ${rankedCount} ranked` : ''}`}
        onBack={onBack}
        below={
          <div className="flex gap-2 mt-2">
            {/* Radius chip */}
            <RadiusChip radius={radius} onOpen={onShowRadiusSheet} />

            {/* Sort dropdown */}
            <SortDropdown
              sortBy={sortBy}
              onSortChange={onSortChange}
              isOpen={sortDropdownOpen}
              onToggle={onSortDropdownToggle}
            />
          </div>
        }
      />

      {/* Dish list */}
      <div className="px-4 py-4">
        <LocationBanner
          permissionState={permissionState}
          requestLocation={requestLocation}
        />
        {isLoading ? (
          <DishRowSkeleton count={5} />
        ) : error ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(var(--color-danger-rgb), 0.15)' }}>
              <span className="text-2xl" aria-hidden="true">⚠️</span>
            </div>
            <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>{error?.message || 'Something went wrong'}</p>
            {onRetry ? (
              <button type="button" onClick={() => onRetry()} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
                Try again
              </button>
            ) : (
              <button type="button" onClick={onBackToCategories} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
                Browse Categories
              </button>
            )}
          </div>
        ) : dishCount === 0 ? (
          <EmptyState
            emoji={<img src="/search-not-found.webp" alt="" className="w-16 h-16 mx-auto rounded-full object-cover" />}
            title={debouncedSearchQuery
              ? `No dishes found for "${debouncedSearchQuery}"`
              : 'No dishes in this category yet'
            }
            subtitle={debouncedSearchQuery
              ? (relatedSuggestions.length > 0 ? 'Explore similar:' : null)
              : (radius ? 'Try a wider search radius.' : null)
            }
            action={
              <>
                {relatedSuggestions.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {relatedSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => onSearchSuggestionClick(suggestion)}
                        className="px-3 py-2 rounded-full text-xs font-semibold min-h-[36px] transition-all active:scale-95"
                        style={{
                          background: 'var(--color-surface)',
                          border: '1.5px solid var(--color-divider)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {suggestion.charAt(0).toUpperCase() + suggestion.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={onBackToCategories} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
                  Browse Categories
                </button>
              </>
            }
          />
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
            {dishCount > 3 && (
              <div className="mt-3 rounded-xl overflow-hidden">
                {filteredDishes.slice(3, 10).map((dish, index) => (
                  <DishListItem
                    key={dish.dish_id}
                    dish={dish}
                    rank={index + 4}
                    sortBy={sortBy}
                    showDistance
                    isLast={index === Math.min(dishCount - 4, 6)}
                  />
                ))}
              </div>
            )}

            {/* 11+ behind a toggle */}
            {dishCount > 10 && (
              <>
                {showAll && (
                  <div className="mt-3 rounded-xl overflow-hidden">
                    {filteredDishes.slice(10).map((dish, index) => (
                      <DishListItem
                        key={dish.dish_id}
                        dish={dish}
                        rank={index + 11}
                        sortBy={sortBy}
                        showDistance
                        isLast={index === dishCount - 11}
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowAll(v => !v)}
                  aria-expanded={showAll}
                  className="mt-4 w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-divider)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {showAll ? 'Show fewer' : `Show ${dishCount - 10} more dishes`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
})
