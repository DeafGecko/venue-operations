import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

// A viewer can look around, but cannot add or change anything, and does not see Settings.
test.use({ storageState: undefined });

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'admin_session', value: adminCookie('viewer'), url: 'http://localhost:4330' }]);
});

test('viewer sidebar hides Settings and Data Management', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Sidebar checked on desktop.');
  await page.goto('/admin/dashboard');
  await expect(page.locator('a[href="/admin/settings"]')).toHaveCount(0);
  await expect(page.locator('a[href="/admin/data-management"]')).toHaveCount(0);
  await expect(page.locator('a[href="/admin/bills"]').first()).toBeVisible();
});

test('viewer cannot use Add on the tenants page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await page.goto('/admin/tenants');
  await page.waitForLoadState('networkidle');
  const add = page.getByRole('button', { name: /^Add/ }).first();
  if ((await add.count()) === 0) test.skip(true, 'No Add control on this page.');
  await expect(add).toBeDisabled();
});
