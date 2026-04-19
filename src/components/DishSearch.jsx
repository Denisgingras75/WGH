import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { capture } from '../lib/analytics'
import { useDishSearch } from '../hooks/useDishSearch'
import { useLocationContext } from '../context/LocationContext'
import { useRestaurantSearch } from '../hooks/useRestaurantSearch'
import { AddRestaurantModal } from './AddRestaurantModal'
import { PoweredByGoogle } from './PoweredByGoogle'
import { getCategoryNeonImage, matchCategories } from '../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getRatingColor } from '../utils/ranking'

const MIN_SEARCH_LENGTH = 2
const MAX_DISH_RESULTS = 5
const MAX_CATEGORY_RESULTS = 2

// Prototype search-glass icon (matches Icon.Browse in remix.html)
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

export function DishSearch({ loading = false, placeholder = "Search a dish, restaurant, or 'lobster roll'…", town = null, onSearchChange = null, rightSlot = null, initialQuery = '' }) {
  const navigate = useNavigate()
  const { location, isUsingDefault } = useLocationContext()
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalQuery, setAddModalQuery] = useState('')
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const wrapperRef = useRef(null)

  // Sync internal query when parent clears/changes initialQuery
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  // Client-side search for dropdown mode (instant, no network calls)
  const { results: hookResults, loading: hookLoading } = useDishSearch(
    onSearchChange ? '' : query,  // Only search in dropdown mode
    MAX_DISH_RESULTS,
    town
  )

  // Restaurant search fallback — shows when dish results are thin (dropdown mode only)
  const isDropdownMode = !onSearchChange
  const showRestaurantFallback = isDropdownMode && query.length >= MIN_SEARCH_LENGTH && !hookLoading
  const placesLat = isUsingDefault ? null : (location ? location.lat : null)
  const placesLng = isUsingDefault ? null : (location ? location.lng : null)
  const restaurantData = useRestaurantSearch(query, placesLat, placesLng, showRestaurantFallback)
  const restaurantLocal = restaurantData.localResults
  const restaurantExternal = restaurantData.externalResults
  const hasRestaurantResults = restaurantLocal.length > 0 || restaurantExternal.length > 0

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Pass query to parent for inline results (homepage mode)
  useEffect(() => {
    if (onSearchChange) {
      const trimmed = query.trim()
      const timer = setTimeout(() => {
        onSearchChange(trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : '')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [query, onSearchChange])

  // Find matching categories (client-side, searches ALL_CATEGORIES with fuzzy scoring)
  const matchingCategories = useMemo(() => {
    if (query.length < MIN_SEARCH_LENGTH) return []
    return matchCategories(query).slice(0, MAX_CATEGORY_RESULTS)
  }, [query])

  const results = {
    dishes: onSearchChange ? [] : hookResults,
    categories: matchingCategories,
  }

  const hasResults = results.dishes.length > 0 || results.categories.length > 0 || hasRestaurantResults
  const showDropdown = !onSearchChange && isFocused && query.length >= MIN_SEARCH_LENGTH
  const isLoading = loading || (hookLoading && !onSearchChange)

  // Handle dish selection
  const handleDishSelect = (dish) => {
    capture('search_performed', {
      query: query,
      result_type: 'dish',
      selected_dish_id: dish.dish_id,
      selected_dish_name: dish.dish_name,
      selected_restaurant: dish.restaurant_name,
      results_count: results.dishes.length,
    })
    setQuery('')
    setIsFocused(false)
    navigate(`/dish/${dish.dish_id}`)
  }

  // Handle category selection
  const handleCategorySelect = (category) => {
    capture('search_performed', {
      query: query,
      result_type: 'category',
      selected_category: category.id,
      results_count: results.categories.length,
    })
    setQuery('')
    setIsFocused(false)
    navigate(`/browse?category=${encodeURIComponent(category.id)}`)
  }

  // Handle Enter key - go to full search results page (dropdown mode only)
  const handleKeyDown = (e) => {
    if (onSearchChange) return
    if (e.key === 'Enter' && query.trim().length >= MIN_SEARCH_LENGTH) {
      capture('search_performed', {
        query: query.trim(),
        result_type: 'full_search',
        dish_results_count: results.dishes.length,
        category_results_count: results.categories.length,
      })
      setQuery('')
      setIsFocused(false)
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Search Row — matches prototype SearchRow */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Input wrapper */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            background: 'var(--card)',
            padding: '10px 12px 10px 36px',
          }}
        >
          <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--ink-3)' }}>
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id="dish-search"
            name="dish-search"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search dishes by name"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="dish-search-dropdown"
            style={{
              border: 0,
              background: 'transparent',
              outline: 'none',
              width: '100%',
              font: '500 14px/1.2 Inter',
              color: 'var(--ink)',
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 0,
                background: 'transparent',
                padding: 4,
                cursor: 'pointer',
                color: 'var(--ink-3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Right slot — consumers can pass a filter/radius button */}
        {rightSlot}
      </div>

      {/* Add Restaurant Modal (dropdown mode only) */}
      {isDropdownMode && (
        <AddRestaurantModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          initialQuery={addModalQuery}
        />
      )}

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="dish-search-dropdown"
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 z-50"
          style={{
            top: '100%',
            marginTop: 8,
            background: 'var(--card)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div
                className="animate-spin"
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid var(--rule)',
                  borderTopColor: 'var(--tomato)',
                  borderRadius: '50%',
                  margin: '0 auto',
                }}
              />
              <p style={{ font: '500 12px/1.2 Inter', marginTop: 8, color: 'var(--ink-3)' }}>
                Searching...
              </p>
            </div>
          ) : !hasResults ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ font: '500 14px/1.3 Inter', color: 'var(--ink-2)' }}>
                No dishes found for "{query}"
              </p>
              <p style={{ font: '500 12px/1.3 Inter', marginTop: 4, color: 'var(--ink-3)' }}>
                Try a different search term
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {/* Dish Results */}
              {results.dishes.length > 0 && (
                <div>
                  <SectionLabel>{town ? `Best in ${town}` : 'Best Matches'}</SectionLabel>
                  {results.dishes.map((dish, index) => (
                    <DishResult
                      key={dish.dish_id}
                      dish={dish}
                      rank={index + 1}
                      onClick={() => handleDishSelect(dish)}
                    />
                  ))}
                </div>
              )}

              {/* Category Results */}
              {results.categories.length > 0 && (
                <div>
                  <SectionLabel>Categories</SectionLabel>
                  {results.categories.map((category) => (
                    <CategoryResult
                      key={category.id}
                      category={category}
                      onClick={() => handleCategorySelect(category)}
                    />
                  ))}
                </div>
              )}

              {/* Restaurant fallback — local DB + Google Places */}
              {hasRestaurantResults && (
                <div>
                  <SectionLabel>Restaurants</SectionLabel>

                  {restaurantLocal.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setIsFocused(false); setQuery(''); navigate('/restaurants/' + r.id) }}
                      className="w-full text-left"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: 'var(--tomato)',
                          color: 'var(--paper)',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ font: '600 14px/1.2 Inter', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</p>
                        <p style={{ font: '500 12px/1.3 Inter', color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.town || 'On WGH'}</p>
                      </div>
                    </button>
                  ))}

                  {restaurantExternal.map((p) => (
                    <button
                      key={p.placeId}
                      onClick={() => { setIsFocused(false); setQuery(''); setAddModalQuery(p.name); setAddModalOpen(true) }}
                      className="w-full text-left"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: 'var(--tomato-soft)',
                          color: 'var(--tomato)',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ font: '600 14px/1.2 Inter', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                        <p style={{ font: '500 12px/1.3 Inter', color: 'var(--tomato)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Add to WGH</p>
                      </div>
                    </button>
                  ))}
                  {restaurantExternal.length > 0 && (
                    <div style={{ padding: '8px 16px', borderTop: '1px solid var(--rule)' }}>
                      <PoweredByGoogle align="right" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Section label — uppercase caption above each result group
function SectionLabel({ children }) {
  return (
    <div
      style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--rule)',
        font: '600 10px/1.2 Inter',
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
      }}
    >
      {children}
    </div>
  )
}

// Individual dish result row — matches Top 10 compact style
function DishResult({ dish, rank, onClick }) {
  const { dish_name, restaurant_name, avg_rating, total_votes } = dish
  const isRanked = (total_votes || 0) >= MIN_VOTES_FOR_RANKING

  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span
        style={{
          width: 24,
          textAlign: 'center',
          font: '700 14px/1.2 Inter',
          color: 'var(--ink-3)',
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ font: '500 14px/1.3 Inter', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ color: 'var(--ink-2)' }}>{restaurant_name}</span>
          {' · '}
          {dish_name}
        </p>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {isRanked ? (
          <span style={{ font: '700 14px/1.2 Inter', color: getRatingColor(avg_rating) }}>
            {avg_rating || '—'}
          </span>
        ) : (
          <span style={{ font: '500 12px/1.2 Inter', color: 'var(--ink-3)' }}>
            {total_votes ? `${total_votes} vote${total_votes === 1 ? '' : 's'}` : 'New'}
          </span>
        )}
      </div>
    </button>
  )
}

// Category result row
function CategoryResult({ category, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper-2)',
        }}
      >
        {getCategoryNeonImage(category.id) ? (
          <img
            src={getCategoryNeonImage(category.id)}
            alt={category.label}
            loading="lazy"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
        ) : (
          <span style={{ font: '600 16px/1 Inter', color: 'var(--ink)' }}>{category.label.charAt(0)}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ font: '600 14px/1.2 Inter', color: 'var(--ink)' }}>
          {category.label}
        </h4>
        <p style={{ font: '500 12px/1.3 Inter', color: 'var(--ink-3)', marginTop: 2 }}>
          View all ranked dishes
        </p>
      </div>

      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ color: 'var(--ink-3)', flexShrink: 0 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
