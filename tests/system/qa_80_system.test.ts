import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('test-reviewer@wyzquestpro.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2026!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('row', { name: 'QA Testing (3) Awaiting' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Open Canvas' }).click();
  await page.getByRole('button', { name: 'Submit Review' }).click();
  await page.getByRole('button', { name: 'Approve & Publish' }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
});