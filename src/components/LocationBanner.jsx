/**
 * Reusable location permission banner
 * Shows "Enable location for better results" when permissionState === 'prompt'
 */
export function LocationBanner({ permissionState, requestLocation, message }) {
  if (permissionState !== 'prompt') return null

  return (
    <div
      className="mb-4 p-4 flex items-center justify-between gap-3"
      style={{
        background: 'var(--color-card)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="min-w-0">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
          {message || 'Enable location for better results'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          We'll sort by distance and show what's nearby
        </p>
      </div>
      <button
        onClick={requestLocation}
        className="btn flex-shrink-0 px-4 py-2 text-sm"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-text-on-primary)',
        }}
      >
        Enable
      </button>
    </div>
  )
}
