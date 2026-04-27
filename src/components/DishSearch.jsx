import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { capture } from '../lib/analytics'
import { useDishSearch } from '../hooks/useDishSearch'
import { useLocationContext } from '../context/LocationContext'
import { useRestaurantSearch } from '../hooks/useRestaurantSearch'
import { AddRestaurantModal } from './AddRestaurantModal'
import { PoweredByGoogle } from './PoweredByGoogle'
import { getCategoryNeonImage, getCategoryEmoji, matchCategories } from '../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
const MIN_SEARCH_LENGTH = 2
const MAX_DISH_RESULTS = 5
const MAX_CATEGORY_RESULTS = 2

export function DishSearch({ loading = false, placeholder = "Find What's Good near you", town = null, onSearchChange = null, rightSlot = null, initialQuery = '' }) {
  const navigate = useNavigate()
  const { location, isUsingDefault } = useLocationContext()
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalQuery, setAddModalQuery] = useState('')
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Sync internal query when parent clears/changes initialQuery
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  // Client-side search for dropdown mode (instant, no network calls)
  const { results: hookResults, loading: hookLoading } = useDishSearch(
    onSearchChange ? '' : query,
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
    <div className="relative w-full">
      {/* Editorial search input */}
      <div
        className="editorial-search-input relative flex items-center gap-2"
        style={{
          background: 'var(--card-paper)',
          border: isFocused ? '1.5px solid var(--ink)' : '1px solid var(--rule)',
          borderRadius: 6,
          padding: '10px 12px',
          minHeight: 48,
          transition: 'border-color 0.12s',
        }}
      >
        <svg
          className="flex-shrink-0"
          style={{ width: 18, height: 18, color: 'var(--ink-2)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path strokeLinecap="round" d="m20 20-4-4" />
        </svg>

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
          className="flex-1 bg-transparent outline-none border-none"
          style={{
            font: "500 14px/1.2 'Inter', system-ui, sans-serif",
            color: 'var(--ink)',
            outline: 'none',
            border: 'none',
            boxShadow: 'none',
            letterSpacing: '-0.005em',
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="press"
            style={{
              padding: 4,
              background: 'transparent',
              border: 0,
              borderRadius: 999,
              color: 'var(--ink-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

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

      {/* Editorial dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="dish-search-dropdown"
          role="listbox"
          aria-label="Search results"
          className="editorial-search-dropdown absolute top-full left-0 right-0 mt-2 overflow-hidden z-50"
          style={{
            background: 'var(--card-paper)',
            border: '1px solid var(--ink)',
            borderRadius: 6,
            boxShadow: 'var(--shadow-ink)',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div
                className="animate-spin"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid var(--rule)',
                  borderTopColor: 'var(--tomato)',
                  margin: '0 auto',
                }}
              />
              <p
                className="mono"
                style={{
                  fontSize: 10,
                  marginTop: 8,
                  color: 'var(--ink-3)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                Searching
              </p>
            </div>
          ) : !hasResults ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p className="serif" style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: 'var(--ink)', margin: 0 }}>
                Nothing for &ldquo;{query}&rdquo;
              </p>
              <p className="mono" style={{ fontSize: 10, marginTop: 6, color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Try a different term
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {/* Dish Results */}
              {results.dishes.length > 0 && (
                <div>
                  <SectionHeader label={town ? `Best in ${town}` : 'Best Matches'} />
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
                  <SectionHeader label="Categories" />
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
                  <SectionHeader label="Restaurants" />

                  {restaurantLocal.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setIsFocused(false); setQuery(''); navigate('/restaurants/' + r.id) }}
                      className="search-result-row press"
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          background: 'var(--moss)',
                          color: 'var(--paper)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="serif"
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            fontStyle: 'italic',
                            color: 'var(--ink)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.name}
                        </p>
                        <p
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: 'var(--ink-3)',
                            margin: '2px 0 0',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {r.town || 'On WGH'}
                        </p>
                      </div>
                    </button>
                  ))}

                  {restaurantExternal.map((p) => (
                    <button
                      key={p.placeId}
                      type="button"
                      onClick={() => { setIsFocused(false); setQuery(''); setAddModalQuery(p.name); setAddModalOpen(true) }}
                      className="search-result-row press"
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          background: 'var(--ochre)',
                          color: 'var(--paper)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="serif"
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            fontStyle: 'italic',
                            color: 'var(--ink)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.name}
                        </p>
                        <p
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: 'var(--tomato)',
                            margin: '2px 0 0',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                          }}
                        >
                          + Add to WGH
                        </p>
                      </div>
                    </button>
                  ))}
                  {restaurantExternal.length > 0 && (
                    <div
                      style={{
                        padding: '8px 14px',
                        borderTop: '1px solid var(--rule)',
                      }}
                    >
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

function SectionHeader({ label }) {
  return (
    <div
      className="hairline-b"
      style={{
        padding: '8px 14px',
        background: 'var(--paper-2)',
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// Editorial dish result row
function DishResult({ dish, rank, onClick }) {
  const { dish_name, restaurant_name, avg_rating, total_votes, category } = dish
  const isRanked = (total_votes || 0) >= MIN_VOTES_FOR_RANKING
  const ratingNum = avg_rating != null ? Number(avg_rating) : null
  const ratingTone = ratingNum == null ? 'neutral' : ratingNum >= 7 ? 'yes' : ratingNum >= 5 ? 'neutral' : 'no'

  return (
    <button type="button" onClick={onClick} className="search-result-row press">
      <span
        className="rank-num"
        style={{
          width: 24,
          textAlign: 'center',
          fontSize: 22,
          color: rank <= 3 ? 'var(--tomato)' : 'var(--ink-2)',
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 28,
          textAlign: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {getCategoryEmoji(category) || '🍽️'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="serif"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.005em',
          }}
        >
          {dish_name}
        </p>
        <p
          style={{
            font: "500 11px/1.2 'Inter', system-ui, sans-serif",
            color: 'var(--ink-2)',
            margin: '2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {restaurant_name}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        {isRanked && ratingNum != null ? (
          <span className={'vote-pill ' + ratingTone}>
            {ratingNum.toFixed(1)}
            <span style={{ opacity: 0.55, fontWeight: 500 }}>/10</span>
          </span>
        ) : (
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {total_votes ? `${total_votes} ${total_votes === 1 ? 'vote' : 'votes'}` : 'New'}
          </span>
        )}
      </div>
    </button>
  )
}

// Editorial category result row
function CategoryResult({ category, onClick }) {
  return (
    <button type="button" onClick={onClick} className="search-result-row press">
      <div
        className="stripe-ph"
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {getCategoryNeonImage(category.id) ? (
          <img
            src={getCategoryNeonImage(category.id)}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
            aria-hidden="true"
          >
            {getCategoryEmoji(category.id) || category.label.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="serif"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
            letterSpacing: '-0.005em',
          }}
        >
          {category.label}
        </p>
        <p
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--ink-3)',
            margin: '2px 0 0',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          View ranked dishes
        </p>
      </div>
      <svg
        width="14"
        height="14"
        style={{ color: 'var(--ink-3)', flexShrink: 0 }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
