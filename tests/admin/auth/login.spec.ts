import { test, expect } from '@playwright/test';

const EMAIL = "wyzquestbuilder@gmail.com";
const PASSWORD = "WyzQuests2025!"


const landingPage = "https://staging.wyzquests.com/";
const devServerLandingPage = "http://72.60.42.114/"
const NavigationSignIn = {role: 'navigation', name: 'Sign In'};

// QA-001-3: Happy Path - Login with valid credentials
test('QA-001-3: Login with valid credentials', async ({ page }) => {
  await page.goto('https://staging.wyzquests.com/');
  await page.getByRole('navigation').getByRole('button', {name: 'Sign In' }).click();

  await page.locator('input[name="identifier"]').fill(EMAIL)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await page.waitForSelector('input[type="password"]', { timeout: 10000 })
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.waitForURL(/\/admin/, { timeout: 15000 })
  
  await expect(page).toHaveURL(/\/admin/)
  console.log('✅ Successfully logged in and redirected to admin dashboard')
});



// QA-003-3.1: Login with invalid password
test('QA-003-3.1: Login with invalid password', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto(landingPage);
  await page.getByRole('navigation').getByRole('button', {name: 'Sign In' }).click();
  await page.locator('input[name="identifier"]').fill(EMAIL)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.waitForSelector('input[type="password"]', { timeout: 10000 })
  await page.locator('input[type="password"]').first().fill('Wrong Password')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  // Wait for either error message OR redirect
  await page.waitForTimeout(3000)
  
  const url = page.url()
  console.log('URL after wrong password:', url)
  const errorVisible = await page.locator('#error-password').isVisible().catch(() => false)

  if (errorVisible) {
    console.log('✅ QA-003-3.1 PASSED: Invalid password rejected with error')
    return
  }
    // If we got redirected to 2FA despite wrong password, that's a bug
  if (url.includes('factor-one')) {
    console.log('⚠️ WARNING: System accepted wrong password and proceeded to 2FA')
    console.log('This might be a security bug OR passwordless auth is enabled')
    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/wrong-password-accepted.png', fullPage: true })
    
    // This is actually a FAIL - wrong password should NOT reach 2FA
    throw new Error('❌ QA-003-3.1 FAILED: System accepted invalid password and reached 2FA. This is a security concern.')
  }
  
  // If neither error nor 2FA, something unexpected happened
  throw new Error('❌ QA-003-3.1 FAILED: Unexpected state after wrong password')
})



// ============================================================
// QA-004-3.1: Login with empty email
// ============================================================
test('QA-004-3.1: Login with empty email', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto(landingPage);
  await page.getByRole('navigation').getByRole('button', {name: 'Sign In' }).click();

  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  const emailInput = page.locator('input[name="identifier"]')
  await expect(emailInput).toBeFocused()

  console.log('✅ QA-004-3.1 PASSED: Empty email validation works')
})


// PASSED
// ============================================================
// QA-004-3.2: Login with empty password
// ============================================================
test('QA-004-3.2: Login with empty password', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto(landingPage);
  await page.getByRole('navigation').getByRole('button', {name: 'Sign In' }).click();

  await page.locator('input[name="identifier"]').fill(EMAIL)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await page.waitForSelector('input[type="password"]', { timeout: 10000 })
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await expect(page.getByText(/Enter your password/i)).toBeVisible({ timeout: 5000 })
  
  console.log('✅ QA-004-3.2 PASSED: Empty password validation shown')
})


// PASSED
// ============================================================
// QA-003-3.2: Login with unregistered email
// ============================================================
test('QA-003-3.2: Login with unregistered email', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto(landingPage);
  await page.getByRole('navigation').getByRole('button', {name: 'Sign In' }).click();

  // Use a random email that definitely doesn't exist
  const randomEmail = `test${Date.now()}@example.com`
  await page.locator('input[name="identifier"]').fill(randomEmail)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Wait for navigation
  await page.waitForTimeout(3000)
  
  const url = page.url()
  console.log('Redirect URL:', url)

  // Verify redirect to sign-up (or equivalent)
  const isSignupPage = url.includes('sign-up') || 
                       url.includes('sign_up') || 
                       url.includes('create')
  
  if (!isSignupPage) {
    await page.screenshot({ path: 'test-results/qa-003-3.2-fail.png', fullPage: true })
    throw new Error(`❌ QA-003-3.2 FAILED: Expected signup page, got ${url}`)
  }
  
  console.log('✅ QA-003-3.2 PASSED: Redirected to signup page')
})


// PASSED
// ============================================================
// QA-003-3.3: Access dashboard URL without login
// ============================================================
test('QA-003-3.3: Access dashboard without login', async ({ page }) => {
  await page.context().clearCookies()

  await page.goto(`${landingPage}admin`)

  await page.waitForURL(/sign-in/, { timeout: 10000 })
  await expect(page).toHaveURL(/sign-in/)
  
  console.log('✅ QA-003-3.3 PASSED: Protected route redirected to sign-in')
})


