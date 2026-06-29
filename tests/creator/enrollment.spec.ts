import { expect, test, type Page } from '@playwright/test'

const TEST_QUEST_NAME = 'HTML Content Testing'
const TEST_LEARNER_EMAIL = 'wyzquest-learner@gmail.com'

test('QA-071: Enroll learner manually via modal', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

  // Step 1: Open Creator Dashboard
  await page.goto('/creator')
  await page.waitForTimeout(3000)

  // Step 2: Open existing quest as Creator
  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })

  await questCard.waitFor({
    state: 'visible',
    timeout: 15_000,
  })

  await questCard.scrollIntoViewIfNeeded()
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, {
    timeout: 20_000,
  })

  await page.waitForTimeout(2000)

  console.log('✅ Step 2 passed: Opened HTML Content Testing quest')

  // Step 3: Go to Enrollment section
  const enrollmentTab = page
    .getByRole('link', { name: /^Enrollment$/i })
    .or(page.getByRole('tab', { name: /^Enrollment$/i }))

  await enrollmentTab.waitFor({
    state: 'visible',
    timeout: 10_000,
  })

  await enrollmentTab.click()

  await page.waitForTimeout(2000)

  console.log('✅ Step 3 passed: Opened Enrollment section')

  // Step 4: Click Add Learners
  const addLearnersBtn = page.getByRole('button', {
    name: /Add Learners/i,
  })

  await addLearnersBtn.waitFor({
    state: 'visible',
    timeout: 10_000,
  })

  await addLearnersBtn.click()

  await page.waitForTimeout(1000)

  console.log('✅ Step 4 passed: Add Learners modal opened')

  // Step 5: Enter learner email
  const emailInput = page.getByPlaceholder('learner@example.com')

  await emailInput.waitFor({
    state: 'visible',
    timeout: 10_000,
  })

  await emailInput.fill(TEST_LEARNER_EMAIL)

  console.log('✅ Step 5 passed: Learner email entered')

  // Step 6: Submit enrollment
  const addLearnerBtn = page.getByRole('button', {
    name: /Add Learner/i,
  })

  await addLearnerBtn.click()

  await page.waitForTimeout(3000)

  console.log('✅ Step 6 passed: Enrollment submitted')

  // Step 7: Verify learner appears in enrollment list
  await expect(
    page.getByText(TEST_LEARNER_EMAIL),
  ).toBeVisible({
    timeout: 15_000,
  })

  console.log('✅ Step 7 passed: Learner appears in enrollment list')

  console.log(
    '✅ QA-071 passed: Learner successfully enrolled and displayed in learner list',
  )
})

test('QA-072: Bulk enroll learners via CSV upload', async ({ page }: { page: Page }) => {
  test.setTimeout(120_000)

  const CSV_FILE_PATH = 'tests/fixtures/Book1.csv'

  // Step 1: Open Creator Dashboard
  await page.goto('/creator')
  await page.waitForTimeout(3000)

  // Step 2: Open existing quest as Creator
  const questCard = page.getByRole('button', {
    name: TEST_QUEST_NAME,
  })

  await questCard.waitFor({
    state: 'visible',
    timeout: 15_000,
  })

  await questCard.scrollIntoViewIfNeeded()
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, {
    timeout: 20_000,
  })

  await page.waitForTimeout(2000)

  console.log('✅ Step 2 passed: Opened HTML Content Testing quest')

  // Step 3: Go to Enrollment section
  const enrollmentTab = page
    .getByRole('link', { name: /^Enrollment$/i })
    .or(page.getByRole('tab', { name: /^Enrollment$/i }))

  await enrollmentTab.waitFor({
    state: 'visible',
    timeout: 10_000,
  })

  await enrollmentTab.click()

  await page.waitForTimeout(2000)

  console.log('✅ Step 3 passed: Opened Enrollment section')

  // Step 4: Click Bulk Import
  const bulkImportBtn = page.getByRole('button', {
    name: /Bulk Import/i,
  })

  await bulkImportBtn.waitFor({
    state: 'visible',
    timeout: 10_000,
  })

  await bulkImportBtn.click()

  console.log('✅ Step 4 passed: Bulk Import modal opened')

  // Verify modal opened
  await expect(
    page.getByRole('heading', {
      name: /Bulk Add Learners/i,
    }),
  ).toBeVisible()

  // Step 5: Upload CSV file
  const fileInput = page.locator('input[type="file"]')

  await fileInput.setInputFiles(CSV_FILE_PATH)

  console.log('✅ Step 5 passed: CSV file uploaded')

  // Verify uploaded file appears
  await expect(
    page.getByText('Book1.csv'),
  ).toBeVisible({
    timeout: 10_000,
  })

  console.log('✅ Step 5a passed: Uploaded file displayed')

  // Step 6: Submit bulk enrollment
  const importBtn = page.getByRole('button', {
    name: /Import.*Learners/i,
  })

  await importBtn.waitFor({
    state: 'visible',
    timeout: 10_000,
  })

  await importBtn.click()

  await page.waitForTimeout(4000)

  console.log('✅ Step 6 passed: Bulk enrollment submitted')

  // Step 7: Verify learner appears in enrollment list
  await expect(
    page.getByText(TEST_LEARNER_EMAIL),
  ).toBeVisible({
    timeout: 15_000,
  })

  console.log('✅ Step 7 passed: Learner appears in enrollment list')

  console.log(
    '✅ QA-072 passed: Valid CSV uploaded and learner enrolled successfully',
  )
})