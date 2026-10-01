import { useState, useEffect, useRef } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine)

    const handleOffline = () => {
      clearTimeout(timerRef.current)
      setIsOffline(true)
      setShowReconnected(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      // Show "back online" message briefly
      setShowReconnected(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setShowReconnected(false), 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      clearTimeout(timerRef.current)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9998] text-center py-2 px-4 text-sm font-medium animate-slideDown"
      style={{
        background: isOffline ? 'var(--color-danger)' : 'var(--color-success)',
        color: 'var(--color-text-on-primary)',
        paddingTop: 'max(8px, env(safe-area-inset-top))',
        pointerEvents: 'none',
      }}
    >
      {isOffline ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          You're offline
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Back online
        </span>
      )}
    </div>
  )
}
