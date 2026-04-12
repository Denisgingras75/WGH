import { test, expect } from '../fixtures/test.js'

/**
 * 10 Consumer Personas — Real UX Audit
 *
 * Each persona has a goal, walks a flow, and reports:
 * - FRICTION: things that slow the user down
 * - BUG: broken functionality
 * - DEAD_END: flows that lead nowhere
 * - MISSING: expected elements not present
 * - SLOW: loads > 3s
 * - CONSOLE_ERROR: JS errors in console
 */

const issues = []
function report(persona, type, detail) {
  const msg = `[${type}][${persona}] ${detail}`
  console.log(msg)
  issues.push(msg)
}

// Helper: capture console errors during a test
function captureConsoleErrors(page, persona) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      report(persona, 'CONSOLE_ERROR', msg.text().substring(0, 200))
    }
  })
  page.on('pageerror', err => {
    report(persona, 'BUG', `Uncaught: ${err.message.substring(0, 200)}`)
  })
}

// Helper: measure navigation time
async function timedGoto(page, url, persona, label) {
  const start = Date.now()
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  const elapsed = Date.now() - start
  if (elapsed > 3000) {
    report(persona, 'SLOW', `${label} took ${elapsed}ms to load`)
  }
  return elapsed
}

// Helper: check if an element exists and is visible
async function checkVisible(page, selector, description, persona) {
  const el = page.locator(selector).first()
  const visible = await el.isVisible().catch(() => false)
  if (!visible) {
    report(persona, 'MISSING', description)
  }
  return visible
}

// Helper: wait for network to settle (instead of fixed timeouts)
async function waitForContent(page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout })
  } catch {
    // networkidle timeout is ok — page may have polling
  }
}

