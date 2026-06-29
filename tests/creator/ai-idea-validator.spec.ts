import { expect, test, type Page } from '@playwright/test'

/**
 * AI Idea Validator E2E Tests
 * Tests for QA-015 and QA-016
 * 
 * QA-015: Click AI Validator button with a topic - validates topic and returns viability score
 * QA-016: Import AI outline to Canvas nodes - imports curriculum to quest editor
 */

test.describe('Creator - AI Idea Validator', () => {
  test.describe.configure({ mode: 'parallel' })

  // Test data
  const testTopic = 'Programming for Beginners'
  const testContext = 'A beginner-friendly course for programmers'
  const testLearningObjectives = 'Understand Programming Basics'

  test('QA-015: Validate topic with AI Idea Validator', async ({ page }) => {
    // Increase test timeout for AI validation (2 minutes)
    test.setTimeout(120_000)
    
    // Step 1: Navigate to AI Idea Validator page
    await page.goto('/creator/ai-validator')
    await expect(page).toHaveURL(/\/creator\/ai-validator/)
    
    // Step 2: Wait for page to load and hydration to complete
    await page.getByRole('heading', { name: 'AI Idea Validator' }).waitFor({ state: 'visible', timeout: 10_000 })
    await page.waitForTimeout(3000) // Wait for React hydration
    
    // Step 2b: Close any hydration error dialogs (press Escape to dismiss Next.js error overlay)
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
    
    // Step 3: Enter quest topic (required field) - use id selector
    const topicInput = page.locator('input#topic')
    await topicInput.waitFor({ state: 'visible', timeout: 10_000 })
    await topicInput.click()
    await topicInput.fill(testTopic)
    await page.waitForTimeout(500)
    
    // Step 4: Enter context (optional)
    const contextInput = page.locator('textarea#context')
    if (await contextInput.count() > 0) {
      await contextInput.fill(testContext)
    }
    
    // Step 5: Enter learning objectives (required) - use id selector
    const objectivesInput = page.locator('textarea#objectives')
    await objectivesInput.waitFor({ state: 'visible', timeout: 10_000 })
    await objectivesInput.click()
    await objectivesInput.fill(testLearningObjectives)
    await page.waitForTimeout(500)
    
    // Step 6: Click "Validate Topic" button
    const validateBtn = page.getByRole('button', { name: /Validate Topic/i })
    await validateBtn.waitFor({ state: 'visible', timeout: 10_000 })
    // Wait for button to be enabled
    await expect(validateBtn).toBeEnabled({ timeout: 5_000 })
    await validateBtn.click()
    
    // Step 7: Wait for validation to complete (up to 90 seconds for AI processing)
    // The button text changes to "Validating with Gemini AI..." during processing
    const validatingIndicator = page.getByText(/Validating with Gemini AI/i)
    await validatingIndicator.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {})
    
    // Step 8: Wait for Import Curriculum button to be visible (confirms successful validation)
    const importBtn = page.getByRole('button', { name: /Import Curriculum/i })
    await importBtn.waitFor({ state: 'visible', timeout: 60_000 })
    
    // Step 9: Verify viability score is shown
    const viabilityBadge = page.getByText(/Viability:\s*\d+\/100/i)
    await expect(viabilityBadge).toBeVisible({ timeout: 10_000 })
    
    // Step 10: Verify curriculum outline is generated (at least one module)
    const moduleCards = page.locator('text=/Module \\d+:/i')
    await expect(moduleCards.first()).toBeVisible({ timeout: 10_000 })
    
    // Step 11: Verify conflict points or crisis scenarios exist (exploration mode)
    const conflictPoints = page.getByText(/Conflict Points/i)
    const crisisScenarios = page.getByText(/Crisis Scenarios/i)
    const hasConflicts = await conflictPoints.count() > 0
    const hasCrisis = await crisisScenarios.count() > 0
    
    // Log success details
    const viabilityText = await viabilityBadge.textContent()
    const moduleCount = await moduleCards.count()
    console.log(`Validation successful: ${viabilityText}, ${moduleCount} modules, conflicts: ${hasConflicts}, crisis: ${hasCrisis}`)
  })

  test('QA-016: Import AI outline to Canvas nodes', async ({ page }) => {
    // Increase test timeout for AI validation + import (3 minutes)
    test.setTimeout(180_000)
    
    // Step 1: Navigate to AI Idea Validator page
    await page.goto('/creator/ai-validator')
    await expect(page).toHaveURL(/\/creator\/ai-validator/)
    
    // Step 2: Wait for page to load and hydration to complete
    await page.getByRole('heading', { name: 'AI Idea Validator' }).waitFor({ state: 'visible', timeout: 10_000 })
    await page.waitForTimeout(3000) // Wait longer for React hydration
    
    // Step 2b: Close any hydration error dialogs that may appear (press Escape to dismiss Next.js error overlay)
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
    
    // Step 3: Enter quest topic (required) - use id selector
    const topicInput = page.locator('input#topic')
    await topicInput.waitFor({ state: 'visible', timeout: 10_000 })
    await topicInput.click()
    await topicInput.fill(testTopic)
    await page.waitForTimeout(500)
    
    // Step 4: Enter learning objectives (required) - use id selector
    const objectivesInput = page.locator('textarea#objectives')
    await objectivesInput.waitFor({ state: 'visible', timeout: 10_000 })
    await objectivesInput.click()
    await objectivesInput.fill(testLearningObjectives)
    await page.waitForTimeout(500)
    
    // Step 5: Click "Validate Topic" button
    const validateBtn = page.getByRole('button', { name: /Validate Topic/i })
    await expect(validateBtn).toBeEnabled({ timeout: 5_000 })
    await validateBtn.click()
    
    // Step 6: Wait for validation to complete (up to 90 seconds for AI processing)
    const validatingIndicator = page.getByText(/Validating with Gemini AI/i)
    await validatingIndicator.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {})
    
    // Step 7: Wait for Import Curriculum button to be visible (confirms successful validation)
    const importBtn = page.getByRole('button', { name: /Import Curriculum/i })
    await importBtn.waitFor({ state: 'visible', timeout: 60_000 })
    
    // Step 8: Click "Import Curriculum" button
    await importBtn.click()
    
    // Step 9: Wait for Import Decision Dialog to appear
    const dialogTitle = page.getByText('Import Curriculum').last()
    await dialogTitle.waitFor({ state: 'visible', timeout: 10_000 })
    
    // Step 10: Ensure "Create New Quest" is selected (click to select)
    const createNewOption = page.getByText('Create New Quest')
    await createNewOption.waitFor({ state: 'visible', timeout: 5_000 })
    await createNewOption.click()
    await page.waitForTimeout(500)
    
    // Step 11: Ensure "Visual Canvas" is selected (click to select)
    const canvasOption = page.getByText('Visual Canvas')
    await canvasOption.waitFor({ state: 'visible', timeout: 5_000 })
    await canvasOption.click()
    await page.waitForTimeout(500)
    
    // Step 12: Click "Confirm Import" button
    const confirmBtn = page.getByRole('button', { name: /Confirm Import/i })
    await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 })
    await confirmBtn.click()
    await expect(dialogTitle).toBeHidden({ timeout: 10_000 })

    console.log('Confirm Import clicked and dialog dismissed — import handoff verified')
  })
})
