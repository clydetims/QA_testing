import { test, expect } from '@playwright/test'

test.describe('QA-031.2 - Delete Archived Node', () => {
  test('Delete a previously archived node', async ({ page }) => {
    // Open Creator Dashboard
    await page.goto('/creator')

    // Open the quest
    await page.getByText(/HTML Content Testing/i).click()

    // Open Content section
    await page.getByText(/^Content$/).click()

    // Wait for Visual Canvas
    await expect(page.locator('.react-flow')).toBeVisible({
      timeout: 15000,
    })

    // Open Archived Nodes dialog
    await page.getByRole('button', {
      name: /Archived/i,
    }).click()

    // Archived modal appears
    await expect(
      page.getByRole('heading', {
        name: /Archived Nodes/i,
      }),
    ).toBeVisible()

    // Verify archived node exists
    await expect(
      page.getByText(/Text Node/i),
    ).toBeVisible()

    // Click Delete
    await page.getByRole('button', {
      name: /^Delete$/i,
    }).click()

    // Confirmation modal
    await expect(
      page.getByRole('heading', {
        name: /Are you absolutely sure/i,
      }),
    ).toBeVisible()

    // Permanently delete
    await page.getByRole('button', {
      name: /Delete Permanently/i,
    }).click()

    // Wait until confirmation dialog disappears
    await expect(
      page.getByRole('heading', {
        name: /Are you absolutely sure/i,
      }),
    ).not.toBeVisible()

    // Archived modal should no longer contain the node
    await expect(
      page.getByText(/Text Node/i),
    ).not.toBeVisible({
      timeout: 10000,
    })
  })
})