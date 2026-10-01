/**
 * Skeleton loading components for placeholder UI
 */

var BLOCK = { background: 'var(--color-divider)' }

// One placeholder row mirroring the DishListItem ranked row:
// rank · 64px icon · name / restaurant · rating / votes, divider bottom border
function DishRowSkeletonRow({ isLast = false }) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: '8px 10px',
        borderBottom: isLast ? 'none' : '1px solid var(--color-divider)',
      }}
    >
      <div className="w-7 h-4 rounded flex-shrink-0" style={BLOCK} />
      <div className="w-16 h-16 rounded-lg ml-1 flex-shrink-0" style={BLOCK} />
      <div className="flex-1 min-w-0 ml-1.5 space-y-1.5">
        <div className="h-3.5 w-3/4 rounded" style={BLOCK} />
        <div className="h-3 w-1/2 rounded" style={BLOCK} />
      </div>
      <div className="flex-shrink-0 ml-2">
        <div className="h-4 w-10 ml-auto rounded" style={BLOCK} />
        <div className="h-2.5 w-12 ml-auto rounded mt-1" style={BLOCK} />
      </div>
    </div>
  )
}

/**
 * DishRowSkeleton — loading placeholder for any DishListItem list.
 *   <DishRowSkeleton count={6} />  self-contained: one animate-pulse role="status" wrapper with N rows
 *                                  (`label` overrides the "Loading dishes" accessible name)
 *   <DishRowSkeleton />            one bare row, for callers that supply their own
 *                                  animate-pulse role="status" wrapper
 */
export function DishRowSkeleton({ count, label = 'Loading dishes' } = {}) {
  if (count == null) return <DishRowSkeletonRow />

  return (
    <div className="animate-pulse" role="status" aria-label={label}>
      {Array.from({ length: count }, function (_, i) {
        return <DishRowSkeletonRow key={i} isLast={i === count - 1} />
      })}
    </div>
  )
}

/**
 * DishAddRowSkeleton — loading placeholder for DishAddRow search results:
 * 40px icon · name / restaurant · 28px add circle, divider bottom borders.
 */
export function DishAddRowSkeleton({ count = 3, label = 'Searching dishes' } = {}) {
  return (
    <div className="animate-pulse" role="status" aria-label={label}>
      {Array.from({ length: count }, function (_, i) {
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ minHeight: 60, borderBottom: '1px solid var(--color-divider)' }}
          >
            <div className="w-10 h-10 rounded-lg flex-shrink-0" style={BLOCK} />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded" style={BLOCK} />
              <div className="h-3 w-1/2 rounded" style={BLOCK} />
            </div>
            <div className="w-7 h-7 rounded-full flex-shrink-0" style={BLOCK} />
          </div>
        )
      })}
    </div>
  )
}

// PageSkeleton - full-page placeholder for route Suspense and auth checks
export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="animate-pulse text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full" style={BLOCK} />
        <div className="h-4 w-24 mx-auto rounded" style={BLOCK} />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  )
}

// ProfileSkeleton - matches UserProfile layout
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} role="status" aria-label="Loading profile">
      <div className="animate-pulse">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex justify-between items-center">
          <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-divider)' }} />
          <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-divider)' }} />
        </div>

        {/* Profile card */}
        <div className="px-4 pb-4">
          <div className="rounded-3xl p-6" style={{ background: 'var(--color-card)', border: '1px solid var(--color-divider)' }}>
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full" style={{ background: 'var(--color-divider)' }} />
              <div className="space-y-2">
                <div className="h-6 w-32 rounded" style={{ background: 'var(--color-divider)' }} />
                <div className="h-4 w-24 rounded" style={{ background: 'var(--color-divider)' }} />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-8 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center space-y-1">
                  <div className="h-6 w-8 mx-auto rounded" style={{ background: 'var(--color-divider)' }} />
                  <div className="h-3 w-12 mx-auto rounded" style={{ background: 'var(--color-divider)' }} />
                </div>
              ))}
            </div>

            {/* Follow button */}
            <div className="h-10 w-full rounded-xl" style={{ background: 'var(--color-divider)' }} />
          </div>
        </div>

        {/* Content sections */}
        <div className="px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl" style={{ background: 'var(--color-divider)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
