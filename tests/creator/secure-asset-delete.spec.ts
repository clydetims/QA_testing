import { expect, test, type Locator, type Page } from '@playwright/test'

async function gotoBackgroundAssets(page: Page) {
  await page.goto('/creator/background-assets')
  await expect(page).toHaveURL(/\/creator\/background-assets/)
  await expect(page.getByRole('heading', { name: /Background Assets/i })).toBeVisible({
    timeout: 15_000,
  })
}

async function getFirstActiveAssetCard(page: Page) {
  const assetCard = page
    .locator('li')
    .filter({ has: page.getByRole('button', { name: /^Delete$/i }) })
    .first()

  await expect(assetCard).toBeVisible({ timeout: 15_000 })
  return assetCard
}

async function getAssetNameFromCard(card: Locator) {
  const nameFromText = (await card.locator('span.truncate').first().textContent().catch(() => ''))?.trim()
  if (nameFromText) return nameFromText

  const nameFromAlt = (await card.locator('img').first().getAttribute('alt').catch(() => ''))?.trim()
  if (nameFromAlt) return nameFromAlt

  throw new Error('Could not determine asset name from the card.')
}

async function moveFirstAssetToTrash(page: Page) {
  await gotoBackgroundAssets(page)

  const assetCard = await getFirstActiveAssetCard(page)
  const assetName = await getAssetNameFromCard(assetCard)

  const deleteButton = assetCard.getByRole('button', { name: /^Delete$/i }).first()
  await expect(deleteButton).toBeVisible({ timeout: 10_000 })
  await deleteButton.click()

  const modal = page.getByRole('dialog')
  await expect(modal.getByRole('heading', { name: /^Move to Trash$/i })).toBeVisible({
    timeout: 10_000,
  })

  const confirmMoveButton = modal.getByRole('button', { name: /^Move to Trash$/i })
  const softDeleteResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/creator/delete-assets') &&
      response.request().method() === 'DELETE' &&
      response.ok(),
    { timeout: 30_000 },
  )

  await confirmMoveButton.click()
  await softDeleteResponse

  await expect(assetCard).toHaveCount(0, { timeout: 20_000 })

  const trashBinLink = page.getByRole('link', { name: /Trash Bin/i }).first()
  await expect(trashBinLink).toBeVisible({ timeout: 10_000 })
  await trashBinLink.click()

  await expect(page).toHaveURL(/\/creator\/trash/)
  await expect(page.getByRole('heading', { name: /Trash Bin/i })).toBeVisible({
    timeout: 15_000,
  })

  return assetName
}

async function getTrashAssetCard(page: Page, assetName: string) {
  const assetCard = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole('heading', { name: assetName, level: 6 }) })
    .first()

  await expect(assetCard).toBeVisible({ timeout: 15_000 })
  return assetCard
}

async function openPurgeModalForAsset(page: Page, assetName: string) {
  const assetCard = await getTrashAssetCard(page, assetName)
  const purgeButton = assetCard.getByRole('button', { name: /^Purge$/i }).first()
  await expect(purgeButton).toBeVisible({ timeout: 10_000 })
  await purgeButton.click()

  const modal = page.getByRole('dialog')
  await expect(modal.getByRole('heading', { name: /^Permanently Delete File$/i })).toBeVisible({
    timeout: 10_000,
  })

  return modal
}

test.describe('Creator - Secure Asset Delete', () => {
  test.describe.configure({ mode: 'serial' })

  test('QA-045: permanently delete a trashed asset with correct confirmation text', async ({
    page,
  }) => {
    test.setTimeout(120_000)

    const assetName = await moveFirstAssetToTrash(page)
    const modal = await openPurgeModalForAsset(page, assetName)

    const confirmInput = page.locator('#confirm-purge-asset')
    await expect(confirmInput).toBeVisible({ timeout: 10_000 })
    await confirmInput.fill('DELETE')

    const deletePermanentlyButton = modal.getByRole('button', {
      name: /^Delete Permanently$/i,
    })
    await expect(deletePermanentlyButton).toBeEnabled({ timeout: 10_000 })

    const purgeResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/creator/purge-assets') &&
        response.request().method() === 'DELETE' &&
        response.ok(),
      { timeout: 30_000 },
    )

    await deletePermanentlyButton.click()
    await purgeResponse

    await expect(page.getByText(/Asset permanently deleted/i).first()).toBeVisible({
      timeout: 10_000,
    })

    await page.reload()
    await page.waitForURL(/\/creator\/trash/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: /Trash Bin/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('heading', { name: assetName, level: 6 })).toHaveCount(0)
  })

  test('QA-046: block permanent delete until DELETE is entered', async ({ page }) => {
    test.setTimeout(120_000)

    const assetName = await moveFirstAssetToTrash(page)
    const modal = await openPurgeModalForAsset(page, assetName)

    const confirmInput = page.locator('#confirm-purge-asset')
    await expect(confirmInput).toBeVisible({ timeout: 10_000 })
    await expect(confirmInput).toHaveValue('')

    const deletePermanentlyButton = modal.getByRole('button', {
      name: /^Delete Permanently$/i,
    })
    await expect(deletePermanentlyButton).toBeDisabled({ timeout: 10_000 })

    await confirmInput.fill('WRONG')
    await expect(deletePermanentlyButton).toBeDisabled({ timeout: 10_000 })
    await expect(page.getByText(/Text does not match/i).first()).toBeVisible({
      timeout: 10_000,
    })

    await modal.getByRole('button', { name: /^Cancel$/i }).click()

    await page.reload()
    await page.waitForURL(/\/creator\/trash/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: assetName, level: 6 })).toBeVisible({
      timeout: 15_000,
    })
  })
})
