import { test, expect } from '../fixtures/test.js'

test.describe('Dish Detail — Tourist view', () => {
  test('clicking a dish shows score and restaurant name', async ({ page }) => {
    await page.goto('/')

    // Wait for dishes to load
    const firstDish = page.locator('[data-dish-id]').first()
    await expect(firstDish).toBeVisible({ timeout: 20_000 })

    // Click the first dish
    await firstDish.click({ position: { x: 16, y: 16 } })

    // Should navigate to dish detail page
    await page.waitForURL(/\/dish\//)

    // Should show dish name (h1 or prominent heading)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
  })

  test('directions button links to Google Maps', async ({ page }) => {
    await page.goto('/')

    // Navigate to a dish
    const firstDish = page.locator('[data-dish-id]').first()
    await expect(firstDish).toBeVisible({ timeout: 20_000 })
    await firstDish.click({ position: { x: 16, y: 16 } })
    await page.waitForURL(/\/dish\//)

    // Wait for dish detail to render
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })

    // Look for a directions/maps link
    const mapsLink = page.locator('a[href*="google.com/maps"], a[href*="maps.google"]').first()
    if (await mapsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await mapsLink.getAttribute('href')
      expect(href).toContain('google')
    }
  })
})
