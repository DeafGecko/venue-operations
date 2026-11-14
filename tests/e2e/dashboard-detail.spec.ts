import { expect, test } from '@playwright/test';

// Opens a client's detail dialog from the dashboard and closes it. Saving is not exercised here, so no live data changes.
test('clicking a client name on the dashboard opens its detail dialog', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: 'authenticated:admin', url: 'http://localhost:4330' }]);
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');

  const name = page.locator('[data-open-booking]').first();
  await expect(name).toBeVisible();
  await name.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Payment status')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Save status' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
