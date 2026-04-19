import { memo } from 'react'
import { BROWSE_CATEGORIES } from '../../constants/categories'

/**
 * Horizontal scrolling category chip strip — Claude Design prototype `.chip` pattern.
 * Drop-in replacement for the pre-redesign CategoryIcons row on Home.
 */
export var CategoryChipStrip = memo(function CategoryChipStrip({ active, onSelect }) {
  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '4px 20px 14px',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <button
        type="button"
        onClick={function () { onSelect && onSelect(null) }}
        className={'chip ' + (!active ? 'active' : '')}
        style={{
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          padding: '8px 14px',
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14 }}>•</span> All
      </button>
      {BROWSE_CATEGORIES.map(function (cat) {
        return (
          <button
            key={cat.id}
            type="button"
            onClick={function () { onSelect && onSelect(cat.id) }}
            className={'chip ' + (active === cat.id ? 'active' : '')}
            style={{
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              padding: '8px 14px',
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14 }}>{cat.emoji}</span> {cat.label}
          </button>
        )
      })}
    </div>
  )
})
