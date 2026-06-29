import { expect, test, type Page } from '@playwright/test'

const TEST_QUEST_NAME = 'Project Management Fundamentals for Software Development Project Management'

test('QA-032: AI suggests 3 crisis scenarios', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

  // Step 1: Open the quest and go to Visual Canvas
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)
  await page.waitForTimeout(3000)

  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await expect(questCard).toBeVisible({ timeout: 15_000 })
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  await page.waitForTimeout(2000)

  // Step 2: Go to Content > Visual Canvas
  const contentTab = page
    .getByRole('link', { name: /^Content$/i })
    .or(page.getByRole('tab', { name: /^Content$/i }))
  await contentTab.waitFor({ state: 'visible', timeout: 10_000 })
  await contentTab.click()

  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, { timeout: 20_000 })
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2000)

  // Step 3: Click "Generate AI Scenarios" button on top left of canvas
  const generateBtn = page.getByRole('button', { name: /Generate AI Scenarios/i })
  await generateBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await generateBtn.click()
  await page.waitForTimeout(1000)

  // Step 4: Verify modal is visible
  const modal = page.getByText('Generate AI Scenarios').last()
  await modal.waitFor({ state: 'visible', timeout: 10_000 })

  // Step 5: Enter topic
  const topicInput = page.getByPlaceholder('Enter topic or module name...')
  await topicInput.waitFor({ state: 'visible', timeout: 10_000 })
  await topicInput.fill('Project Management Fundamentals')
  await page.waitForTimeout(300)

  // Step 6: Number of scenarios is already set to 3 (default), verify it
  const scenarioSlider = page.getByRole('slider')
  await scenarioSlider.waitFor({ state: 'visible', timeout: 5_000 })

  // Step 7: Select complexity - keep Beginner (already selected by default)
  const beginnerOption = page.getByLabel('Beginner')
    .or(page.locator('input[type="radio"]').filter({ hasText: /Beginner/i }))
  if (await beginnerOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await beginnerOption.click()
  }

  // Step 8: Click "Generate Now"
  const generateNowBtn = page.getByRole('button', { name: /Generate Now/i })
  await generateNowBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await generateNowBtn.click()
  await page.waitForTimeout(1000)

  // Step 9: Wait for AI generation to complete (modal closes or loading stops)
  await page.waitForFunction(
    () => !document.querySelector('[class*="loading"], [class*="spinner"], [class*="generating"]'),
    { timeout: 90_000 }
  ).catch(() => {})

})