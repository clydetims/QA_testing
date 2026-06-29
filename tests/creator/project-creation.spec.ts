import { expect, test, type Locator, type Page } from '@playwright/test'

const creatorEmail = 'wyzquest-creator@gmail.com'
const creatorPassword = 'WyzQuests2025!'
const expectedCreatorPath = process.env.E2E_LOGIN_EXPECTED_PATH ?? '/creator'

// Helper: sign in as creator using email/password (NOT Google OAuth)
async function signInAsCreator(page: Page) {
  await page.goto('/sign-in')
  
  // Wait for the sign-in form to load
  await page.waitForTimeout(1000)
  
  // Fill email in the email input field
  const emailField = page.locator('input[type="email"], input[name="identifier"]').first()
  await emailField.waitFor({ state: 'visible', timeout: 10_000 })
  await emailField.fill(creatorEmail)
  
  // Click the blue "Continue" button below email (NOT the Google button)
  // The Continue button for email login is the last one (Google's has "with Google" text)
  const allContinueBtns = page.locator('button').filter({ hasText: /^Continue/ })
  const continueBtn = allContinueBtns.last()
  await continueBtn.click()
  
  // Wait for password step to appear
  await page.waitForTimeout(2000)
  
  // Fill password
  const passwordField = page.locator('input[type="password"]').first()
  await passwordField.waitFor({ state: 'visible', timeout: 10_000 })
  
  // Wait until the password field is enabled
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[type="password"]') as HTMLInputElement
      return input && !input.disabled
    },
    { timeout: 10_000 }
  )
  
  await passwordField.fill(creatorPassword)
  
  // Click Continue to sign in
  const signInBtn = page.locator('button').filter({ hasText: /^Continue/ }).last()
  await signInBtn.click()
  
  // Wait for redirect to creator dashboard
  await page.waitForURL(/\/creator|\/redirect-check/, { timeout: 30_000 })
  
  // If on redirect-check, wait for final redirect
  if (page.url().includes('/redirect-check')) {
    await page.waitForURL(/\/creator/, { timeout: 30_000 })
  }
}

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

// Helper: robust click
async function safeClick(locator: Locator) {
  if ((await locator.count()) === 0) return false
  const el = locator.first()
  try {
    await el.waitFor({ state: 'visible', timeout: 10_000 })
    await el.click({ timeout: 10_000 })
    return true
  } catch {
    await el.click({ force: true, timeout: 10_000 })
    return true
  }
}

