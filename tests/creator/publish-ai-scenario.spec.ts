import { test, expect } from '@playwright/test'

test.describe('AI Scenario Seed - Publish Quest', () => {
  test('Quest with AI generated scenario can be published', async ({ page }) => {
    // Open Creator Dashboard
    await page.goto('/creator')

    await page.getByText(/HTML Content Testing/i).click()

    // Open Content section
    await page.getByText(/^Content$/).click()

    // Wait for Visual Canvas
    await expect(page.locator('.react-flow')).toBeVisible({
      timeout: 15000,
    })

    // Click Publish
    const publishButton = page.getByRole('button', {
      name: /^Publish$/i,
    })

    await expect(publishButton).toBeVisible({
      timeout: 15000,
    })

    await publishButton.click()

    // Wait until it becomes Unpublish
    await expect(
      page.getByRole('button', {
        name: /^Unpublish$/i,
      }),
    ).toBeVisible({
      timeout: 30000,
    })

    // Optional: verify published badge
    await expect(
      page.getByText(/Published/i).first(),
    ).toBeVisible()
  })
})