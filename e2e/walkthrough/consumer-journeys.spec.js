import { test, expect } from '../fixtures/test.js'

/**
 * Consumer Journey Walkthroughs
 *
 * Exercises every user-facing flow that matters for launch:
 * - Tourist discovery (browse, search, map, directions, ordering)
 * - Foodie engagement (vote, review with Jitter, favorites, profile)
 * - Restaurant detail (menu, dishes, directions, order now)
 */

test.describe('Tourist Discovery — First Visit', () => {

  test('homepage loads with ranked dishes and category icons', async ({ page }) => {
    await page.goto('/')

    // Should see the brand header
    await expect(page.locator('body')).toBeVisible()

    // Wait for dishes to load
    await page.waitForTimeout(2000)

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'e2e/screenshots/01-homepage.png', fullPage: true })

    // Should have dish items visible
    const dishItems = page.locator('[class*="dish"], [class*="Dish"], a[href*="/dish/"]')
    const count = await dishItems.count()
    console.log(`Homepage shows ${count} dish elements`)
  })

  test('search for a dish — type "lobster" and see results', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)

    // Find and click the search input
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="earch"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.click()
      await searchInput.fill('lobster')
      await page.waitForTimeout(1500)
      await page.screenshot({ path: 'e2e/screenshots/02-search-lobster.png', fullPage: true })

      // Check if results appear
      const results = page.locator('a[href*="/dish/"]')
      const resultCount = await results.count()
      console.log(`Search "lobster" returned ${resultCount} results`)
    } else {
      console.log('No search input found on homepage')
      await page.screenshot({ path: 'e2e/screenshots/02-no-search.png' })
    }
  })

  test('browse categories page', async ({ page }) => {
    await page.goto('/browse')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/03-browse.png', fullPage: true })

    // Click the first category if available
    const categoryLinks = page.locator('a[href*="/browse"], button').filter({ hasText: /pizza|burger|seafood|lobster|sushi|breakfast/i })
    if (await categoryLinks.count() > 0) {
      await categoryLinks.first().click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'e2e/screenshots/03b-category-results.png', fullPage: true })
    }
  })

  test('tap a dish to see detail page', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Find first dish link
    const dishLink = page.locator('a[href*="/dish/"]').first()
    if (await dishLink.isVisible()) {
      await dishLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'e2e/screenshots/04-dish-detail.png', fullPage: true })

      // Check for key elements
      const orderBtn = page.locator('a, button').filter({ hasText: /order now/i })
      const directionsBtn = page.locator('a, button').filter({ hasText: /direction/i })
      const ratingEl = page.locator('[class*="rating"], [class*="score"]')

      console.log(`Dish detail — Order Now: ${await orderBtn.count() > 0}, Directions: ${await directionsBtn.count() > 0}`)

      // Check for Jitter trust badges on reviews
      const trustBadge = page.locator('[class*="trust"], [class*="jitter"], [class*="badge"]')
      console.log(`Trust badges visible: ${await trustBadge.count()}`)

      // Scroll down to see reviews section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'e2e/screenshots/04b-dish-reviews.png', fullPage: true })
    }
  })

  test('directions button opens Google Maps', async ({ page, context }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const dishLink = page.locator('a[href*="/dish/"]').first()
    if (await dishLink.isVisible()) {
      await dishLink.click()
      await page.waitForTimeout(2000)

      // Check for directions link with Google Maps URL
      const directionsLink = page.locator('a[href*="google.com/maps"]')
      const dirCount = await directionsLink.count()
      console.log(`Directions links found: ${dirCount}`)

      if (dirCount > 0) {
        const href = await directionsLink.first().getAttribute('href')
        console.log(`Directions URL: ${href}`)
        expect(href).toContain('google.com/maps/dir')
      }
    }
  })

  test('Order Now button links to Toast or order URL', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Find any Order Now button on the page
    const orderLinks = page.locator('a').filter({ hasText: /order now/i })
    const orderCount = await orderLinks.count()
    console.log(`Order Now links on homepage: ${orderCount}`)

    if (orderCount > 0) {
      const href = await orderLinks.first().getAttribute('href')
      console.log(`First Order URL: ${href}`)
      const isToast = href?.includes('toasttab.com')
      const isOrderUrl = href?.startsWith('http')
      console.log(`Toast: ${isToast}, External: ${isOrderUrl}`)
    }

    await page.screenshot({ path: 'e2e/screenshots/05-order-buttons.png' })
  })
})

test.describe('Map Mode — Location Discovery', () => {

  test('toggle to map mode and see dish pins', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Look for the mode toggle FAB
    const modeFab = page.locator('[class*="mode"], [class*="fab"], [class*="FAB"], button').filter({ hasText: /map|list/i })
    if (await modeFab.count() > 0) {
      await modeFab.first().click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'e2e/screenshots/06-map-mode.png', fullPage: true })

      // Check for Leaflet map container
      const mapContainer = page.locator('.leaflet-container, [class*="map"]')
      console.log(`Map containers: ${await mapContainer.count()}`)

      // Check for map pins/markers
      const markers = page.locator('.leaflet-marker-icon, .leaflet-marker-pane img')
      console.log(`Map markers: ${await markers.count()}`)
    } else {
      console.log('No map toggle found — checking for map link in nav')
      await page.screenshot({ path: 'e2e/screenshots/06-no-map-toggle.png' })
    }
  })
})

