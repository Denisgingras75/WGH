import { useRef, useEffect } from 'react'
import { CategoryImageCard } from '../CategoryImageCard'
import { SearchAutocomplete } from './SearchAutocomplete'
import { BROWSE_CATEGORIES } from '../../constants/categories'

const CATEGORIES = BROWSE_CATEGORIES

export function CategoryGrid({
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  autocompleteSuggestions,
  autocompleteOpen,
  autocompleteIndex,
  onAutocompleteSelect,
  onSearchKeyDown,
  onSearchFocus,
  onSearchBlur,
  searchFocused,
  onClearSearch,
  onSearchSubmit,
}) {
  const searchInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target) &&
        !searchInputRef.current?.contains(e.target)
      ) {
        // Signal to parent to close autocomplete
        onSearchBlur()
      }
    }
    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onSearchBlur])

  return (
    <div
      className="px-6 pt-5 pb-6 relative"
      style={{
        background: 'var(--color-bg)',
        minHeight: 'calc(100vh - 80px)',
      }}
    >

      {/* Section title - anchors the grid */}
      <div className="flex justify-center pt-4 pb-10">
        <span
          className="eyebrow"
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
            onClick={() => onCategoryChange(category.id)}
            size={72}
          />
        ))}
      </div>

      {/* Search bar - escape hatch, visually separate from categories */}
      <div className="mt-auto pt-10">
        <div className="relative">
          <div
            className="flex items-center gap-3 px-4 py-3 transition-all duration-150"
            style={{
              background: 'var(--color-surface-elevated)',
              border: 'var(--border-ink)',
              borderRadius: 'var(--radius-md)',
              boxShadow: searchFocused ? '4px 4px 0 var(--color-primary)' : 'var(--shadow-hard)',
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
              id="category-grid-search"
              name="category-grid-search"
              type="text"
              placeholder="Find the best ___ near you"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              onKeyDown={onSearchKeyDown}
              className="flex-1 bg-transparent outline-none border-none text-sm"
              style={{ color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: 'none' }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onClearSearch()
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
          <SearchAutocomplete
            ref={autocompleteRef}
            suggestions={autocompleteSuggestions}
            isOpen={autocompleteOpen}
            activeIndex={autocompleteIndex}
            onSelect={onAutocompleteSelect}
          />
        </div>
      </div>
    </div>
  )
}
