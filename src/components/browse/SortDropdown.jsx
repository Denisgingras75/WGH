import { useRef, useEffect } from 'react'

const SORT_OPTIONS = [
  { id: 'top_rated', label: 'Top Rated', icon: '⭐' },
  { id: 'best_value', label: 'Best Value', icon: '💰' },
  { id: 'most_voted', label: 'Most Voted', icon: '💬' },
  { id: 'closest', label: 'Closest', icon: '📍' },
]

export function SortDropdown({ sortBy, onSortChange, isOpen, onToggle }) {
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onToggle(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onToggle])

  const handleSortChange = (sortId) => {
    onSortChange(sortId)
    onToggle(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => onToggle(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap transition-colors"
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-ink)',
          background: 'var(--color-card)',
          border: 'var(--border-subtle)',
          borderRadius: 'var(--radius-pill)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-card-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-card)'}
      >
        <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.icon}</span>
        <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.label}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-44 p-1 z-50"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSortChange(option.id)}
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors"
              style={{
                color: sortBy === option.id ? 'var(--color-ink)' : 'var(--color-text-secondary)',
                fontWeight: sortBy === option.id ? 600 : 500,
                borderRadius: 'var(--radius-sm)',
                background: sortBy === option.id ? 'var(--color-highlight-muted)' : 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = sortBy === option.id ? 'var(--color-highlight-muted)' : 'transparent'}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {sortBy === option.id && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
