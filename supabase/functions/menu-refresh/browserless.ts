/**
 * Browserless API client — fetches fully-rendered HTML for JavaScript-heavy sites.
 *
 * Docs:
 *   https://docs.browserless.io/rest-apis/content
 *   https://docs.browserless.io/rest-apis/unblock
 *   https://docs.browserless.io/rest-apis/request-configuration
 *
 * Pricing (2026 prototyping plan):
 *   - $25/year for 20,000 units
 *   - 1 unit = up to 30s of browser time
 *   - Overages: $0.002/unit
 *
 * Important gotchas:
 *   - /content returns HTTP 200 even when the TARGET site returned 403/404.
 *     The real target status is in the `X-Response-Code` response header.
 *     We check this header and throw on 4xx/5xx target responses.
 *   - `waitForTimeout` is a TOP-LEVEL body field for "sleep after load",
 *     NOT `gotoOptions.timeout` which is the navigation timeout.
 *   - /unblock requires `?proxy=residential` in the query string per the docs.
 */

const BROWSERLESS_BASE = 'https://production-sfo.browserless.io'

export interface RenderOptions {
  // Navigation timeout in ms (default 30000)
  gotoTimeout?: number
  // Extra sleep after load in ms — gives JS frameworks time to hydrate
  waitForTimeoutMs?: number
  // CSS selector to wait for before considering the page loaded
  waitForSelector?: string
  // Use residential proxy + unblock pipeline (costs more, for 403-blocked sites)
  useUnblock?: boolean
}

export type BrowserlessErrorCode =
  | 'NO_API_KEY'
  | 'RENDER_TIMEOUT'
  | 'RENDER_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'TARGET_ERROR'

export class BrowserlessError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: BrowserlessErrorCode
  ) {
    super(message)
    this.name = 'BrowserlessError'
  }
}

/**
 * Fetch fully-rendered HTML for a URL using Browserless.
 * Throws BrowserlessError on failure.
 */
export async function fetchRenderedHtml(url: string, options: RenderOptions = {}): Promise<string> {
  const apiKey = Deno.env.get('BROWSERLESS_API_KEY')
  if (!apiKey) {
    throw new BrowserlessError('BROWSERLESS_API_KEY not configured', 500, 'NO_API_KEY')
  }

  const endpoint = options.useUnblock ? '/unblock' : '/content'
  const query = options.useUnblock
    ? `?token=${encodeURIComponent(apiKey)}&proxy=residential`
    : `?token=${encodeURIComponent(apiKey)}`
  const fullUrl = `${BROWSERLESS_BASE}${endpoint}${query}`

  const body: Record<string, unknown> = {
    url,
    gotoOptions: {
      // networkidle0 = wait for ZERO network requests for 500ms (stricter than networkidle2)
      // Wix/Square load menu data via XHR after the initial page load, so we need
      // to wait for ALL network activity to settle, not just most of it.
      waitUntil: 'networkidle0',
      timeout: options.gotoTimeout ?? 30000,
    },
  }

  // Top-level waitForTimeout — sleep after page load (NOT navigation timeout)
  if (options.waitForTimeoutMs != null) {
    body.waitForTimeout = options.waitForTimeoutMs
  }

  if (options.waitForSelector) {
    body.waitForSelector = { selector: options.waitForSelector, timeout: 10000 }
  }

  // /unblock requires content: true to return the HTML in the JSON response
  if (options.useUnblock) {
    body.browserWSEndpoint = false
    body.cookies = false
    body.content = true
    body.screenshot = false
    body.ttl = 0
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // overall wall clock

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 429 || errorText.includes('quota')) {
        throw new BrowserlessError(`Browserless quota exceeded: ${errorText}`, response.status, 'QUOTA_EXCEEDED')
      }
      throw new BrowserlessError(`Browserless render failed: ${response.status} ${errorText}`, response.status, 'RENDER_FAILED')
    }

    // Check if the TARGET site returned an error even though Browserless returned 200
    const targetStatusHeader = response.headers.get('x-response-code')
    if (targetStatusHeader) {
      const targetStatus = parseInt(targetStatusHeader, 10)
      if (!isNaN(targetStatus) && targetStatus >= 400) {
        throw new BrowserlessError(
          `Target site returned ${targetStatus}`,
          targetStatus,
          'TARGET_ERROR'
        )
      }
    }

    if (options.useUnblock) {
      const json = await response.json()
      return json.content || ''
    }

    return await response.text()
  } catch (err) {
    if (err instanceof BrowserlessError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new BrowserlessError('Browserless render timeout', 408, 'RENDER_TIMEOUT')
    }
    throw new BrowserlessError(
      `Browserless request failed: ${err instanceof Error ? err.message : String(err)}`,
      500,
      'RENDER_FAILED'
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
