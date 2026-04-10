# Browserless Render Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Layer 1 menu extraction fails on JavaScript-rendered sites (Wix, Square Online), automatically render the page via Browserless and retry extraction — all inline in the same job attempt.

**Architecture:** Add an inline render fallback to the existing `menu-refresh` Edge Function. When raw HTML extraction returns `page_too_short` or `no_dishes` on a detected JS-rendered CMS (Wix/Square/Weebly), call Browserless `/content` to get the fully-rendered HTML, then re-run the existing Sonnet extraction pipeline on the rendered output. Same job, same processing attempt — no new tables, no new crons, no UI changes.

**Tech Stack:** Supabase Edge Functions (Deno), Browserless `/content` API ($25/year prototyping plan), existing Sonnet 4.6 extraction pipeline

**Background (from Codex review 2026-04-10):**
- Don't build a separate "Managed Agent" — overkill for the actual failure modes
- Don't wait for `dead` status before trying render — fix it in the same attempt
- Browserless is cheaper and simpler: 20k renders/year for $25
- The existing dishes hook doesn't watch for `dead → completed`, so inline is the only safe path

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/functions/menu-refresh/index.ts` | Modify | Add CMS detection, Browserless client, render fallback inline |
| `supabase/functions/menu-refresh/cms-detect.ts` | Create | Pure function: detect CMS from HTML/URL signatures |
| `supabase/functions/menu-refresh/browserless.ts` | Create | Browserless API client (fetchRenderedHtml) |
| `supabase/functions/menu-refresh/cms-detect.test.ts` | Create | Unit tests for CMS detection |
| `supabase/migrations/add-browserless-columns.sql` | Create | No schema changes — error_context already JSONB |

**Key design decisions:**
- Keep `menu-refresh/index.ts` as the entrypoint — Supabase Edge Functions bundle into one file, so we import from sibling files
- CMS detection is pure (testable without network) — separate from the fetch logic
- Browserless client is a thin wrapper — easy to swap if we ever change providers
- No new schema — Codex confirmed `error_context JSONB` can hold the new fields

---

## Prerequisites

Before starting implementation:

1. **Sign up for Browserless** at https://www.browserless.io
2. **Get API token** — choose the $25/year prototyping plan (20,000 units)
3. **Set Supabase secret** in dashboard → Edge Functions → Secrets:
   - Name: `BROWSERLESS_API_KEY`
   - Value: your Browserless token

---

### Task 1: CMS Detection Module

**Files:**
- Create: `supabase/functions/menu-refresh/cms-detect.ts`
- Create: `supabase/functions/menu-refresh/cms-detect.test.ts`

- [ ] **Step 1: Write the test file**

Create `supabase/functions/menu-refresh/cms-detect.test.ts`:

```ts
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { detectCms } from './cms-detect.ts'

Deno.test('detects Wix by wixstatic URL', () => {
  const html = '<html><link href="https://static.wixstatic.com/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'wix')
})

Deno.test('detects Wix by wixsite in URL', () => {
  const html = '<html></html>'
  assertEquals(detectCms(html, 'https://example.wixsite.com/mysite'), 'wix')
})

Deno.test('detects Wix by parastorage asset URL', () => {
  const html = '<html><script src="https://static.parastorage.com/services/wix-thunderbolt/dist/main.js"></script></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'wix')
})

Deno.test('detects Wix Thunderbolt framework marker', () => {
  const html = '<html><script>window.viewerModel = {}; // Wix Thunderbolt</script></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'wix')
})

Deno.test('detects Square Online by square-cdn', () => {
  const html = '<html><link href="https://square-cdn.com/styles.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'square')
})

Deno.test('detects Square Online by square.site URL', () => {
  const html = '<html></html>'
  assertEquals(detectCms(html, 'https://example.square.site/'), 'square')
})

Deno.test('detects Weebly by weeblycloud asset', () => {
  const html = '<html><link href="https://cdn2.editmysite.com/css/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'weebly')
})

Deno.test('detects Squarespace by squarespace-cdn', () => {
  const html = '<html><link href="https://static1.squarespace.com/static/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), 'squarespace')
})

