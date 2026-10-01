import { useState, useRef, useEffect } from 'react'

const MIN_SEARCH_LENGTH = 2

// Inline search field: emits the trimmed query (or '' below MIN_SEARCH_LENGTH)
// to the parent, which renders the results (Home list mode, Map mode).
export function DishSearch({ placeholder = "Find What's Good near you", onSearchChange = null, rightSlot = null, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  // Last value sent to the parent. Echoes of it coming back as initialQuery
  // must not overwrite what the user is typing (trailing spaces, 1-char input).
  const lastEmittedRef = useRef(initialQuery)

  // Sync internal query only when the parent sets a different value (e.g. clears it)
  useEffect(() => {
    if (initialQuery !== lastEmittedRef.current) {
      lastEmittedRef.current = initialQuery
      setQuery(initialQuery)
    }
  }, [initialQuery])

  // Pass query to parent for inline results
  useEffect(() => {
    if (!onSearchChange) return
    const trimmed = query.trim()
    const timer = setTimeout(() => {
      const value = trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : ''
      lastEmittedRef.current = value
      onSearchChange(value)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, onSearchChange])

  // Enter / keyboard "Search": emit immediately and dismiss the keyboard
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const trimmed = query.trim()
    const value = trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : ''
    lastEmittedRef.current = value
    if (onSearchChange) onSearchChange(value)
    inputRef.current?.blur()
  }

  return (
    <div className="relative w-full">
      <label htmlFor="dish-search" className="sr-only">Search dishes by name</label>
      {/* Search Input */}
      <div
        className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
        style={{
          background: 'var(--color-surface-elevated)',
          border: isFocused ? '2px solid var(--color-primary)' : '2px solid var(--color-divider)',
          minHeight: '48px',
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
          ref={inputRef}
          id="dish-search"
          name="dish-search"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none border-none text-sm"
          style={{ color: 'var(--color-text-primary)', outline: 'none', border: 'none', boxShadow: 'none' }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="w-11 h-11 -my-3 -mx-2 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
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

        {rightSlot}
      </div>
    </div>
  )
}
