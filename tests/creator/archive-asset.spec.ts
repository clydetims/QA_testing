import { expect, test, type Page } from '@playwright/test'

const TEST_QUEST_NAME = 'HTML Content Testing'

test('QA-051: Move asset to Trash Bin and verify not selectable for new nodes', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

// Step 1: Open Creator -> Background Assets
  await page.goto('/creator/background-assets')
  await expect(page).toHaveURL(/\/creator\/background-assets/)
  await page.waitForTimeout(2000)



// Step 2: Locate the "hanni pham" asset
  const firstAsset = page.getByRole('img', { name: 'hanni pham' })
  await firstAsset.waitFor({ state: 'visible', timeout: 10_000 })
  console.log('✅ Step 2 passed: Found asset — hanni pham')

  // Step 3: Click the Delete button on the "hanni pham" asset
  // Hover first to make the delete button visible
  await firstAsset.hover()
  await page.waitForTimeout(500)

  const deleteIcon = page.getByRole('button', { name: 'Delete' }).first()
  await deleteIcon.waitFor({ state: 'visible', timeout: 10_000 })
  await deleteIcon.click()
  await page.waitForTimeout(500)

// Step 4: Confirm "Move to Trash" dialog
  const moveToTrashBtn = page.getByRole('button', { name: 'Move to Trash' })
  await moveToTrashBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await moveToTrashBtn.click()
  await page.waitForTimeout(1000)
  console.log('✅ Step 4 passed: Move to Trash confirmed')

  // Step 5: Verify asset is removed from the active asset library
  await expect(firstAsset).toBeHidden({ timeout: 10_000 })
  console.log('✅ Step 5 passed: Asset removed from active library')

// Step 6: Open Trash Bin
  const trashBinBtn = page.getByRole('button', { name: 'Trash Bin' })
  await trashBinBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await trashBinBtn.click()
  await page.waitForTimeout(1000)

// Step 7: Verify "hanni pham" appears in the Trash Bin
  const archivedAsset = page.getByText('30d lefthanni phamIMAGE')
  await expect(archivedAsset).toBeVisible({ timeout: 10_000 })
  console.log('✅ Step 7 passed: "hanni pham" appears in Trash Bin')

// Step 8: Go back to creator dashboard
  await page.goto('/creator')
  await page.waitForTimeout(3000)

  // Open the HTML Content Testing quest
  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await questCard.waitFor({ state: 'visible', timeout: 15_000 })
  await questCard.scrollIntoViewIfNeeded()
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  await page.waitForTimeout(2000)

  // Go to Media tab
  const mediaTab = page
    .getByRole('link', { name: /^Media$/i })
    .or(page.getByRole('tab', { name: /^Media$/i }))
  await mediaTab.waitFor({ state: 'visible', timeout: 10_000 })
  await mediaTab.click()
  await page.waitForTimeout(2000)

  // Click Select Background Image
  const selectBgImageBtn = page.getByRole('button', { name: /Select Background Image/i })
  await selectBgImageBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await selectBgImageBtn.click()
  await page.waitForTimeout(1000)

  // Step 8: Click "From Assets" tab
  const fromAssetsBtn = page.getByRole('button', { name: 'From Assets' })
  await fromAssetsBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await fromAssetsBtn.click()
  await page.waitForTimeout(1000)

  // Click "Browse Images"
  const browseImagesBtn = page.getByRole('button', { name: /Browse Images/i })
  await browseImagesBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await browseImagesBtn.click()
  await page.waitForTimeout(1000)

  // Step 9: Verify "hanni pham" is NOT in the asset picker
  const hanniPhamInPicker = page.getByRole('img', { name: 'hanni pham' })
  await expect(hanniPhamInPicker).toBeHidden({ timeout: 5_000 })
  console.log('✅ Step 9 passed: "hanni pham" not selectable in asset picker — archived asset hidden')

  console.log('✅ QA-051 passed: Asset moved to Trash Bin; not selectable for new nodes')
})