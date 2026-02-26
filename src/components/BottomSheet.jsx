import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react'
import { logger } from '../utils/logger'

var DETENTS = {
  peek: 0.15,
  half: 0.50,
  full: 0.85,
}

var DETENT_VALUES = [DETENTS.peek, DETENTS.half, DETENTS.full]

// Velocity threshold (fraction-of-viewport per ms) — flick must be faster than this
var VELOCITY_THRESHOLD = 0.0004

function BottomSheetInner({ children, initialDetent, onDetentChange, contentRef: externalContentRef }, ref) {
  var sheetRef = useRef(null)
  var internalContentRef = useRef(null)
  var contentScrollRef = externalContentRef || internalContentRef
  var dragRef = useRef({
    startY: 0,
    startHeight: 0,
    isDragging: false,
    // Velocity tracking: store last few touch samples
    lastTouches: [], // { time, y }
    dragSource: 'handle', // 'handle' or 'content'
  })
  var [heightFraction, setHeightFraction] = useState(initialDetent || DETENTS.half)

  // Snap with velocity awareness
  var snapWithVelocity = useCallback(function (fraction, velocity) {
    var target

    // If velocity exceeds threshold, snap to NEXT detent in direction of movement
    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      if (velocity > 0) {
        // Flicking UP — go to next higher detent
        target = DETENT_VALUES[DETENT_VALUES.length - 1] // default to highest
        for (var i = 0; i < DETENT_VALUES.length; i++) {
          if (DETENT_VALUES[i] > fraction) {
            target = DETENT_VALUES[i]
            break
          }
        }
      } else {
        // Flicking DOWN — go to next lower detent
        target = DETENT_VALUES[0] // default to lowest
        for (var j = DETENT_VALUES.length - 1; j >= 0; j--) {
          if (DETENT_VALUES[j] < fraction) {
            target = DETENT_VALUES[j]
            break
          }
        }
      }
    } else {
      // No significant velocity — snap to nearest
      target = DETENT_VALUES[0]
      var minDist = Math.abs(fraction - target)
      for (var k = 1; k < DETENT_VALUES.length; k++) {
        var dist = Math.abs(fraction - DETENT_VALUES[k])
        if (dist < minDist) {
          minDist = dist
          target = DETENT_VALUES[k]
        }
      }
    }

    setHeightFraction(target)
    if (onDetentChange) {
      var name = target === DETENTS.peek ? 'peek' : target === DETENTS.half ? 'half' : 'full'
      onDetentChange(name)
    }
  }, [onDetentChange])

  // Calculate velocity from recent touch samples (last ~100ms)
  var calculateVelocity = useCallback(function () {
    var touches = dragRef.current.lastTouches
    if (touches.length < 2) return 0

    var now = Date.now()
    // Find the sample closest to 100ms ago
    var startIdx = 0
    for (var i = touches.length - 1; i >= 0; i--) {
      if (now - touches[i].time >= 80) {
        startIdx = i
        break
      }
    }

    var start = touches[startIdx]
    var end = touches[touches.length - 1]
    var dt = end.time - start.time
    if (dt === 0) return 0

    // deltaY is positive when dragging up (increasing fraction)
    var deltaFraction = (start.y - end.y) / window.innerHeight
    return deltaFraction / dt
  }, [])

  // Record touch sample for velocity tracking
  var recordTouch = useCallback(function (clientY) {
    var now = Date.now()
    var touches = dragRef.current.lastTouches
    touches.push({ time: now, y: clientY })
    // Keep only samples from last 200ms
    while (touches.length > 0 && now - touches[0].time > 200) {
      touches.shift()
    }
  }, [])

  // ─── Handle drag (touch) on the drag handle ─────────────────
  var handleTouchStart = useCallback(function (e) {
    var touch = e.touches[0]
    dragRef.current = {
      startY: touch.clientY,
      startHeight: heightFraction,
      isDragging: true,
      lastTouches: [{ time: Date.now(), y: touch.clientY }],
      dragSource: 'handle',
    }
    // Prevent body scroll during drag
    document.body.style.overflow = 'hidden'
  }, [heightFraction])

  var handleTouchMove = useCallback(function (e) {
    if (!dragRef.current.isDragging) return
    var touch = e.touches[0]
    recordTouch(touch.clientY)
    var deltaY = dragRef.current.startY - touch.clientY
    var deltaFraction = deltaY / window.innerHeight
    var newFraction = Math.max(0.10, Math.min(0.90, dragRef.current.startHeight + deltaFraction))
    setHeightFraction(newFraction)
  }, [recordTouch])

  var handleTouchEnd = useCallback(function () {
    if (!dragRef.current.isDragging) return
    dragRef.current.isDragging = false
    document.body.style.overflow = ''
    var velocity = calculateVelocity()
    snapWithVelocity(heightFraction, velocity)
  }, [heightFraction, snapWithVelocity, calculateVelocity])

  // ─── Scroll-to-collapse: content area touch handling ─────────
  var contentDragRef = useRef({
    startY: 0,
    isCollapsing: false,
  })

  var handleContentTouchStart = useCallback(function (e) {
    var scrollEl = contentScrollRef.current
    if (!scrollEl) return
    var touch = e.touches[0]
    contentDragRef.current = {
      startY: touch.clientY,
      isCollapsing: false,
      startScrollTop: scrollEl.scrollTop,
    }
  }, [contentScrollRef])

  var handleContentTouchMove = useCallback(function (e) {
    var scrollEl = contentScrollRef.current
    if (!scrollEl) return

    var touch = e.touches[0]
    var deltaY = touch.clientY - contentDragRef.current.startY

    // If scrolled to top and dragging down — enter collapse mode
    if (scrollEl.scrollTop <= 0 && deltaY > 0 && contentDragRef.current.startScrollTop <= 0) {
      // Prevent normal scroll
      e.preventDefault()

      if (!contentDragRef.current.isCollapsing) {
        // Transition into sheet-drag mode
        contentDragRef.current.isCollapsing = true
        dragRef.current = {
          startY: contentDragRef.current.startY,
          startHeight: heightFraction,
          isDragging: true,
          lastTouches: [{ time: Date.now(), y: touch.clientY }],
          dragSource: 'content',
        }
        document.body.style.overflow = 'hidden'
      }

      // Update sheet position
      if (dragRef.current.isDragging) {
        recordTouch(touch.clientY)
        var sheetDeltaY = dragRef.current.startY - touch.clientY
        var deltaFraction = sheetDeltaY / window.innerHeight
        var newFraction = Math.max(0.10, Math.min(0.90, dragRef.current.startHeight + deltaFraction))
        setHeightFraction(newFraction)
      }
    }
  }, [heightFraction, recordTouch, contentScrollRef])

  var handleContentTouchEnd = useCallback(function () {
    if (contentDragRef.current.isCollapsing && dragRef.current.isDragging) {
      dragRef.current.isDragging = false
      contentDragRef.current.isCollapsing = false
      document.body.style.overflow = ''
      var velocity = calculateVelocity()
      snapWithVelocity(heightFraction, velocity)
    }
  }, [heightFraction, snapWithVelocity, calculateVelocity])

  // ─── Mouse drag for desktop testing ─────────────────────────
  var handleMouseDown = useCallback(function (e) {
    dragRef.current = {
      startY: e.clientY,
      startHeight: heightFraction,
      isDragging: true,
      lastTouches: [{ time: Date.now(), y: e.clientY }],
      dragSource: 'handle',
    }
    document.body.style.overflow = 'hidden'

    var handleMouseMove = function (ev) {
      recordTouch(ev.clientY)
      var deltaY = dragRef.current.startY - ev.clientY
      var deltaFraction = deltaY / window.innerHeight
      var newFraction = Math.max(0.10, Math.min(0.90, dragRef.current.startHeight + deltaFraction))
      setHeightFraction(newFraction)
    }
    var handleMouseUp = function () {
      dragRef.current.isDragging = false
      document.body.style.overflow = ''
      var velocity = calculateVelocity()
      snapWithVelocity(heightFraction, velocity)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [heightFraction, snapWithVelocity, calculateVelocity, recordTouch])

  // ─── Imperative handle: let parent set detent programmatically ─────
  useImperativeHandle(ref, function () {
    return {
      setDetent: function (detentName) {
        var value = DETENTS[detentName]
        if (value == null) {
          logger.warn('BottomSheet.setDetent: unknown detent "' + detentName + '"')
          return
        }
        setHeightFraction(value)
        if (onDetentChange) onDetentChange(detentName)
      },
      getContentEl: function () {
        return contentScrollRef.current
      },
    }
  }, [onDetentChange, contentScrollRef])

  // Clean up body overflow on unmount
  useEffect(function () {
    return function () {
      document.body.style.overflow = ''
    }
  }, [])

  var isDragging = dragRef.current.isDragging
  var sheetHeight = Math.round(heightFraction * 100)

  // Stop all pointer/touch events from leaking through the sheet to the map below
  var stopPropagation = useCallback(function (e) {
    e.stopPropagation()
  }, [])

  return (
    <div
      ref={sheetRef}
      className="fixed left-0 right-0 bottom-0 z-20"
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
      style={{
        height: sheetHeight + 'vh',
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        background: 'var(--color-surface-elevated)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingBottom: '64px', /* BottomNav height */
        willChange: isDragging ? 'height' : 'auto',
      }}
    >
      {/* Drag handle — 48px minimum touch target */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        className="flex-shrink-0"
        style={{
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--color-divider)',
          }}
        />
      </div>

      {/* Scrollable content with scroll-to-collapse */}
      <div
        ref={contentScrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleContentTouchStart}
        onTouchMove={handleContentTouchMove}
        onTouchEnd={handleContentTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

var BottomSheet = forwardRef(BottomSheetInner)

export { BottomSheet, DETENTS }
