import { useRef, useEffect, useId } from 'react'
import { BROWSE_SORT_OPTIONS as SORT_OPTIONS } from '../../constants/app'

export function SortDropdown({ sortBy, onSortChange, isOpen, onToggle }) {
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const listboxId = useId()
  const current = SORT_OPTIONS.find(o => o.id === sortBy) || SORT_OPTIONS[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onToggle(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  // Close on Escape and return focus to the trigger
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onToggle(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onToggle])

  const handleSortChange = (sortId) => {
    onSortChange(sortId)
    onToggle(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onToggle(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={'Sort by ' + current.label}
        className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold min-h-[36px] whitespace-nowrap transition-all"
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-divider)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span aria-hidden="true">{current.icon}</span>
        <span>{current.label}</span>
        <svg
          aria-hidden="true"
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sort by"
          className="absolute left-0 mt-1 w-40 rounded-xl shadow-lg py-1 z-50"
          style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-divider)' }}
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = sortBy === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSortChange(option.id)}
                className={`w-full min-h-[44px] px-3 text-sm text-left flex items-center gap-2 transition-colors ${
                  isSelected ? 'font-semibold' : ''
                }`}
                style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span aria-hidden="true">{option.icon}</span>
                <span>{option.label}</span>
                {isSelected && (
                  <svg aria-hidden="true" className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
