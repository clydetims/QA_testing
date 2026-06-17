

async function editBadge(page: Page) {
    await page.waitForSelector('dialog', { state: 'visible' });
    await page.getByRole('textbox', { name: 'Badge Name' }).fill(`test ${Date.now()}`);

    


}