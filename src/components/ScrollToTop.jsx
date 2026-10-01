import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Scrolls the window to the top when the route path changes via a link or
 * navigate() (PUSH / REPLACE). Back/forward (POP) keeps the browser's own
 * scroll position. Query-string changes are left to the page.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}

export default ScrollToTop
