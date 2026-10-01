import { BROWSE_CATEGORIES } from '../../constants/categories'
import { CategoryImageCard } from '../CategoryImageCard'
import { SearchAutocomplete } from './SearchAutocomplete'

const CATEGORIES = BROWSE_CATEGORIES
const LISTBOX_ID = 'browse-search-listbox'

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
  const listOpen = autocompleteOpen && autocompleteSuggestions.length > 0

  return (
    <div className="px-4 pb-6 relative">
      <h1
        className="pt-5 mb-5"
        style={{
          fontFamily: "'Amatic SC', cursive",
          fontSize: '32px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1.1,
          color: 'var(--color-text-primary)',
        }}
      >
        Categories
      </h1>

      {/* Category grid - BROWSE_CATEGORIES, 3 columns */}
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
      <div className="pt-10">
        <div className="relative">
          <label htmlFor="browse-search" className="sr-only">Search dishes</label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
            style={{
              background: 'var(--color-surface)',
              border: searchFocused ? '2px solid var(--color-primary)' : '2px solid var(--color-divider)',
            }}
          >
            <svg
              aria-hidden="true"
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
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listOpen}
              aria-controls={listOpen ? LISTBOX_ID : undefined}
              aria-activedescendant={listOpen && autocompleteIndex >= 0 ? `${LISTBOX_ID}-option-${autocompleteIndex}` : undefined}
              placeholder="Find the best ___ near you"
              value={searchQuery}
              onChange={onSearchChange}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              onKeyDown={onSearchKeyDown}
              className="flex-1 bg-transparent outline-none border-none text-sm"
              style={{ color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: 'none' }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={onClearSearch}
                className="w-11 h-11 -my-3 -mr-3 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
              >
                <svg
                  aria-hidden="true"
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

          <SearchAutocomplete
            ref={autocompleteRef}
            id={LISTBOX_ID}
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
