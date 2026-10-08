/**
 * Reusable location permission banner
 * Shows "Enable location for better results" when permissionState === 'prompt'
 */
export function LocationBanner({ permissionState, requestLocation, message }) {
  if (permissionState !== 'prompt') return null

  return (
    <div
      className="mb-4 p-4 rounded-xl flex items-center justify-between gap-3"
      style={{
        background: 'rgba(var(--color-accent-rgb), 0.08)',
        border: '1px solid rgba(var(--color-accent-rgb), 0.2)',
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {message || 'Enable location for better results'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          We'll sort by distance and show what's nearby
        </p>
      </div>
      <button
        onClick={requestLocation}
        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-bg)',
        }}
      >
        Enable
      </button>
    </div>
  )
}
