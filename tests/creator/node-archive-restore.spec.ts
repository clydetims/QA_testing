import { expect, test, type Locator, type Page } from '@playwright/test'

let archivedQuestId = ''
let archivedNodeTitle = ''

async function openFirstExplorationQuest(page: Page) {
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)

  const explorationCard = page
    .locator('li')
    .filter({ has: page.getByText('Exploration', { exact: true }) })
    .filter({ has: page.locator('h3') })
    .first()

  await expect(explorationCard).toBeVisible({ timeout: 15_000 })

  const questTitle = explorationCard.locator('h3').first()
  await expect(questTitle).toBeVisible({ timeout: 10_000 })
  await questTitle.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  archivedQuestId = page.url().match(/\/quest-editor\/([^/]+)/)?.[1] ?? ''
  if (!archivedQuestId) {
    throw new Error('Could not determine the quest ID for the exploration quest.')
  }

  const contentTab = page
    .getByRole('link', { name: /^Content$/i })
    .or(page.getByRole('tab', { name: /^Content$/i }))

  await expect(contentTab).toBeVisible({ timeout: 10_000 })
  await contentTab.click()
  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, {
    timeout: 20_000,
  })
}

async function openQuestCanvas(page: Page, questId: string) {
  await page.goto(`/quest-editor/${questId}/content/visual-canvas`)
  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, {
    timeout: 20_000,
  })
}

async function getTargetCanvasNode(page: Page) {
  const nodes = page.locator('.react-flow__node')
  await expect(nodes.first()).toBeVisible({ timeout: 20_000 })

  const count = await nodes.count()
  for (let index = 0; index < count; index += 1) {
    const node = nodes.nth(index)
    if (!(await node.isVisible().catch(() => false))) continue

  const rawTitle = await node.locator('[data-slot="card-title"]').first().textContent().catch(() => '')
  const title = (rawTitle ?? '').trim()

    if (/^Quiz 1$/i.test(title)) {
      return { node, title }
    }
  }

  throw new Error('Could not find the target Quiz 1 node on the canvas.')
}

async function waitForCanvasNodeTitle(page: Page, title: string, shouldExist: boolean) {
  await page.waitForFunction(
    ([expectedLabel, expectedExistence]) => {
      const matches = Array.from(document.querySelectorAll('.react-flow__node')).some((node) => {
        const titleNode = node.querySelector('[data-slot="card-title"]');
        return titleNode?.textContent?.trim() === expectedLabel;
      });

      return matches === expectedExistence;
    },
    [title, shouldExist],
    { timeout: 20_000 },
  );
}

async function openNodeActions(node: Locator) {
  const actionsButton = node.locator('button[data-slot="dropdown-menu-trigger"]').first()
  await expect(actionsButton).toBeVisible({ timeout: 10_000 })
  await actionsButton.click()
  return actionsButton
}

async function archiveNodeFromCanvas(page: Page) {
  const { node, title } = await getTargetCanvasNode(page)
  archivedNodeTitle = title

  await openNodeActions(node)

  const archiveItem = page.getByRole('menuitem', { name: /^Archive$/i })
  await expect(archiveItem).toBeVisible({ timeout: 10_000 })
  const saveResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/creator/update-quest-canvas') &&
      response.request().method() === 'PUT' &&
      response.ok(),
    { timeout: 30_000 },
  )
  await archiveItem.click()
  await saveResponse

  await waitForCanvasNodeTitle(page, title, false)

  return title
}

async function openArchivedNodesModal(page: Page) {
  const archivedButton = page.getByRole('button', { name: /Archived \(\d+\)/i })
  await expect(archivedButton).toBeVisible({ timeout: 10_000 })
  await archivedButton.click()

  const modal = page.getByRole('dialog').filter({
    has: page.getByText('Archived Nodes', { exact: true }),
  })
  await expect(modal).toBeVisible({ timeout: 10_000 })

  return modal.first()
}

test.describe('Creator - Archive Node', () => {
  test.describe.configure({ mode: 'serial' })

  test('QA-030: archive a node on the canvas', async ({ page }) => {
    test.setTimeout(120_000)

    await openFirstExplorationQuest(page)
    await archiveNodeFromCanvas(page)

    const modal = await openArchivedNodesModal(page)
    await expect(modal.getByText(/Quiz Node/i).first()).toBeVisible({ timeout: 10_000 })

    // Keep the node archived for the follow-up restore case.
    await expect(modal.getByRole('button', { name: /^Restore$/i })).toBeVisible({
      timeout: 10_000,
    })

    // Reload to confirm the archived state was actually persisted, not just shown in-memory.
    await page.reload()
    await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, {
      timeout: 20_000,
    })

    const persistedModal = await openArchivedNodesModal(page)
    await expect(persistedModal.getByText(/Quiz Node/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('QA-031: restore a previously archived node', async ({ page }) => {
    test.setTimeout(120_000)

    if (!archivedQuestId || !archivedNodeTitle) {
      throw new Error('QA-030 must run first so QA-031 can restore the archived node.')
    }

    await openQuestCanvas(page, archivedQuestId)

    const modal = await openArchivedNodesModal(page)
    const archivedItem = modal.getByText(/Quiz Node/i).first().locator('xpath=ancestor::div[contains(@class,"justify-between")][1]')
    await expect(archivedItem).toBeVisible({ timeout: 10_000 })

    const restoreButton = archivedItem.getByRole('button', { name: /^Restore$/i })
    await expect(restoreButton).toBeVisible({ timeout: 10_000 })
    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/creator/update-quest-canvas') &&
        response.request().method() === 'PUT' &&
        response.ok(),
      { timeout: 30_000 },
    )
    await restoreButton.click()
    await saveResponse

    await waitForCanvasNodeTitle(page, archivedNodeTitle, true)

    // Reload once more to verify the restore also persists.
    await page.reload()
    await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, {
      timeout: 20_000,
    })
    await waitForCanvasNodeTitle(page, archivedNodeTitle, true)
  })
})
