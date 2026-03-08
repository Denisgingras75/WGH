import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useUserVotes } from '../hooks/useUserVotes'
import { useDishSearch } from '../hooks/useDishSearch'
import { useFavorites } from '../hooks/useFavorites'
import { restaurantsApi } from '../api/restaurantsApi'
import { getStorageItem, setStorageItem } from '../lib/storage'
import { BROWSE_CATEGORIES, CATEGORY_INFO } from '../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getRelatedSuggestions } from '../constants/searchSuggestions'
import { DishListItem } from '../components/DishListItem'
import { getPendingVoteFromStorage } from '../lib/storage'
import { LoginModal } from '../components/Auth/LoginModal'
import { DishCardSkeleton } from '../components/Skeleton'
import { ImpactFeedback, getImpactMessage } from '../components/ImpactFeedback'
import { SortDropdown, CategoryGrid } from '../components/browse'
import { CategoryImageCard } from '../components/CategoryImageCard'
import { RadiusSheet } from '../components/LocationPicker'
import { LocationBanner } from '../components/LocationBanner'
import { useRestaurantSearch } from '../hooks/useRestaurantSearch'

// Use centralized browse categories
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

export function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [impactFeedback, setImpactFeedback] = useState(null)
  const [pendingVoteData, setPendingVoteData] = useState(null)
  const [sortBy, setSortBy] = useState('top_rated')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  // Autocomplete state
  const [autocompleteOpen, setAutocompleteOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1)
  const [restaurantSuggestions, setRestaurantSuggestions] = useState([])

  const { location, radius, setRadius, town, permissionState, requestLocation, isUsingDefault } = useLocationContext()
  const [showRadiusSheet, setShowRadiusSheet] = useState(false)
  const { stats: userStats } = useUserVotes(user?.id)

  // Search results from API using React Query hook
  // Handles cuisine/tag searches with proper caching and error handling
  // Pass town to filter search results by selected town
  const { results: searchResults, loading: searchLoading } = useDishSearch(debouncedSearchQuery, 50, town)

  // Google Places restaurant search — don't bias by default MV location or Browse radius
  const placesLat = isUsingDefault ? null : location?.lat
  const placesLng = isUsingDefault ? null : location?.lng
  const { externalResults: placesResults } = useRestaurantSearch(
    searchQuery, placesLat, placesLng, searchQuery.trim().length >= 2, null
  )

  const beforeVoteRef = useRef(null)
  const searchInputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const votingDishId = new URLSearchParams(window.location.search).get('votingDish')

  // Handle category and search query from URL params (when coming from home page)
  // Redirect to Home if no category or search query
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    const queryFromUrl = searchParams.get('q')

    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
      setSearchQuery('')
      setDebouncedSearchQuery('')
    } else if (queryFromUrl) {
      setSearchQuery(queryFromUrl)
      setDebouncedSearchQuery(queryFromUrl)
      setSelectedCategory(null)
    } else {
      // No category or search - show category grid
      setSelectedCategory(null)
      setSearchQuery('')
      setDebouncedSearchQuery('')
    }
  }, [searchParams, navigate])

  // Debounce search query by 300ms - only when already showing dishes
  // On categories page, search only triggers on Enter key
  useEffect(() => {
    // Skip auto-debounce if we're on the category grid (not showing dishes yet)
    if (!selectedCategory && !debouncedSearchQuery) {
      return
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, debouncedSearchQuery])


  // Handle sort change
  const handleSortChange = (sortId) => {
    setSortBy(sortId)
    setStorageItem('browse_sort', sortId)
    setSortDropdownOpen(false)
  }

  // Dish suggestions from client-side search (instant, no network calls)
  const dishSuggestions = useMemo(() => {
    if (!searchQuery?.trim() || searchQuery.trim().length < 2) return []
    return searchResults.slice(0, 5)
  }, [searchResults, searchQuery])

  // Fetch restaurant autocomplete suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setRestaurantSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        const restaurantResults = await restaurantsApi.search(searchQuery, 3)
        setRestaurantSuggestions(restaurantResults)
      } catch (error) {
        logger.error('Restaurant suggestions failed:', error)
        setRestaurantSuggestions([])
      }
    }

    const timer = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target) &&
        !searchInputRef.current?.contains(e.target)
      ) {
        setAutocompleteOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Only fetch from useDishes when browsing by category (NOT when text searching)
  // Text search uses useDishSearch hook instead
  const shouldFetchFromUseDishes = selectedCategory && !debouncedSearchQuery.trim()

  const { dishes, loading, error, refetch } = useDishes(
    shouldFetchFromUseDishes ? location : null, // Pass null location to skip fetch
    radius,
    selectedCategory,
    null,
    town
  )
  const { isFavorite, toggleFavorite } = useFavorites(user?.id)

  // Helper to find dish rank in current list
  const getDishRank = useCallback((dishId, dishList) => {
    const ranked = dishList?.filter(d => (d.total_votes || 0) >= MIN_VOTES_FOR_RANKING) || []
    const index = ranked.findIndex(d => d.dish_id === dishId)
    return index === -1 ? 999 : index + 1
  }, [])

  // Navigate to full dish page
  const openDishPage = useCallback((dish) => {
    navigate(`/dish/${dish.dish_id}`)
  }, [navigate])

  // Auto-navigate to dish page after OAuth/magic link login if there's a pending vote
  useEffect(() => {
    if (!user || !dishes?.length) return

    // Check URL for votingDish param (from magic link redirect)
    // Also check localStorage as fallback
    const pending = getPendingVoteFromStorage()
    const dishIdToOpen = votingDishId || pending?.dishId

    if (!dishIdToOpen) return

    // Find the dish in current list
    const dish = dishes.find(d => d.dish_id === dishIdToOpen)
    if (!dish) return

    // Clean up the URL param first
    if (votingDishId) {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('votingDish')
      window.history.replaceState({}, '', newUrl.pathname + newUrl.search)
    }

    // Navigate to dish page
    openDishPage(dish)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dishes, openDishPage])

  // Calculate impact when dishes update after voting
  useEffect(() => {
    if (!pendingVoteData || !dishes?.length) return

    const after = dishes.find(d => d.dish_id === pendingVoteData.dish_id)
    if (!after) return

    // Check if votes actually increased (data refreshed)
    if (after.total_votes > pendingVoteData.total_votes) {
      const afterRank = getDishRank(pendingVoteData.dish_id, dishes)
      const impact = getImpactMessage(
        pendingVoteData, after, pendingVoteData.rank, afterRank
      )
      setImpactFeedback(impact)
      setPendingVoteData(null)
    }
  }, [dishes, pendingVoteData, setImpactFeedback, getDishRank])

  const handleLoginRequired = () => {
    setLoginModalOpen(true)
  }

  const handleToggleFavorite = async (dishId) => {
    if (!user) {
      setLoginModalOpen(true)
      return
    }
    try {
      await toggleFavorite(dishId)
    } catch (error) {
      logger.error('Failed to toggle favorite:', error)
    }
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setSearchQuery('') // Clear search when selecting category
    setDebouncedSearchQuery('')
    // Update URL params
    if (categoryId) {
      setSearchParams({ category: categoryId })
    } else {
      setSearchParams({})
    }
  }

  // Go back to Home page
  const handleBackToCategories = () => {
    navigate('/')
  }

  // Filter and sort dishes
  const filteredDishes = useMemo(() => {
    // When searching, use search results from useDishSearch
    // When browsing by category, use dishes from useDishes
    const source = debouncedSearchQuery.trim() ? searchResults : dishes
    let result = (Array.isArray(source) ? source : []).filter(d => d && d.dish_id)

    // Then sort based on selected option
    switch (sortBy) {
      case 'best_value':
        result = result.slice().sort((a, b) => {
          const aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          const bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          if (aRanked && !bRanked) return -1
          if (!aRanked && bRanked) return 1
          const aVal = a.value_percentile != null ? Number(a.value_percentile) : -1
          const bVal = b.value_percentile != null ? Number(b.value_percentile) : -1
          if (bVal !== aVal) return bVal - aVal
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        })
        break
      case 'most_voted':
        result = result.slice().sort((a, b) => {
          return (b.total_votes || 0) - (a.total_votes || 0)
        })
        break
      case 'closest':
        result = result.slice().sort((a, b) => {
          const aDist = a.distance_miles != null ? Number(a.distance_miles) : 9999
          const bDist = b.distance_miles != null ? Number(b.distance_miles) : 9999
          if (aDist !== bDist) return aDist - bDist
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        })
        break
      case 'top_rated':
      default:
        // Sort by avg_rating (1-10 scale) for Discovery view
        result = result.slice().sort((a, b) => {
          const aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          const bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          // Ranked dishes first
          if (aRanked && !bRanked) return -1
          if (!aRanked && bRanked) return 1
          // Then by avg_rating (quality score)
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        })
        break
    }

    return result
  }, [dishes, debouncedSearchQuery, sortBy, searchResults])

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setAutocompleteOpen(false)
  }

  // Autocomplete suggestions (dishes and restaurants from API search)
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []

    // Use dish suggestions from API (filter out invalid entries)
    const dishMatches = (Array.isArray(dishSuggestions) ? dishSuggestions : [])
      .filter(d => d && d.dish_id && d.dish_name)
      .map(d => ({
        type: 'dish',
        id: d.dish_id,
        name: d.dish_name,
        subtitle: d.restaurant_name || '',
        data: d,
      }))

    // Use restaurant suggestions from API (filter out invalid entries)
    const restaurantMatches = (Array.isArray(restaurantSuggestions) ? restaurantSuggestions : [])
      .filter(r => r && r.id && r.name)
      .map(r => ({
        type: 'restaurant',
        id: r.id,
        name: r.name,
        subtitle: r.address || '',
        data: r,
      }))

    // Google Places results — restaurants not yet in WGH
    const placeMatches = (Array.isArray(placesResults) ? placesResults : [])
      .slice(0, 4)
      .map(p => ({
        type: 'place',
        id: p.placeId,
        name: p.name,
        subtitle: p.address || '',
        data: p,
      }))

    return [...dishMatches, ...restaurantMatches, ...placeMatches]
  }, [searchQuery, dishSuggestions, restaurantSuggestions, placesResults])

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback((suggestion) => {
    setAutocompleteOpen(false)
    setAutocompleteIndex(-1)

    if (suggestion.type === 'dish') {
      // Open the dish modal
      openDishPage(suggestion.data)
      setSearchQuery('')
    } else if (suggestion.type === 'restaurant') {
      // Navigate to restaurant page
      navigate(`/restaurants/${suggestion.id}`)
    }
  }, [navigate, openDishPage])

  // Handle keyboard navigation in autocomplete
  const handleSearchKeyDown = useCallback((e) => {
    if (!autocompleteOpen || autocompleteSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && searchQuery.trim().length >= 2) {
        setAutocompleteOpen(true)
        setAutocompleteIndex(0)
        e.preventDefault()
      } else if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
        // Handle Enter even when autocomplete is closed - navigate to search results
        e.preventDefault()
        setSelectedCategory(null)
        setDebouncedSearchQuery(searchQuery.trim())
        setSearchParams({ q: searchQuery.trim() })
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setAutocompleteIndex(prev =>
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setAutocompleteIndex(prev =>
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (autocompleteIndex >= 0 && autocompleteSuggestions[autocompleteIndex]) {
          handleAutocompleteSelect(autocompleteSuggestions[autocompleteIndex])
        } else if (searchQuery.trim().length >= 2) {
          // No autocomplete selection - trigger search like Home page does
          setAutocompleteOpen(false)
          setAutocompleteIndex(-1)
          setSelectedCategory(null)
          setDebouncedSearchQuery(searchQuery.trim())
          setSearchParams({ q: searchQuery.trim() })
        }
        break
      case 'Escape':
        setAutocompleteOpen(false)
        setAutocompleteIndex(-1)
        break
    }
  }, [autocompleteOpen, autocompleteSuggestions, autocompleteIndex, handleAutocompleteSelect, searchQuery, setSearchParams])

  // Are we showing dishes or the category grid?
  const showingDishes = selectedCategory || debouncedSearchQuery.trim()

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      {/* Header - only shows when viewing dishes */}
      {showingDishes && (
        <header style={{ background: 'var(--color-bg)' }}>
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1 -ml-1 rounded-lg transition-opacity hover:opacity-70"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {selectedCategory && !debouncedSearchQuery.trim() && (
              <>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </span>
                <button
                  onClick={handleBackToCategories}
                  className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                  style={{ color: 'var(--color-primary)', background: 'var(--color-primary-muted)' }}
                >
                  Clear
                </button>
              </>
            )}
            {debouncedSearchQuery.trim() && (
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Results for "{debouncedSearchQuery.trim()}"
              </span>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      {!showingDishes ? (
        /* Category Grid - Plates on a dining table */
        <div
          className="px-6 pt-5 pb-6 relative"
          style={{
            background: 'linear-gradient(180deg, var(--color-card) 0%, var(--color-surface) 50%, var(--color-bg) 100%)',
            minHeight: 'calc(100vh - 80px)',
          }}
        >
          {/* Table edge */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, var(--color-divider) 20%, var(--color-divider) 80%, transparent 100%)',
            }}
          />

          {/* Section title - anchors the grid */}
          <div className="flex justify-center pt-4 pb-10">
            <span
              className="text-[11px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Categories
            </span>
          </div>

          {/* Category grid - 12 items, 4 rows of 3, shelf-like rhythm */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-7 justify-items-center">
            {CATEGORIES.map((category) => (
              <CategoryImageCard
                key={category.id}
                category={category}
                isActive={selectedCategory === category.id}
                onClick={() => handleCategoryChange(category.id)}
                size={72}
              />
            ))}
          </div>

          {/* Search bar - escape hatch, visually separate from categories */}
          <div className="mt-auto pt-10">
            <div className="relative">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: 'var(--color-bg)',
                  border: searchFocused ? '2px solid var(--color-primary)' : '2px solid var(--color-divider)',
                }}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  id="browse-search"
                  name="browse-search"
                  type="text"
                  autoComplete="off"
                  placeholder="Find the best ___ near you"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.length >= 2) {
                      setAutocompleteOpen(true)
                    } else {
                      setAutocompleteOpen(false)
                    }
                    setAutocompleteIndex(-1)
                  }}
                  onFocus={() => {
                    setSearchFocused(true)
                    if (searchQuery.length >= 2 && autocompleteSuggestions.length > 0) {
                      setAutocompleteOpen(true)
                    }
                  }}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={handleSearchKeyDown}
                  className="flex-1 bg-transparent outline-none border-none text-sm"
                  style={{ color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: 'none' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      clearSearch()
                      searchInputRef.current?.focus()
                    }}
                    className="p-1 rounded-full transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: 'var(--color-text-tertiary)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

            {/* Autocomplete dropdown */}
            {autocompleteOpen && autocompleteSuggestions.length > 0 && (
              <div
                ref={autocompleteRef}
                className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border overflow-hidden z-50"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)', border: '1.5px solid var(--color-divider)' }}
              >
                {autocompleteSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    onClick={() => handleAutocompleteSelect(suggestion)}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2 transition-colors"
                    style={{
                      background: index === autocompleteIndex ? 'var(--color-primary-muted)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index === autocompleteIndex ? 'var(--color-primary-muted)' : 'transparent'}
                  >
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {suggestion.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                        {suggestion.type === 'dish' ? `at ${suggestion.subtitle}` : suggestion.subtitle}
                      </p>
                    </div>

                    {/* Type badge */}
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: suggestion.type === 'dish'
                          ? 'var(--color-primary-muted)'
                          : suggestion.type === 'place'
                          ? 'var(--color-accent-gold-muted)'
                          : 'var(--color-primary-muted)',
                        color: suggestion.type === 'dish'
                          ? 'var(--color-primary)'
                          : suggestion.type === 'place'
                          ? 'var(--color-accent-gold)'
                          : 'var(--color-blue-light)',
                      }}
                    >
                      {suggestion.type === 'dish' ? 'Dish' : suggestion.type === 'place' ? '+ Add' : 'Spot'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      ) : (
        /* Dish List View */
        <>
          {/* Category Header */}
          <div className="px-4 py-4 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {debouncedSearchQuery
                    ? `Best ${formatSearchQuery(debouncedSearchQuery)} ${town ? `in ${town}` : 'near you'}`
                    : `The Best ${CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Dishes'}${town ? ` in ${town}` : ''}`
                  }
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
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
                  onClick={() => setShowRadiusSheet(true)}
                  aria-label={`Search radius: ${radius} miles. Tap to change`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    borderColor: 'var(--color-divider)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span>{radius} mi</span>
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Sort dropdown */}
                <SortDropdown
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  isOpen={sortDropdownOpen}
                  onToggle={setSortDropdownOpen}
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
                    className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
                    style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-divider)' }}
                  >
                    <div className="w-7 h-7 rounded-full" style={{ background: 'var(--color-surface)' }} />
                    <div className="w-12 h-12 rounded-lg" style={{ background: 'var(--color-surface)' }} />
                    <div className="flex-1">
                      <div className="h-4 w-32 rounded mb-1" style={{ background: 'var(--color-surface)' }} />
                      <div className="h-3 w-24 rounded" style={{ background: 'var(--color-surface)' }} />
                    </div>
                    <div className="h-6 w-10 rounded" style={{ background: 'var(--color-surface)' }} />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-danger, var(--color-primary)) 15%, var(--color-bg))' }}>
                  <span className="text-2xl">⚠️</span>
                </div>
                <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger, var(--color-primary))' }}>{error?.message || 'Something went wrong'}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--color-danger, var(--color-primary))', color: 'var(--color-text-primary)' }}
                >
                  Retry
                </button>
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="py-12 text-center">
                <img src="/search-not-found.png" alt="" className="w-16 h-16 mx-auto mb-4 rounded-full object-cover" />
                <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {debouncedSearchQuery
                    ? `No dishes found for "${debouncedSearchQuery}"`
                    : 'No dishes in this category yet'
                  }
                </p>
                {debouncedSearchQuery && (
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                    Explore similar:
                  </p>
                )}

                {/* Contextual suggestions */}
                {debouncedSearchQuery && (
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {getRelatedSuggestions(debouncedSearchQuery).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setSearchQuery(suggestion)
                          setDebouncedSearchQuery(suggestion)
                          setSearchParams({ q: suggestion })
                        }}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'var(--color-surface-elevated)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-divider)',
                        }}
                      >
                        {suggestion.charAt(0).toUpperCase() + suggestion.slice(1)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Browse categories button */}
                <button
                  onClick={handleBackToCategories}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
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
                      className="cursor-pointer py-3 text-center text-sm font-medium rounded-xl transition-colors"
                      style={{
                        background: 'var(--color-bg)',
                        color: 'var(--color-text-secondary)',
                        border: '1.5px solid var(--color-divider)'
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
              <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--color-divider)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {filteredDishes.length} {filteredDishes.length === 1 ? 'dish' : 'dishes'} found
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <RadiusSheet
        isOpen={showRadiusSheet}
        onClose={() => setShowRadiusSheet(false)}
        radius={radius}
        onRadiusChange={setRadius}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />


      {/* Impact feedback toast */}
      <ImpactFeedback
        impact={impactFeedback}
        onClose={() => setImpactFeedback(null)}
      />
    </div>
  )
}
