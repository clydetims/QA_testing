import { expect, test, type Page } from '@playwright/test'

const TEST_QUEST_NAME = 'Project Management Fundamentals for Software Development Project Management'
const UPDATED_TITLE = 'QA-025 Form Editor Updated Title'
const SECOND_CARD_TITLE = 'QA-025 Form Editor Reordered Card'
const FIRST_CARD_BODY = 'QA-025 body content for the newly created text card'

test.describe.configure({ mode: 'serial' })

async function openLinearFormEditor(page: Page) {
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)

  const myContentSection = page.getByText('My Content', { exact: true })
  await myContentSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)

  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await questCard.waitFor({ state: 'visible', timeout: 10_000 })
  await questCard.scrollIntoViewIfNeeded()
  await questCard.click()

  await page.waitForURL(/\/quest-editor\//, { timeout: 15_000 })
  await page.waitForTimeout(1500)

  const settingsTab = page.getByRole('tab', { name: /Settings/i })
    .or(page.getByRole('link', { name: /Settings/i }))
  await settingsTab.waitFor({ state: 'visible', timeout: 10_000 })
  await settingsTab.click()

  const narrativeOption = page
    .getByRole('button', { name: /Narrative/i })
    .or(page.getByLabel(/Narrative/i))
    .or(page.getByText(/Narrative \(Linear\)/i))
  await narrativeOption.waitFor({ state: 'visible', timeout: 10_000 })
  await narrativeOption.click()
  await page.waitForTimeout(500)

  const contentTab = page.getByRole('tab', { name: /Content/i })
    .or(page.getByRole('link', { name: /Content/i }))
  await contentTab.waitFor({ state: 'visible', timeout: 10_000 })
  await contentTab.click()

  await expect(page.getByRole('heading', { name: /Quest Canvas/i })).toBeVisible({
    timeout: 15_000,
  })
}

function getCardLocators(page: Page) {
  return page.locator('div.group').filter({ has: page.locator('h4') })
}

async function createTextCard(page: Page, title: string, body: string) {
  const addCardButton = page.getByRole('button', { name: /Add Card|Add Your First Card/i }).first()
  await expect(addCardButton).toBeVisible({ timeout: 15_000 })

  const createResponse = page.waitForResponse((response) =>
    response.url().includes('/api/creator/quest-content-cards/create') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )

  await addCardButton.click()

  const chooseTypeDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /Choose Card Type/i }),
  })
  await expect(chooseTypeDialog).toBeVisible({ timeout: 10_000 })
  await chooseTypeDialog.getByRole('button', { name: /Text Card/i }).click()

  await createResponse

  const editDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /Edit Card/i }),
  })
  await expect(editDialog).toBeVisible({ timeout: 10_000 })

  const titleInput = editDialog.getByPlaceholder('Enter text title...')
  await expect(titleInput).toBeVisible({ timeout: 10_000 })
  await titleInput.fill(title)

  const bodyEditor = editDialog.locator('[contenteditable="true"]').first()
  await expect(bodyEditor).toBeVisible({ timeout: 10_000 })
  await bodyEditor.click()
  await bodyEditor.fill(body)

  const saveResponse = page.waitForResponse((response) =>
    response.url().includes('/api/creator/quest-content-cards/update') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await editDialog.getByRole('button', { name: /Save Changes/i }).click()
  await saveResponse
}

test('QA-025: edit a content card title in the form editor and persist it', async ({ page }: { page: Page }) => {
  test.setTimeout(90_000)

  await openLinearFormEditor(page)

  await createTextCard(page, UPDATED_TITLE, FIRST_CARD_BODY)

  await expect(page.getByRole('heading', { name: UPDATED_TITLE })).toBeVisible({
    timeout: 15_000,
  })

  await page.reload()
  await expect(page.getByRole('heading', { name: /Quest Canvas/i })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('heading', { name: UPDATED_TITLE })).toBeVisible({
    timeout: 15_000,
  })
})

test('QA-025: reorder content cards in the form editor and persist the order', async ({ page }: { page: Page }) => {
  test.setTimeout(90_000)

  await openLinearFormEditor(page)

  const cardsBefore = getCardLocators(page)
  await expect(cardsBefore.nth(0)).toBeVisible({ timeout: 15_000 })

  const existingCardTitle = (await cardsBefore.nth(0).locator('h4').innerText()).trim()
  await expect(existingCardTitle).toBeTruthy()

  await createTextCard(page, SECOND_CARD_TITLE, 'QA-025 second card body')

  const cards = getCardLocators(page)
  await expect(cards.nth(1)).toBeVisible({ timeout: 15_000 })

  const reorderResponse = page.waitForResponse((response) =>
    response.url().includes('/api/creator/quest-content-cards/reorder') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )

  const dragHandle = cards.nth(1).locator('svg.lucide-grip-vertical').first()
  await expect(dragHandle).toBeVisible({ timeout: 10_000 })
  await dragHandle.dragTo(cards.nth(0), { force: true })
  await reorderResponse

  await page.reload()
  await expect(page.getByRole('heading', { name: /Quest Canvas/i })).toBeVisible({
    timeout: 15_000,
  })

  const cardsAfterReload = getCardLocators(page)
  await expect(cardsAfterReload.nth(0).locator('h4')).toHaveText(SECOND_CARD_TITLE, { timeout: 15_000 })
  await expect(cardsAfterReload.nth(1).locator('h4')).toHaveText(existingCardTitle, { timeout: 15_000 })
})
