import { Link, useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()
  const canGoBack = window.history.length > 1

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'var(--color-bg)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="text-center max-w-sm w-full">
        <img
          src="/empty-plate.webp"
          alt=""
          className="w-20 h-20 mx-auto mb-6 rounded-full object-cover"
        />
        <h1
          className="mb-2"
          style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            color: 'var(--color-text-primary)',
          }}
        >
          Page not found
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Looks like this dish isn't on the menu. Let's get you back to exploring.
        </p>
        <Link
          to="/"
          className="block w-full py-3 px-4 rounded-xl font-bold text-sm text-center transition-all active:scale-[0.98]"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
        >
          Back to home
        </Link>
        {canGoBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'transparent', border: '1px solid var(--color-divider)', color: 'var(--color-text-primary)' }}
          >
            Go back
          </button>
        )}
      </div>
    </div>
  )
}
