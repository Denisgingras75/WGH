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
        background: 'var(--color-card)',
        border: '1px solid var(--color-divider)',
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
        type="button"
        onClick={requestLocation}
        className="flex-shrink-0 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-text-on-primary)',
        }}
      >
        Enable
      </button>
    </div>
  )
}
