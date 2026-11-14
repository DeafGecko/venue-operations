import { expect, test } from '@playwright/test';

test('clicking a revenue-by-month bar opens only that month of bookings', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: 'authenticated:admin', url: 'http://localhost:4330' }]);
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');

  const bar = page.getByRole('link', { name: /Show bookings for Nov/ });
  await expect(bar).toBeVisible();
  await bar.click();

  await expect(page).toHaveURL(/\/admin\/\?month=\d{4}-11/);
  await expect(page.getByText('Show all bookings')).toBeVisible();
});
