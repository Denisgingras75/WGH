import { Component } from 'react'
import { getSessionItem, setSessionItem } from '../lib/storage'
import { CHUNK_RELOAD_KEY, isChunkLoadError } from '../utils/chunkErrors'
import { ErrorFallback } from './ErrorFallback'

// Custom error boundary that lazy-loads Sentry for error reporting
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Auto-reload on chunk load errors (fallback if lazyWithRetry misses it)
    if (isChunkLoadError(error) && !getSessionItem(CHUNK_RELOAD_KEY)) {
      setSessionItem(CHUNK_RELOAD_KEY, '1')
      window.location.reload()
      return
    }

    // Lazy-load Sentry and report the error
    if (import.meta.env.PROD) {
      import('@sentry/react').then(Sentry => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo?.componentStack,
            },
          },
        })
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
