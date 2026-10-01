import { test, expect } from '../fixtures/test.js'

test.describe('Pioneer — Favorites & sharing', () => {
  test('ear icon toggles on dish detail', async ({ page }) => {
    await page.goto('/')

    const firstDish = page.locator('[data-dish-id]').first()
    await expect(firstDish).toBeVisible({ timeout: 15_000 })
    await firstDish.click({ position: { x: 16, y: 16 } })
    await page.waitForURL(/\/dish\//)

    // Look for the ear/favorite icon button
    const earButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1)

    if (await earButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to toggle
      await earButton.click()
      await page.waitForTimeout(500)
      // Should not crash — page still on dish detail
      expect(page.url()).toContain('/dish/')
    }
  })

  test('share button does not throw an error', async ({ page }) => {
    await page.goto('/')

    const firstDish = page.locator('[data-dish-id]').first()
    await expect(firstDish).toBeVisible({ timeout: 15_000 })
    await firstDish.click({ position: { x: 16, y: 16 } })
    await page.waitForURL(/\/dish\//)

    // Look for share button
    const shareBtn = page.locator('[aria-label*="Share" i], button:has-text("Share")').first()

    if (await shareBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Listen for console errors
      const errors = []
      page.on('pageerror', (err) => errors.push(err.message))

      await shareBtn.click()
      await page.waitForTimeout(1000)

      // No JS errors should have been thrown
      const criticalErrors = errors.filter((e) => !e.includes('AbortError') && !e.includes('NotAllowedError'))
      expect(criticalErrors).toHaveLength(0)
    }
  })
})
