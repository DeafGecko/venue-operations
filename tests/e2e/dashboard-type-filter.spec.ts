import { expect, test } from '@playwright/test';
import { adminCookie } from './helpers';

test('event-type revenue card has a month filter in its corner', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: adminCookie('admin'), url: 'http://localhost:4330' }]);
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');

  const picker = page.locator('#type-period');
  await expect(picker).toBeVisible();
  await expect(picker.locator('option', { hasText: 'All time' })).toHaveCount(1);
  const months = await picker.locator('option').allTextContents();
  expect(months.length).toBeGreaterThan(1);

  await picker.selectOption({ index: 1 });
  await expect(picker).toHaveValue(/^\d{4}-\d{2}$/);
  await expect(page.getByText('Revenue by Event Type', { exact: true })).toBeVisible();
});
