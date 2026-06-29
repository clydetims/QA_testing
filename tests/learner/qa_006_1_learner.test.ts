import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.clock.install();
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('wyzquest-learner@gmail.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('WyzQuests2025!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('main').click();
  await expect(page.getByText('WyzQuests BuilderWelcome back, Learner!SettingsStart Learning')).toBeVisible();
  await page.clock.fastForward('20:00');
  await expect(page.getByText('You will be logged out in 2 minutes due to inactivity.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Continue to WyzQuests' })).toBeVisible();
});