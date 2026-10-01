/**
 * RadiusChip — "5 mi ▾" chip that opens the radius sheet.
 * Used in the homepage search bar (list + map modes), Browse and Restaurants.
 *
 * Props:
 *   radius      - miles (0 = anywhere)
 *   onOpen      - opens the RadiusSheet
 *   inSearchBar - sits inside the 48px search field: negative vertical margin keeps
 *                 the 36px hit area from growing the bar, and the label is compact
 */
export function RadiusChip({ radius, onOpen, inSearchBar = false }) {
  var label = radius === 0 ? (inSearchBar ? 'All' : 'Anywhere') : radius + ' mi'
  return (
    <button
      type="button"
      onClick={function (e) { e.stopPropagation(); onOpen() }}
      aria-haspopup="dialog"
      aria-label={radius === 0 ? 'Search radius: anywhere. Tap to change' : 'Search radius: ' + radius + ' miles. Tap to change'}
      className={
        'inline-flex items-center gap-1 px-3 min-h-[36px] rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95'
        + (inSearchBar ? ' -my-1.5' : ' py-2')
      }
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-divider)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {label}
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}
