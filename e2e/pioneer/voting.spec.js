import { test, expect } from '../fixtures/test.js'

test.describe('Pioneer — Voting (single-screen rate flow)', () => {
  test('dish detail shows "Rate this dish" CTA', async ({ page }) => {
    await page.goto('/')

    // Wait for dishes to load, click first one
    const firstDish = page.locator('[data-dish-id]').first()
    await expect(firstDish).toBeVisible({ timeout: 15_000 })
    await firstDish.click()
    await page.waitForURL(/\/dish\//)

    // The rate CTA button should be visible (authed users see "Rate this dish"
    // or, if they've voted before, "Update your rating").
    const rateCta = page.getByRole('button', { name: /Rate this dish|Update your rating/i })
    await expect(rateCta).toBeVisible({ timeout: 10_000 })
  })

  test('clicking Rate CTA opens the overlay with a rating slider', async ({ page }) => {
    await page.goto('/')

    const firstDish = page.locator('[data-dish-id]').first()
    await expect(firstDish).toBeVisible({ timeout: 15_000 })
    await firstDish.click()
    await page.waitForURL(/\/dish\//)

    // Open the rate flow overlay
    const rateCta = page.getByRole('button', { name: /Rate this dish|Update your rating/i })
    await expect(rateCta).toBeVisible({ timeout: 10_000 })
    await rateCta.click()

    // Overlay should appear as a dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Rating slider (input[type=range]) should be present inside the overlay
    const slider = dialog.getByRole('slider')
    await expect(slider).toBeVisible({ timeout: 5000 })

    // Submit button should exist but start disabled (slider is "unrated" until
    // the user touches it).
    const submit = dialog.getByRole('button', { name: /Submit rating|Update rating|Saving…/i })
    await expect(submit).toBeVisible()
  })

  test('interacting with the slider enables Submit and advances the flow', async ({ page }) => {
    await page.goto('/')

    const firstDish = page.locator('[data-dish-id]').first()
    await expect(firstDish).toBeVisible({ timeout: 15_000 })
    await firstDish.click()
    await page.waitForURL(/\/dish\//)

    // Open overlay
    const rateCta = page.getByRole('button', { name: /Rate this dish|Update your rating/i })
    await expect(rateCta).toBeVisible({ timeout: 10_000 })
    await rateCta.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Drive the slider via keyboard — FoodRatingSlider is a native
    // <input type="range"> with aria-label "Rate this dish from 0 to 10"
    // when unrated. Focusing + ArrowRight nudges it off the unrated state.
    const slider = dialog.getByRole('slider')
    await slider.focus()
    // Several presses to reach a clearly-rated value (step is 0.1, default
    // is around the midpoint once touched — a few presses is plenty to
    // move the slider off its initial unrated state).
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowRight')
    }

    // Submit should now be enabled
    const submit = dialog.getByRole('button', { name: /Submit rating|Update rating/i })
    await expect(submit).toBeEnabled({ timeout: 5000 })

    // Clicking Submit should either close the overlay or move to a saved/
    // updated state. We don't assert on server persistence here (no mock),
    // just that the flow doesn't crash and the dish page is still loaded.
    await submit.click()
    await page.waitForTimeout(1500)
    expect(page.url()).toContain('/dish/')
  })
})
