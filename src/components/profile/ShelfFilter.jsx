/**
 * ShelfFilter — horizontal scrollable shelf filter bar for the journal feed.
 *
 * Props:
 *   shelves  - array of { id, label }
 *   active   - currently active shelf id
 *   onSelect - callback when shelf is tapped
 */
export function ShelfFilter({ shelves, active, onSelect }) {
  return (
    <div
      className="flex gap-1 px-4 py-2"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--color-bg)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {shelves.map(function (shelf) {
        var isActive = shelf.id === active
        return (
          <button
            key={shelf.id}
            onClick={function () { onSelect(shelf.id) }}
            className="flex-shrink-0 px-3 py-1.5 transition-colors"
            style={{
              fontWeight: isActive ? '700' : '400',
              fontSize: '13px',
              color: isActive ? 'var(--color-ink)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-highlight)' : 'var(--color-card)',
              border: isActive ? 'var(--border-subtle)' : '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-pill)',
              whiteSpace: 'nowrap',
            }}
          >
            {shelf.label}
          </button>
        )
      })}
    </div>
  )
}
