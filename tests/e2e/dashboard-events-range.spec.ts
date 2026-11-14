import { expect, test } from '@playwright/test';

test('events card dropdown switches between today, tomorrow, and this week', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: 'authenticated:admin', url: 'http://localhost:4330' }]);
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');

  const picker = page.locator('#events-range');
  await expect(page.locator('[data-range="today"]')).toBeVisible();
  await picker.selectOption('week');
  await expect(page.locator('[data-range="week"]')).toBeVisible();
  await expect(page.locator('[data-range="today"]')).toBeHidden();
  await picker.selectOption('tomorrow');
  await expect(page.locator('[data-range="tomorrow"]')).toBeVisible();
});
