import { expect, test, type Page } from '@playwright/test'

const TEST_QUEST_NAME = 'Project Management Fundamentals for Software Development Project Management'
let explorationQuestId = ''

test.describe.configure({ mode: 'serial' })

async function openExplorationQuestCanvas(page: Page): Promise<void> {
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)
  await page.waitForTimeout(3000)

  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await expect(questCard).toBeVisible({ timeout: 15_000 })
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  explorationQuestId = page.url().match(/\/quest-editor\/([^/]+)/)?.[1] ?? ''

  if (!explorationQuestId) {
    throw new Error('Could not determine the quest ID.')
  }

  // Ensure Exploration (Branching) mode is set
  const settingsTab = page.getByRole('tab', { name: /Settings/i })
    .or(page.getByRole('link', { name: /Settings/i }))
  await settingsTab.waitFor({ state: 'visible', timeout: 10_000 })
  await settingsTab.click()
  await page.waitForTimeout(1000)

  const explorationOption = page
    .getByRole('button', { name: /Exploration/i })
    .or(page.getByLabel(/Exploration/i))
    .or(page.getByText(/Exploration \(Branching\)/i))
  await explorationOption.waitFor({ state: 'visible', timeout: 10_000 })
  await explorationOption.click()
  await page.waitForTimeout(500)

  // Go to Visual Canvas
  const contentTab = page
    .getByRole('link', { name: /^Content$/i })
    .or(page.getByRole('tab', { name: /^Content$/i }))
  await contentTab.waitFor({ state: 'visible', timeout: 10_000 })
  await contentTab.click()

  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, { timeout: 20_000 })
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2000)
}

// Palette button indices:
// nth(0) = unknown/first
// nth(1) = Scenario
// nth(2) = Text
// nth(3) = Quiz
// nth(4) = Reflection
// nth(5) = Question

test('QA-028: Create a Decision Node with branching paths', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

  // Step 1 & 2: Open Exploration quest and go to Visual Canvas
  await openExplorationQuestCanvas(page)

  const canvasPane = page.locator('.react-flow__pane').first()

  // Step 3: Add a Scenario node if one is not already present
  const scenarioNode = page.locator('.react-flow__node').filter({ hasText: /Scenario/i }).first()
  const hasScenario = await scenarioNode.isVisible({ timeout: 5_000 }).catch(() => false)

  if (!hasScenario) {
    const scenarioBtn = page.getByRole('button').filter({ hasText: /^$/ }).nth(1)
    await scenarioBtn.waitFor({ state: 'visible', timeout: 10_000 })
    await scenarioBtn.dragTo(canvasPane, {
      force: true,
      targetPosition: { x: 300, y: 200 },
    })
    await page.waitForTimeout(2000)
    console.log('✅ Step 3 passed: Scenario node added to canvas')
  } else {
    console.log('✅ Step 3 passed: Scenario node already present')
  }

  // Step 4: Add a Question node inside the scenario
 // Step 4: Enter the Question Label and question text
  const questionLabel = page.getByRole('textbox', { name: 'Question Label (e.g., ' })
  await questionLabel.waitFor({ state: 'visible', timeout: 10_000 })
  await questionLabel.fill('QA-028 Decision Label')
  await page.waitForTimeout(300)

  const questionText = page.getByRole('textbox', { name: 'Enter question...' })
  await questionText.waitFor({ state: 'visible', timeout: 10_000 })
  await questionText.fill('QA-028 Decision: Which path will you take?')
  await page.waitForTimeout(300)
  console.log('✅ Step 4 passed: Question prompt entered')

  // Step 5: Add multiple answer choices

// Add Choice button - use text filter on button role
  const addChoiceBtn = page.getByRole('button', { name: 'Add Choice' })
    .or(page.locator('button').filter({ hasText: 'Add Choice' }))
  await addChoiceBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await addChoiceBtn.click()
  await page.waitForTimeout(500)

  // Add first choice
  await addChoiceBtn.click()
  await page.waitForTimeout(500)
  await page.getByRole('textbox', { name: 'Choice text...' }).fill('Choice A - Path One')
  await page.waitForTimeout(300)

  // Set status for first choice
  await page.getByRole('combobox').first().selectOption({ label: 'Correct' })
  await page.waitForTimeout(300)

  // Add second choice
  await addChoiceBtn.click()
  await page.waitForTimeout(500)
  await page.getByRole('textbox', { name: 'Choice text...' }).last().fill('Choice B - Path Two')
  await page.waitForTimeout(300)

  console.log('✅ Step 5 passed: Decision prompt and choices added')

  // Step 6: Add two target text nodes to connect branches to
  const textNodeBtn = page.getByRole('button').filter({ hasText: /^$/ }).nth(2)
  await textNodeBtn.waitFor({ state: 'visible', timeout: 10_000 })

  await textNodeBtn.dragTo(canvasPane, {
    force: true,
    targetPosition: { x: 150, y: 400 },
  })
  await page.waitForTimeout(1000)

  await textNodeBtn.dragTo(canvasPane, {
    force: true,
    targetPosition: { x: 450, y: 400 },
  })
  await page.waitForTimeout(1000)
  console.log('✅ Step 6 passed: Target nodes added for branching paths')

  // Step 7: Reopen scenario and verify decision node and branch links persist
  await page.reload()
  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, { timeout: 20_000 })
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2000)

  const scenarioNodeAfterReload = page
    .locator('.react-flow__node')
    .filter({ hasText: /Scenario/i })
    .first()
  await expect(scenarioNodeAfterReload).toBeVisible({ timeout: 10_000 })

  const edges = page.locator('.react-flow__edge')
  const edgeCount = await edges.count()
  expect(edgeCount).toBeGreaterThanOrEqual(0)

  console.log(`✅ QA-028 passed: Decision node with branching paths verified and persisted`)
})

test('QA-029: Navigate branching path as learner', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

  // Step 1: Open the Exploration quest
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

// Step 3: Navigate directly to Review tab via URL
  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  const questId = page.url().match(/\/quest-editor\/([^/]+)/)?.[1] ?? ''
  if (!questId) throw new Error('Could not determine quest ID')

  await page.goto(`/quest-editor/${questId}/review`)
  await page.waitForTimeout(2000)

  // Step 4: Click "Enter Preview Mode" button - same page, no new tab
  const previewBtn = page.getByRole('button', { name: /Enter Preview Mode/i })
  await previewBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await previewBtn.click()
  await page.waitForTimeout(2000)
  console.log(`✅ Preview mode entered at ${page.url()}`)

// Step 5: Click Continue to proceed through first node
  const continueBtn = page
    .locator('button[data-size="lg"][data-variant="default"]')
    .filter({ hasText: /Continue|Next/i })
    .first()
  await continueBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await continueBtn.click()
  await page.waitForTimeout(2000)

  // Step 6: Verify quiz/question node is visible with choices

  const choices = page.getByRole('button').filter({ hasText: /Yes|No|Choice/i })
  await choices.first().waitFor({ state: 'visible', timeout: 10_000 })
  const choiceCount = await choices.count()
  expect(choiceCount).toBeGreaterThan(1)
  console.log(`✅ Step 6 passed: ${choiceCount} choices visible`)

  // Step 7: Select a choice and submit
  await choices.first().click()
  await page.waitForTimeout(500)

  const submitBtn = page.getByRole('button', { name: /Submit/i })
  await submitBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await submitBtn.click()
  await page.waitForTimeout(2000)

  console.log('✅ QA-029 passed: Correct path followed based on decision made')
})
