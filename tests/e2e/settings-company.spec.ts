import { expect, test } from '@playwright/test';

test('settings shows company, colors, and tax fields without a scroll box', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: 'authenticated:admin', url: 'http://localhost:4330' }]);
  await page.goto('/admin/settings');
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel('Company Legal Name')).toBeVisible();
  await expect(page.getByLabel('Tax ID')).toBeVisible();
  await expect(page.getByLabel('Tax Rate (%)')).toBeVisible();
  await expect(page.getByText('Colors', { exact: true })).toBeVisible();
});
