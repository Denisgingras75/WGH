import { test, expect } from '../fixtures/test.js'

test.describe('Pioneer — Profile', () => {
  test('/profile shows the Journal, Playlists and Saved tabs', async ({ page }) => {
    await page.goto('/profile')

    // Should show profile content (not sign-in card)
    await expect(page.locator('#main-content')).toBeVisible()

    const journalTab = page.getByRole('tab', { name: 'Journal' })
    await expect(journalTab).toBeVisible({ timeout: 10_000 })
    await expect(journalTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Playlists' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Saved' })).toBeVisible()
  })

  test('switching tabs updates the selection and the URL', async ({ page }) => {
    await page.goto('/profile')

    const playlistsTab = page.getByRole('tab', { name: 'Playlists' })
    await expect(playlistsTab).toBeVisible({ timeout: 10_000 })
    await playlistsTab.click()

    await expect(playlistsTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Journal' })).toHaveAttribute('aria-selected', 'false')
    await expect(page).toHaveURL(/[?&]tab=playlists/)
  })
})
