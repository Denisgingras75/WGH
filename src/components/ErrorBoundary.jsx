import { Component } from 'react'
import { getSessionItem, setSessionItem } from '../lib/storage'

function ErrorFallback({ error, resetError }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-category-strip)', border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
        >
          <span className="text-2xl">😵</span>
        </div>
        <h1 className="mb-2" style={{ color: 'var(--color-text-primary)', fontSize: '26px', lineHeight: 1.1 }}>
          Something went wrong
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          We've been notified and are working on it. Try refreshing the page.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-ink w-full px-4 py-3.5"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', fontSize: '16px' }}
          >
            Refresh Page
          </button>
          <button
            onClick={resetError}
            className="btn-ink w-full px-4 py-3.5"
            style={{ background: 'var(--color-card)', color: 'var(--color-ink)', fontSize: '16px' }}
          >
            Try Again
          </button>
        </div>
        {import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="eyebrow cursor-pointer">
              Error details (dev only)
            </summary>
            <pre
              className="mt-2 p-3 text-xs overflow-auto"
              style={{ background: 'var(--color-surface)', color: 'var(--color-danger)', border: '1.5px dashed var(--color-divider)', borderRadius: 'var(--radius-sm)' }}
            >
              {error?.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

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
    const msg = error?.message || ''
    const isChunkError = (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch')
    )
    if (isChunkError && !getSessionItem('wgh_chunk_reload')) {
      setSessionItem('wgh_chunk_reload', '1')
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

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}
