import { test, expect } from '@playwright/test'

test.use({
  storageState: { cookies: [], origins: [] },
})

test.describe('QA-081 - Verification Prompt Shows', () => {
  test('Verification prompt appears when changing user role', async ({
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

    // Open Manage Users
    await page.getByRole('link', { name: /Manage Users/i }).click()

    // Wait for users table
    await expect(
      page.getByText('Pat Babala', { exact: false }).first(),
    ).toBeVisible({
      timeout: 15000,
    })
 
    const PatRow = page
      .locator('tr')
      .filter({
        has: page.getByText(/Pat Babala/i),
      })

    // Open role menu 
    await PatRow
    page.locator('tr:nth-child(26) > td:nth-child(4) > .border-input').click();

    // Change to ADMIN
    await page.getByRole('option', { name: 'ADMIN' }).click()

    // Verify modal opened
    await expect(
      page.getByRole('dialog', { name: 'Confirm Identity' })
    ).toBeVisible()

  })
})