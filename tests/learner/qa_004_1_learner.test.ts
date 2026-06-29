import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('#identifier-field').click();
  await page.locator('#identifier-field').fill('denzonchristian@gmail.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('form-feedback-error').click();
});