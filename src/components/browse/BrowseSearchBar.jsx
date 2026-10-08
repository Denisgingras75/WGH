import { BROWSE_CATEGORIES } from '../../constants/categories'
import { CategoryImageCard } from '../CategoryImageCard'

const CATEGORIES = BROWSE_CATEGORIES

export function BrowseSearchBar({
  searchQuery,
  searchFocused,
  searchInputRef,
  autocompleteRef,
  autocompleteOpen,
  autocompleteIndex,
  autocompleteSuggestions,
  selectedCategory,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onSearchKeyDown,
  onClearSearch,
  onAutocompleteSelect,
  onCategoryChange,
}) {
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
        <h2 style={{ fontSize: '30px', color: 'var(--color-text-primary)' }}>
          Categories
        </h2>
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
              background: searchFocused ? 'var(--color-card)' : 'var(--color-surface)',
              border: searchFocused ? '1px solid var(--color-ink)' : '1px solid transparent',
              borderRadius: 'var(--radius-md)',
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
              onChange={onSearchChange}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              onKeyDown={onSearchKeyDown}
              aria-label="Search dishes"
              className="flex-1 bg-transparent outline-none border-none text-sm"
              style={{ color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: 'none' }}
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                onClick={onClearSearch}
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
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)', border: '1px solid var(--color-divider)' }}
            >
              {autocompleteSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => onAutocompleteSelect(suggestion)}
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
                        ? 'var(--color-accent-muted)'
                        : 'var(--color-primary-muted)',
                      color: suggestion.type === 'dish'
                        ? 'var(--color-primary)'
                        : suggestion.type === 'place'
                        ? 'var(--color-accent)'
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
  )
}
