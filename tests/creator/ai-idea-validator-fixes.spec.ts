import { expect, test, type Page } from '@playwright/test'

const TOPIC = 'AI Awareness Seminar'
const CONTEXT = 'for engineers'
const OBJECTIVE = 'to learn ai'

async function generateCurriculum(page: Page) {
    await page.goto('/creator')

  await page.getByRole('link', {
  name: /AI Idea Validator/i,
    }).click()

  await page.waitForLoadState('networkidle')

  await page.getByLabel(/Quest Topic/i).fill(TOPIC)

  await page
    .getByLabel(/Context/i)
    .fill(CONTEXT)

  await page
    .getByLabel(/Learning Objectives/i)
    .fill(OBJECTIVE)

  await page
    .getByText(/Narrative \(Linear\)/i)
    .click()

  await page.getByRole('button', {
    name: /Validate Topic/i,
  }).click()

  // Gemini generation can take a while
  await expect(
    page.getByRole('button', {
      name: /Import Curriculum/i,
    }),
  ).toBeVisible({
    timeout: 180_000,
  })

  await page
    .getByRole('button', {
      name: /Import Curriculum/i,
    })
    .click()
}

test.describe('AI Idea Validator', () => {
  test('QA-016.2.1: Import AI outline to Canvas nodes (Linear Visual Canvas View)', async ({
    page,
  }) => {
    test.setTimeout(300_000)

    await generateCurriculum(page)

    await page.getByText(/Create New Quest/i).click()

    await page.getByText(/Visual Canvas/i).click()

    await page.getByRole('button', {
      name: /Confirm Import/i,
    }).click()

    await page.waitForURL(
      /\/quest-editor\/.*\/content\/visual-canvas/,
      {
        timeout: 120_000,
      },
    )

    // Verify imported nodes exist
    await expect(
      page.locator('.react-flow__node').first(),
    ).toBeVisible({
      timeout: 60_000,
    })

    const nodeCount =
      await page.locator('.react-flow__node').count()

    expect(nodeCount).toBeGreaterThan(0)

    console.log(
      `✅ QA-016.2.1 passed: ${nodeCount} canvas nodes imported`,
    )
  })

  test('QA-016.2.2: Import AI outline to Canvas nodes (Linear Outline View)', async ({
    page,
  }) => {
    test.setTimeout(300_000)

    await generateCurriculum(page)

    await page.getByText(/Create New Quest/i).click()

    await page.getByText(/Outline View/i).click()

    await page.getByRole('button', {
      name: /Confirm Import/i,
    }).click()

    await page.waitForURL(
      /\/quest-editor\/.*\/content/,
      {
        timeout: 120_000,
      },
    )

    // Verify outline cards exist
    await expect(
      page.getByText(/Quest Canvas/i),
    ).toBeVisible({
      timeout: 60_000,
    })

    const cards =
      page.locator('[data-slot="card"]')

    await expect(cards.first()).toBeVisible()

    const cardCount = await cards.count()

    expect(cardCount).toBeGreaterThan(0)

    console.log(
      `✅ QA-016.2.2 passed: ${cardCount} outline cards imported`,
    )
  })
})