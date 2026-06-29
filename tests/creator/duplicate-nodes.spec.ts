import { test, expect } from '@playwright/test'

test('QA-026.5: nodes are connected and not duplicated', async ({ page }) => {
  await page.goto('/creator')

  await page.getByText('HTML Content Testing').click()

  await page.getByRole('link', { name: /Content/i }).click()

  await expect(
    page.locator('.react-flow__node').filter({
      hasText: /SCENARIO 1/i,
    })
  ).toHaveCount(1)

  await expect(
    page.locator('.react-flow__node').filter({
      hasText: /QUESTION/i,
    })
  ).toHaveCount(1)

  await expect(
    page.locator('.react-flow__edge')
  ).toHaveCount(1)

  await expect(
    page.locator('.react-flow__node')
  ).toHaveCount(2)

  await expect(
    page.locator('.react-flow__node').filter({
      hasText: /QUESTION/i,
    })
  ).toHaveCount(1)

  await expect(
    page.locator('.react-flow__node').filter({
      hasText: /SCENARIO 1/i,
    })
  ).toHaveCount(1)
})