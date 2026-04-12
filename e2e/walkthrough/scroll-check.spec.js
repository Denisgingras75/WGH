import { test, expect } from '../fixtures/test.js'

test('homepage scroll — ranks 4-10 with action buttons', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(2500)

  // Scroll past podium cards to see ranks 4+
  await page.evaluate(() => window.scrollTo(0, 800))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'e2e/screenshots/20-ranks-4-7.png', fullPage: false })

  // Scroll further
  await page.evaluate(() => window.scrollTo(0, 1400))
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'e2e/screenshots/21-ranks-7-10.png', fullPage: false })

  // Full page
  await page.screenshot({ path: 'e2e/screenshots/22-full-homepage.png', fullPage: true })
})

test('category page — pizza with action buttons', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(2000)

  // Click Pizza category
  const pizza = page.locator('button, a').filter({ hasText: /^PIZZA$/i }).first()
  if (await pizza.isVisible()) {
    await pizza.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/23-pizza-full.png', fullPage: true })
  }
})

test('dish detail — check Jitter trust badges on reviews', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(2000)

  const dishLink = page.locator('a[href*="/dish/"]').first()
  if (await dishLink.isVisible()) {
    await dishLink.click()
    await page.waitForTimeout(2000)

    // Scroll to reviews
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'e2e/screenshots/24-dish-reviews-jitter.png', fullPage: true })
  }
})
