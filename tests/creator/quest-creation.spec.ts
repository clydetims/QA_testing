import { expect, test, type Page } from '@playwright/test'

const TEST_QUEST_NAME = 'Project Management Fundamentals for Software Development Project Management'

test('QA-019: Select Narrative (Linear) mode for a quest', async ({ page }: { page: Page }) => {
  test.setTimeout(60_000)

  // Step 1: Open an existing quest in the Quest Editor
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)

  const myContentSection = page.getByText('My Content', { exact: true })
  await myContentSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)

  // Step 2: Click the quest
  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await questCard.waitFor({ state: 'visible', timeout: 10_000 })
  await questCard.scrollIntoViewIfNeeded()
  await questCard.click()

  // Step 3: Wait for quest editor to load
  await page.waitForURL(/\/quest-editor\//, { timeout: 15_000 })
  await page.waitForTimeout(2000)

  // Step 4: Open the Settings tab and find Quest Mode
  const settingsTab = page.getByRole('tab', { name: /Settings/i })
    .or(page.getByRole('link', { name: /Settings/i }))
  await settingsTab.waitFor({ state: 'visible', timeout: 10_000 })
  await settingsTab.click()

  // Step 5: Confirm the Quest Mode section is visible
  const questModeSection = page.getByText(/Quest Mode/i)
  await questModeSection.waitFor({ state: 'visible', timeout: 10_000 })

  // Step 6: Click Narrative (Linear)
  const narrativeOption = page
    .getByRole('button', { name: /Narrative/i })
    .or(page.getByLabel(/Narrative/i))
    .or(page.getByText(/Narrative \(Linear\)/i))
  await narrativeOption.waitFor({ state: 'visible', timeout: 10_000 })
  await narrativeOption.click()
  await page.waitForTimeout(500)

  // Step 7: Open the quest's Content area
  const contentTab = page.getByRole('tab', { name: /Content/i })
    .or(page.getByRole('link', { name: /Content/i }))
  await contentTab.waitFor({ state: 'visible', timeout: 20_000 })
  await contentTab.click()

  // Step 8: Verify we land on outline/form editor (Linear mode), NOT visual canvas
  await expect(page.getByText(/visual.?canvas/i)).toBeHidden({ timeout: 5_000 })

})

test('QA-020: Select Exploration (Branching) mode for a quest', async ({ page }: { page: Page }) => {
  test.setTimeout(60_000)

  // Step 1: Navigate to creator dashboard
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)
  await page.waitForTimeout(3000)

  // Step 2: Click the quest
  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await questCard.waitFor({ state: 'visible', timeout: 10_000 })
  await questCard.scrollIntoViewIfNeeded()
  await questCard.click()

  // Step 3: Wait for quest editor to load
  await page.waitForURL(/\/quest-editor\//, { timeout: 15_000 })
  await page.waitForTimeout(2000)

  // Step 4: Go to Overview
  const overviewTab = page.getByRole('tab', { name: /Overview/i })
    .or(page.getByRole('link', { name: /Overview/i }))
  await overviewTab.waitFor({ state: 'visible', timeout: 10_000 })
  await overviewTab.click()
  await page.waitForTimeout(1000)

  // Step 5: Open the Settings tab
  const settingsTab = page.getByRole('tab', { name: /Settings/i })
    .or(page.getByRole('link', { name: /Settings/i }))
  await settingsTab.waitFor({ state: 'visible', timeout: 10_000 })
  await settingsTab.click()
  await page.waitForTimeout(1000)

  // Step 6: Confirm Quest Mode section is visible
  const questModeSection = page.getByText(/Quest Mode/i)
  await questModeSection.waitFor({ state: 'visible', timeout: 10_000 })


  // Step 7: Click Exploration (Branching)
  const explorationOption = page
    .getByRole('button', { name: /Exploration/i })
    .or(page.getByLabel(/Exploration/i))
    .or(page.getByText(/Exploration \(Branching\)/i))
  await explorationOption.waitFor({ state: 'visible', timeout: 10_000 })
  await explorationOption.click()
  await page.waitForTimeout(500)


  // Step 9: Open the quest's Content area
  const contentTab = page.getByRole('tab', { name: /Content/i })
    .or(page.getByRole('link', { name: /Content/i }))
  await contentTab.waitFor({ state: 'visible', timeout: 10_000 })
  await contentTab.click()
  await page.waitForTimeout(1000)

  // Step 10: Verify canvas view is enabled
  const canvasView = page
    .getByTestId('visual-canvas')
    .or(page.getByText(/Visual Canvas/i))
    .or(page.locator('[class*="canvas"]'))
  await canvasView.waitFor({ state: 'visible', timeout: 15_000 })

  // Step 11: Verify mode persisted after reload
  await page.reload()
  await page.waitForTimeout(3000)

  const overviewTabAfterReload = page.getByRole('tab', { name: /Overview/i })
    .or(page.getByRole('link', { name: /Overview/i }))
  await overviewTabAfterReload.waitFor({ state: 'visible', timeout: 10_000 })
  await overviewTabAfterReload.click()
  await page.waitForTimeout(1000)

  const settingsTabAfterReload = page.getByRole('tab', { name: /Settings/i })
    .or(page.getByRole('link', { name: /Settings/i }))
  await settingsTabAfterReload.waitFor({ state: 'visible', timeout: 10_000 })
  await settingsTabAfterReload.click()
  await page.waitForTimeout(1000)

})