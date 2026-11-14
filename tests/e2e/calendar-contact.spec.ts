import { expect, test } from '@playwright/test';

test('clicking a calendar event shows contact details and balance', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'Checked on desktop.');
  await context.addCookies([{ name: 'admin_session', value: 'authenticated:admin', url: 'http://localhost:4330' }]);
  await page.goto('/admin/calendar');
  await page.waitForLoadState('networkidle');

  const event = page.locator('button[title*="·"]').first();
  test.skip((await event.count()) === 0, 'No events on the calendar to open.');
  await event.click();

  const dialog = page.locator('.cal-root', { hasText: 'Balance due' }).last();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Contact', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Edit Booking' })).toBeVisible();
});
