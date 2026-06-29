import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('wyzquest-creator@gmail.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2025!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'QA Testing (3) QA Testing (3' }).click();
  await page.getByRole('link', { name: 'Content' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('region', { name: 'Notifications alt+T' }).getByRole('listitem')).toBeVisible();
});