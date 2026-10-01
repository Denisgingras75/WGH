import { CategoryIcon } from './home/CategoryIcons'

/**
 * DishAddRow — one result row for every "search a dish → add it to a list" flow
 * (My Top 10 search, playlist AddDishSearchSheet). Same type scale as DishListItem:
 * 40px food icon · dish name (14/700) / restaurant · town (12px tertiary) · circled +,
 * which turns into a filled ✓ once the dish is on the list. Divider bottom border.
 *
 * Props:
 *   dish     - { dish_id|id, dish_name|name, restaurant_name, restaurant_town, category }
 *   added    - dish is already on the list (row disabled, ✓ shown)
 *   disabled - temporarily not tappable (e.g. an add is in flight)
 *   onAdd    - tap handler
 */
export function DishAddRow({ dish, added = false, disabled = false, onAdd }) {
  var name = dish.dish_name || dish.name
  var restaurantName = dish.restaurant_name
  var town = dish.restaurant_town

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={added || disabled}
      aria-label={(added ? name + ', added' : 'Add ' + name) + (restaurantName ? ' from ' + restaurantName : '')}
      className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-all active:scale-[0.98]"
      style={{
        minHeight: 60,
        background: 'transparent',
        borderBottom: '1px solid var(--color-divider)',
        opacity: disabled && !added ? 0.7 : 1,
      }}
    >
      <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 40, height: 40 }} aria-hidden="true">
        <CategoryIcon categoryId={dish.category} dishName={name} size={40} />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className="block truncate"
          style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-text-primary)' }}
        >
          {name}
        </span>
        {restaurantName && (
          <span className="block truncate" style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
            {restaurantName}
            {town ? ' · ' + town : ''}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 28,
          height: 28,
          border: '2px solid var(--color-primary)',
          background: added ? 'var(--color-primary)' : 'transparent',
          color: added ? 'var(--color-text-on-primary)' : 'var(--color-primary)',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {added ? '✓' : '+'}
      </span>
    </button>
  )
}

export default DishAddRow
