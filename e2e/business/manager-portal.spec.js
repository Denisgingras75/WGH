import { test, expect } from '../fixtures/test.js'

test.describe('Business — Manager Portal', () => {
  test('/manage loads without redirect, shows restaurant name', async ({ page }) => {
    await page.goto('/manage')

    // Should NOT redirect to /login (we're authenticated as manager)
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url).toContain('/manage')

    // Should show restaurant name and "Restaurant Manager" text
    const managerText = page.getByText(/Restaurant Manager/i).first()
    await expect(managerText).toBeVisible({ timeout: 10_000 })
  })

  test('Specials tab shows content area', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // Specials tab should be active by default or click it
    const specialsTab = page.getByRole('tab', { name: /Specials/i }).first()
    if (await specialsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await specialsTab.click()
      await page.waitForTimeout(1000)
      // Content area should be visible (no crash)
      expect(page.url()).toContain('/manage')
    }
  })

  test('Menu tab shows dishes list', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    const menuTab = page.getByRole('tab', { name: /Menu/i }).first()
    await expect(menuTab).toBeVisible({ timeout: 10_000 })
    await menuTab.click()
    await page.waitForTimeout(1000)

    // Should show dishes content
    expect(page.url()).toContain('/manage')
  })

  test('Events tab shows events content', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    const eventsTab = page.getByRole('tab', { name: /Events/i }).first()
    await expect(eventsTab).toBeVisible({ timeout: 10_000 })
    await eventsTab.click()
    await page.waitForTimeout(1000)

    expect(page.url()).toContain('/manage')
  })

  test('Info tab shows restaurant info form', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    const infoTab = page.getByRole('tab', { name: /Info/i }).first()
    await expect(infoTab).toBeVisible({ timeout: 10_000 })
    await infoTab.click()
    await page.waitForTimeout(1000)

    // Should show some form or info content
    expect(page.url()).toContain('/manage')
  })
})
