import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useDishSearch } from '../hooks/useDishSearch'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { BROWSE_CATEGORIES } from '../constants/categories'
import { DishSearch } from '../components/DishSearch'
import { TownPicker } from '../components/TownPicker'
import { DishListItem } from '../components/DishListItem'
import { CategoryChips } from '../components/CategoryChips'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { RadiusSheet } from '../components/LocationPicker'
import { LocationBanner } from '../components/LocationBanner'

export function Home() {
  var navigate = useNavigate()
  var { location, radius, setRadius, town, setTown, permissionState, requestLocation } = useLocationContext()

  var [selectedCategory, setSelectedCategory] = useState(null)
  var [townPickerOpen, setTownPickerOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState('')
  var [searchLimit, setSearchLimit] = useState(10)
  var [showRadiusSheet, setShowRadiusSheet] = useState(false)

  var handleSearchChange = useCallback(function (q) {
    setSearchQuery(q)
    setSearchLimit(10)
    if (q) setSelectedCategory(null)
  }, [])

  // Search results
  var searchData = useDishSearch(searchQuery, searchLimit, town)
  var searchResults = searchData.results
  var searchLoading = searchData.loading

  // Ranked dishes for the list
  var dishData = useDishes(location, radius, null, null, town)
  var dishes = dishData.dishes
  var loading = dishData.loading
  var error = dishData.error

  // Rank-sort function
  var rankSort = function (a, b) {
    var aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
    var bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
    if (aRanked && !bRanked) return -1
    if (!aRanked && bRanked) return 1
    return (b.avg_rating || 0) - (a.avg_rating || 0)
  }

  // Filtered + sorted dishes
  var rankedDishes = useMemo(function () {
    if (!dishes || dishes.length === 0) return []
    var filtered = dishes
    if (selectedCategory) {
      filtered = dishes.filter(function (d) {
        return d.category && d.category.toLowerCase() === selectedCategory
      })
    }
    return filtered.slice().sort(rankSort).slice(0, 20)
  }, [dishes, selectedCategory])

  var selectedCategoryLabel = selectedCategory
    ? BROWSE_CATEGORIES.find(function (c) { return c.id === selectedCategory })
    : null

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      <h1 className="sr-only">What's Good Here</h1>

      {/* Search row */}
      <div className="px-4 pt-4 pb-3">
        <DishSearch
          loading={loading}
          placeholder="What are you craving?"
          town={town}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Location banner */}
      <div className="px-4">
        <LocationBanner
          permissionState={permissionState}
          requestLocation={requestLocation}
          message="Enable location to find the best food near you"
        />
      </div>

      {/* Radius chip */}
      <div className="px-4 pb-2">
        <button
          onClick={function () { setShowRadiusSheet(true) }}
          aria-label={'Search radius: ' + radius + ' miles'}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold"
          style={{
            fontSize: '13px',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1.5px solid var(--color-divider)',
          }}
        >
          {radius} mi
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Category chips + town picker */}
      <CategoryChips
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        sticky
        maxVisible={23}
        townPickerOpen={townPickerOpen}
        townPicker={
          <TownPicker
            town={town}
            onTownChange={setTown}
            isOpen={townPickerOpen}
            onToggle={setTownPickerOpen}
          />
        }
      />

      {/* Section header */}
      <div className="px-4 pt-3 pb-2">
        <SectionHeader
          title={selectedCategoryLabel
            ? (town ? 'Best ' + selectedCategoryLabel.label + ' in ' + town : 'Best ' + selectedCategoryLabel.label)
            : (town ? 'Top Rated in ' + town : 'Top Rated Nearby')
          }
        />
      </div>

      {/* Ranked dish list */}
      <div className="px-4 pb-4">
        {searchQuery ? (
          searchLoading ? (
            <ListSkeleton />
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col" style={{ gap: '2px' }}>
              {searchResults.map(function (dish, i) {
                return (
                  <DishListItem
                    key={dish.dish_id}
                    dish={dish}
                    rank={i + 1}
                    showDistance
                    onClick={function () { navigate('/dish/' + dish.dish_id) }}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState
              emoji="🔍"
              title={'No dishes found for \u201c' + searchQuery + '\u201d'}
            />
          )
        ) : loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="py-8 text-center">
            <p role="alert" style={{ fontSize: '14px', color: 'var(--color-danger)' }}>
              {error.message || error}
            </p>
          </div>
        ) : rankedDishes.length > 0 ? (
          <div className="flex flex-col" style={{ gap: '2px' }}>
            {rankedDishes.map(function (dish, i) {
              return (
                <DishListItem
                  key={dish.dish_id}
                  dish={dish}
                  rank={i + 1}
                  showDistance
                  onClick={function () { navigate('/dish/' + dish.dish_id) }}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            emoji="🍽️"
            title={selectedCategory ? 'No ' + (selectedCategoryLabel ? selectedCategoryLabel.label : '') + ' rated yet' : 'No dishes found'}
          />
        )}
      </div>

      {/* Radius Sheet */}
      <RadiusSheet
        isOpen={showRadiusSheet}
        onClose={function () { setShowRadiusSheet(false) }}
        radius={radius}
        onRadiusChange={setRadius}
      />

    </div>
  )
}

/* --- Loading skeleton ----------------------------------------------------- */
function ListSkeleton() {
  return (
    <div className="animate-pulse">
      {[0, 1, 2, 3, 4].map(function (i) {
        return (
          <div key={i} className="flex items-center gap-3 py-3 px-3">
            <div className="w-7 h-5 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="w-6 h-6 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="flex-1">
              <div className="h-4 w-28 rounded mb-1" style={{ background: 'var(--color-divider)' }} />
              <div className="h-3 w-20 rounded" style={{ background: 'var(--color-divider)' }} />
            </div>
            <div className="h-5 w-8 rounded" style={{ background: 'var(--color-divider)' }} />
          </div>
        )
      })}
    </div>
  )
}
