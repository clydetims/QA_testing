import { test, expect } from '@playwright/test'

test.use({
  storageState: { cookies: [], origins: [] },
})

test.describe('QA-061 - Export Data', () => {
  test('Team data can be exported successfully', async ({
    page,
  }) => {

    // Login as Admin
    await page.goto('/sign-in')

    await page
      .locator('input[type="email"], input[name="identifier"]')
      .first()
      .fill('wyzquestbuilder@gmail.com')

    await page
      .getByRole('button', { name: /^Sign In$/i })
      .last()
      .click()

    await page
      .locator('input[type="password"]')
      .first()
      .fill('WyzQuests2025!')

    await page
      .getByRole('button', { name: /^Sign In$/i })
      .last()
      .click()

    // Wait until dashboard loads
    await page.waitForURL(/admin|dashboard/i, {
      timeout: 30000,
    })

    // Admin dashboard
    await page.goto('/admin')

    // Open Agency Dashboard
    await page.getByRole('link', { name: /Agency Dashboard/i }).click()
 
    // Open Team Analytics
    await page.getByRole('link', { name: /Team Analytics/i }).click()


    // Click Export Team Data
    await page.getByText(/^Export Team Data$/i).click()
  })
})
