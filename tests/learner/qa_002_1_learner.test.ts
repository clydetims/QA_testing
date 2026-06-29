import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('denzonchristian@gmail.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2025!');
  await page.getByRole('button', { name: 'Show password' }).click();
  await page.getByRole('button', { name: 'Hide password' }).click();
  await page.getByRole('button', { name: 'Show password' }).click();
  await page.getByRole('button', { name: 'Hide password' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('http://localhost:3000/creator');
});