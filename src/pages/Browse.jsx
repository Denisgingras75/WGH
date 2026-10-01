import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate, useNavigationType } from 'react-router-dom'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useDishSearch } from '../hooks/useDishSearch'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { MIN_VOTES_FOR_RANKING, BROWSE_SORT_OPTIONS } from '../constants/app'
import { AddRestaurantModal } from '../components/AddRestaurantModal'
import { RadiusSheet } from '../components/LocationPicker'
import { useRestaurantSearch } from '../hooks/useRestaurantSearch'
import { BrowseSearchBar, BrowseResults } from '../components/browse'
import { calculateDistance } from '../utils/distance'
import { getUserMessage } from '../utils/errorHandler'

export function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [addRestaurantQuery, setAddRestaurantQuery] = useState(null)
  // Persisted sort choice; an unknown saved value falls back to Top Rated
  const [sortBy, setSortBy] = useState(() => {
    const saved = getStorageItem(STORAGE_KEYS.BROWSE_SORT)
    return BROWSE_SORT_OPTIONS.some(o => o.id === saved) ? saved : 'top_rated'
  })
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  // Autocomplete state
  const [autocompleteOpen, setAutocompleteOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1)

  const { location, radius, setRadius, permissionState, requestLocation, isUsingDefault } = useLocationContext()
  const [showRadiusSheet, setShowRadiusSheet] = useState(false)

  const searchGeo = {
    lat: location ? location.lat : null,
    lng: location ? location.lng : null,
    radiusMiles: radius,
    isUsingDefault: isUsingDefault,
  }

  // Full results for a submitted text search (client-side over the cached ['allDishes'] query)
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useDishSearch(debouncedSearchQuery, 50, searchGeo)

  // Live dish suggestions while typing — same cache, no extra network call
  const { results: dishSuggestions } = useDishSearch(searchQuery, 5, searchGeo)

  // Google Places restaurant search — don't bias by default MV location or Browse radius
  const placesLat = isUsingDefault ? null : location?.lat
  const placesLng = isUsingDefault ? null : location?.lng
  const { localResults: hookRestaurantResults, externalResults: placesResults } = useRestaurantSearch(
    searchQuery, placesLat, placesLng, searchQuery.trim().length >= 2, null
  )

  const searchInputRef = useRef(null)
  const autocompleteRef = useRef(null)

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

  // Switching category or submitting a search swaps the whole view (grid →
  // results) without a path change, so ScrollToTop doesn't fire. Start the new
  // view at the top so the sticky results header never covers the first rows.
  // Back/forward (POP) keeps the browser's restored position.
  const navigationType = useNavigationType()
  const activeCategoryParam = searchParams.get('category')
  const activeQueryParam = searchParams.get('q')
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [activeCategoryParam, activeQueryParam, navigationType])

  // Handle sort change (SortDropdown closes itself)
  const handleSortChange = (sortId) => {
    setSortBy(sortId)
    setStorageItem(STORAGE_KEYS.BROWSE_SORT, sortId)
  }

  // Restaurant suggestions derived from useRestaurantSearch (no duplicate fetch)
  const restaurantSuggestions = useMemo(
    () => (hookRestaurantResults || []).slice(0, 3),
    [hookRestaurantResults]
  )

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
  const isTextSearch = !!debouncedSearchQuery.trim()
  const shouldFetchFromUseDishes = selectedCategory && !isTextSearch

  const { dishes, loading, error, refetch } = useDishes(
    shouldFetchFromUseDishes ? location : null,
    radius,
    selectedCategory,
    null
  )

  // Navigate to full dish page
  const openDishPage = useCallback((dish) => {
    navigate(`/dish/${dish.dish_id}`)
  }, [navigate])

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

  // Back to the Browse category grid
  const handleBackToCategories = () => handleCategoryChange(null)

  // Results header back button: history back, or the grid on a deep link
  const handleResultsBack = () => (window.history.length > 1 ? navigate(-1) : handleCategoryChange(null))

  // Text-search rows carry restaurant coords but no distance — add it so
  // "Closest" sorts and DishListItem can show distance
  const searchResultsWithDistance = useMemo(() => {
    if (!location) return searchResults
    return searchResults.map(d => (
      d.restaurant_lat != null && d.restaurant_lng != null
        ? { ...d, distance_miles: calculateDistance(location.lat, location.lng, d.restaurant_lat, d.restaurant_lng) }
        : d
    ))
  }, [searchResults, location])

  // Filter and sort dishes
  const filteredDishes = useMemo(() => {
    const source = debouncedSearchQuery.trim() ? searchResultsWithDistance : dishes
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
  }, [dishes, debouncedSearchQuery, sortBy, searchResultsWithDistance])

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
      // Google Places result — open Add Restaurant modal with the place name prefilled
      setAddRestaurantQuery(suggestion.data?.name || suggestion.data?.description || searchQuery)
    }
  }, [navigate, openDishPage, searchQuery])

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
      case 'Tab':
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
  const showingDishes = selectedCategory || isTextSearch

  // Text search reads the dish cache; category browse reads useDishes (already { message })
  const resultsError = isTextSearch
    ? (searchError ? { message: getUserMessage(searchError, 'searching dishes') } : null)
    : error

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
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
          error={resultsError}
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
          onBack={handleResultsBack}
          onRetry={isTextSearch ? refetchSearch : refetch}
        />
      )}

      <RadiusSheet
        isOpen={showRadiusSheet}
        onClose={() => setShowRadiusSheet(false)}
        radius={radius}
        onRadiusChange={setRadius}
      />

      <AddRestaurantModal
        isOpen={addRestaurantQuery !== null}
        onClose={() => setAddRestaurantQuery(null)}
        initialQuery={addRestaurantQuery || ''}
      />
    </div>
  )
}