Deno.test('returns null for plain HTML with no CMS signatures', () => {
  const html = '<html><body><h1>My Restaurant</h1><p>Menu items here</p></body></html>'
  assertEquals(detectCms(html, 'http://example.com'), null)
})

Deno.test('returns null for WordPress (not a JS-rendered CMS)', () => {
  const html = '<html><link href="https://example.com/wp-content/themes/main.css"></html>'
  assertEquals(detectCms(html, 'http://example.com'), null)
})

Deno.test('case-insensitive URL matching', () => {
  const html = '<html></html>'
  assertEquals(detectCms(html, 'https://EXAMPLE.WIXSITE.COM/'), 'wix')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd supabase/functions/menu-refresh && deno test cms-detect.test.ts`
Expected: FAIL — `cms-detect.ts` does not exist.

- [ ] **Step 3: Write the implementation**

Create `supabase/functions/menu-refresh/cms-detect.ts`:

```ts
/**
 * Detect the CMS powering a website from its raw HTML and URL.
 * Returns the CMS id if it's a JS-rendered platform where raw HTML extraction will likely fail,
 * or null if it's plain/server-rendered HTML that should work with normal fetching.
 *
 * We only return a CMS id for platforms where the raw HTML response is essentially
 * a JavaScript framework loader, not actual content. WordPress, plain HTML, etc.
 * return null because those work fine with the existing extraction pipeline.
 */
export type CmsId = 'wix' | 'square' | 'weebly' | 'squarespace'

interface CmsSignature {
  id: CmsId
  urlPatterns: RegExp[]
  htmlPatterns: RegExp[]
}

const SIGNATURES: CmsSignature[] = [
  {
    id: 'wix',
    urlPatterns: [
      /\.wixsite\.com/i,
      /\.wix\.com/i,
    ],
    htmlPatterns: [
      /static\.wixstatic\.com/i,
      /static\.parastorage\.com/i,
      /wix-thunderbolt/i,
      /viewerModel/,
    ],
  },
  {
    id: 'square',
    urlPatterns: [
      /\.square\.site/i,
    ],
    htmlPatterns: [
      /square-cdn\.com/i,
      /squareup\.com\/online/i,
      /data-square-merchant-id/i,
    ],
  },
  {
    id: 'weebly',
    urlPatterns: [
      /\.weebly\.com/i,
    ],
    htmlPatterns: [
      /editmysite\.com/i,
      /weeblycloud\.com/i,
    ],
  },
  {
    id: 'squarespace',
    urlPatterns: [
      /\.squarespace\.com/i,
    ],
    htmlPatterns: [
      /static1\.squarespace\.com/i,
      /squarespace-cdn\.com/i,
    ],
  },
]

export function detectCms(html: string, url: string): CmsId | null {
  for (const sig of SIGNATURES) {
    for (const pattern of sig.urlPatterns) {
      if (pattern.test(url)) return sig.id
    }
    for (const pattern of sig.htmlPatterns) {
      if (pattern.test(html)) return sig.id
    }
  }
  return null
}

/**
 * Returns true if the CMS is known to require JavaScript rendering to surface menu content.
 * Squarespace actually serves content in raw HTML, so it's included for detection but not
 * marked as requiring render.
 */
export function cmsRequiresRender(cms: CmsId | null): boolean {
  return cms === 'wix' || cms === 'square' || cms === 'weebly'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd supabase/functions/menu-refresh && deno test cms-detect.test.ts`
Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/menu-refresh/cms-detect.ts supabase/functions/menu-refresh/cms-detect.test.ts
git commit -m "feat: add CMS detection module for render fallback decision"
```

---

### Task 2: Browserless Client

**Files:**
- Create: `supabase/functions/menu-refresh/browserless.ts`

- [ ] **Step 1: Write the client**

Create `supabase/functions/menu-refresh/browserless.ts`:

```ts
/**
 * Browserless API client — fetches fully-rendered HTML for JavaScript-heavy sites.
 *
 * Docs: https://docs.browserless.io/rest-apis/content
 *
 * Pricing (2026 prototyping plan):
 *   - $25/year for 20,000 units
 *   - 1 unit = up to 30s of browser time
 *   - Overages: $0.002/unit
 *
 * We use the /content endpoint which returns fully rendered HTML as text/html.
 * Set BROWSERLESS_API_KEY env var.
 */

const BROWSERLESS_BASE = 'https://production-sfo.browserless.io'

export interface RenderOptions {
  // Max wait in ms before returning even if page isn't fully loaded
  waitForTimeout?: number
  // CSS selector to wait for before considering the page loaded
  waitForSelector?: string
  // Use residential proxy (costs more, required for 403-blocked sites)
  useUnblock?: boolean
}

export class BrowserlessError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: 'NO_API_KEY' | 'RENDER_TIMEOUT' | 'RENDER_FAILED' | 'QUOTA_EXCEEDED'
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
  const fullUrl = `${BROWSERLESS_BASE}${endpoint}?token=${encodeURIComponent(apiKey)}`

  const body: Record<string, unknown> = {
    url,
    gotoOptions: {
      waitUntil: 'networkidle2',
      timeout: options.waitForTimeout ?? 30000,
    },
  }

  if (options.waitForSelector) {
    body.waitForSelector = { selector: options.waitForSelector, timeout: 10000 }
  }

  // /unblock requires slightly different body shape
  if (options.useUnblock) {
    body.browserWSEndpoint = false
    body.cookies = false
    body.content = true
    body.screenshot = false
    body.ttl = 0
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

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
    throw new BrowserlessError(`Browserless request failed: ${err instanceof Error ? err.message : String(err)}`, 500, 'RENDER_FAILED')
  } finally {
    clearTimeout(timeoutId)
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd supabase/functions/menu-refresh && deno check browserless.ts`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/menu-refresh/browserless.ts
git commit -m "feat: add Browserless API client for rendered HTML fetching"
```

---

### Task 3: Refactor fetchMenuContent into fetch + extract

**Files:**
- Modify: `supabase/functions/menu-refresh/index.ts` (existing `fetchMenuContent` function around line 295-359)

The current `fetchMenuContent(url)` does two things: fetches HTML and extracts text. Split them so we can reuse the extractor on rendered HTML.

- [ ] **Step 1: Locate the existing function**

Read `supabase/functions/menu-refresh/index.ts` lines 292-360. The current `fetchMenuContent` function takes a URL, fetches HTML, strips it down with 3 strategies (JSON-LD, menu scripts, plain text), and returns up to 60k chars of combined text.

- [ ] **Step 2: Replace the function with two functions**

Replace the entire `fetchMenuContent` function (lines 292-360 approximately) with:

```ts
/**
 * Fetch raw HTML from a URL with a browser-ish User-Agent and 20s timeout.
 * Returns the full HTML text. Caller is responsible for extracting content.
 */
async function fetchRawHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsGoodHere-MenuBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Extract menu-relevant text from HTML using 3 strategies, combined.
 * Returns up to 60k chars of text suitable for Sonnet extraction.
 */
function extractMenuTextFromHtml(html: string): string {
  // Strategy 1: Extract JSON-LD structured data (common on Squarespace/Wix)
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  const jsonLdText = jsonLdMatches
    .map(m => m.replace(/<\/?script[^>]*>/gi, ''))
    .join(' ')

  // Strategy 2: Extract script tags that look like menu data (prices, items)
  const menuScripts: string[] = []
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1]
    if (content.match(/\$\d+|\bprice\b|\bmenu\b.*\d{1,3}\.\d{2}/i) && content.length < 5000) {
      menuScripts.push(content)
    }
  }

  // Strategy 3: Standard HTML text extraction
  const plainText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  const parts: string[] = []
  if (jsonLdText.length > 20) parts.push('=== STRUCTURED DATA ===\n' + jsonLdText)
  if (menuScripts.length > 0) parts.push('=== EMBEDDED DATA ===\n' + menuScripts.join('\n'))
  parts.push('=== PAGE TEXT ===\n' + plainText)

  return parts.join('\n\n').slice(0, 60000)
}

/**
 * Legacy wrapper — same signature as before so existing callers still work.
 */
async function fetchMenuContent(url: string): Promise<string> {
  const html = await fetchRawHtml(url)
  return extractMenuTextFromHtml(html)
}
```

- [ ] **Step 3: Verify the file still compiles**

Run: `cd supabase/functions/menu-refresh && deno check index.ts`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/menu-refresh/index.ts
git commit -m "refactor: split fetchMenuContent into fetchRawHtml + extractMenuTextFromHtml"
```

---

### Task 4: Add Render Fallback to Queue Processing

**Files:**
- Modify: `supabase/functions/menu-refresh/index.ts` (queue processing mode, around line 630-700)

The queue mode currently calls `fetchMenuContent(menuUrl)`, then checks for `page_too_short`, then calls Sonnet, then checks for `no_dishes`. We need to wrap all of that so that if the content is too short OR Sonnet returns no dishes AND the CMS is a JS-rendered one, we retry with Browserless.

- [ ] **Step 1: Add imports at top of file**

Find the imports at the top of `supabase/functions/menu-refresh/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
```

Add after them:

```ts
import { detectCms, cmsRequiresRender } from './cms-detect.ts'
import { fetchRenderedHtml, BrowserlessError } from './browserless.ts'
```

- [ ] **Step 2: Replace the inline processing block in queue mode**

In the queue mode's `for (const job of jobs)` loop, find the block that starts with:

```ts
      const content = await fetchMenuContent(menuUrl)

      if (content.length < 50) {
```

And ends just before the `upsertDishes` call. Replace that whole block (from the fetchMenuContent line through the end of the `if (extracted.dishes.length === 0)` block) with:

```ts
      // --- Fetch + extract (with render fallback for JS-rendered sites) ---
      let rawHtml: string
      try {
        rawHtml = await fetchRawHtml(menuUrl)
      } catch (fetchErr) {
        const classified = classifyError(fetchErr)
        const newAttemptCount = job.attempt_count + 1
        await supabase.from('menu_import_jobs').update({
          status: newAttemptCount >= job.max_attempts ? 'dead' : 'pending',
          attempt_count: newAttemptCount,
          run_after: newAttemptCount >= job.max_attempts ? undefined : calculateBackoff(newAttemptCount).toISOString(),
          error_code: classified.code,
          error_message: classified.message,
          error_context: { ...classified.context, menu_url: menuUrl },
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'fetch_failed', restaurant: restaurant.name, error: classified.code })
        continue
      }

      const cms = detectCms(rawHtml, menuUrl)
      let content = extractMenuTextFromHtml(rawHtml)
      let rendererAttempted = false
      let renderedTextLen: number | null = null

      // Render fallback #1: content too short AND CMS requires rendering
      if (content.length < 50 && cmsRequiresRender(cms)) {
        console.log(`${restaurant.name}: content too short + ${cms} CMS, attempting render fallback`)
        try {
          const renderedHtml = await fetchRenderedHtml(menuUrl)
          rendererAttempted = true
          content = extractMenuTextFromHtml(renderedHtml)
          renderedTextLen = content.length
        } catch (renderErr) {
          console.error(`${restaurant.name}: render failed:`, renderErr)
        }
      }

      if (content.length < 50) {
        const classified = classifyError(null, 'page_too_short')
        const newAttemptCount = job.attempt_count + 1
        await supabase.from('menu_import_jobs').update({
          status: newAttemptCount >= job.max_attempts ? 'dead' : 'pending',
          attempt_count: newAttemptCount,
          run_after: newAttemptCount >= job.max_attempts ? undefined : calculateBackoff(newAttemptCount).toISOString(),
          error_code: classified.code,
          error_message: classified.message,
          error_context: {
            menu_url: menuUrl,
            website_url: websiteUrl,
            cms_detected: cms,
            raw_html_len: rawHtml.length,
            raw_text_len: content.length,
            renderer_attempted: rendererAttempted,
            rendered_text_len: renderedTextLen,
          },
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'page_too_short', restaurant: restaurant.name })
        continue
      }

      // Content hash — skip if unchanged
      const contentHash = await hashContent(content)
      if (restaurant.menu_content_hash && restaurant.menu_content_hash === contentHash) {
        await supabase.from('restaurants').update({ menu_last_checked: new Date().toISOString() }).eq('id', restaurant.id)
        await supabase.from('menu_import_jobs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          dishes_found: 0, dishes_inserted: 0, dishes_updated: 0, dishes_unchanged: 0,
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'unchanged', restaurant: restaurant.name })
        continue
      }

      // Closed detection
      const closedSignal = detectClosed(content)
      if (closedSignal) {
        await supabase.from('restaurants').update({
          is_open: false, menu_last_checked: new Date().toISOString(),
        }).eq('id', restaurant.id)

        if (job.job_type === 'refresh') {
          await supabase.from('menu_import_jobs').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_message: `Closed: ${closedSignal}`,
            lock_expires_at: null,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id)
          results.push({ job_id: job.id, status: 'closed', restaurant: restaurant.name })
          continue
        }
      }

      // Extract with Sonnet
      let extracted = await extractMenuWithClaude(content, restaurant.name)

      // Render fallback #2: zero dishes AND CMS requires rendering AND we haven't rendered yet
      if (extracted.dishes.length === 0 && cmsRequiresRender(cms) && !rendererAttempted) {
        console.log(`${restaurant.name}: Sonnet found 0 dishes in ${cms} site, attempting render fallback`)
        try {
          const renderedHtml = await fetchRenderedHtml(menuUrl)
          rendererAttempted = true
          content = extractMenuTextFromHtml(renderedHtml)
          renderedTextLen = content.length
          if (content.length >= 50) {
            extracted = await extractMenuWithClaude(content, restaurant.name)
          }
        } catch (renderErr) {
          console.error(`${restaurant.name}: render retry failed:`, renderErr)
        }
      }

      if (extracted.dishes.length === 0) {
        const classified = classifyError(null, 'no_dishes')
        const newAttemptCount = job.attempt_count + 1
        await supabase.from('menu_import_jobs').update({
          status: newAttemptCount >= job.max_attempts ? 'dead' : 'pending',
          attempt_count: newAttemptCount,
          run_after: newAttemptCount >= job.max_attempts ? undefined : calculateBackoff(newAttemptCount).toISOString(),
          error_code: classified.code,
          error_message: classified.message,
          error_context: {
            menu_url: menuUrl,
            website_url: websiteUrl,
            cms_detected: cms,
            raw_html_len: rawHtml.length,
            raw_text_len: content.length,
            renderer_attempted: rendererAttempted,
            rendered_text_len: renderedTextLen,
          },
          lock_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        results.push({ job_id: job.id, status: 'no_dishes', restaurant: restaurant.name })
        continue
      }
```

The rest of the loop (upsertDishes, marking complete, etc.) stays unchanged.

- [ ] **Step 3: Verify the file compiles**

Run: `cd supabase/functions/menu-refresh && deno check index.ts`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/menu-refresh/index.ts
git commit -m "feat: inline Browserless render fallback for JS-rendered sites

When extraction fails on Wix/Square/Weebly sites, automatically retry
with Browserless rendered HTML in the same job attempt. Stores rich
error_context (cms, text lengths, renderer_attempted) for debugging."
```

---

### Task 5: Extend Job Lock for Render Workload

**Files:**
- Modify: `supabase/functions/menu-refresh/index.ts` (queue mode, the dequeue call)

Rendering adds 10-30 seconds per job. If we claim 5 jobs and each needs rendering, we might exceed the 5-minute lock. Two options: extend the lock, or process fewer jobs per run. We'll process fewer to keep the lock length conservative.

- [ ] **Step 1: Lower the per-run job limit**

In the queue mode block, find:

```ts
      const { data: jobs, error: dequeueErr } = await supabase.rpc('claim_menu_import_jobs', { p_limit: 5 })
```

Replace with:

```ts
      const { data: jobs, error: dequeueErr } = await supabase.rpc('claim_menu_import_jobs', { p_limit: 3 })
```

3 jobs × (20s fetch + 30s render + 10s Sonnet + 5s upsert) = ~3 minutes worst case, well under the 5-minute lock.

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/menu-refresh/index.ts
git commit -m "chore: reduce jobs per cron run to 3 — safer with render fallback"
```

---

### Task 6: Deploy and Test

- [ ] **Step 1: Set the Browserless secret**

Manual step: In Supabase dashboard → Settings → Edge Functions → Secrets, add:
- Key: `BROWSERLESS_API_KEY`
- Value: your Browserless token

- [ ] **Step 2: Deploy the updated Edge Function**

Use the Supabase MCP tool `mcp__claude_ai_Supabase__deploy_edge_function`:

- project_id: `vpioftosgdkyiwvhxewy`
- name: `menu-refresh`
- entrypoint_path: `index.ts`
- verify_jwt: `false`
- files: array with all 3 files:
  - `index.ts` (the main file)
  - `cms-detect.ts`
  - `browserless.ts`

Verify the deployed version number increases.

- [ ] **Step 3: Retry a Wix site from the dead pile**

Run this SQL in Supabase SQL Editor:

```sql
-- Reset Scottish Bakehouse or Bluefish River (pick one that failed earlier today)
UPDATE menu_import_jobs SET
  status = 'pending',
  attempt_count = 0,
  error_code = NULL,
  error_message = NULL,
  error_context = NULL,
  run_after = now(),
  lock_expires_at = NULL,
  started_at = NULL,
  completed_at = NULL,
  dishes_found = NULL
WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name ILIKE '%scottish%' OR name ILIKE '%bluefish%'
);

-- Clear content hashes so they re-fetch
UPDATE restaurants SET menu_content_hash = NULL
WHERE name ILIKE '%scottish%' OR name ILIKE '%bluefish%';

-- Fire immediately
SELECT net.http_post(
  url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/menu-refresh',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
  ),
  body := '{"mode": "queue"}'::jsonb
);
```

- [ ] **Step 4: Verify success**

Wait 60 seconds (render takes longer than raw fetch), then check:

```sql
SELECT
  r.name,
  j.status,
  j.dishes_found,
  j.error_code,
  j.error_context->>'cms_detected' as cms,
  j.error_context->>'renderer_attempted' as rendered,
  j.error_context->>'raw_text_len' as raw_len,
  j.error_context->>'rendered_text_len' as rendered_len
FROM menu_import_jobs j
JOIN restaurants r ON r.id = j.restaurant_id
WHERE r.name ILIKE '%scottish%' OR r.name ILIKE '%bluefish%'
ORDER BY j.created_at DESC;
```

Expected:
- `status = 'completed'`
- `dishes_found > 0`
- `cms = 'wix'`
- `rendered = 'true'` (if raw was too short — though with render, it may be null because we only write error_context on failures)

If still failing, the `error_context` JSON shows exactly what went wrong: which CMS, how much raw text, how much rendered text.

- [ ] **Step 5: Commit any final docs or config**

```bash
git add -A
git commit -m "docs: Browserless integration verified with Wix sites"
```

---

## Summary

| Task | What | Est. |
|------|------|------|
| 1 | CMS detection module + tests | 15 min |
| 2 | Browserless client | 15 min |
| 3 | Refactor fetchMenuContent | 10 min |
| 4 | Render fallback in queue mode | 30 min |
| 5 | Lower job limit for render workload | 2 min |
| 6 | Deploy + E2E test on Wix site | 15 min |

**Total: ~90 minutes**

## What This Does Not Solve

- **Plane View (403)** — needs Browserless `/unblock`, not `/content`. Add later if it becomes a pattern.
- **Image-only menus** — needs OCR, out of scope.
- **No-website restaurants** — needs Google reviews scraping, out of scope.
- **Landfall-style multi-section menus where /menu redirects to drinks** — needs content-scored prober, separate plan.

These are the "future Managed Agent" cases. We'll revisit once Browserless is live and we have 2-4 weeks of data on what's still failing.
