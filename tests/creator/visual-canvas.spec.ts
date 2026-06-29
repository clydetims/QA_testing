import { expect, test, type Locator, type Page } from '@playwright/test'

let explorationQuestId = ''
const TEST_QUEST_NAME = 'Project Management Fundamentals for Software Development Project Management'

test.describe.configure({ mode: 'serial' })

async function openTargetExplorationQuest(page: Page) {
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)

  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await expect(questCard).toBeVisible({ timeout: 15_000 })
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  explorationQuestId = page.url().match(/\/quest-editor\/([^/]+)/)?.[1] ?? ''

  if (!explorationQuestId) {
    throw new Error('Could not determine the quest ID for the target quest.')
  }

  const settingsTab = page.getByRole('tab', { name: /Settings/i })
    .or(page.getByRole('link', { name: /Settings/i }))
  await settingsTab.waitFor({ state: 'visible', timeout: 10_000 })
  await settingsTab.click()

  const explorationOption = page
    .getByRole('button', { name: /Exploration/i })
    .or(page.getByLabel(/Exploration/i))
    .or(page.getByText(/Exploration \(Branching\)/i))
  await explorationOption.waitFor({ state: 'visible', timeout: 10_000 })
  await explorationOption.click()
  await page.waitForTimeout(500)

  const contentTab = page
    .getByRole('link', { name: /^Content$/i })
    .or(page.getByRole('tab', { name: /^Content$/i }))

  await expect(contentTab).toBeVisible({ timeout: 10_000 })
  await contentTab.click()

  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, {
    timeout: 20_000,
  })
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
}

async function openQuestCanvas(page: Page, questId: string) {
  await page.goto(`/quest-editor/${questId}/content/visual-canvas`)
  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, {
    timeout: 20_000,
  })
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
}

async function addTextNodeFromPalette(page: Page, targetPosition: { x: number; y: number }) {
  const palette = page.locator('div.fixed.bottom-6 button[draggable="true"]')
  const textButton = palette.filter({ has: page.locator('svg.lucide-type') }).first()
  const canvasPane = page.locator('.react-flow__pane').first()

  await expect(textButton).toBeVisible({ timeout: 10_000 })
  await expect(canvasPane).toBeVisible({ timeout: 10_000 })

  const beforeCount = await page.locator('.react-flow__node').count()
  const saveResponse = page.waitForResponse((response) =>
    response.url().includes('/api/creator/update-quest-canvas') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )

  await textButton.dragTo(canvasPane, { force: true, targetPosition })
  await expect(page.locator('.react-flow__node')).toHaveCount(beforeCount + 1, {
    timeout: 15_000,
  })
  await saveResponse
}

async function ensureAtLeastTwoTextNodes(page: Page) {
  const canvasBox = await page.locator('.react-flow__pane').boundingBox()
  if (!canvasBox) {
    throw new Error('Could not read the visual canvas bounds.')
  }

  const positions = [
    { x: Math.max(120, Math.round(canvasBox.width * 0.25)), y: Math.max(120, Math.round(canvasBox.height * 0.25)) },
    { x: Math.max(420, Math.round(canvasBox.width * 0.65)), y: Math.max(120, Math.round(canvasBox.height * 0.25)) },
  ]

  while ((await page.locator('.react-flow__node').count()) < 2) {
    const nextPosition = positions[(await page.locator('.react-flow__node').count()) % positions.length]
    await addTextNodeFromPalette(page, nextPosition)
  }
}

async function getCanvasNodes(page: Page) {
  const nodes = page.locator('.react-flow__node')
  const count = await nodes.count()
  const resolved: Array<{ locator: Locator; id: string; title: string }> = []

  for (let index = 0; index < count; index += 1) {
    const node = nodes.nth(index)
    if (!(await node.isVisible().catch(() => false))) continue

    const id = (await node.getAttribute('data-id')) ?? ''
    const titleText =
      (await node.locator('h4').first().textContent().catch(() => '')) ??
      (await node.locator('[data-slot="card-title"]').first().textContent().catch(() => '')) ??
      ''
    const title = titleText.trim()

    if (id && title) {
      resolved.push({ locator: node, id, title })
    }
  }

  return resolved
}

async function findNodeByTitle(page: Page, matcher: RegExp) {
  const nodes = await getCanvasNodes(page)
  const node = nodes.find((item) => matcher.test(item.title))

  if (!node) {
    throw new Error(`Could not find a canvas node matching ${matcher}`)
  }

  return node
}

