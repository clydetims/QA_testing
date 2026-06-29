import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('test-reviewer@wyzquestpro.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2026!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('row', { name: 'QA Testing (3) Just submitted' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Claim & Start Review' }).click();
  await page.getByRole('link', { name: 'Back to Queue' }).click();
  await page.getByRole('cell', { name: 'QA Testing (3)' }).click();
});