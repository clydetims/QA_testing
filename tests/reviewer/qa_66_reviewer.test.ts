import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('test-reviewer@wyzquestpro.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2026!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('combobox').filter({ hasText: 'All Statuses' }).click();
  await page.getByText('My Active Reviews').click();
  await page.getByRole('row', { name: 'Harnessing the Elements:' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Open Canvas' }).click();
  await expect(page).toHaveURL('http://localhost:3000/quest-editor/b7c7320b-a843-4600-b5d5-ab03c5506ede/content/visual-canvas?view=readonly');
});