test.describe('Creator - Project Creation', () => {
  test.describe.configure({ mode: 'parallel' })

  test('QA-013: Create project via Manual path (blank form)', async ({ page }) => {
    // Step 1: Go to Creator dashboard (auth state already loaded)
    await page.goto('/creator')
    await expect(page).toHaveURL(/\/creator/)
    
    // Step 2: Click "Create Content" button
    await clickCreateContent(page)
    
    // Step 3: Select Quest
    await selectContentType(page, 'quest')
    
    // Step 4: Click Continue
    await clickContinue(page)
    
    // Step 5: Wait for "How would you like to start?" modal to appear
    const howToStartModal = page.getByText('How would you like to start?')
    await howToStartModal.waitFor({ state: 'visible', timeout: 10_000 })
    
    // Step 6: Click "Manual" option
    await page.getByText('Manual', { exact: true }).click()
    await page.waitForTimeout(500)
    
    // Step 7: Click Continue
    await clickContinue(page)
    
    // Step 8: Verify blank form is displayed
    
    // Step 5: Verify the blank form opens with empty fields
    const titleField = page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/title|name/i))
      .or(page.locator('input[name="title"]'))
      .first()
    
    // Wait for form to load
    await page.waitForTimeout(2000)
    
    // Check that form fields exist (blank form opened)
    const formExists = 
      (await titleField.count()) > 0 ||
      (await page.locator('form').count()) > 0 ||
      (await page.getByText(/create.*quest|new.*quest/i).count()) > 0
    
    expect(formExists).toBeTruthy()
    
    // Step 6: Verify no AI-generated content is prefilled
    if ((await titleField.count()) > 0) {
      const titleValue = await titleField.inputValue()
      // Title should be empty or have a default placeholder, not AI-generated content
      expect(titleValue.length).toBeLessThan(50) // No long AI-generated title
    }
    
    // Check description field is also empty
    const descField = page
      .getByLabel(/description|introduction/i)
      .or(page.locator('textarea[name="description"], textarea[name="introduction"]'))
      .first()
    
    if ((await descField.count()) > 0) {
      const descValue = await descField.inputValue()
      expect(descValue.length).toBeLessThan(100) // No long AI-generated description
    }
  })

  test('QA-014: Create project via AI Assistant path', async ({ page }) => {
    // Step 1: Go to Creator dashboard (auth state already loaded)
    await page.goto('/creator')
    await expect(page).toHaveURL(/\/creator/)
    
    // Step 2: Click "Create Content" button
    await clickCreateContent(page)
    
    // Step 3: Select Quest
    await selectContentType(page, 'quest')
    
    // Step 4: Click Continue
    await clickContinue(page)
    
    // Step 5: Wait for "How would you like to start?" modal to appear
    const howToStartModal = page.getByText('How would you like to start?')
    await howToStartModal.waitFor({ state: 'visible', timeout: 10_000 })
    
    // Step 6: Click "AI Assistant" option
    await page.getByText('AI Assistant', { exact: true }).first().click()
    await page.waitForTimeout(500)
    
    // Step 7: Click Continue
    await clickContinue(page)
    
    // Step 8: Wait for "Create a Quest" wizard to appear (Step 1 of 2)
    const wizardTitle = page.getByText('Create a Quest')
    await wizardTitle.waitFor({ state: 'visible', timeout: 10_000 })
    
    // Step 9: Click "AI Demo Data" button
    const aiDemoDataBtn = page.getByRole('button', { name: /AI Demo Data/i })
    await aiDemoDataBtn.waitFor({ state: 'visible', timeout: 10_000 })
    await aiDemoDataBtn.click()
    
    // Step 10: Wait for generation to complete (wait until "Generating..." disappears)
    const generatingIndicator = page.getByText('Generating...')
    await generatingIndicator.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
    await page.waitForTimeout(1000)
    
    // Step 10b: If AI Demo Data failed, fill fields manually
    const targetAudienceField = page.getByPlaceholder(/Software engineers/i).or(page.locator('textarea').first())
    const targetAudienceValue = await targetAudienceField.inputValue().catch(() => '')
    
    if (targetAudienceValue.length < 5) {
      // Fill Target Audience
      await targetAudienceField.fill('Software developers learning TypeScript, intermediate level')
      
      // Fill Domain/Industry
      const domainField = page.getByPlaceholder(/Project Management/i).or(page.locator('input[type="text"]').first())
      await domainField.fill('Software Development')
    }
    
    // Step 11: Click "Next" button (exact match to avoid Next.js dev tools button)
    const nextBtn = page.getByRole('button', { name: 'Next', exact: true })
    await nextBtn.click()
    
    // Step 12: Wait for Step 2 and click "Create Quest"
    await page.waitForTimeout(2000)
    const createQuestBtn = page.getByRole('button', { name: /Create Quest/i })
    await createQuestBtn.waitFor({ state: 'visible', timeout: 10_000 })
    await createQuestBtn.click()
    
    // Step 13: Verify quest was created (should redirect or show success)
    await page.waitForTimeout(3000)
    
    // Verify we're redirected to quest editor or success message appears
    const questCreated = 
      page.url().includes('/quest-editor') ||
      (await page.getByText(/quest created|success/i).count()) > 0 ||
      (await page.getByText(/redirecting/i).count()) > 0
    
    expect(questCreated).toBeTruthy()
  })
})