// ─────────────────────────────────────────────────────────
// PERSONA 1: Hungry Tourist — "I just got off the ferry, what should I eat?"
// Goal: Find a top dish near me and get directions
// ─────────────────────────────────────────────────────────
test.describe('1. Hungry Tourist', () => {
  const P = 'HungryTourist'

  test('find food fast — homepage → dish → directions', async ({ page }) => {
    captureConsoleErrors(page, P)

    // Land on homepage
    const loadTime = await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    console.log(`${P}: Homepage loaded in ${loadTime}ms`)

    // Expect to see dishes immediately — no blank screen
    const dishLinks = page.locator('a[href*="/dish/"]')
    await page.waitForTimeout(3000) // give React Query time
    const dishCount = await dishLinks.count()
    if (dishCount === 0) {
      report(P, 'DEAD_END', 'Homepage shows ZERO dishes — tourist sees nothing')
    } else {
      console.log(`${P}: ${dishCount} dishes visible`)
    }

    // Screenshot homepage
    await page.screenshot({ path: 'e2e/screenshots/p1-01-homepage.png', fullPage: true })

    // Is there a clear CTA or value prop for first-time visitors?
    const welcomeText = page.locator('text=/good|best|top|rated|popular/i').first()
    const hasWelcome = await welcomeText.isVisible().catch(() => false)
    if (!hasWelcome) {
      report(P, 'FRICTION', 'No value prop visible — tourist doesnt know what this app does')
    }

    // Tap the first dish
    if (dishCount > 0) {
      await dishLinks.first().click()
      await waitForContent(page)
      await page.waitForTimeout(1000)

      // On dish detail — check for key actions
      const currentUrl = page.url()
      if (!currentUrl.includes('/dish/')) {
        report(P, 'BUG', `Dish link didn't navigate to dish detail — landed on ${currentUrl}`)
      }

      await page.screenshot({ path: 'e2e/screenshots/p1-02-dish-detail.png', fullPage: true })

      // Restaurant name visible?
      const restaurantLink = page.locator('a[href*="/restaurants/"]').first()
      if (!await restaurantLink.isVisible().catch(() => false)) {
        report(P, 'MISSING', 'Dish detail: no restaurant link — tourist cant find the place')
      }

      // Directions button?
      const directionsBtn = page.locator('a[href*="google.com/maps"], a[href*="maps.apple.com"]')
      if (await directionsBtn.count() === 0) {
        report(P, 'MISSING', 'Dish detail: no directions button — tourist cant navigate there')
      }

      // Order button?
      const orderBtn = page.locator('a, button').filter({ hasText: /order/i })
      if (await orderBtn.count() === 0) {
        report(P, 'MISSING', 'Dish detail: no order button')
      }

      // Back button or way to go back?
      const backBtn = page.locator('button, a').filter({ hasText: /back|←|chevron/i })
      const hasBack = await backBtn.count() > 0
      // Also check browser back works
      await page.goBack()
      await page.waitForTimeout(1000)
      const backUrl = page.url()
      if (!backUrl.endsWith('/') && !backUrl.includes('localhost')) {
        report(P, 'FRICTION', `Browser back from dish detail went to ${backUrl} instead of homepage`)
      }
    }
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 2: Search-First User — "I want lobster rolls"
// Goal: Search for something specific and find it
// ─────────────────────────────────────────────────────────
test.describe('2. Search-First User', () => {
  const P = 'SearchUser'

  test('search flow — type query, see results, tap result', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    // Find search input
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="earch"]').first()
    const searchVisible = await searchInput.isVisible().catch(() => false)

    if (!searchVisible) {
      report(P, 'BUG', 'No search input found on homepage')
      await page.screenshot({ path: 'e2e/screenshots/p2-01-no-search.png' })
      return
    }

    // Type "lobster"
    await searchInput.click()
    await page.waitForTimeout(500)
    await searchInput.fill('lobster')
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'e2e/screenshots/p2-01-search-typing.png', fullPage: true })

    // Are there results?
    const resultLinks = page.locator('a[href*="/dish/"]')
    const resultCount = await resultLinks.count()
    if (resultCount === 0) {
      report(P, 'DEAD_END', 'Search "lobster" returned 0 results — is the search working?')
    } else {
      console.log(`${P}: "lobster" returned ${resultCount} results`)

      // Tap first result
      await resultLinks.first().click()
      await waitForContent(page)
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'e2e/screenshots/p2-02-search-result.png', fullPage: true })
    }

    // Test empty search
    await page.goto('/')
    await waitForContent(page)
    await page.waitForTimeout(2000)
    const searchInput2 = page.locator('input[type="text"], input[type="search"], input[placeholder*="earch"]').first()
    if (await searchInput2.isVisible().catch(() => false)) {
      await searchInput2.click()
      await searchInput2.fill('xyznotafood123')
      await page.waitForTimeout(2000)

      await page.screenshot({ path: 'e2e/screenshots/p2-03-no-results.png', fullPage: true })

      // Check for empty state message
      const emptyState = page.locator('text=/no results|no dishes|not found|try another/i').first()
      if (!await emptyState.isVisible().catch(() => false)) {
        report(P, 'MISSING', 'No empty state message when search returns 0 results')
      }
    }
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 3: Category Browser — "Show me breakfast spots"
// Goal: Browse by category, find variety
// ─────────────────────────────────────────────────────────
test.describe('3. Category Browser', () => {
  const P = 'CategoryBrowser'

  test('browse categories — tap through multiple', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    // Find category chips/icons on homepage
    const categoryArea = page.locator('button, a').filter({ hasText: /pizza|seafood|breakfast|burger|sushi|lobster|tacos|wings/i })
    const catCount = await categoryArea.count()
    if (catCount === 0) {
      report(P, 'MISSING', 'No category shortcuts on homepage')
    } else {
      console.log(`${P}: ${catCount} categories visible on homepage`)
    }

    // Go to browse page
    await timedGoto(page, '/browse', P, 'Browse page')
    await waitForContent(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/p3-01-browse.png', fullPage: true })

    // Count category cards
    const browseCategories = page.locator('a[href*="/browse"], button').filter({ hasText: /pizza|seafood|breakfast|burger|sushi|lobster|tacos|wings|salads|soup|bbq|dessert/i })
    const browseCount = await browseCategories.count()
    console.log(`${P}: Browse page has ${browseCount} category options`)

    // Tap first category
    if (browseCount > 0) {
      const firstCat = browseCategories.first()
      const catName = await firstCat.textContent()
      await firstCat.click()
      await waitForContent(page)
      await page.waitForTimeout(2000)

      await page.screenshot({ path: 'e2e/screenshots/p3-02-category-results.png', fullPage: true })

      // Check if we got results
      const catDishes = page.locator('a[href*="/dish/"]')
      const catDishCount = await catDishes.count()
      if (catDishCount === 0) {
        report(P, 'DEAD_END', `Category "${catName?.trim()}" shows 0 dishes — empty category`)
      } else {
        console.log(`${P}: "${catName?.trim()}" has ${catDishCount} dishes`)
      }

      // Can I get back to browse easily?
      const backLink = page.locator('a, button').filter({ hasText: /browse|back|all categories/i })
      if (await backLink.count() === 0) {
        report(P, 'FRICTION', 'No obvious way to get back to all categories from category results')
      }
    }
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 4: Map Explorer — "I want to see what's near me"
// Goal: Use the map to find dishes nearby
// ─────────────────────────────────────────────────────────
test.describe('4. Map Explorer', () => {
  const P = 'MapExplorer'

  test('map mode — toggle, interact, tap pin', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    // Find map toggle
    const mapToggle = page.locator('button').filter({ hasText: /map/i })
    const fabToggle = page.locator('[class*="fab"], [class*="FAB"], [class*="mode"]').first()

    let toggled = false
    if (await mapToggle.count() > 0) {
      await mapToggle.first().click()
      toggled = true
    } else if (await fabToggle.isVisible().catch(() => false)) {
      await fabToggle.click()
      toggled = true
    }

    if (!toggled) {
      report(P, 'MISSING', 'No map toggle button found on homepage')
      await page.screenshot({ path: 'e2e/screenshots/p4-01-no-map-toggle.png' })
      return
    }

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/p4-01-map-mode.png', fullPage: true })

    // Check for Leaflet map
    const leafletMap = page.locator('.leaflet-container')
    if (!await leafletMap.isVisible().catch(() => false)) {
      report(P, 'BUG', 'Map toggle clicked but no Leaflet map appeared')
      return
    }

    // Check for markers/pins
    const markers = page.locator('.leaflet-marker-icon')
    const markerCount = await markers.count()
    if (markerCount === 0) {
      report(P, 'MISSING', 'Map loaded but has 0 pins — nothing to explore')
    } else {
      console.log(`${P}: ${markerCount} pins on map`)

      // Tap a pin
      await markers.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'e2e/screenshots/p4-02-pin-popup.png', fullPage: true })

      // Check if popup appeared
      const popup = page.locator('.leaflet-popup, [class*="popup"], [class*="Popup"]')
      if (await popup.count() === 0) {
        report(P, 'FRICTION', 'Tapped map pin but no popup/tooltip appeared')
      }
    }

    // Toggle back to list
    const listToggle = page.locator('button').filter({ hasText: /list/i })
    const fabToggle2 = page.locator('[class*="fab"], [class*="FAB"], [class*="mode"]').first()
    if (await listToggle.count() > 0) {
      await listToggle.first().click()
    } else if (await fabToggle2.isVisible().catch(() => false)) {
      await fabToggle2.click()
    }
    await page.waitForTimeout(1000)

    // Verify list came back
    const dishesBack = page.locator('a[href*="/dish/"]')
    if (await dishesBack.count() === 0) {
      report(P, 'BUG', 'Toggled back from map but dish list is gone')
    }
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 5: Restaurant Researcher — "I'm going to The Net Result, what's good?"
// Goal: Find a restaurant, see its dishes, get directions
// ─────────────────────────────────────────────────────────
test.describe('5. Restaurant Researcher', () => {
  const P = 'RestaurantResearcher'

  test('restaurants page → detail → dishes → directions', async ({ page }) => {
    captureConsoleErrors(page, P)
    const loadTime = await timedGoto(page, '/restaurants', P, 'Restaurants page')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'e2e/screenshots/p5-01-restaurants.png', fullPage: true })

    // Are there restaurants listed?
    const restaurantLinks = page.locator('a[href*="/restaurants/"]')
    const restCount = await restaurantLinks.count()
    if (restCount === 0) {
      report(P, 'DEAD_END', 'Restaurants page shows 0 restaurants')
      return
    }
    console.log(`${P}: ${restCount} restaurants listed`)

    // Check for open/closed indicators
    const openIndicator = page.locator('text=/open|closed|hours/i').first()
    if (!await openIndicator.isVisible().catch(() => false)) {
      report(P, 'MISSING', 'No open/closed status visible on restaurant list')
    }

    // Tap first restaurant
    await restaurantLinks.first().click()
    await waitForContent(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/p5-02-restaurant-detail.png', fullPage: true })

    // Check restaurant detail has key info
    const address = page.locator('text=/vineyard|martha|street|road|ave|MV/i').first()
    if (!await address.isVisible().catch(() => false)) {
      report(P, 'MISSING', 'Restaurant detail: no address visible')
    }

    // Check for dishes at this restaurant
    const restaurantDishes = page.locator('a[href*="/dish/"]')
    const rdCount = await restaurantDishes.count()
    if (rdCount === 0) {
      report(P, 'MISSING', 'Restaurant detail: no dishes listed')
    } else {
      console.log(`${P}: Restaurant has ${rdCount} dishes`)
    }

    // Directions link
    const directions = page.locator('a[href*="google.com/maps"], a[href*="maps"]')
    if (await directions.count() === 0) {
      report(P, 'MISSING', 'Restaurant detail: no directions link')
    }

    // Phone number
    const phone = page.locator('a[href*="tel:"]')
    if (await phone.count() === 0) {
      report(P, 'MISSING', 'Restaurant detail: no phone number')
    }

    // Scroll to see full page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/screenshots/p5-03-restaurant-bottom.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 6: Want-to-Vote User — "I ate here, I want to rate this dish"
// Goal: Try to vote on a dish (will hit auth wall)
// ─────────────────────────────────────────────────────────
test.describe('6. Want-to-Vote User', () => {
  const P = 'VoterUser'

  test('try to vote — hit auth, see login flow', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    // Navigate to a dish
    const dishLink = page.locator('a[href*="/dish/"]').first()
    if (!await dishLink.isVisible().catch(() => false)) {
      report(P, 'DEAD_END', 'No dishes on homepage to vote on')
      return
    }

    await dishLink.click()
    await waitForContent(page)
    await page.waitForTimeout(1500)

    // Look for vote/rate UI
    const voteArea = page.locator('button, [role="button"]').filter({ hasText: /yes|no|vote|rate|order again|thumbs/i })
    const voteCount = await voteArea.count()
    if (voteCount === 0) {
      report(P, 'MISSING', 'Dish detail: no vote/rate buttons visible')
      await page.screenshot({ path: 'e2e/screenshots/p6-01-no-vote.png', fullPage: true })
      return
    }

    console.log(`${P}: ${voteCount} vote-related buttons found`)
    await page.screenshot({ path: 'e2e/screenshots/p6-01-vote-buttons.png', fullPage: true })

    // Try to vote (should trigger login modal since we're not authenticated)
    await voteArea.first().click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'e2e/screenshots/p6-02-after-vote-click.png', fullPage: true })

    // Check if login modal appeared
    const loginModal = page.locator('text=/log in|sign in|email|create account/i').first()
    const modalVisible = await loginModal.isVisible().catch(() => false)
    if (!modalVisible) {
      // Maybe the vote just went through without auth?
      report(P, 'BUG', 'Voted without authentication — no login prompt appeared')
    } else {
      console.log(`${P}: Login modal appeared correctly after vote attempt`)

      // Check the login modal has email input
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"]')
      if (await emailInput.count() === 0) {
        report(P, 'MISSING', 'Login modal has no email input')
      }

      // Can I dismiss the modal?
      const closeBtn = page.locator('button').filter({ hasText: /close|×|cancel/i })
      const overlayClose = page.locator('[class*="overlay"], [class*="backdrop"]')
      if (await closeBtn.count() === 0 && await overlayClose.count() === 0) {
        report(P, 'FRICTION', 'Login modal has no obvious close button')
      }
    }
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 7: Profile Curious — "What's my profile look like?"
// Goal: Check profile page, favorites, voting history
// ─────────────────────────────────────────────────────────
test.describe('7. Profile Curious', () => {
  const P = 'ProfileUser'

  test('profile page unauthenticated — should prompt login', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/profile', P, 'Profile page')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'e2e/screenshots/p7-01-profile.png', fullPage: true })

    // Should show login prompt, not a broken page
    const loginPrompt = page.locator('text=/log in|sign in|create account|join/i').first()
    const blankPage = page.locator('body')
    const bodyText = await blankPage.textContent()

    if (bodyText && bodyText.trim().length < 50) {
      report(P, 'BUG', 'Profile page is nearly blank for unauthenticated users')
    }

    if (!await loginPrompt.isVisible().catch(() => false)) {
      // Check if we got redirected to login
      if (!page.url().includes('/login')) {
        report(P, 'FRICTION', 'Profile page shows no login prompt and didnt redirect to login')
      }
    }
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 8: iPhone SE User — Smallest common viewport
// Goal: Everything should work at 375×667
// ─────────────────────────────────────────────────────────
test.describe('8. iPhone SE User', () => {
  const P = 'iPhoneSE'

  test.use({ viewport: { width: 375, height: 667 } })

  test('small screen — check every major page for overflow', async ({ page }) => {
    captureConsoleErrors(page, P)

    const pages = [
      ['/', 'Homepage'],
      ['/browse', 'Browse'],
      ['/restaurants', 'Restaurants'],
      ['/how-reviews-work', 'How Reviews Work'],
      ['/for-restaurants', 'For Restaurants'],
      ['/jitter', 'Jitter'],
    ]

    for (const [url, name] of pages) {
      await page.goto(url)
      await waitForContent(page)
      await page.waitForTimeout(2000)

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      if (hasOverflow) {
        report(P, 'BUG', `${name} has horizontal overflow at 375px — content wider than screen`)
      }

      // Check for text truncation that hides critical info
      const truncated = await page.evaluate(() => {
        const els = document.querySelectorAll('*')
        let count = 0
        for (const el of els) {
          if (el.scrollWidth > el.clientWidth + 2 && el.textContent && el.textContent.length > 10) {
            count++
          }
        }
        return count
      })
      if (truncated > 5) {
        report(P, 'FRICTION', `${name} has ${truncated} elements with hidden overflow text`)
      }

      const safeName = name.toLowerCase().replace(/\s+/g, '-')
      await page.screenshot({ path: `e2e/screenshots/p8-${safeName}.png`, fullPage: true })
    }

    // Test dish detail at small size
    await page.goto('/')
    await waitForContent(page)
    await page.waitForTimeout(2000)
    const dish = page.locator('a[href*="/dish/"]').first()
    if (await dish.isVisible().catch(() => false)) {
      await dish.click()
      await waitForContent(page)
      await page.waitForTimeout(1500)
      await page.screenshot({ path: 'e2e/screenshots/p8-dish-detail.png', fullPage: true })

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      if (hasOverflow) {
        report(P, 'BUG', 'Dish detail has horizontal overflow at 375px')
      }
    }
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 9: Deep Scroller — "What's at the bottom?"
// Goal: Scroll to the very bottom of long pages, check for dead ends
// ─────────────────────────────────────────────────────────
test.describe('9. Deep Scroller', () => {
  const P = 'DeepScroller'

  test('scroll all the way down on homepage — check for dead ends', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    // Scroll incrementally
    let lastHeight = 0
    let sameHeightCount = 0
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 800))
      await page.waitForTimeout(500)
      const currentHeight = await page.evaluate(() => window.scrollY)
      if (currentHeight === lastHeight) {
        sameHeightCount++
        if (sameHeightCount >= 2) break
      } else {
        sameHeightCount = 0
      }
      lastHeight = currentHeight
    }

    const totalHeight = await page.evaluate(() => document.body.scrollHeight)
    console.log(`${P}: Page height: ${totalHeight}px`)

    await page.screenshot({ path: 'e2e/screenshots/p9-01-bottom.png', fullPage: false })

    // At the bottom — is there a footer? A "load more"? Or just... nothing?
    const footer = page.locator('footer, [class*="footer"], [class*="Footer"]')
    const loadMore = page.locator('button, a').filter({ hasText: /load more|show more|see all/i })
    const endOfList = page.locator('text=/end|no more|all dishes/i')

    const hasFooter = await footer.count() > 0
    const hasLoadMore = await loadMore.count() > 0
    const hasEndMarker = await endOfList.count() > 0

    if (!hasFooter && !hasLoadMore && !hasEndMarker) {
      report(P, 'DEAD_END', 'Bottom of homepage has no footer, no load-more, no end indicator — just stops')
    }

    // Count total dish links visible after scrolling
    const allDishes = page.locator('a[href*="/dish/"]')
    const totalDishes = await allDishes.count()
    console.log(`${P}: Total dishes after scrolling: ${totalDishes}`)
  })

  test('restaurants page — scroll and check for lazy loading', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/restaurants', P, 'Restaurants')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    const initialCount = await page.locator('a[href*="/restaurants/"]').count()

    // Scroll down
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 800))
      await page.waitForTimeout(500)
    }

    const afterScrollCount = await page.locator('a[href*="/restaurants/"]').count()
    console.log(`${P}: Restaurants — ${initialCount} initially, ${afterScrollCount} after scroll`)

    await page.screenshot({ path: 'e2e/screenshots/p9-02-restaurants-scrolled.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────────────────
// PERSONA 10: Link Checker — Crawl every nav link, check nothing 404s
// Goal: Make sure all navigation paths work
// ─────────────────────────────────────────────────────────
test.describe('10. Link Checker', () => {
  const P = 'LinkChecker'

  test('crawl all internal links from homepage', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    // Collect all internal links
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href]')
      const urls = new Set()
      for (const a of anchors) {
        const href = a.getAttribute('href')
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          urls.add(href.split('?')[0].split('#')[0])
        }
      }
      return [...urls]
    })

    console.log(`${P}: Found ${links.length} unique internal links: ${links.join(', ')}`)

    // Visit each one
    const broken = []
    for (const link of links) {
      try {
        const response = await page.goto(link, { timeout: 10000 })
        await page.waitForTimeout(500)

        // Check for 404 page or error
        const is404 = await page.locator('text=/not found|404|page doesn.*exist/i').first().isVisible().catch(() => false)
        const status = response?.status()

        if (status >= 400 || is404) {
          broken.push(link)
          report(P, 'BUG', `Broken link: ${link} (status: ${status})`)
        }

        // Check for blank/empty page
        const bodyText = await page.locator('body').textContent()
        if (bodyText && bodyText.trim().length < 20) {
          report(P, 'BUG', `Nearly empty page: ${link}`)
        }
      } catch (err) {
        report(P, 'BUG', `Link ${link} failed to load: ${err.message?.substring(0, 100)}`)
      }
    }

    if (broken.length > 0) {
      console.log(`${P}: BROKEN LINKS: ${broken.join(', ')}`)
    } else {
      console.log(`${P}: All ${links.length} links working`)
    }
  })

  test('bottom nav links all work', async ({ page }) => {
    captureConsoleErrors(page, P)
    await timedGoto(page, '/', P, 'Homepage')
    await waitForContent(page)
    await page.waitForTimeout(2000)

    // Find bottom nav
    const navLinks = page.locator('nav a, [class*="nav"] a[href]')
    const navCount = await navLinks.count()
    console.log(`${P}: ${navCount} nav links`)

    if (navCount === 0) {
      report(P, 'MISSING', 'No navigation links found')
      return
    }

    // Collect hrefs first (clicking changes DOM)
    const hrefs = []
    for (let i = 0; i < navCount; i++) {
      const href = await navLinks.nth(i).getAttribute('href')
      if (href) hrefs.push(href)
    }

    for (const href of hrefs) {
      await page.goto(href)
      await waitForContent(page)
      await page.waitForTimeout(1000)

      const bodyText = await page.locator('body').textContent()
      if (bodyText && bodyText.trim().length < 20) {
        report(P, 'BUG', `Nav link ${href} leads to nearly empty page`)
      }
    }
  })
})

// ─────────────────────────────────────────────────────────
// SUMMARY — Print all issues at the end
// ─────────────────────────────────────────────────────────
test.afterAll(() => {
  console.log('\n═══════════════════════════════════════')
  console.log('       CONSUMER AUDIT SUMMARY')
  console.log('═══════════════════════════════════════')
  if (issues.length === 0) {
    console.log('✓ No issues found across all 10 personas')
  } else {
    console.log(`Found ${issues.length} issues:\n`)
    for (const issue of issues) {
      console.log(`  ${issue}`)
    }
  }
  console.log('═══════════════════════════════════════\n')
})
