import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox').click();
  await page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox').click();
  await page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox').click();
  await page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox').click();
  await page.getByRole('option', { name: 'LEARNER' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox').click();
  await page.locator('#radix-_r_s6_').click();
  await page.getByRole('textbox', { name: 'Admin Password' }).click();
  await page.getByRole('textbox', { name: 'Admin Password' }).fill('adwdasd');
  await page.getByRole('textbox', { name: 'Admin Password' }).dblclick();
  await page.getByRole('textbox', { name: 'Admin Password' }).fill('');
  await page.getByRole('textbox', { name: 'Admin Password' }).click();
  await page.getByText('CancelVerify').click();
  await page.getByRole('textbox', { name: 'Admin Password' }).click();
  await page.getByRole('textbox', { name: 'Admin Password' }).fill('zdadwdasd');
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('row', { name: 'C Clyde Ador ID: cbfcf799...' }).getByRole('combobox').click();
  await page.getByRole('option', { name: 'LEARNER' }).click();
  await page.getByRole('textbox', { name: 'Admin Password' }).click();
  await page.getByRole('textbox', { name: 'Admin Password' }).fill('WyzQuests2025!');
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByText('User role updated successfully').click();
});