import { expect, test, type Page } from '@playwright/test'

async function gotoCreator(page: Page) {
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)
}

async function openMyContentTrash(page: Page) {
  const myContentHeading = page.getByText('My Content', { exact: true })
  await expect(myContentHeading).toBeVisible({ timeout: 10_000 })

  const trashTab = page.getByText('Trash', { exact: true })
  await expect(trashTab).toBeVisible({ timeout: 10_000 })
  await trashTab.click()
}

async function archiveFirstQuest(page: Page) {
  const questsTab = page.getByText('Quests', { exact: true }).first()
  await expect(questsTab).toBeVisible({ timeout: 10_000 })
  await questsTab.click()

  const archiveButton = page.getByRole('button', { name: /archive to trash/i }).first()
  await expect(archiveButton).toBeVisible({ timeout: 10_000 })

  const archivedTitleLocator = archiveButton.locator('xpath=ancestor::li[1]//h3').first()
  await expect(archivedTitleLocator).toBeVisible({ timeout: 10_000 })

  const archivedTitle = (await archivedTitleLocator.textContent())?.trim()
  if (!archivedTitle) {
    throw new Error('Could not determine the title of the quest to archive.')
  }

  await archiveButton.click()

  await expect(page.getByText(/moved to Trash/i).first()).toBeVisible({
    timeout: 10_000,
  })

  return archivedTitle
}

test.describe('Creator - Permanent Delete', () => {
  test('QA-024: permanently delete a quest from Trash', async ({ page }) => {
    test.setTimeout(120_000)

    await gotoCreator(page)

    const archivedTitle = await archiveFirstQuest(page)

    await openMyContentTrash(page)

    const trashItem = page.getByRole('heading', { name: archivedTitle, level: 4 })
    await expect(trashItem).toBeVisible({ timeout: 10_000 })

    const trashCard = trashItem.locator('xpath=ancestor::li[1]')
    const deleteButton = trashCard
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-trash-2') })
      .first()

    await expect(deleteButton).toBeVisible({ timeout: 10_000 })
    await deleteButton.click()

    const modal = page.getByRole('dialog')
    await expect(modal.getByText('Permanent Deletion', { exact: true })).toBeVisible({
      timeout: 10_000,
    })

    const confirmInput = page.locator('#confirm-delete')
    await expect(confirmInput).toBeVisible({ timeout: 10_000 })
    await confirmInput.fill('DELETE')

    const confirmDeleteButton = modal.getByRole('button', { name: /^Delete Forever$/i })
    await expect(confirmDeleteButton).toBeEnabled({ timeout: 10_000 })
    await confirmDeleteButton.click()

    await expect(page.getByText(/permanently deleted/i).first()).toBeVisible({
      timeout: 10_000,
    })

    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: archivedTitle, level: 4 })).toHaveCount(0)
  })
})
