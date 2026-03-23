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
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.icon}</span>
        <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 rounded-xl shadow-lg border py-1 z-50" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSortChange(option.id)}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                sortBy === option.id ? 'font-medium' : ''
              }`}
              style={{ color: sortBy === option.id ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
