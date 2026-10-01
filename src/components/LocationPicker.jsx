import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../hooks/useFocusTrap'

var RADIUS_OPTIONS = [1, 5, 10, 25, 0]

// [emoji, subtitle] per radius option (0 = anywhere)
var RADIUS_META = {
  1: ['\uD83D\uDEB6', 'Walking distance'],
  5: ['\uD83D\uDEB6', 'Quick drive'],
  10: ['\uD83D\uDE97', 'Short trip'],
  25: ['\uD83D\uDEE3\uFE0F', 'Extended range'],
  0: ['\uD83C\uDF0E', 'Show all dishes everywhere'],
}

var DISMISS_THRESHOLD = 80

/**
 * Radius selection bottom sheet — swipe down to dismiss.
 * Portaled to <body> so it stacks above BottomNav (both z-50; later in DOM wins).
 */
export function RadiusSheet({ isOpen, onClose, radius, onRadiusChange }) {
  var radiusSheetRef = useFocusTrap(isOpen, onClose)
  var [dragOffset, setDragOffset] = useState(0)
  var [isDragging, setIsDragging] = useState(false)
  var dragRef = useRef({ startY: 0, isDragging: false })

  var handleRadiusSelect = function (newRadius) {
    onRadiusChange(newRadius)
    onClose()
  }

  var handleTouchStart = useCallback(function (e) {
    var touch = e.touches[0]
    dragRef.current = { startY: touch.clientY, isDragging: true }
    setIsDragging(true)
  }, [])

  var handleTouchMove = useCallback(function (e) {
    if (!dragRef.current.isDragging) return
    var touch = e.touches[0]
    var deltaY = touch.clientY - dragRef.current.startY
    // Only allow dragging down (positive delta)
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }, [])

  var handleTouchEnd = useCallback(function () {
    dragRef.current.isDragging = false
    setIsDragging(false)
    if (dragOffset > DISMISS_THRESHOLD) {
      onClose()
    }
    setDragOffset(0)
  }, [dragOffset, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: 'rgba(0,0,0,0.5)',
          opacity: dragOffset > 0 ? Math.max(0.2, 1 - dragOffset / 300) : 1,
        }}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        ref={radiusSheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="radius-sheet-title"
        className="relative w-full max-w-lg rounded-t-3xl"
        style={{
          background: 'var(--color-surface-elevated)',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          transform: 'translateY(' + dragOffset + 'px)',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
          touchAction: 'none',
        }}
        onClick={function (e) { e.stopPropagation() }}
        onTouchStart={function (e) { e.stopPropagation() }}
        onTouchMove={function (e) { e.stopPropagation() }}
        onPointerDown={function (e) { e.stopPropagation() }}
      >
        {/* Drag handle — swipe down to dismiss */}
        <div
          className="flex justify-center pt-3 pb-2"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: 'grab', touchAction: 'none' }}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-divider)' }} />
        </div>

        {/* Header — also draggable */}
        <div
          className="px-6 pb-4 border-b"
          style={{ borderColor: 'var(--color-divider)' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 id="radius-sheet-title" className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Search radius
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            How far should we look for dishes?
          </p>
        </div>

        {/* Radius Options — tappable, not drag area */}
        <div className="p-4 space-y-2 overflow-y-auto" style={{ touchAction: 'pan-y', maxHeight: '60vh' }}>
          {RADIUS_OPTIONS.map(function (r) {
            return (
              <button
                key={r}
                type="button"
                onClick={function () { handleRadiusSelect(r) }}
                aria-pressed={radius === r}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                style={radius === r ? {
                  background: 'var(--color-primary-muted)',
                  borderColor: 'var(--color-primary)'
                } : {
                  background: 'var(--color-surface)',
                  borderColor: 'transparent'
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: radius === r
                        ? 'var(--color-primary)'
                        : 'var(--color-divider)'
                    }}
                  >
                    <span aria-hidden="true" style={radius === r ? { color: 'var(--color-text-on-primary)' } : undefined}>
                      {RADIUS_META[r][0]}
                    </span>
                  </div>
                  <div className="text-left">
                    <p
                      className="font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {r === 0 ? 'Anywhere' : 'Within ' + r + ' ' + (r === 1 ? 'mile' : 'miles')}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {RADIUS_META[r][1]}
                    </p>
                  </div>
                </div>
                {radius === r && (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--color-primary)' }}
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
