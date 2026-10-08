import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="text-center max-w-sm w-full">
        <img
          src="/empty-plate.webp"
          alt=""
          className="w-24 h-24 mx-auto mb-6 rounded-full object-cover"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-ink)',
            boxShadow: 'var(--shadow-hard)',
          }}
        />
        <h1
          className="mb-2"
          style={{ color: 'var(--color-text-primary)', fontSize: '30px', lineHeight: 1.05 }}
        >
          Page not found
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}
        >
          Looks like this dish isn't on the menu. Let's get you back to exploring.
        </p>
        <Link
          to="/"
          className="btn-ink w-full py-3.5 px-6 text-center"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
        >
          Explore the Map
        </Link>
      </div>
    </div>
  )
}
