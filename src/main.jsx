import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initBackButtonInterceptor } from './utils/backButtonInterceptor'
// Claude Design tokens + utilities must load BEFORE index.css so the legacy
// alias block (--color-bg: var(--paper) etc.) can see the new tokens. Vite's
// @import-in-CSS resolution was dropping this file in dev; explicit JS imports
// are always bundled.
import './styles/claude-design.css'
import './index.css'
import App from './App.jsx'

// Register popstate interceptor BEFORE React Router mounts so it fires first.
// Used by ReviewFlow to navigate between vote flow steps on browser back.
initBackButtonInterceptor()

// Configure React Query for data caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Data stays fresh for 2 minutes
      gcTime: 1000 * 60 * 10, // Cache garbage collected after 10 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch on tab focus
    },
  },
})

// Defer third-party analytics loading until after hydration
// This keeps them off the critical path for faster TTI
function initAnalytics() {
  // Initialize PostHog for user analytics
  // Attached to window so analytics.js wrapper can access it without static imports
  if (import.meta.env.VITE_PUBLIC_POSTHOG_KEY && import.meta.env.PROD) {
    import('posthog-js').then(({ default: posthog }) => {
      window.posthog = posthog
      posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
        // Use reverse proxy to avoid ad blockers (middleware at /ingest)
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        capture_pageview: true,        // Auto-track page views
        capture_pageleave: true,       // Track when users leave
        autocapture: true,             // Auto-track clicks, form submissions
        // Enable Web Vitals performance monitoring
        capture_performance: {
          web_vitals: true,            // Capture Core Web Vitals (LCP, CLS, INP)
        },
        session_recording: {
          maskAllInputs: true,         // Mask all form inputs for privacy
          maskTextSelector: '[data-mask]', // Mask elements with data-mask attribute
        },
        // Don't send user IP address
        ip: false,
        // Mask email in properties
        sanitize_properties: (properties) => {
          // Mask email addresses in all properties
          const masked = { ...properties }
          if (masked.email) {
            masked.email = masked.email.replace(/(.{2}).*(@.*)/, '$1***$2')
          }
          if (masked.$current_url) {
            // Remove any email params from URLs
            masked.$current_url = masked.$current_url.replace(/email=[^&]+/, 'email=***')
          }
          return masked
        },
      })
    })
  }

  // Initialize Sentry for error tracking
  if (import.meta.env.PROD) {
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        // Performance monitoring
        tracesSampleRate: 0.1, // 10% of transactions
        // Session replay for debugging
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      })
    })
  }
}

// Load analytics during browser idle time for minimal impact on interactivity
// Uses requestIdleCallback with setTimeout fallback for Safari
function scheduleAnalytics() {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(initAnalytics, { timeout: 3000 })
  } else {
    setTimeout(initAnalytics, 1000)
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    scheduleAnalytics()
  } else {
    window.addEventListener('load', scheduleAnalytics, { once: true })
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
