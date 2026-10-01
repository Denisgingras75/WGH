import { capture } from '../../lib/analytics'
import { sanitizeUrl } from '../../utils/sanitize'

const BAR_BUTTON = 'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]'

/**
 * Floating action bar above BottomNav on the Dish page: Order Now (or See Menu) + Directions.
 */
export function DishActionBar({ dish }) {
  const orderHref = dish.toast_slug
    ? 'https://order.toasttab.com/online/' + dish.toast_slug
    : sanitizeUrl(dish.order_url)
  const menuHref = sanitizeUrl(dish.website_url)
  const directionsHref = dish.restaurant_lat && dish.restaurant_lng
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + dish.restaurant_lat + ',' + dish.restaurant_lng
    : 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent((dish.restaurant_address || (dish.restaurant_name + ', ' + (dish.restaurant_town || "Martha's Vineyard") + ', MA')))

  return (
    <div
      className="fixed left-0 right-0 px-3"
      style={{
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        zIndex: 40,
      }}
    >
      <div
        className="flex gap-2 p-2 rounded-2xl"
        style={{
          background: 'var(--color-card)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15), 0 0 0 1px var(--color-divider)',
        }}
      >
        {orderHref ? (
          <a
            href={orderHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={function () { capture('order_clicked', {
              dish_id: dish.dish_id,
              dish_name: dish.dish_name,
              restaurant_id: dish.restaurant_id,
              restaurant_name: dish.restaurant_name,
              source: dish.toast_slug ? 'toast' : 'order_url',
            }) }}
            className={BAR_BUTTON}
            style={{
              background: 'var(--color-accent-orange)',
              color: 'var(--color-text-on-primary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
            Order Now
          </a>
        ) : menuHref ? (
          <a
            href={menuHref}
            target="_blank"
            rel="noopener noreferrer"
            className={BAR_BUTTON}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-on-primary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            See Menu
          </a>
        ) : null}

        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={BAR_BUTTON}
          style={{
            background: 'var(--color-accent-gold)',
            color: 'var(--color-text-on-primary)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          Directions
        </a>
      </div>
    </div>
  )
}