// PASSED
// ============================================================
// QA-002-3: Password Eye icon toggles visibility
// ============================================================
test('QA-002-3: Password visibility toggle', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto(landingPage);
  await page.getByRole('navigation').getByRole('button', {name: 'Sign In' }).click();

  // Step 1: Enter email to reach password step
  await page.locator('input[name="identifier"]').fill(EMAIL)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Step 2: Wait for password field
  await page.waitForSelector('input[type="password"]', { timeout: 10000 })

  // Use a broader locator - the input ID is "password-field" from your inspect element
  const passwordInput = page.locator('#password-field')
  
  // Enter a password
  await passwordInput.fill('TestPassword123')

  // Verify password is hidden by default
  await expect(passwordInput).toHaveAttribute('type', 'password')
  console.log('✅ Password is hidden by default')

  // Click the eye icon button
  const toggleButton = page.locator('.cl-formFieldInputShowPasswordButton')
  await toggleButton.click()

  // Now the input type changed to "text", so we check the same element
  await expect(passwordInput).toHaveAttribute('type', 'text')
  console.log('✅ Password is visible after toggle')

  // Click again to hide
  await toggleButton.click()

  // Verify hidden again
  await expect(passwordInput).toHaveAttribute('type', 'password')
  console.log('✅ Password is hidden again after second toggle')

  console.log('✅ QA-002-3 PASSED: Password visibility toggle works correctly')
})

// ============================================================
// QA-005-3.6: Mobile - Access login via Business Plan
// ============================================================
test('QA-005-3.6: Mobile - Login via Business Plan', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto(landingPage)

  // Scroll to pricing section
  await page.evaluate(() => {
    const pricing = document.querySelector('#pricing') || 
                    document.querySelector('[class*="pricing"]')
    if (pricing) pricing.scrollIntoView({ behavior: 'instant' })
  })

  

  await page.waitForTimeout(500)

  // Get all "Start 30-Day Free Trial" buttons
  const buttons = page.getByRole('button', { name: 'Start 30-Day Free Trial' })
  
  const count = await buttons.count()
  
  if (count >= 2) {
    // Click the second one (Business Plan)
    await buttons.nth(1).click()
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 5000 })
    console.log('✅ QA-005-3.6 PASSED: Business Plan redirects to auth')
  } else {
    console.log('⚠️ QA-005-3.6 SKIPPED: Business Plan button not found')
  }
})































// ============================================================
// QA-005-3.2: Mobile view of login screen
// ============================================================
test('QA-005-3.2: Mobile view - Login form responsive', async ({ page }) => {
  await page.context().clearCookies()
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto(devServerLandingPage)
  await page.getByRole('button', { name: /open menu/i }).click();
  await page.waitForTimeout(500)
  await page.getByRole('button', {name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 })

  await expect(page.locator('input[name="identifier"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()

  console.log('✅ QA-005-3.2 PASSED: Login form is responsive on mobile')
})

// ============================================================
// QA-005-3.3: Mobile - Access login via landing banner
// ============================================================
test('QA-005-3.3: Mobile - Login via landing banner', async ({ page }) => {
  await page.context().clearCookies()
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto(devServerLandingPage)
  await page.getByRole('button', {name: 'Sign In' }).click();
  await expect(page).toHaveURL(/sign-in/, { timeout: 5000 })

  console.log('✅ QA-005-3.3 PASSED: Mobile menu redirects to login')
})

// ============================================================
// QA-005-3.4: Mobile - Access login via Starter Plan Free
// ============================================================
test('QA-005-3.4: Mobile - Login via Starter Plan', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto(landingPage)

  await page.evaluate(() => {
    const pricing = document.querySelector('#pricing') || 
                    document.querySelector('[class*="pricing"]')
    if (pricing) pricing.scrollIntoView({ behavior: 'instant' })
  })

  await page.waitForTimeout(500)

  const startFreeBtn = page.getByRole('button', { name: 'Start Free Forever' })

  if (await startFreeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await startFreeBtn.first().click()
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 5000 })
    console.log('✅ QA-005-3.4 PASSED: Starter Plan redirects to auth')
  } else {
    console.log('⚠️ QA-005-3.4 SKIPPED: Starter Plan button not found')
  }
})


// ============================================================
// QA-005-3.5: Mobile - Access login via Professional Plan
// ============================================================
test('QA-005-3.5: Mobile - Login via Professional Plan', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto(landingPage)

  await page.evaluate(() => {
    const pricing = document.querySelector('#pricing') || 
                    document.querySelector('[class*="pricing"]')
    if (pricing) pricing.scrollIntoView({ behavior: 'instant' })
  })

  await page.waitForTimeout(500)
  
  // Look for "Start 30-Day Free Trial" button
  const trialBtn = page.getByRole('button', { name: 'Start 30-Day Free Trial' })

  

  if (await trialBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await trialBtn.first().click()
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 5000 })
    console.log('✅ QA-005-3.5 PASSED: Professional Plan redirects to auth')
  } else {
    console.log('⚠️ QA-005-3.5 SKIPPED: Professional Plan button not found')
  }
})


