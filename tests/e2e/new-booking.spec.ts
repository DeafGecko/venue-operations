import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

test('New booking on the dashboard opens the popup in place', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: adminCookie('admin'), url: 'http://localhost:4330' }]);
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /New booking/ }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'New Booking' })).toBeVisible();
  await expect(page.locator('input[name="phone"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'New Booking' })).toHaveCount(0);
});
