import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 13'],
});

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.locator('section').filter({ hasText: '➜ New: AI-Powered' }).getByRole('button').click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('denzonchristian@gmail.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2025!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL('http://localhost:3000/creator');
});