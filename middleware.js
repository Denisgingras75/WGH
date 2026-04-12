// Vercel Edge Middleware to proxy PostHog requests
// This avoids ad blocker blocking by routing through our domain

const POSTHOG_HOST = 'us.i.posthog.com'
const POSTHOG_ASSETS_HOST = 'us-assets.i.posthog.com'

export const config = {
  matcher: '/ingest/:path*',
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Remove /ingest prefix and determine target host
  const path = pathname.replace('/ingest', '')
  let targetHost = POSTHOG_HOST

  if (path.startsWith('/static')) {
    targetHost = POSTHOG_ASSETS_HOST
  }

  const targetUrl = new URL(`https://${targetHost}${path}${url.search}`)

  // Clone headers but update host
  const headers = new Headers(request.headers)
  headers.set('host', targetHost)
  headers.delete('connection')

  // Forward the request
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'follow',
  })

  try {
    const response = await fetch(proxyRequest)

    // Return response with CORS headers
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', 'https://whats-good-here.vercel.app')
    responseHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('PostHog proxy error:', error)
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
