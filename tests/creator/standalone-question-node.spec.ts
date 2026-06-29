import { test, expect } from '@playwright/test'

const QUEST_NAME = 'HTML Content Testing'

test.describe('Question Node Preview', () => {
  test('QA-026.4: Question node renders in Quest Player', async ({ page }) => {
    test.setTimeout(120_000)

    // Open Creator Dashboard
    await page.goto('/creator')

    // Scroll to My Content
    await expect(page.getByText('My Content')).toBeVisible()

    const questCard = page.getByText(QUEST_NAME).first()

    await questCard.scrollIntoViewIfNeeded()

    await expect(questCard).toBeVisible({
      timeout: 15000,
    })

    await questCard.click()

    // Open Content
    const contentTab = page
      .getByRole('link', { name: /^Content$/i })
      .or(page.getByRole('tab', { name: /^Content$/i }))

    await expect(contentTab).toBeVisible()
    await contentTab.click()

    // Wait for Visual Canvas
    await page.waitForURL(/content\/visual-canvas/, {
      timeout: 20000,
    })

    // Verify Scenario node exists
    await expect(
      page.locator('.react-flow__node').filter({
        hasText: /SCENARIO/i,
      }).first(),
    ).toBeVisible({
      timeout: 15000,
    })

    // Verify Question node exists
    await expect(
      page.locator('.react-flow__node').filter({
        hasText: /QUESTION/i,
      }).first(),
    ).toBeVisible({
      timeout: 15000,
    })

    // Go to Review
    const reviewTab = page.getByRole('link', {
      name: /^Review$/i,
    })

    await reviewTab.click()

    // Enter Preview Mode
    const previewButton = page.getByRole('button', {
      name: /Enter Preview Mode/i,
    })

    await expect(previewButton).toBeVisible({
      timeout: 15000,
    })

    await previewButton.click()

    // First Continue
    const continueBtn = page.getByRole('button', {
      name: /^Continue$/i,
    })

    await expect(continueBtn).toBeVisible({
      timeout: 15000,
    })

    await continueBtn.click()

    // Second Continue
    await expect(continueBtn).toBeVisible({
      timeout: 15000,
    })

    await continueBtn.click()

    // Verify Question page loaded
    await expect(
    page.getByRole('button', { name: /Submit/i }),
    ).toBeVisible({
    timeout: 15000,
    })

    console.log(
      '✅ QA-026.4 passed: Question node rendered correctly in Quest Player',
    )
  })
})