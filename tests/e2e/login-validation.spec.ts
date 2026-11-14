import { expect, test } from '@playwright/test';

test('login shows our own message for a bad email instead of the browser bubble', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('hjlhj');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.locator('#email-err')).toHaveText('Enter a valid email address, like name@example.com.');
  await expect(page.locator('#password-err')).toBeHidden();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
