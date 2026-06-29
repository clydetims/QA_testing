import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('wyzquest-learner@gmail.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2025!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'View All' }).click();
  await expect(page.getByRole('link', { name: 'View quest: Computer Science - Fundamentals (TESTING ONGOING BY JOY)' })).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Quests' }).click();
  await expect(page.getByRole('link', { name: 'View quest: Computer Science - Fundamentals (TESTING ONGOING BY JOY)' })).toBeVisible();
});