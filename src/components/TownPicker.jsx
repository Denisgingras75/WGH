import { ALL_TOWNS } from '../constants/towns'

/**
 * TownPicker — lives inline in the category chips strip.
 * Closed: soft rectangle with pin + town name inside.
 * Open: row of soft rectangles with town names inside.
 */
export function TownPicker({ town, onTownChange, isOpen, onToggle }) {
  var currentLabel = ALL_TOWNS.find(function (t) { return t.value === town })?.label || 'All Areas'

  var handleSelect = function (value) {
    onTownChange(value)
    onToggle(false)
  }

  if (isOpen) {
    return (
      <div className="flex items-center gap-2">
        {ALL_TOWNS.map(function (option) {
          var isActive = option.value === town
          return (
            <button
              key={option.label}
              onClick={function () { handleSelect(option.value) }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3"
              style={{
                height: '46px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 600,
                background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                border: isActive ? 'none' : '1.5px solid var(--color-divider)',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isActive ? 'var(--color-text-on-primary)' : 'var(--color-text-tertiary)'}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
              </svg>
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <button
      onClick={function () { onToggle(true) }}
      className="flex-shrink-0 flex items-center gap-1.5 px-3"
      style={{
        height: '46px',
        borderRadius: '14px',
        fontSize: '12px',
        fontWeight: town ? 700 : 600,
        background: town ? 'var(--color-primary)' : 'var(--color-surface)',
        color: town ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
        border: town ? 'none' : '1.5px solid var(--color-divider)',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={town ? 'var(--color-text-on-primary)' : 'var(--color-text-tertiary)'}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
      </svg>
      {currentLabel}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}
