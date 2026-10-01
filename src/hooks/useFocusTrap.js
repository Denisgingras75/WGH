import { useEffect, useRef, useCallback } from 'react'

// Open traps, innermost last. Only the innermost one handles keys, so Escape in
// a nested dialog (e.g. ReviewFlow's discard prompt inside DishModal) closes
// that dialog alone instead of every dialog underneath it.
const openTraps = []

/**
 * Custom hook for trapping focus within a modal/dialog
 * Also handles Escape key to close
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @returns {Object} - ref to attach to the modal container
 */
export function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null)
  const previousActiveElement = useRef(null)
  const trapToken = useRef(null)

  // Register on the open-trap stack (keyed on isOpen only, so a new onClose
  // identity never reorders the stack)
  useEffect(() => {
    if (!isOpen) return
    const token = {}
    trapToken.current = token
    openTraps.push(token)
    return () => {
      const i = openTraps.indexOf(token)
      if (i !== -1) openTraps.splice(i, 1)
    }
  }, [isOpen])

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
    }
  }, [isOpen])

  // Focus first focusable element when modal opens
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const focusableElements = getFocusableElements(containerRef.current)
    if (focusableElements.length > 0) {
      // Small delay to ensure modal is fully rendered
      requestAnimationFrame(() => {
        focusableElements[0].focus()
      })
    }
  }, [isOpen])

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [isOpen])

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return
    // A dialog opened on top of this one owns the keyboard
    if (openTraps[openTraps.length - 1] !== trapToken.current) return

    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose?.()
      return
    }

    // Trap focus on Tab
    if (e.key === 'Tab' && containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  }, [isOpen, onClose])

  // Add keyboard listener
  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  return containerRef
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container) {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

export default useFocusTrap
