import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { logger } from '../utils/logger'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useUserVotes } from '../hooks/useUserVotes'
import { useDishSearch } from '../hooks/useDishSearch'
import { useFavorites } from '../hooks/useFavorites'
import { restaurantsApi } from '../api/restaurantsApi'
import { getStorageItem, setStorageItem } from '../lib/storage'
import { BROWSE_CATEGORIES } from '../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getPendingVoteFromStorage } from '../lib/storage'
import { LoginModal } from '../components/Auth/LoginModal'
import { ImpactFeedback, getImpactMessage } from '../components/ImpactFeedback'
import { RadiusSheet } from '../components/LocationPicker'
import { useRestaurantSearch } from '../hooks/useRestaurantSearch'
import { BrowseSearchBar } from '../components/browse/BrowseSearchBar'
import { BrowseResults } from '../components/browse/BrowseResults'

const CATEGORIES = BROWSE_CATEGORIES

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
      setSelectedCategory(null)
      setSearchQuery('')
      setDebouncedSearchQuery('')
    }
  }, [searchParams, navigate])

  // Debounce search query by 300ms - only when already showing dishes
  useEffect(() => {
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

  // Dish suggestions from client-side search
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
  const shouldFetchFromUseDishes = selectedCategory && !debouncedSearchQuery.trim()

  const { dishes, loading, error, refetch } = useDishes(
    shouldFetchFromUseDishes ? location : null,
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

    const pending = getPendingVoteFromStorage()
    const dishIdToOpen = votingDishId || pending?.dishId

    if (!dishIdToOpen) return

    const dish = dishes.find(d => d.dish_id === dishIdToOpen)
    if (!dish) return

    if (votingDishId) {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('votingDish')
      window.history.replaceState({}, '', newUrl.pathname + newUrl.search)
    }

    openDishPage(dish)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dishes, openDishPage])

  // Calculate impact when dishes update after voting
  useEffect(() => {
    if (!pendingVoteData || !dishes?.length) return

    const after = dishes.find(d => d.dish_id === pendingVoteData.dish_id)
    if (!after) return

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
    setSearchQuery('')
    setDebouncedSearchQuery('')
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
    const source = debouncedSearchQuery.trim() ? searchResults : dishes
    let result = (Array.isArray(source) ? source : []).filter(d => d && d.dish_id)

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
        result = result.slice().sort((a, b) => {
          const aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          const bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
          if (aRanked && !bRanked) return -1
          if (!aRanked && bRanked) return 1
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

    const dishMatches = (Array.isArray(dishSuggestions) ? dishSuggestions : [])
      .filter(d => d && d.dish_id && d.dish_name)
      .map(d => ({
        type: 'dish',
        id: d.dish_id,
        name: d.dish_name,
        subtitle: d.restaurant_name || '',
        data: d,
      }))

    const restaurantMatches = (Array.isArray(restaurantSuggestions) ? restaurantSuggestions : [])
      .filter(r => r && r.id && r.name)
      .map(r => ({
        type: 'restaurant',
        id: r.id,
        name: r.name,
        subtitle: r.address || '',
        data: r,
      }))

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
      openDishPage(suggestion.data)
      setSearchQuery('')
    } else if (suggestion.type === 'restaurant') {
      navigate(`/restaurants/${suggestion.id}`)
    } else if (suggestion.type === 'place') {
      // Google Places result — not in our DB yet
      toast('This restaurant hasn\'t been added yet', { duration: 2000 })
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

  // Search input event handlers (passed to BrowseSearchBar)
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
    if (e.target.value.length >= 2) {
      setAutocompleteOpen(true)
    } else {
      setAutocompleteOpen(false)
    }
    setAutocompleteIndex(-1)
  }, [])

  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true)
    if (searchQuery.length >= 2 && autocompleteSuggestions.length > 0) {
      setAutocompleteOpen(true)
    }
  }, [searchQuery, autocompleteSuggestions])

  const handleSearchBlur = useCallback(() => {
    setSearchFocused(false)
  }, [])

  const handleClearSearch = useCallback(() => {
    clearSearch()
    searchInputRef.current?.focus()
  }, [])

  // Handle search suggestion click from empty state
  const handleSearchSuggestionClick = useCallback((suggestion) => {
    setSearchQuery(suggestion)
    setDebouncedSearchQuery(suggestion)
    setSearchParams({ q: suggestion })
  }, [setSearchParams])

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
        <BrowseSearchBar
          searchQuery={searchQuery}
          searchFocused={searchFocused}
          searchInputRef={searchInputRef}
          autocompleteRef={autocompleteRef}
          autocompleteOpen={autocompleteOpen}
          autocompleteIndex={autocompleteIndex}
          autocompleteSuggestions={autocompleteSuggestions}
          selectedCategory={selectedCategory}
          onSearchChange={handleSearchChange}
          onSearchFocus={handleSearchFocus}
          onSearchBlur={handleSearchBlur}
          onSearchKeyDown={handleSearchKeyDown}
          onClearSearch={handleClearSearch}
          onAutocompleteSelect={handleAutocompleteSelect}
          onCategoryChange={handleCategoryChange}
        />
      ) : (
        <BrowseResults
          filteredDishes={filteredDishes}
          loading={loading}
          searchLoading={searchLoading}
          error={error}
          selectedCategory={selectedCategory}
          debouncedSearchQuery={debouncedSearchQuery}
          sortBy={sortBy}
          sortDropdownOpen={sortDropdownOpen}
          radius={radius}
          permissionState={permissionState}
          requestLocation={requestLocation}
          onSortChange={handleSortChange}
          onSortDropdownToggle={setSortDropdownOpen}
          onShowRadiusSheet={() => setShowRadiusSheet(true)}
          onSearchSuggestionClick={handleSearchSuggestionClick}
          onBackToCategories={handleBackToCategories}
        />
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
