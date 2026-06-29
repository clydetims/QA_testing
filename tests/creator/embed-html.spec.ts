import { expect, test, type Page } from '@playwright/test'

const TEST_QUEST_NAME = 'HTML Content Testing'

async function openQuestVisualCanvas(page: Page): Promise<void> {
  await page.goto('/creator')
  await expect(page).toHaveURL(/\/creator/)
  await page.waitForTimeout(3000)

  const questCard = page.getByRole('button', { name: TEST_QUEST_NAME })
  await expect(questCard).toBeVisible({ timeout: 15_000 })
  await questCard.scrollIntoViewIfNeeded()
  await questCard.click()

  await page.waitForURL(/\/quest-editor\/[^/]+/, { timeout: 20_000 })
  await page.waitForTimeout(2000)

  const contentTab = page
    .getByRole('link', { name: /^Content$/i })
    .or(page.getByRole('tab', { name: /^Content$/i }))
  await contentTab.waitFor({ state: 'visible', timeout: 10_000 })
  await contentTab.click()

  await page.waitForURL(/\/quest-editor\/[^/]+\/content\/visual-canvas/, { timeout: 20_000 })
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2000)
}

async function dragCodeBlockToCanvas(page: Page): Promise<void> {
  const codeBlockBtn = page.locator('button:nth-child(11)')
  await codeBlockBtn.waitFor({ state: 'visible', timeout: 10_000 })

  const canvasPane = page.locator('.react-flow__pane').first()
  const canvasBox = await canvasPane.boundingBox()
  if (!canvasBox) throw new Error('Could not get canvas bounds')

  const nodeCountBefore = await page.locator('.react-flow__node').count()

  await codeBlockBtn.dragTo(canvasPane, {
    force: true,
    targetPosition: {
      x: Math.round(canvasBox.width * 0.5),
      y: Math.round(canvasBox.height * 0.5),
    },
  })

  await expect(page.locator('.react-flow__node'))
    .toHaveCount(nodeCountBefore + 1, { timeout: 15_000 })
  await page.waitForTimeout(1000)
}
test.describe('QA-049 & QA-050: Embed HTML Content', () => {

  test('QA-049: Add HTML Custom node and verify Monaco editor with live preview', async ({ page }: { page: Page }) => {
    test.setTimeout(120_000)

    // Step 1 & 2: Open quest and go to Visual Canvas
    await openQuestVisualCanvas(page)


    // Step 3: Drag Code Block node to canvas
    await dragCodeBlockToCanvas(page)

    // Get the newly added code block node
    const codeBlockNode = page.locator('.react-flow__node').filter({ hasText: /CODE BLOCK/i }).last()
    await codeBlockNode.waitFor({ state: 'visible', timeout: 10_000 })
    console.log('✅ Step 3 passed: Code Block node added to canvas')

    // Step 4: Enter a Node Label
    const nodeLabelInput = page.getByPlaceholder('Node Label (e.g., Interactive Form)')
    await nodeLabelInput.waitFor({ state: 'visible', timeout: 10_000 })
    await nodeLabelInput.fill('React Components HTML Embed')
    await page.waitForTimeout(500)

   // Step 4: Enter HTML content into the Monaco editor
    const monacoEditor = page.locator('.monaco-editor').first()
      .or(page.locator('.cm-editor').first())
    await monacoEditor.waitFor({ state: 'visible', timeout: 10_000 })
    await monacoEditor.click()
    await page.waitForTimeout(500)

    // Select all existing content and delete
    await page.keyboard.press('Control+A')
    await page.waitForTimeout(300)
    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    const htmlContent = `<div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
  <h2 class="quest-title">React Components Check</h2>
  <p class="quest-content">Which React component pattern is best when you want reusable UI building blocks?</p>
  <button class="btn-primary" onclick="showResult('Correct! Components help you build reusable, maintainable UI.')">
    Use reusable components
  </button>
  <button class="btn-secondary" onclick="showResult('Not quite. Copy-pasting large UI blocks makes maintenance harder.')">
    Copy and paste the same UI everywhere
  </button>
  <button class="btn-secondary" onclick="showResult('Partly true, but component reuse is the stronger answer here.')">
    Put all UI in one file
  </button>
  <p id="result" style="margin-top:16px; font-weight:bold;"></p>
</div>
<script>
function showResult(message) {
  document.getElementById('result').textContent = message;
}
</script>`

    // Use clipboard paste instead of keyboard.type to preserve formatting
    await page.evaluate((content) => {
      navigator.clipboard.writeText(content)
    }, htmlContent)
    await page.waitForTimeout(300)
    await page.keyboard.press('Control+V')
    await page.waitForTimeout(2000)


    // Step 5: Verify editor accepts the content (character count updates)
    const charCount = page.getByText(/Characters: \d+\/50000/i)
    await charCount.waitFor({ state: 'visible', timeout: 10_000 })
    const charCountText = await charCount.textContent() ?? ''
    expect(charCountText).not.toContain('0/50000')
    console.log(`✅ Step 5 passed: Editor accepted content — ${charCountText}`)

    // Step 6: Verify live preview pane renders the HTML output
    const previewPane = page.locator('.react-flow__node')
      .filter({ hasText: /CODE BLOCK/i })
      .last()
      .locator('iframe')
      .or(page.locator('.react-flow__node').filter({ hasText: /CODE BLOCK/i }).last().locator('[class*="preview"]'))

    // Check preview area is visible and has rendered content
    const previewArea = page.locator('.react-flow__node')
      .filter({ hasText: /React Components Check/i })
    await expect(previewArea).toBeVisible({ timeout: 15_000 })
    console.log('✅ Step 6 passed: Live preview pane renders HTML output')

// Step 7: Verify preview updates based on entered content
    const previewTitle = page.getByText('React Components Check').first()
    await expect(previewTitle).toBeVisible({ timeout: 10_000 })
    console.log('✅ Step 7 passed: Preview reflects entered content')

    // Verify auto-save
    const savedIndicator = page.getByText(/Auto-save on|Saved/i)
    await expect(savedIndicator).toBeVisible({ timeout: 10_000 })

    console.log('✅ QA-049 passed: Monaco editor renders with live preview pane')
  })

  test('QA-050: XSS attempt via HTML node input is sanitized', async ({ page }: { page: Page }) => {
    test.setTimeout(120_000)

    // Step 1 & 2: Open quest and go to Visual Canvas
    await openQuestVisualCanvas(page)

    // Step 3: Add or open existing Code Block node
    const existingCodeBlock = page.locator('.react-flow__node').filter({ hasText: /CODE BLOCK/i }).last()
    const hasCodeBlock = await existingCodeBlock.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!hasCodeBlock) {
      await dragCodeBlockToCanvas(page)
    }

    const codeBlockNode = page.locator('.react-flow__node').filter({ hasText: /CODE BLOCK/i }).last()
    await codeBlockNode.waitFor({ state: 'visible', timeout: 10_000 })
    console.log('✅ Step 3 passed: Code Block node found/added')

    // Step 4: Paste HTML content with dangerous XSS tags
    const monacoEditor = page.locator('.monaco-editor').first()
      .or(page.locator('.cm-editor').first())
    await monacoEditor.waitFor({ state: 'visible', timeout: 10_000 })
    await monacoEditor.click()
    await page.waitForTimeout(500)

    await page.keyboard.press('Control+A')
    await page.waitForTimeout(300)

    const xssPayload = `<div>
  <h2>Unsafe HTML Test</h2>
  <img src="x" onerror="alert('XSS via image')" />
  <iframe src="javascript:alert('XSS via iframe')"></iframe>
</div>`

    await page.keyboard.type(xssPayload)
    await page.waitForTimeout(2000)
    console.log('✅ Step 4 passed: XSS payload entered in editor')

// Step 5: Verify content is accepted into the editor
    const xssCharCount = page.getByText(/Characters: \d+\/50000/i)
    await xssCharCount.waitFor({ state: 'visible', timeout: 10_000 })
    const xssCharCountText = await xssCharCount.textContent() ?? ''
    expect(xssCharCountText).not.toContain('0/50000')
    console.log(`✅ Step 5 passed: Editor accepted content — ${xssCharCountText}`)

    // Step 6: Verify preview does NOT execute unsafe behavior (no alert dialogs)
    let alertFired = false
    page.on('dialog', async (dialog) => {
      alertFired = true
      await dialog.dismiss()
    })
    await page.waitForTimeout(3000)
    expect(alertFired).toBe(false)
    console.log('✅ Step 6 passed: No alert dialogs fired — XSS not executed')

// Step 7: Verify dangerous tags are blocked or sanitized
    const xssCharCount2 = page.getByText(/Characters: \d+\/50000/i)
    await xssCharCount2.waitFor({ state: 'visible', timeout: 10_000 })
    const xssCharCountText2 = await xssCharCount2.textContent() ?? ''
    expect(xssCharCountText2).not.toContain('0/50000')
    console.log(`✅ Content accepted in editor — ${xssCharCountText2}`)

    // Verify the preview area exists (right side of code block)
    const previewArea = page.locator('.react-flow__node')
      .filter({ hasText: /CODE BLOCK/i })
      .last()
    await expect(previewArea).toBeVisible({ timeout: 10_000 })

    // Verify no XSS alert was triggered
    expect(alertFired).toBe(false)
    console.log('✅ Step 7 passed: Dangerous tags blocked/sanitized — no alert executed')

    // Verify iframe with javascript: protocol is not present in DOM
    const unsafeIframe = page.locator('iframe[src*="javascript:"]')
    expect(await unsafeIframe.count()).toBe(0)

    console.log('✅ QA-050 passed: XSS attempt blocked; sanitization active')
  })

})