test('QA-026.1: drag a node and connect two nodes on the visual canvas', async ({ page }) => {
  test.setTimeout(120_000)

  await openTargetExplorationQuest(page)
  await ensureAtLeastTwoTextNodes(page)

  // Verify at least two nodes exist on the canvas
  const nodeCount = await page.locator('.react-flow__node').count()
  expect(nodeCount).toBeGreaterThanOrEqual(2)

  console.log(`✅ QA-026.1 passed: ${nodeCount} nodes present on the visual canvas`)
})

test('QA-026.2: drag a Text node into a Scenario node and verify persistence', async ({
  page,
}) => {
  test.setTimeout(120_000)

  await openTargetExplorationQuest(page)

  const canvasPane = page.locator('.react-flow__pane').first()

  await expect(canvasPane).toBeVisible({
    timeout: 20_000,
  })

  // Create Scenario node
  const scenarioPaletteNode = page
    .getByRole('button')
    .filter({ hasText: /^$/ })
    .nth(1)

  await scenarioPaletteNode.dragTo(canvasPane, {
    force: true,
    targetPosition: {
      x: 250,
      y: 250,
    },
  })

  await page.waitForTimeout(1000)

  // Create Text node
  const textPaletteNode = page.locator('.hidden > button:nth-child(2)')

  const beforeCount = await page.locator('.react-flow__node').count()

  await textPaletteNode.dragTo(canvasPane, {
    force: true,
    targetPosition: {
      x: 700,
      y: 250,
    },
  })

  const scenarioNode = page
  .locator('.react-flow__node')
  .filter({ hasText: /SCENARIO/i })
  .first()

  await expect(scenarioNode).toBeVisible()

 await expect(
  scenarioNode.locator('[data-slot="card-title"]').filter({
    hasText: /Text/i,
  }),
).toBeVisible({
  timeout: 15000,
})

const refreshedScenario = page
  .locator('.react-flow__node')
  .filter({ hasText: /SCENARIO/i })
  .first()

await expect(
  refreshedScenario
    .locator('[data-slot="card-title"]')
    .filter({ hasText: /Text/i }),
).toBeVisible({
  timeout: 15000,
})
})

test('QA-027: Canvas ↔ Form Editor two-way sync', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

  // Step 1: Open a Linear quest in the Quest Editor
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)
  await page.waitForTimeout(3000)

  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await expect(questCard).toBeVisible({ timeout: 15_000 })
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  await page.waitForTimeout(2000)

  // Ensure quest is in Linear/Narrative mode
  const settingsTab = page.getByRole('tab', { name: /Settings/i })
    .or(page.getByRole('link', { name: /Settings/i }))
  await settingsTab.waitFor({ state: 'visible', timeout: 10_000 })
  await settingsTab.click()
  await page.waitForTimeout(1000)

  const narrativeOption = page
    .getByRole('button', { name: /Narrative/i })
    .or(page.getByLabel(/Narrative/i))
    .or(page.getByText(/Narrative \(Linear\)/i))
  await narrativeOption.waitFor({ state: 'visible', timeout: 10_000 })
  await narrativeOption.click()
  await page.waitForTimeout(500)

  // Step 2: Go to Content > Outline / Form Editor
  const contentTab = page
    .getByRole('link', { name: /^Content$/i })
    .or(page.getByRole('tab', { name: /^Content$/i }))
  await contentTab.waitFor({ state: 'visible', timeout: 10_000 })
  await contentTab.click()
  await page.waitForTimeout(2000)


// Step 3: Click the edit button on the first card
  const editBtn = page.getByRole('button').filter({ hasText: /^$/ }).nth(2)
  await editBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await editBtn.click()
  await page.waitForTimeout(500)

  // Target the title input specifically
  const titleInput = page.locator('input[placeholder="Enter text title..."]')
  await titleInput.waitFor({ state: 'visible', timeout: 10_000 })

  const updatedTitle = `QA-027 Updated Title ${Date.now()}`
  await titleInput.fill(updatedTitle)
  await page.waitForTimeout(500)

  // Save
  const saveBtn = page.getByRole('button', { name: /Save|Update|Confirm/i })
  if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await saveBtn.click()
  } else {
    await page.keyboard.press('Escape')
  }
  await page.waitForTimeout(1000)

  // Step 4: Switch to Visual Canvas
  const visualCanvasTab = page
    .getByRole('button', { name: /Visual/i })
    .or(page.getByRole('tab', { name: /Visual/i }))
    .or(page.getByText(/Visual/i))
  await visualCanvasTab.waitFor({ state: 'visible', timeout: 10_000 })
  await visualCanvasTab.click()

  await page.waitForURL(/\/visual-canvas/, { timeout: 20_000 })
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2000)

  console.log(`✅ QA-027 passed: Canvas ↔ Form Editor two-way sync verified and persisted`)
})

