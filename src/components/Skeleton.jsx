/**
 * Skeleton loading components for placeholder UI
 */

// DishRowSkeleton - matches DishRow layout (rank circle, image, text, rating area, arrow)
export function DishRowSkeleton() {
  return (
    <div
      className="w-full flex items-center gap-3 p-2.5"
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-divider)',
        borderRadius: 'var(--radius-lg)',
      }}
      role="status"
      aria-label="Loading dish"
    >
      {/* Rank circle */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: 'var(--color-divider)' }}
      />

      {/* Photo */}
      <div
        className="w-12 h-12 flex-shrink-0 animate-pulse"
        style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-sm)' }}
      />

      {/* Dish + Restaurant text */}
      <div className="flex-1 min-w-0 space-y-2">
        <div
          className="h-4 w-3/4 animate-pulse"
          style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
        />
        <div
          className="h-3 w-1/2 animate-pulse"
          style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
        />
      </div>

      {/* Rating + Votes area */}
      <div className="flex-shrink-0 space-y-1.5 text-right">
        <div
          className="h-4 w-14 ml-auto animate-pulse"
          style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
        />
        <div
          className="h-2.5 w-16 ml-auto animate-pulse"
          style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
        />
      </div>

      {/* Arrow indicator */}
      <div
        className="w-6 h-6 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: 'var(--color-divider)' }}
      />
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
          <div
            className="p-6"
            style={{
              background: 'var(--color-surface)',
              border: '2px solid var(--color-divider)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full" style={{ background: 'var(--color-divider)' }} />
              <div className="space-y-2">
                <div className="h-6 w-32" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }} />
                <div className="h-4 w-24" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }} />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-8 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center space-y-1">
                  <div className="h-6 w-8 mx-auto" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-sm)' }} />
                  <div className="h-3 w-12 mx-auto" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }} />
                </div>
              ))}
            </div>

            {/* Follow button */}
            <div className="h-10 w-full" style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>

        {/* Content sections */}
        <div className="px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-20"
              style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-divider)',
                borderRadius: 'var(--radius-lg)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// DishCardSkeleton - matches BrowseCard layout (image, content area)
export function DishCardSkeleton() {
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-divider)',
        borderRadius: 'var(--radius-lg)',
      }}
      role="status"
      aria-label="Loading dish"
    >
      {/* Image area with 16/10 aspect ratio */}
      <div
        className="aspect-[16/10] animate-pulse"
        style={{ background: 'var(--color-divider)' }}
      />

      {/* Content area */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Dish name */}
            <div
              className="h-5 w-4/5 animate-pulse"
              style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
            />
            {/* Restaurant + price */}
            <div
              className="h-4 w-3/5 animate-pulse"
              style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
            />
            {/* Rating info */}
            <div
              className="h-3 w-2/5 animate-pulse"
              style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
            />
          </div>

          {/* Tap indicator placeholder */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div
              className="w-10 h-10 rounded-full animate-pulse"
              style={{ background: 'var(--color-divider)' }}
            />
            <div
              className="h-2 w-6 animate-pulse"
              style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-pill)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
