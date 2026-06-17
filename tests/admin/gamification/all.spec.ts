import { test, expect, BrowserContext, Page } from '@playwright/test'
import { loginAsAdmin, viewPortsize } from '../index.spec'
import { faker } from '@faker-js/faker';


test('Show All Global Badges', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page);
    if(!loggedIn) {
        return
    }

    await page.waitForTimeout(2000);
    await page.getByRole('link', { name: 'Gamification' }).click();
    await page.waitForSelector('table[data-slot="table"]', { state: 'visible' });
    
    // Target the first table specifically
    const table = page.locator('table').first();
    // OR const table = page.locator('table').nth(0);
    
    await expect(table).toBeVisible();
    
    // Verify table has correct classes
    await expect(table).toHaveClass(/caption-bottom/);
    await expect(table).toHaveClass(/text-sm/);
    await expect(table).toHaveClass(/table-fixed/);
    await expect(table).toHaveClass(/w-full/);
    
    // Verify number of rows - adjust count based on which table you're testing
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(1);

    await page.pause();
    
    // Check data-slot attribute
    await expect(rows.first()).toHaveAttribute('data-slot', 'table-row');   
    
    

    // ------------ Badge Trigger -------------------
    const badgeTriggerTable = page.locator('table').nth(1);
    await expect(badgeTriggerTable).toBeVisible();
    await expect(badgeTriggerTable).toHaveClass(/caption-bottom/);
    await expect(badgeTriggerTable).toHaveClass(/text-sm/);
    await expect(badgeTriggerTable).toHaveClass(/table-fixed/);
    await expect(badgeTriggerTable).toHaveClass(/w-full/);

    // ===== HEADER VALIDATIONS =====
    const thead = badgeTriggerTable.locator('thead');
    await expect(thead).toBeVisible();
    await expect(thead).toHaveAttribute('data-slot', 'table-header');
    await expect(thead).toHaveClass(/bg-muted\/50/);
    
    // Header row
    const headerRow = thead.locator('tr');
    await expect(headerRow).toHaveAttribute('data-slot', 'table-row');
    await expect(headerRow).toHaveClass(/border-b/);
    await expect(headerRow).toHaveClass(/transition-colors/);
    await expect(headerRow).toHaveClass(/border-border/);
    
    // Header cells
    const headerCells = headerRow.locator('th');
    await expect(headerCells).toHaveCount(4);

    // Verify header text content
    await expect(headerCells.nth(0)).toHaveText('Trigger');
    await expect(headerCells.nth(1)).toHaveText('Target Value');
    await expect(headerCells.nth(2)).toHaveText('Connected Learner Stats');
    await expect(headerCells.nth(3)).toHaveText('Actions');
    
    // Header common classes
    for (let i = 0; i < 4; i++) {
        const cell = headerCells.nth(i);
        await expect(cell).toHaveAttribute('data-slot', 'table-head');
        await expect(cell).toHaveClass(/h-10/);
        await expect(cell).toHaveClass(/px-2/);
        await expect(cell).toHaveClass(/align-middle/);
        await expect(cell).toHaveClass(/whitespace-nowrap/);
        await expect(cell).toHaveClass(/text-brand-navy/);
        await expect(cell).toHaveClass(/font-semibold/);
    }

    // Alignment checks
    await expect(headerCells.nth(0)).toHaveClass(/text-left/);
    await expect(headerCells.nth(1)).toHaveClass(/text-left/);
    await expect(headerCells.nth(2)).toHaveClass(/text-left/);
    await expect(headerCells.nth(3)).toHaveClass(/text-right/);
    
    // Actions column specific
    await expect(headerCells.nth(3)).toHaveClass(/w-\[100px\]/);
    await expect(headerCells.nth(3)).toHaveClass(/pr-6/);
    
    // ===== TBODY VALIDATIONS =====
    const tbody = badgeTriggerTable.locator('tbody');
    await expect(tbody).toBeVisible();
    await expect(tbody).toHaveAttribute('data-slot', 'table-body');
    
    // Check rows count - 8 rows as shown in the HTML
    const triggerRows = tbody.locator('tr');
    await expect(triggerRows).toHaveCount(8);
    
    // Validate each body row
    const rowCount = await triggerRows.count();
    for (let i = 0; i < rowCount; i++) {
        const row = triggerRows.nth(i);
        await expect(row).toHaveAttribute('data-slot', 'table-row');
        await expect(row).toHaveClass(/hover:bg-muted\/50/);
        await expect(row).toHaveClass(/border-b/);
        await expect(row).toHaveClass(/transition-colors/);
    }

    // Check last row has no border (based on [&_tr:last-child]:border-0)
    // Note: This class is on tbody, the actual border removal happens via CSS
    // You can verify the CSS rule is applied
    const lastRow = triggerRows.last();
    const lastRowBorderStyle = await lastRow.evaluate((el) => {
        return window.getComputedStyle(el).borderBottomWidth;
    });
    // The last row should have 0 border-bottom-width if CSS is working
    expect(lastRowBorderStyle).toBe('0px');
})



