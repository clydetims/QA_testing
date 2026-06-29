import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('test-reviewer@wyzquestpro.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2026!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'View Overview' }).nth(4).click();
  await page.getByRole('button', { name: 'Open Canvas' }).click();
  await page.locator('.absolute.-inset-2').first().click();
  await page.getByRole('textbox', { name: 'Comment content' }).click();
  await page.getByRole('textbox', { name: 'Comment content' }).fill('Nice.');
  await page.getByRole('button', { name: 'Send comment' }).click();
  await expect(page.getByText('TEXT 1Canvas NodeGo to NodeKAKyle AguilaJust nowNice. Resolve Reply')).toBeVisible();
});