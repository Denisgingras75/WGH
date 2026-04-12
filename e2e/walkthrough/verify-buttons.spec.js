import { test, expect } from '../fixtures/test.js'

test('pizza category — full list with action buttons', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(2000)

  const pizza = page.locator('button, a').filter({ hasText: /^PIZZA$/i }).first()
  if (await pizza.isVisible()) {
    await pizza.click()
    await page.waitForTimeout(2500)

    // Scroll past podium to ranks 4+
    await page.evaluate(() => window.scrollTo(0, 1200))
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/screenshots/30-pizza-ranks-4-10.png', fullPage: false })

    // Full page to see everything
    await page.screenshot({ path: 'e2e/screenshots/31-pizza-full-updated.png', fullPage: true })
  }
})

test('dish detail page — order, directions, jitter badges', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(2000)

  // Navigate into the #1 dish via its button
  const podiumCard = page.locator('button[data-dish-id]').first()
  if (await podiumCard.isVisible()) {
    await podiumCard.click()
    await page.waitForTimeout(2500)
    await page.screenshot({ path: 'e2e/screenshots/32-dish-detail-top.png', fullPage: false })

    // Scroll to reviews to see Jitter badges
    await page.evaluate(() => window.scrollTo(0, 999999))
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'e2e/screenshots/33-dish-detail-reviews.png', fullPage: false })

    // Full page
    await page.screenshot({ path: 'e2e/screenshots/34-dish-detail-full.png', fullPage: true })
  }
})
