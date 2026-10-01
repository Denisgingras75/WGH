/**
 * ErrorFallback — root crash screen rendered by ErrorBoundary.
 * The boundary sits outside BrowserRouter, so navigation uses window.location.
 */
export function ErrorFallback({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-md w-full">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(var(--color-danger-rgb), 0.1)' }}
        >
          <span className="text-2xl" aria-hidden="true">😵</span>
        </div>
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
          Something went wrong
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          We've been notified and are working on it. Try refreshing the page.
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Refresh Page
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
            style={{
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
            }}
          >
            Go to home
          </button>
        </div>
        {import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
              Error details (dev only)
            </summary>
            <pre className="mt-2 p-3 rounded-lg text-xs overflow-auto" style={{ background: 'var(--color-surface)', color: 'var(--color-danger)' }}>
              {error?.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
