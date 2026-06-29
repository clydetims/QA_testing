import { test, expect } from '@playwright/test'

const QUEST_NAME = 'HTML Content Testing'

test.describe('Forum Sync', () => {
  test('QA-026.3: Discussion node and Forum details align', async ({ page }) => {
    test.setTimeout(120_000)

    // Step 1: Open existing quest
    await page.goto('/creator')

    
    const questCard = page.getByRole('button', {
      name: new RegExp(QUEST_NAME, 'i'),
    })

    await questCard.scrollIntoViewIfNeeded()

    await expect(questCard).toBeVisible({
      timeout: 15000,
    })

    await questCard.click()

    // Step 2: Go to Content
    const contentTab = page
      .getByRole('link', { name: /^Content$/i })
      .or(page.getByRole('tab', { name: /^Content$/i }))

    await expect(contentTab).toBeVisible()
    await contentTab.click()

    // Step 3: Publish quest
    const publishBtn = page.getByRole('button', {
      name: /^Publish$/i,
    })

    await expect(publishBtn).toBeVisible({
      timeout: 15000,
    })

    await publishBtn.click()

    // Allow publish to complete
    await page.waitForTimeout(5000)

    // Step 4: Return to Creator Dashboard
    await page.goto('/creator')

    await page.getByRole('link', { name: /^Forum$/i }).click()


    // Step 6: Verify Forum page loaded
    await expect(
      page.getByRole('heading', { name: /Forum/i }),
    ).toBeVisible({
      timeout: 10000,
    })

    // Step 7: Verify discussion post exists
    await expect(
      page.getByText('Test Title'),
    ).toBeVisible({
      timeout: 15000,
    })

    console.log(
      '✅ QA-026.3 passed: Discussion node content appears in Forum'
    )
  })
})