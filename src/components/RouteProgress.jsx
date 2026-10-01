/**
 * Route transition loading bar using NProgress
 * Shows a slim brand-colored progress bar at the top during route changes
 * (styles for #nprogress live in index.css; the library stylesheet is not imported)
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import NProgress from 'nprogress'

// Configure NProgress - no spinner, just the bar
NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  speed: 300,
  trickleSpeed: 100,
})

export function RouteProgress() {
  const location = useLocation()
  const previousPath = useRef(location.pathname)

  useEffect(() => {
    // Only trigger on actual path changes (not hash or search changes)
    if (previousPath.current !== location.pathname) {
      NProgress.start()
      // Complete after a brief moment (simulates load completion)
      const timer = setTimeout(() => {
        NProgress.done()
      }, 200)
      previousPath.current = location.pathname
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  return null
}
