import { test, expect } from '@playwright/test'

test.use({
  storageState: { cookies: [], origins: [] },
})

test.describe('QA-073.5 - Secure User Delete', () => {
  test('Deletion is blocked when Admin password is incorrect', async ({
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
      page.getByText('Clyde Ador', { exact: false }).first(),
    ).toBeVisible({
      timeout: 15000,
    })

 
    const clydeRow = page
      .locator('tr')
      .filter({
        has: page.getByText(/Clyde Ador/i),
      })


    // Open actions menu (3 dots)
    await clydeRow
      .locator('#radix-_r_2e_')
      .filter({
        has: page.locator('svg'),
      })
      .last()
      .click()

    // Click Delete
    await page.getByText(/^Delete$/i).click()

    // Verify modal opened
    await expect(
      page.getByRole('heading', {
        name: /Confirm Identity/i,
      }),
    ).toBeVisible()

    // Enter INVALID password
    await page
      .getByPlaceholder(/Enter your password/i)
      .fill('WrongPassword123')

    // Click Verify
    await page.getByRole('button', { name: /^Verify$/i }).click()

    await expect(
    page.getByRole('heading', {
        name: /Confirm Identity/i,
    }),
    ).toBeVisible()
  })
})