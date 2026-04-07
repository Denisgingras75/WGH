import { useRef, useEffect } from 'react'
import { BROWSE_CATEGORIES, getCategoryNeonImage } from '../../constants/categories'

export function MapCategoryBar({ activeCategory, onCategoryChange }) {
  var scrollRef = useRef(null)
  var activeRef = useRef(null)

  // Scroll active icon into view when category changes
  useEffect(function () {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeCategory])

  return (
    <div
      style={{
        background: 'rgba(240, 236, 232, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: '6px 4px',
      }}
    >
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Near You — no category filter */}
        <button
          ref={activeCategory === null ? activeRef : null}
          onClick={function () { onCategoryChange(null) }}
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: activeCategory === null ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: activeCategory === null ? 'rgba(228, 68, 10, 0.12)' : 'transparent',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          aria-label="Near You — all categories"
          title="Near You"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeCategory === null ? 'var(--color-primary)' : 'var(--color-text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>

        {BROWSE_CATEGORIES.map(function (cat) {
          var isActive = activeCategory === cat.id
          var iconSrc = getCategoryNeonImage(cat.id)

          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : null}
              onClick={function () { onCategoryChange(cat.id) }}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: isActive ? 'rgba(228, 68, 10, 0.12)' : 'transparent',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              aria-label={cat.label}
              title={cat.label}
            >
              {iconSrc ? (
                <img src={iconSrc} alt="" width={28} height={28} loading="lazy" />
              ) : (
                <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