test('Add New Global Badge', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const loggedIn = await loginAsAdmin(page);
    if(!loggedIn) {
        return
    }


    await page.getByRole('link', { name: 'Gamification' }).click();

    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Add Badge' }).click();

    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Badge Name' }).fill(`Test ${Date.now()}`);

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'sample_name' }).click();
    await page.getByRole('textbox', { name: 'Badge description' }).fill(`Test ${Date.now()} Description`);

    await page.getByRole('button', { name: 'Pick from assets' }).click();
    await page.locator('button:nth-child(8)').click();

    await page.getByRole('textbox', { name: 'Completion Message' }).click();
    await page.getByRole('textbox', { name: 'Completion Message' }).fill(faker.lorem.sentence());
    
    await page.getByRole('button', { name: 'Save Badge' }).click();



    await expect(page.getByText('Global achievements updated')).toBeVisible();
})


test('Edit a Global Badge', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const loggedIn = await loginAsAdmin(page);
    if(!loggedIn) {
        return
    }
    
    await page.getByRole('link', { name: 'Gamification' }).click();

    await page.waitForTimeout(2000);
    await page.locator('div').filter({ hasText: /^Fetching available badges\.\.\.$/ }).waitFor({ state: 'detached'});
    await page.waitForSelector('table[data-slot="table"]', { state: 'visible'});

    const table = page.locator('table[data-slot="table"]').first();

    console.log('Table Count: ', await table.count());

    const columns = table.locator('thead tr th');
    console.log('Number of Columns: ', await columns.count());
    expect(await columns.count()).toBe(5);

    const rows = table.locator('tbody tr');
    console.log('Number of Rows: ', await rows.count());
    const rowCount = await rows.count();
    if (rowCount === 0) {
        console.log('No rows found in table');
        return;
    }

    const matchedRows = rows.filter({
        hasText: /Test/i
    });
    const matchedCount = await matchedRows.count();
    console.log('Number of matching rows:', matchedCount);

    if (matchedCount === 0) {
        console.log('No row found with "Test"');
        return;
    }

    const targetRow = matchedRows.first();
    
    // Click edit button in the row
    await targetRow.getByRole('button').first().click();

    // Wait for Edit Badge dialog
    await page.getByRole('dialog', { name: 'Edit Badge' }).waitFor({ state: 'visible' });
    await page.waitForTimeout(1000); // Let dialog fully render

    // ===== COMBINED SELECTION =====
    await page.getByRole('combobox').click();
    await page.waitForTimeout(500);

    const select = page.locator('select[aria-hidden="true"]');
    const optionCount = await select.locator('option').count();
    console.log(`Options: ${optionCount}`);

    if (optionCount > 0) {
        await select.selectOption({ index: Math.floor(Math.random() * optionCount) });
    }

    // ===== FIX: Wait for combobox to close before proceeding =====
    await page.waitForTimeout(1000);
    // Press Escape to close dropdown if still open
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    console.log("Badge Des");

    // ===== FIX: Clear and fill description with proper waits =====
    const descriptionField = page.getByRole('textbox', { name: 'Badge description' });
    await descriptionField.waitFor({ state: 'visible' });
    await descriptionField.click({ force: true }); // Force click if element is covered
    await page.waitForTimeout(300);
    
    // Clear existing text - triple click to select all then delete
    await descriptionField.click({ clickCount: 3 });
    await descriptionField.press('Backspace');
    await page.waitForTimeout(300);
    
    await descriptionField.fill(`Test Description ${Date.now()}`);
    console.log("Description filled");

    // ===== PICK ASSETS =====
    await page.getByRole('button', { name: 'Pick from assets' }).click();
    console.log("Picking Assets");

    // Wait for asset selection to appear
    await page.waitForTimeout(1000);

    const assetButtons = page.getByRole('button');
    await assetButtons.first().waitFor({ state: 'visible' });

    const count = await assetButtons.count();
    console.log('Button Counts: ', count);

    if (count > 0) {
        const randomIndex = await Math.floor(Math.random() * count);
        await assetButtons.nth(randomIndex).click();
        console.log(`Selected asset: ${randomIndex}`);
        await page.getByRole('button', { name: 'Close' }).first().click();
    }


    await page.getByRole('button', { name: 'Pick from assets' }).waitFor({ state: 'detached' })

    // ===== SAVE =====
    await page.getByRole('button', { name: 'Save Badge' }).click();
    console.log("Saved badge");
    
    // Wait for dialog to close
    await page.getByRole('dialog', { name: 'Edit Badge' }).waitFor({ state: 'hidden' });
    console.log("Dialog closed - edit successful");
    
    await page.pause();
});


