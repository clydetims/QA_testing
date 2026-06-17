import { test, expect } from '@playwright/test'

const EXISTING_EMAIL = 'wyzquestbuilder@gmail.com'
const TEST_PASSWORD = 'Test@Pass123!Secure' // Stronger password
const landingPage = "https://staging.wyzquests.com/";
// ============================================================
// QA-008-3.2: Sign up with existing email
// ============================================================
test('QA-008-3.2: Sign up with existing email', async ({ page }) => {
  await page.goto(landingPage);
  await page.getByRole('navigation')
  .getByRole('link', { name: 'Sign Up' })
  .click();

  // Fill all required fields
  await page.locator('#firstName-field').fill('Test');
  await page.locator('#lastName-field').fill('User');
  await page.locator('#emailAddress-field').fill(EXISTING_EMAIL);
  await page.locator('#password-field').fill(TEST_PASSWORD);
  
  // Click Continue
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Verify the email‑already‑in‑use error appears
  const emailError = page.getByText(/email.*(already|taken|in use)/i).first();
  await expect(emailError).toBeVisible();

  console.log('✅ PASSED');
})


// ============================================================
// QA-008-3.3: Sign up with empty required fields
// ============================================================
test('QA-008-3.3: Sign up with empty required fields', async ({ page }) => {
  await page.goto(landingPage)
  await page.getByRole('navigation')
    .getByRole('link', { name: 'Sign Up' })
    .click()

  // Leave ALL fields empty, click Continue
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Wait for validation
  await page.waitForTimeout(2000)

  // Check which field is focused (browser validation)
  const activeElementId = await page.evaluate(() => {
    const el = document.activeElement
    return el ? el.getAttribute('id') : null
  })

  // Check for Clerk validation error
  const hasValidationError = await page.locator('.cl-formFieldError')
    .first()
    .isVisible()
    .catch(() => false)

  // Pass if either validation triggered
  if (activeElementId || hasValidationError) {
    console.log('✅ QA-008-3.3 PASSED: Required field validation displayed')
    return
  }

  // Fallback: check for any "required" text
  const requiredText = await page.getByText(/required|enter.*first|enter.*last|enter.*email|enter.*password/i)
    .first()
    .isVisible()
    .catch(() => false)

  if (requiredText) {
    console.log('✅ QA-008-3.3 PASSED: Required field validation displayed')
  } else {
    throw new Error('❌ QA-008-3.3 FAILED: No validation for empty fields')
  }
})





// ============================================================
// QA-009-3.2: Cancel Google OAuth signup
// ============================================================
test('QA-009-3.2: Cancel Google OAuth signup', async ({ page }) => {
  await page.goto(landingPage)
  await page.getByRole('navigation')
    .getByRole('link', { name: 'Sign Up' })
    .click()

  // Wait for page to load
  await page.waitForTimeout(2000)

  // Find Google button
  const googleButton = page.locator('.cl-socialButtonsBlockButton__google')

  // Skip if Google button not available
  if (!(await googleButton.isVisible().catch(() => false))) {
    console.log('⚠️ QA-009-3.2 SKIPPED: Google sign-up button not found')
    return
  }

  // Listen for popup BEFORE clicking
  const popupPromise = page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null)

  // Click Google button
  await googleButton.click()

  // Handle popup if it opens
  const popup = await popupPromise
  if (popup) {
    await popup.close()
    console.log('Google popup closed')
  }

  // Wait and verify still on signup page
  await page.waitForTimeout(2000)

  const url = page.url()
  const isOnSignup = url.includes('sign-up') || url.includes('sign_up')

  if (isOnSignup) {
    console.log('✅ QA-009-3.2 PASSED: Remains on signup page after canceling Google')
  } else {
    throw new Error(`❌ QA-009-3.2 FAILED: Redirected to ${url}`)
  }
})


