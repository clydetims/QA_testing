import { expect, test, type Page } from '@playwright/test'

test('QA-021: Create an Adventure and add quests', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

  // Step 1: Go to Creator > Create Adventure
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)
  await page.waitForTimeout(3000)

// Helper: click "Create Content" button
async function clickCreateContent(page: Page) {
  const createBtn = page
    .getByRole('button', { name: /create content|create/i })
    .or(page.locator('button:has-text("Create Content")'))
    .first()
  
  await createBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await createBtn.click()
}

// Helper: select content type in modal (Quest or Adventure) - clicks card only
async function selectContentType(page: Page, type: 'quest' | 'adventure') {
  // Wait for the "Create a journey!" modal to appear
  const modalTitle = page.getByText('Create a journey!')
  await modalTitle.waitFor({ state: 'visible', timeout: 10_000 })
  
  // Click on Quest or Adventure text (exact match to avoid clicking wrong elements)
  const cardTitle = type === 'quest' ? 'Quest' : 'Adventure'
  const cardText = page.getByText(cardTitle, { exact: true }).first()
  await cardText.click()
  await page.waitForTimeout(500)
}

// Helper: click Continue button in modal
async function clickContinue(page: Page) {
  const continueBtn = page.getByRole('button', { name: /continue/i })
  await continueBtn.click()
  await page.waitForTimeout(1000)
}

     // Step 2: Click "Create Content" button
    await clickCreateContent(page)
    
    // Step 3: Select Adventure
    await selectContentType(page, 'adventure')
    
    // Step 4: Click Continue
    await clickContinue(page)
    
    // Step 5: Wait for "How would you like to start?" modal to appear
    const howToStartModal = page.getByText('How would you like to start?')
    await howToStartModal.waitFor({ state: 'visible', timeout: 10_000 })
    
    // Step 6: Click "Manual" option
    await page.getByText('Manual', { exact: true }).click()
    await page.waitForTimeout(500)

  // Step 2: Complete the required adventure details and submit the form
  await page.waitForTimeout(2000)
   await clickContinue(page)

  // Fill in adventure title
  const titleInput = page
    .locator('Adventure Name')
    .or(page.getByLabel(/Title/i))
    .or(page.getByPlaceholder(/Title/i))
  await titleInput.waitFor({ state: 'visible', timeout: 10_000 })
  await titleInput.fill('Test Adventure QA-021')

  // Fill in description if required
  const descriptionInput = page
    .locator('Adventure Introduction')
    .or(page.getByLabel(/Adventure Introduction/i))
    .or(page.getByPlaceholder(/Adventure Introduction/i))
  if (await descriptionInput.isVisible()) {
    await descriptionInput.fill('This is a test adventure created by QA-021')
  }

  // Submit the form
  const submitBtn = page
    .getByRole('button', { name: /Create Adventure/i })
  await submitBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await submitBtn.click()

 


  // Step 4: Scroll to the Quest Sequence section
  const questSequenceSection = page
    .getByText(/Quest Sequence/i)
    .or(page.getByTestId('quest-sequence'))
  await questSequenceSection.waitFor({ state: 'visible', timeout: 10_000 })
  await questSequenceSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  // Step 5 & 6: Click Add Quest to Adventure and select a quest
   const addQuestBtn = page.locator('button[data-variant="outline"]')
    .filter({ hasText: /Add Quest to Adventure/i })

  await addQuestBtn.click()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Add' }).first().click()
  await page.waitForTimeout(1000)

  
  // Reopen and add second
  await addQuestBtn.click()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Add' }).first().click()
  await page.waitForTimeout(1000)

  
})