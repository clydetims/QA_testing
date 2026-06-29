import { test, expect } from '@playwright/test'

test.describe('QA-026.6 - Published Quest Edit Warning', () => {
  test('Published Quest will be unpublished when adding an empty scenario node', async ({
    page,
  }) => {
    // Open creator dashboard
    await page.goto('/creator')

    // Open existing published quest
    await page.getByText(/HTML Content Testing/i).click()

    // Go to Content section
    await page.getByRole('link', { name: /Content/i }).first().click()

    // Wait for visual canvas
    await expect(
      page.locator('text=SCENARIO 1').first(),
    ).toBeVisible({
      timeout: 15000,
    })

    // Drag a Scenario node from toolbar
    const scenarioTool = page.locator(
    '.inline-flex.items-center.justify-center.gap-2.whitespace-nowrap.rounded-md.text-sm.font-medium.transition-all.disabled\\:pointer-events-none.disabled\\:opacity-50.\\[\\&_svg\\]\\:pointer-events-none.\\[\\&_svg\\:not\\(\\[class\\*\\=\\\'size-\\\'\\]\\)\\]\\:size-4.shrink-0.\\[\\&_svg\\]\\:shrink-0.outline-none.focus-visible\\:border-ring.focus-visible\\:ring-ring\\/50.focus-visible\\:ring-\\[3px\\].aria-invalid\\:ring-destructive\\/20.dark\\:aria-invalid\\:ring-destructive\\/40.aria-invalid\\:border-destructive.hover\\:bg-accent.hover\\:text-accent-foreground.dark\\:hover\\:bg-accent\\/50.h-9.px-4.py-2.has-\\[\\>svg\\]\\:px-3.cursor-grab'
    ).first()

    await expect(scenarioTool).toBeVisible({
    timeout: 15000,
    })

    // drag onto canvas
    await scenarioTool.dragTo(
    page.locator('.react-flow')
    )

    await expect(
    page.getByRole('heading', {
        name: /Edit published quest/i,
    }),
    ).toBeVisible({
    timeout: 15000,
    })

    await expect(
    page.getByText(
        /Editing this canvas will move the quest back to Draft/i,
    ),
    ).toBeVisible()

    // PASS
  })
})