test.describe('Restaurants Page', () => {

  test('restaurant list with Open/Closed tabs', async ({ page }) => {
    await page.goto('/restaurants')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/07-restaurants.png', fullPage: true })

    // Check for Open/Closed tab switcher
    const tabs = page.locator('button, [role="tab"]').filter({ hasText: /open|closed/i })
    console.log(`Open/Closed tabs: ${await tabs.count()}`)

    // Check for restaurant cards
    const restaurantCards = page.locator('a[href*="/restaurants/"]')
    console.log(`Restaurant cards: ${await restaurantCards.count()}`)

    // Check for collapsible map
    const map = page.locator('.leaflet-container')
    console.log(`Restaurant map visible: ${await map.count() > 0}`)
  })

  test('restaurant detail — menu tab, directions, order now', async ({ page }) => {
    await page.goto('/restaurants')
    await page.waitForTimeout(2000)

    const restaurantLink = page.locator('a[href*="/restaurants/"]').first()
    if (await restaurantLink.isVisible()) {
      await restaurantLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'e2e/screenshots/08-restaurant-detail.png', fullPage: true })

      // Check for Menu tab
      const menuTab = page.locator('button, [role="tab"]').filter({ hasText: /menu/i })
      console.log(`Menu tab: ${await menuTab.count() > 0}`)

      // Click menu tab if available
      if (await menuTab.count() > 0) {
        await menuTab.first().click()
        await page.waitForTimeout(1500)
        await page.screenshot({ path: 'e2e/screenshots/08b-menu-tab.png', fullPage: true })

        // Check for split-pane menu sections
        const sections = page.locator('[class*="section"], [class*="menu"]')
        console.log(`Menu sections: ${await sections.count()}`)
      }

      // Check for Directions button
      const directions = page.locator('a[href*="google.com/maps"]')
      console.log(`Directions links: ${await directions.count()}`)

      // Check for Order Now
      const orderBtn = page.locator('a, button').filter({ hasText: /order now/i })
      console.log(`Order Now: ${await orderBtn.count() > 0}`)

      // Scroll to bottom to see sticky action bar
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'e2e/screenshots/08c-restaurant-footer.png' })
    }
  })
})

test.describe('Foodie Engagement — Vote Flow', () => {

  test('dish detail shows vote/review flow', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const dishLink = page.locator('a[href*="/dish/"]').first()
    if (await dishLink.isVisible()) {
      await dishLink.click()
      await page.waitForTimeout(2000)

      // Look for vote/rate buttons
      const voteBtn = page.locator('button, a').filter({ hasText: /rate|vote|yes|no|would you order/i })
      console.log(`Vote/Rate buttons: ${await voteBtn.count()}`)

      if (await voteBtn.count() > 0) {
        await page.screenshot({ path: 'e2e/screenshots/09-vote-prompt.png', fullPage: true })

        // Try clicking yes/thumbs up
        const yesBtn = page.locator('button').filter({ hasText: /yes|👍/i }).first()
        if (await yesBtn.isVisible()) {
          await yesBtn.click()
          await page.waitForTimeout(1500)
          await page.screenshot({ path: 'e2e/screenshots/09b-after-vote.png', fullPage: true })

          // Check if review input appears (with Jitter tracking)
          const reviewInput = page.locator('textarea, input[placeholder*="review"], input[placeholder*="stood out"]')
          console.log(`Review input visible: ${await reviewInput.count() > 0}`)
        }
      }
    }
  })
})

test.describe('Hub — Events & Specials', () => {

  test('hub page loads with content', async ({ page }) => {
    await page.goto('/hub')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/10-hub.png', fullPage: true })

    // Check for event cards or specials
    const cards = page.locator('[class*="card"], [class*="event"], [class*="special"]')
    console.log(`Hub cards: ${await cards.count()}`)
  })
})

test.describe('Navigation & Static Pages', () => {

  test('bottom nav works across pages', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Check bottom nav
    const bottomNav = page.locator('nav, [class*="BottomNav"], [class*="bottom-nav"]')
    console.log(`Bottom nav: ${await bottomNav.count() > 0}`)
    await page.screenshot({ path: 'e2e/screenshots/11-bottom-nav.png' })

    // Navigate to each tab via bottom nav links
    const navLinks = page.locator('nav a, [class*="nav"] a')
    const navCount = await navLinks.count()
    console.log(`Nav links: ${navCount}`)
  })

  test('profile page shows login prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/12-profile-unauth.png', fullPage: true })

    // Should redirect to login or show login modal
    const loginElements = page.locator('button, a, h1, h2, p').filter({ hasText: /log in|sign in|login|email/i })
    console.log(`Login elements: ${await loginElements.count()}`)
  })

  test('static pages load — privacy, terms, how reviews work', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/how-reviews-work']) {
      await page.goto(path)
      await page.waitForTimeout(1000)
      const heading = page.locator('h1, h2').first()
      if (await heading.isVisible()) {
        console.log(`${path}: ${await heading.textContent()}`)
      }
    }
    await page.screenshot({ path: 'e2e/screenshots/13-static-pages.png' })
  })

  test('jitter landing page loads', async ({ page }) => {
    await page.goto('/jitter')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/14-jitter-landing.png', fullPage: true })

    const heading = page.locator('h1, h2').first()
    if (await heading.isVisible()) {
      console.log(`Jitter page heading: ${await heading.textContent()}`)
    }
  })
})

test.describe('For Restaurants — B2B Landing', () => {

  test('for-restaurants page loads', async ({ page }) => {
    await page.goto('/for-restaurants')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/15-for-restaurants.png', fullPage: true })

    const heading = page.locator('h1, h2').first()
    if (await heading.isVisible()) {
      console.log(`For Restaurants heading: ${await heading.textContent()}`)
    }
  })
})
